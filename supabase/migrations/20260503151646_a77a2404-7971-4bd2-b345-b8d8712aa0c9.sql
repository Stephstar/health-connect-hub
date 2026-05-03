
-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('message-attachments', 'message-attachments', true, 52428800);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

-- Allow anyone to view attachments
CREATE POLICY "Anyone can view attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-attachments');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add message_type column to messages table for attachment support
ALTER TABLE public.messages ADD COLUMN message_type text NOT NULL DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN attachment_url text;
ALTER TABLE public.messages ADD COLUMN attachment_name text;
