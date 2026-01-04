/*
  # Create Users Credits System

  ## Overview
  This migration creates the credits management system for the Altus application.

  ## New Tables
  1. `users_credits`
     - `id` (uuid, primary key) - References auth.users
     - `credits` (integer, default 3) - Free tier credits
     - `is_pro` (boolean, default false) - Pro subscription status
     - `created_at` (timestamptz) - Row creation timestamp
     - `updated_at` (timestamptz) - Last update timestamp

  ## Triggers
  - Auto-creates a row in `users_credits` with 3 free credits when a new user signs up via Supabase Auth

  ## Security
  - RLS enabled on `users_credits` table
  - Users can read their own credit information
  - Users cannot directly modify their credits (only through API)

  ## Important Notes
  1. Credits are decremented through the API route, not directly by users
  2. Pro users (is_pro = true) have unlimited access
  3. Free users start with 3 credits
*/

-- Create users_credits table
CREATE TABLE IF NOT EXISTS users_credits (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  credits integer NOT NULL DEFAULT 3,
  is_pro boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users_credits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own credit information
CREATE POLICY "Users can view own credits"
  ON users_credits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users cannot insert their own credits (handled by trigger)
CREATE POLICY "No direct inserts"
  ON users_credits
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Policy: Users cannot update their own credits (handled by API)
CREATE POLICY "No direct updates"
  ON users_credits
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Policy: Users cannot delete their own credits
CREATE POLICY "No direct deletes"
  ON users_credits
  FOR DELETE
  TO authenticated
  USING (false);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users_credits (id, credits, is_pro)
  VALUES (NEW.id, 3, false);
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create credits row on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_users_credits_updated_at ON users_credits;
CREATE TRIGGER update_users_credits_updated_at
  BEFORE UPDATE ON users_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();