/*
  # Create Notes Table

  1. New Tables
    - `class_notes`
      - `id` (uuid, primary key)
      - `class_id` (uuid, foreign key to classes)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text) - Auto-generated title
      - `raw_notes` (text) - Original unformatted notes
      - `formatted_notes` (text) - AI-formatted markdown notes
      - `summary` (text) - AI-generated summary
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `class_notes` table
    - Add policies for authenticated users to:
      - Read their own notes
      - Create their own notes
      - Update their own notes
      - Delete their own notes
*/

CREATE TABLE IF NOT EXISTS class_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  raw_notes text NOT NULL,
  formatted_notes text NOT NULL,
  summary text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE class_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notes"
  ON class_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes"
  ON class_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON class_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON class_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_class_notes_class_id ON class_notes(class_id);
CREATE INDEX IF NOT EXISTS idx_class_notes_user_id ON class_notes(user_id);