-- VIP + event profile columns, and extra lock/listing detail columns
-- Safe to re-run — every statement uses IF NOT EXISTS or DO blocks

-- ── profiles ──────────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS school          text,
  ADD COLUMN IF NOT EXISTS event_type      text,
  ADD COLUMN IF NOT EXISTS event_date      date,
  ADD COLUMN IF NOT EXISTS event_time      time,
  ADD COLUMN IF NOT EXISTS event_location  text,
  ADD COLUMN IF NOT EXISTS vip_status      text CHECK (vip_status IN ('single', 'season')),
  ADD COLUMN IF NOT EXISTS vip_expiry      timestamptz,
  ADD COLUMN IF NOT EXISTS zip_code        text;

-- ── locks ─────────────────────────────────────────────────────────────────────
ALTER TABLE locks
  ADD COLUMN IF NOT EXISTS designer      text,
  ADD COLUMN IF NOT EXISTS neckline      text,
  ADD COLUMN IF NOT EXISTS back_style    text,
  ADD COLUMN IF NOT EXISTS dress_length  text,
  ADD COLUMN IF NOT EXISTS embellishments text;

-- ── indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_school   ON profiles(school);
CREATE INDEX IF NOT EXISTS idx_locks_user_event  ON locks(user_id, event_id);
