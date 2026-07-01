-- Fix 403 error when creating alerts.
--
-- Root cause: migration 004_security_fixes revoked EXECUTE on
-- public.listing_matches_alert(), public.match_listing_with_alerts() and
-- public.match_alert_with_listings() from PUBLIC/authenticated/anon, but kept
-- match_listing_with_alerts()/match_alert_with_listings() as SECURITY INVOKER.
--
-- Those two functions are triggers: match_alert_with_listings() fires
-- AFTER INSERT ON public.alerts. When a normal end user (role "authenticated")
-- inserts a row into alerts, the trigger runs as SECURITY INVOKER = the
-- authenticated user, and its internal call to listing_matches_alert() is
-- rejected with "42501: permission denied for function listing_matches_alert"
-- because EXECUTE was revoked from authenticated. This aborts the whole
-- transaction and Supabase returns 403 to the frontend.
--
-- This did not surface before because listings are only inserted via the
-- eBay import Edge Function using the service_role key, which still has
-- EXECUTE on all these functions. Once real listings existed, any new alert
-- with permissive filters matches at least one listing, triggering the bug.
--
-- Fix: mark the two trigger functions as SECURITY DEFINER (same pattern
-- already used for handle_new_user() in migration 004), so they - and the
-- functions they call internally - run with the owner's privileges instead
-- of the invoking user's. This keeps the EXECUTE revocations from migration
-- 004 intact (authenticated/anon still cannot call these functions directly),
-- while allowing the trigger to work correctly for any inserting role.

CREATE OR REPLACE FUNCTION public.match_listing_with_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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
$$;

CREATE OR REPLACE FUNCTION public.match_alert_with_listings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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
$$;
