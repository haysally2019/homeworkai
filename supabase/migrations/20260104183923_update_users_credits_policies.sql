/*
  # Update Users Credits Policies

  ## Changes
  - Allow service role to insert credits for users without existing records
  - Allow service role to update credits (for decrementing)
  
  ## Security Notes
  - Regular users still cannot modify their own credits
  - Only service role (API) can perform these operations
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "No direct inserts" ON users_credits;
DROP POLICY IF EXISTS "No direct updates" ON users_credits;

-- Service role can insert credits for any user
CREATE POLICY "Service role can insert credits"
  ON users_credits
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role can update credits for any user
CREATE POLICY "Service role can update credits"
  ON users_credits
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users cannot insert their own credits
CREATE POLICY "Authenticated cannot insert credits"
  ON users_credits
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Authenticated users cannot update their own credits
CREATE POLICY "Authenticated cannot update credits"
  ON users_credits
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);