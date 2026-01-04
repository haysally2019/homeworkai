/*
  # Create Conversation History Table

  ## Overview
  This migration creates tables to store conversation history for context-aware chat sessions.

  ## New Tables
  1. `conversations`
     - `id` (uuid, primary key) - Unique identifier for each conversation
     - `user_id` (uuid, foreign key) - References the user who owns this conversation
     - `class_id` (uuid, foreign key, nullable) - References the class this conversation is related to
     - `assignment_id` (uuid, foreign key, nullable) - References the assignment this conversation is related to
     - `title` (text) - Auto-generated conversation title
     - `created_at` (timestamptz) - Row creation timestamp
     - `updated_at` (timestamptz) - Last update timestamp

  2. `messages`
     - `id` (uuid, primary key) - Unique identifier for each message
     - `conversation_id` (uuid, foreign key) - References the conversation this message belongs to
     - `role` (text) - Message role: 'user' or 'assistant'
     - `content` (text) - Message content
     - `image_url` (text, nullable) - Image URL if message includes an image
     - `created_at` (timestamptz) - Row creation timestamp

  ## Security
  - RLS enabled on both tables
  - Users can only access their own conversations and messages
  - Messages are tied to conversations owned by the same user
  - No cross-user access permitted

  ## Important Notes
  1. Conversations can be linked to a class and optionally an assignment
  2. When a conversation is deleted, all related messages are automatically deleted (CASCADE)
  3. Messages store both user inputs and AI responses
  4. The title is auto-generated from the first message
  5. Image URLs are stored for messages that include images
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_class_id ON conversations(class_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assignment_id ON conversations(assignment_id);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in own conversations"
  ON messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
