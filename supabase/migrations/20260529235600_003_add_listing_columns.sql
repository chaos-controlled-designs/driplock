/*
  Add missing listing columns for dress details and rental options
  
  New columns in listings table:
  - bust_inches (integer)
  - waist_inches (integer)
  - hips_inches (integer)
  - dress_size (text) - replaces 'size' with more descriptive name
  - description (text)
  - designer (text)
  - silhouette (text)
  - condition (text)
  - rental_price_cents (integer)
  - deposit_cents (integer)
  - ships (boolean)
  - local_meetup (boolean)
  
  Also add the same measurement columns to profiles table
*/

-- Add missing columns to listings table
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS dress_size text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS designer text,
ADD COLUMN IF NOT EXISTS silhouette text,
ADD COLUMN IF NOT EXISTS condition text,
ADD COLUMN IF NOT EXISTS bust_inches integer,
ADD COLUMN IF NOT EXISTS waist_inches integer,
ADD COLUMN IF NOT EXISTS hips_inches integer,
ADD COLUMN IF NOT EXISTS rental_price_cents integer,
ADD COLUMN IF NOT EXISTS deposit_cents integer,
ADD COLUMN IF NOT EXISTS ships boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS local_meetup boolean DEFAULT true;

-- Add measurement columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bust_inches integer,
ADD COLUMN IF NOT EXISTS waist_inches integer,
ADD COLUMN IF NOT EXISTS hips_inches integer,
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS grade text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS usual_dress_size text,
ADD COLUMN IF NOT EXISTS safety_agreed boolean DEFAULT false;

-- Create indexes for common searches
CREATE INDEX IF NOT EXISTS idx_listings_dress_size ON listings(dress_size);
CREATE INDEX IF NOT EXISTS idx_listings_designer ON listings(designer);
CREATE INDEX IF NOT EXISTS idx_listings_condition ON listings(condition);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
