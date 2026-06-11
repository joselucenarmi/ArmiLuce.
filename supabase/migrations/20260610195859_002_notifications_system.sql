-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no duplicate notifications for same alert+listing
  UNIQUE(alert_id, listing_id)
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "select_own_notifications" ON public.notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_notifications" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_notifications" ON public.notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_notifications" ON public.notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_listing_id ON public.notifications(listing_id);

-- Function to check if a listing matches an alert
CREATE OR REPLACE FUNCTION public.listing_matches_alert(
  p_listing public.listings,
  p_alert public.alerts
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check type filter (if alert has type, listing must match)
  IF p_alert.type IS NOT NULL AND p_alert.type != '' THEN
    IF p_listing.type != p_alert.type THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check max_price filter (listing price must be <= alert max_price)
  IF p_alert.max_price IS NOT NULL THEN
    IF p_listing.price > p_alert.max_price THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check location filter (listing location must contain alert location)
  IF p_alert.location IS NOT NULL AND p_alert.location != '' THEN
    IF p_listing.location IS NULL THEN
      RETURN FALSE;
    END IF;
    IF p_listing.location ILIKE '%' || p_alert.location || '%' IS FALSE THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check keywords filter (keywords must appear in title or description)
  IF p_alert.keywords IS NOT NULL AND p_alert.keywords != '' THEN
    IF (p_listing.title ILIKE '%' || p_alert.keywords || '%' 
        OR COALESCE(p_listing.description, '') ILIKE '%' || p_alert.keywords || '%') IS FALSE THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to match new listings with active alerts
CREATE OR REPLACE FUNCTION public.match_listing_with_alerts()
RETURNS TRIGGER AS $$
DECLARE
  alert_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- For each active alert, check if the new listing matches
  FOR alert_record IN 
    SELECT id, user_id, type, max_price, location, keywords
    FROM public.alerts
    WHERE is_active = TRUE
  LOOP
    -- Check if listing matches this alert
    IF public.listing_matches_alert(NEW, alert_record) THEN
      -- Create notification (ignore if already exists due to unique constraint)
      BEGIN
        INSERT INTO public.notifications (user_id, listing_id, alert_id)
        VALUES (alert_record.user_id, NEW.id, alert_record.id);
        notification_count := notification_count + 1;
      EXCEPTION WHEN unique_violation THEN
        -- Notification already exists, skip
        NULL;
      END;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to match listings with alerts on insert
DROP TRIGGER IF EXISTS on_listing_insert ON public.listings;
CREATE TRIGGER on_listing_insert
  AFTER INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.match_listing_with_alerts();

-- Function to match new alerts with existing listings
CREATE OR REPLACE FUNCTION public.match_alert_with_listings()
RETURNS TRIGGER AS $$
DECLARE
  listing_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Only process active alerts
  IF NEW.is_active = FALSE THEN
    RETURN NEW;
  END IF;
  
  -- For each existing listing, check if it matches the new alert
  FOR listing_record IN 
    SELECT id, title, description, price, location, type, created_at
    FROM public.listings
  LOOP
    -- Check if listing matches this alert
    IF public.listing_matches_alert(listing_record, NEW) THEN
      -- Create notification (ignore if already exists)
      BEGIN
        INSERT INTO public.notifications (user_id, listing_id, alert_id)
        VALUES (NEW.user_id, listing_record.id, NEW.id);
        notification_count := notification_count + 1;
      EXCEPTION WHEN unique_violation THEN
        -- Notification already exists, skip
        NULL;
      END;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to match new alerts with existing listings
DROP TRIGGER IF EXISTS on_alert_insert ON public.alerts;
CREATE TRIGGER on_alert_insert
  AFTER INSERT ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.match_alert_with_listings();

-- Also trigger when alert is reactivated
DROP TRIGGER IF EXISTS on_alert_update ON public.alerts;
CREATE TRIGGER on_alert_update
  AFTER UPDATE OF is_active ON public.alerts
  FOR EACH ROW
  WHEN (OLD.is_active = FALSE AND NEW.is_active = TRUE)
  EXECUTE FUNCTION public.match_alert_with_listings();
