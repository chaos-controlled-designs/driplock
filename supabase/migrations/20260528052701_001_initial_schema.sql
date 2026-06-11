/*
  # DripLock Initial Schema

  1. New Tables
    - `profiles`: User profiles with school association
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `school_id` (uuid, references schools)
      - `push_token` (text, nullable)
      - `avatar_initials` (text, default generated from username)
      - `created_at` (timestamptz)
    
    - `schools`: School records
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamptz)
    
    - `events`: Prom events for schools
      - `id` (uuid, primary key)
      - `school_id` (uuid, references schools)
      - `name` (text)
      - `date` (timestamptz)
      - `location` (text)
      - `created_at` (timestamptz)
    
    - `locks`: Locked dress/outfit records
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `event_id` (uuid, references events)
      - `title` (text)
      - `description` (text)
      - `color` (text)
      - `style` (text)
      - `size` (text)
      - `photo_urls` (text array)
      - `is_verified` (boolean)
      - `created_at` (timestamptz)
    
    - `listings`: Marketplace listings for rent/sell
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `category` (text)
      - `size` (text)
      - `color` (text)
      - `price_cents` (integer)
      - `listing_type` (text: 'rent' or 'sell')
      - `photo_urls` (text array)
      - `is_available` (boolean)
      - `created_at` (timestamptz)
    
    - `conversations`: Chat conversations between users
      - `id` (uuid, primary key)
      - `user_a` (uuid, references profiles)
      - `user_b` (uuid, references profiles)
      - `listing_id` (uuid, nullable, references listings)
      - `created_at` (timestamptz)
    
    - `messages`: Chat messages
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations)
      - `sender_id` (uuid, references profiles)
      - `content` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies ensure users only see data from their school's event
    - Users can only modify their own data

  3. Important Notes
    - All tables use gen_random_uuid() for primary keys
    - Timestamps default to now()
    - RLS policies reference auth.uid() for user identification
*/

-- Schools table
CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  date timestamptz NOT NULL,
  location text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  push_token text,
  avatar_initials text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Locks table
CREATE TABLE IF NOT EXISTS locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  color text NOT NULL,
  style text NOT NULL,
  size text NOT NULL,
  photo_urls text[] DEFAULT '{}',
  is_verified boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Listings table
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  size text NOT NULL,
  color text NOT NULL,
  price_cents integer NOT NULL,
  listing_type text NOT NULL CHECK (listing_type IN ('rent', 'sell')),
  photo_urls text[] DEFAULT '{}',
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_a, user_b)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Schools policies (everyone can read)
CREATE POLICY "Anyone can read schools"
  ON schools FOR SELECT
  TO authenticated
  USING (true);

-- Events policies (users can read events for their school)
CREATE POLICY "Users can read own school events"
  ON events FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can read profiles from same school"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Locks policies (users see locks from their school's events)
CREATE POLICY "Users can read locks from own school events"
  ON locks FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE school_id IN (
        SELECT school_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own locks"
  ON locks FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    event_id IN (
      SELECT id FROM events WHERE school_id IN (
        SELECT school_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own locks"
  ON locks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own locks"
  ON locks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Listings policies (users see listings from their school)
CREATE POLICY "Users can read listings from same school"
  ON listings FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM profiles WHERE school_id IN (
        SELECT school_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Conversations policies (users see conversations they're part of)
CREATE POLICY "Users can read own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (user_a = auth.uid() OR user_b = auth.uid());

CREATE POLICY "Users can insert conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_a = auth.uid() OR user_b = auth.uid());

-- Messages policies (users see messages from their conversations)
CREATE POLICY "Users can read messages from own conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_a = auth.uid() OR user_b = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to own conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations WHERE user_a = auth.uid() OR user_b = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_events_school_id ON events(school_id);
CREATE INDEX IF NOT EXISTS idx_locks_user_id ON locks(user_id);
CREATE INDEX IF NOT EXISTS idx_locks_event_id ON locks(event_id);
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user_a, user_b);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
