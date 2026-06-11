-- Security Fixes Migration

-- =====================================================
-- 1. Fix Function Search Paths
-- =====================================================

-- Fix handle_new_user with secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix listing_matches_alert with secure search_path
CREATE OR REPLACE FUNCTION public.listing_matches_alert(
  p_listing public.listings,
  p_alert public.alerts
) RETURNS BOOLEAN 
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Check category filter (if alert has category, listing must match)
  IF p_alert.category IS NOT NULL AND p_alert.category != '' THEN
    IF p_listing.category != p_alert.category THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check type filter (if alert has type, listing must match) - for backward compatibility
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

-- Fix match_listing_with_alerts with secure search_path
CREATE OR REPLACE FUNCTION public.match_listing_with_alerts()
RETURNS TRIGGER 
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  alert_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- For each active alert, check if the new listing matches
  FOR alert_record IN 
    SELECT id, user_id, type, category, max_price, location, keywords
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

-- Fix match_alert_with_listings with secure search_path
CREATE OR REPLACE FUNCTION public.match_alert_with_listings()
RETURNS TRIGGER 
SECURITY INVOKER
SET search_path = public
AS $$
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
    SELECT id, title, description, price, location, type, category, created_at
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

-- =====================================================
-- 2. Fix RLS Policies on listings table
-- =====================================================

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "listings_insert_authenticated" ON public.listings;
DROP POLICY IF EXISTS "listings_update_authenticated" ON public.listings;
DROP POLICY IF EXISTS "listings_delete_authenticated" ON public.listings;

-- The select policy already exists, so we don't create it again

-- Create restrictive policies for INSERT/UPDATE/DELETE
-- Service role bypasses RLS, so backend processes can still work
CREATE POLICY "listings_insert_service_only" ON public.listings FOR INSERT
  TO authenticated WITH CHECK (false);

CREATE POLICY "listings_update_service_only" ON public.listings FOR UPDATE
  TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "listings_delete_service_only" ON public.listings FOR DELETE
  TO authenticated USING (false);

-- =====================================================
-- 3. Revoke EXECUTE privileges on security-definer functions
-- =====================================================

-- handle_new_user is only called by the auth trigger
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;

-- These functions are called internally by triggers only
REVOKE EXECUTE ON FUNCTION public.listing_matches_alert(public.listings, public.alerts) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.listing_matches_alert(public.listings, public.alerts) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.listing_matches_alert(public.listings, public.alerts) FROM anon;

REVOKE EXECUTE ON FUNCTION public.match_listing_with_alerts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.match_listing_with_alerts() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.match_listing_with_alerts() FROM anon;

REVOKE EXECUTE ON FUNCTION public.match_alert_with_listings() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.match_alert_with_listings() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.match_alert_with_listings() FROM anon;
