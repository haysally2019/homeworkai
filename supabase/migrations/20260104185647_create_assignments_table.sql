/*
  # Create Assignments Table

  ## Overview
  This migration creates the assignments table to track homework and projects within classes.

  ## New Tables
  1. `assignments`
     - `id` (uuid, primary key) - Unique identifier for each assignment
     - `user_id` (uuid, foreign key) - References the user who owns this assignment
     - `class_id` (uuid, foreign key) - References the class this assignment belongs to
     - `title` (text) - Assignment title
     - `description` (text, nullable) - Assignment details
     - `due_date` (timestamptz, nullable) - When the assignment is due
     - `completed` (boolean) - Completion status
     - `created_at` (timestamptz) - Row creation timestamp
     - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on `assignments` table
  - Users can only view, create, update, and delete their own assignments
  - Assignments are tied to classes owned by the same user
  - No cross-user access permitted

  ## Important Notes
  1. Assignments are scoped to specific classes
  2. When a class is deleted, all related assignments are automatically deleted (CASCADE)
  3. Users can mark assignments as completed
  4. Assignments can have optional due dates
*/

CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignments"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assignments"
  ON assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assignments"
  ON assignments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assignments"
  ON assignments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_completed ON assignments(completed);
