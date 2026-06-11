-- Create dress-photos storage bucket (public so image URLs are directly accessible)
INSERT INTO storage.buckets (id, name, public)
VALUES ('dress-photos', 'dress-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view photos (public bucket)
CREATE POLICY "Public dress photos are viewable by all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dress-photos');

-- Only authenticated users can upload, and only into their own user-id folder
CREATE POLICY "Authenticated users can upload dress photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'dress-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can only delete their own photos
CREATE POLICY "Users can delete own dress photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'dress-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
