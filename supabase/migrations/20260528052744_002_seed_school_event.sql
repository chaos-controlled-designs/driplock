/*
  # DripLock Seed Data - Foundation

  Populates the database with core demo data.
  
  1. Seed Data Included
    - 1 school: "Georgetown Exempted Village High School"
    - 1 event: "GEV HIGH PROM 2026" — May 15, 2026, 7:00 PM

  2. Important Notes
    - Only creates schools and events initially
    - Demo users will be created via auth signup
    - Demo locks, listings, and messages will be seeded via a separate function
*/

-- Insert school
INSERT INTO schools (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Georgetown Exempted Village High School')
ON CONFLICT (id) DO NOTHING;

-- Insert event
INSERT INTO events (id, school_id, name, date, location) VALUES
  ('22222222-2222-2222-2222-222222222222', 
   '11111111-1111-1111-1111-111111111111',
   'GEV HIGH PROM 2026',
   '2026-05-15 19:00:00-04:00',
   '2222 St RT Cincinnati Ohio')
ON CONFLICT (id) DO NOTHING;
