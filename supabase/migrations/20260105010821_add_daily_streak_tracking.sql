/*
  # Add Daily Streak Tracking System

  ## Overview
  This migration adds a daily study streak feature for free tier users to increase engagement and retention.

  ## Changes to `users_credits` Table
  1. New Columns:
     - `last_activity_date` (date) - Date of last credit usage
     - `current_streak` (integer, default 0) - Current consecutive days of activity
     - `longest_streak` (integer, default 0) - Longest streak ever achieved
     - `last_streak_reward_date` (date, nullable) - Date of last streak bonus reward

  ## Reward System
  - Users who study 5 days in a row receive 10 bonus credits
  - Only free tier users see and participate in the streak system
  - Streak resets if more than 1 day gap between activities

  ## Security
  - All RLS policies remain unchanged
  - Streak updates handled by service role through API
*/

-- Add streak tracking columns to users_credits table
ALTER TABLE users_credits 
  ADD COLUMN IF NOT EXISTS last_activity_date date,
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_streak_reward_date date;

-- Update handle_new_user function to include new columns
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users_credits (id, credits, is_pro, current_streak, longest_streak)
  VALUES (NEW.id, 5, false, 0, 0);
  RETURN NEW;
END;
$$;
