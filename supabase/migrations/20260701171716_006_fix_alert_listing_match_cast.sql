-- Fix "cannot cast type record to alerts/listings" error on listings INSERT trigger.
-- match_listing_with_alerts() / match_alert_with_listings() selected only a partial
-- column list into a RECORD variable, then passed it to listing_matches_alert()
-- which expects the full public.alerts / public.listings row type. Selecting all
-- columns (SELECT *) into a properly typed %ROWTYPE fixes the type cast.
-- This was blocking every INSERT into public.listings (e.g. the eBay importer).

CREATE OR REPLACE FUNCTION public.match_listing_with_alerts()
RETURNS TRIGGER
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  alert_record public.alerts%ROWTYPE;
  notification_count INTEGER := 0;
BEGIN
  FOR alert_record IN
    SELECT * FROM public.alerts WHERE is_active = TRUE
  LOOP
    IF public.listing_matches_alert(NEW, alert_record) THEN
      BEGIN
        INSERT INTO public.notifications (user_id, listing_id, alert_id)
        VALUES (alert_record.user_id, NEW.id, alert_record.id);
        notification_count := notification_count + 1;
      EXCEPTION WHEN unique_violation THEN
        NULL;
      END;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.match_alert_with_listings()
RETURNS TRIGGER
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  listing_record public.listings%ROWTYPE;
  notification_count INTEGER := 0;
BEGIN
  IF NEW.is_active = FALSE THEN
    RETURN NEW;
  END IF;

  FOR listing_record IN
    SELECT * FROM public.listings
  LOOP
    IF public.listing_matches_alert(listing_record, NEW) THEN
      BEGIN
        INSERT INTO public.notifications (user_id, listing_id, alert_id)
        VALUES (NEW.user_id, listing_record.id, NEW.id);
        notification_count := notification_count + 1;
      EXCEPTION WHEN unique_violation THEN
        NULL;
      END;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
