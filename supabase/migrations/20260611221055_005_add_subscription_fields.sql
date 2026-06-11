-- Add subscription fields to profiles table

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN public.profiles.subscription_plan IS 'Current subscription plan: basic, pro, or professional';
COMMENT ON COLUMN public.profiles.subscription_status IS 'Subscription status: active, canceled, past_due, etc.';
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for billing';
