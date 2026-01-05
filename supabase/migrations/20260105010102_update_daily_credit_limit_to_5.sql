/*
  # Update Daily Credit Limit to 5

  ## Overview
  This migration updates the free tier daily credit limit from 3 to 5.

  ## Changes
  1. Update default credits column value to 5
  2. Update the handle_new_user function to give 5 credits on signup
  3. Update existing free users to have 5 credits (one-time migration)

  ## Important Notes
  - Existing pro users (is_pro = true) are not affected
  - This change applies to all free tier users
*/

-- Update the default value for the credits column
ALTER TABLE users_credits ALTER COLUMN credits SET DEFAULT 5;

-- Update the handle_new_user function to give 5 credits
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users_credits (id, credits, is_pro)
  VALUES (NEW.id, 5, false);
  RETURN NEW;
END;
$$;

-- Update existing free users to have 5 credits
UPDATE users_credits
SET credits = 5
WHERE is_pro = false AND credits < 5;
