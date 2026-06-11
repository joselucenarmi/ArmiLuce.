-- Update listings table to support external marketplaces

-- Add new columns for marketplace support
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS source TEXT, -- e.g., 'idealista', 'fotocasa', 'milanuncios'
  ADD COLUMN IF NOT EXISTS external_id TEXT, -- ID from the source platform
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'property'; -- 'property', 'vehicle', 'land'

-- Rename url_original to source_url (keep url_original for backward compatibility)
-- We'll populate source_url from url_original
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Update source_url from url_original for existing records
UPDATE public.listings 
SET source_url = url_original 
WHERE source_url IS NULL AND url_original IS NOT NULL;

-- Convert image_url (single) to images (array) for multiple image support
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS images TEXT[]; -- Array of image URLs

-- Migrate existing image_url data to images array
UPDATE public.listings 
SET images = ARRAY[image_url] 
WHERE images IS NULL AND image_url IS NOT NULL;

-- Add constraints
ALTER TABLE public.listings 
  ALTER COLUMN category SET NOT NULL;

-- Add unique constraint for source + external_id combination (prevents duplicates from same source)
CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_source_external 
  ON public.listings(source, external_id) 
  WHERE source IS NOT NULL AND external_id IS NOT NULL;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_listings_source ON public.listings(source);
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category);

-- Update alerts to use category instead of type
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS category TEXT; -- 'property', 'vehicle', 'land'

-- Update the listing_matches_alert function to handle new fields
CREATE OR REPLACE FUNCTION public.listing_matches_alert(
  p_listing public.listings,
  p_alert public.alerts
) RETURNS BOOLEAN AS $$
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

-- Comments for documentation
COMMENT ON COLUMN public.listings.source IS 'External marketplace source (e.g., idealista, fotocasa, milanuncios)';
COMMENT ON COLUMN public.listings.external_id IS 'ID of the listing in the source platform';
COMMENT ON COLUMN public.listings.source_url IS 'URL to the original listing on the source platform';
COMMENT ON COLUMN public.listings.category IS 'Listing category: property, vehicle, or land';
COMMENT ON COLUMN public.listings.images IS 'Array of image URLs for the listing';
COMMENT ON COLUMN public.alerts.category IS 'Filter by listing category: property, vehicle, or land';
