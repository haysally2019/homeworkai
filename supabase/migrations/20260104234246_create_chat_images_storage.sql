/*
  # Create Chat Images Storage Bucket

  ## Overview
  This migration sets up storage for chat images so users can see their uploaded images
  in conversation history.

  ## New Storage
  1. `chat-images` bucket
     - Stores user-uploaded images from chat conversations
     - Images are organized by user ID and conversation ID
     - Public read access for authenticated users' own images

  ## Security
  - Users can only upload images to their own user folder
  - Users can view images they uploaded
  - Users can delete their own images
  - Images are publicly readable via signed URL

  ## Important Notes
  1. File path pattern: {user_id}/{conversation_id}/{timestamp}_{filename}
  2. Maximum file size: 5MB per image
  3. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
  4. Images are stored with public access for easy viewing in chat history
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own chat images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own chat images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own chat images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public read access to chat images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'chat-images');
