/*
  # Create Classes Table

  ## Overview
  This migration creates the classes table to allow users to organize their coursework.

  ## New Tables
  1. `classes`
     - `id` (uuid, primary key) - Unique identifier for each class
     - `user_id` (uuid, foreign key) - References the user who owns this class
     - `name` (text) - Class name (e.g., "Calculus II")
     - `code` (text) - Class code (e.g., "MATH 2414")
     - `color` (text) - Color for visual organization (hex code)
     - `semester` (text) - Semester info (e.g., "Spring 2024")
     - `description` (text, nullable) - Optional class description
     - `created_at` (timestamptz) - Row creation timestamp
     - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on `classes` table
  - Users can only view, create, update, and delete their own classes
  - No cross-user access permitted

  ## Important Notes
  1. Each user can create multiple classes
  2. Classes serve as organizational containers for assignments and conversations
  3. The color field helps users visually distinguish between different classes
*/

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  color text NOT NULL DEFAULT '#10b981',
  semester text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own classes"
  ON classes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own classes"
  ON classes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own classes"
  ON classes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own classes"
  ON classes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_classes_user_id ON classes(user_id);
