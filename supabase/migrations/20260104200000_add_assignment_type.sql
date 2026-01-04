/*
  # Add Assignment Type

  ## Changes
  1. Add `type` column to `assignments` table with a default value of 'Homework'.
  2. This allows filtering and categorizing assignments for the exam prep feature.
*/

ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'Homework';