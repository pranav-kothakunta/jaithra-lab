-- Create reports storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false,
  52428800,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Allow service role to manage all objects in reports bucket
CREATE POLICY "Service role full access reports bucket" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'reports')
  WITH CHECK (bucket_id = 'reports');

-- Allow anon to upload to reports bucket (admin dashboard uses anon key but we'll validate via edge fn)
CREATE POLICY "Anon can insert into reports bucket" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'reports');

-- Allow anon to read from reports bucket (for download links)
CREATE POLICY "Anon can read from reports bucket" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'reports');

-- Reports table: allow service role full access (edge function uses service role)
CREATE POLICY "Service role full access reports" ON reports
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Reports table: allow public to read reports (for patient tracking download)
CREATE POLICY "Public can read reports" ON reports
  FOR SELECT TO public
  USING (true);
