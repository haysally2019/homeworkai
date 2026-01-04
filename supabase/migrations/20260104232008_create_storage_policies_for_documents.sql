/*
  # Create Storage Policies for Class Documents

  ## Overview
  Sets up RLS policies for the class-documents storage bucket to ensure users can only access their own files.

  ## Security Policies
  1. Users can upload files to their own folders
  2. Users can view their own files
  3. Users can delete their own files

  ## Storage Structure
  Files are stored as: {user_id}/{class_id}/{filename}
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload documents to their folders" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload documents to their folders"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'class-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view their own files
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'class-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'class-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
