
-- Add attachment columns to reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text;

-- Add attachment columns to bug_reports
ALTER TABLE public.bug_reports
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text;

-- Create storage bucket for widget uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('widget-uploads', 'widget-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to widget-uploads
CREATE POLICY "Authenticated can upload widget files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'widget-uploads');

-- Allow public read of widget-uploads
CREATE POLICY "Public can read widget uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'widget-uploads');
