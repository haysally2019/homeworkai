-- Add a column to track when the credits were last reset
ALTER TABLE users_credits 
ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;

-- Optional: Index for performance if you have many users
CREATE INDEX IF NOT EXISTS idx_users_credits_reset_date ON users_credits(last_reset_date);