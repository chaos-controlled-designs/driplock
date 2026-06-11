/*
  # DripLock Schema Fixes
  Safe to run against any state of the DB — every operation checks existence first.
*/

-- ─── 1. profiles — add missing columns ──────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS grade            text,
  ADD COLUMN IF NOT EXISTS bio              text,
  ADD COLUMN IF NOT EXISTS usual_dress_size text,
  ADD COLUMN IF NOT EXISTS bust_inches      integer,
  ADD COLUMN IF NOT EXISTS waist_inches     integer,
  ADD COLUMN IF NOT EXISTS hips_inches      integer,
  ADD COLUMN IF NOT EXISTS safety_agreed    boolean DEFAULT false;

-- ─── 2. locks — add silhouette column only ───────────────────────────────────
-- (title / size / style are not in the actual schema — do not alter them)
ALTER TABLE locks
  ADD COLUMN IF NOT EXISTS silhouette text;

-- ─── 3. listings — add missing columns ──────────────────────────────────────
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS designer           text,
  ADD COLUMN IF NOT EXISTS silhouette         text,
  ADD COLUMN IF NOT EXISTS dress_size         text,
  ADD COLUMN IF NOT EXISTS condition          text,
  ADD COLUMN IF NOT EXISTS rental_price_cents integer,
  ADD COLUMN IF NOT EXISTS deposit_cents      integer,
  ADD COLUMN IF NOT EXISTS ships              boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS local_meetup       boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS description        text,
  ADD COLUMN IF NOT EXISTS bust_inches        integer,
  ADD COLUMN IF NOT EXISTS waist_inches       integer,
  ADD COLUMN IF NOT EXISTS hips_inches        integer;

-- Make price_cents nullable (rent-only listings send null)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'listings'
      AND column_name  = 'price_cents'
      AND is_nullable  = 'NO'
  ) THEN
    ALTER TABLE listings ALTER COLUMN price_cents DROP NOT NULL;
  END IF;
END $$;

-- Make color nullable (optional field)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'listings'
      AND column_name  = 'color'
      AND is_nullable  = 'NO'
  ) THEN
    ALTER TABLE listings ALTER COLUMN color DROP NOT NULL;
  END IF;
END $$;

-- Allow listing_type = 'both'
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_listing_type_check;
ALTER TABLE listings ADD CONSTRAINT listings_listing_type_check
  CHECK (listing_type IN ('rent', 'sell', 'both'));

-- ─── 4. wishlists table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlists (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'wishlists' AND policyname = 'Users can read own wishlists'
  ) THEN
    CREATE POLICY "Users can read own wishlists"
      ON wishlists FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'wishlists' AND policyname = 'Users can insert own wishlists'
  ) THEN
    CREATE POLICY "Users can insert own wishlists"
      ON wishlists FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'wishlists' AND policyname = 'Users can delete own wishlists'
  ) THEN
    CREATE POLICY "Users can delete own wishlists"
      ON wishlists FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- ─── 5. RLS — open marketplace reads ────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read listings from same school" ON listings;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'listings' AND policyname = 'Authenticated users can read all listings'
  ) THEN
    CREATE POLICY "Authenticated users can read all listings"
      ON listings FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Authenticated users can read all profiles'
  ) THEN
    CREATE POLICY "Authenticated users can read all profiles"
      ON profiles FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ─── 6. Seed additional schools (match SignUp.tsx IDs) ───────────────────────
INSERT INTO schools (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Lakewood High School'),
  ('00000000-0000-0000-0000-000000000002', 'Westfield High School'),
  ('00000000-0000-0000-0000-000000000003', 'Riverside High School')
ON CONFLICT DO NOTHING;

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id    ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_listing_id ON wishlists(listing_id);
