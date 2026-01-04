/*
  # Enable pgvector and Create Document Embeddings System

  ## Overview
  This migration sets up the vector database infrastructure for RAG (Retrieval Augmented Generation).
  Students can upload class materials (syllabi, notes) and the AI will use relevant context when answering questions.

  ## Extensions
  - Enable `pgvector` for vector similarity search

  ## New Tables
  1. `class_documents`
     - `id` (uuid, primary key) - Unique document identifier
     - `class_id` (uuid, foreign key) - References classes table
     - `user_id` (uuid, foreign key) - References auth.users
     - `filename` (text) - Original filename
     - `file_path` (text) - Path in Supabase Storage
     - `file_type` (text) - MIME type (e.g., application/pdf)
     - `file_size` (bigint) - File size in bytes
     - `upload_date` (timestamptz) - When uploaded
     - `processing_status` (text) - 'pending', 'processing', 'completed', 'failed'
     - `created_at` (timestamptz) - Row creation timestamp

  2. `document_chunks`
     - `id` (uuid, primary key) - Unique chunk identifier
     - `document_id` (uuid, foreign key) - References class_documents
     - `class_id` (uuid, foreign key) - References classes table
     - `user_id` (uuid, foreign key) - References auth.users
     - `content` (text) - The actual text chunk
     - `chunk_index` (integer) - Order of chunk in document
     - `embedding` (vector(768)) - Text embedding for similarity search
     - `created_at` (timestamptz) - Row creation timestamp

  ## Security
  - RLS enabled on both tables
  - Users can only access documents from their own classes
  - Read and insert permissions for authenticated users on their own data

  ## Indexes
  - Vector similarity search index on embeddings
  - Foreign key indexes for performance

  ## Important Notes
  1. Using 768-dimensional vectors (compatible with Google's text-embedding models)
  2. Documents are processed asynchronously via edge function
  3. Chunks are typically 500-1000 characters for optimal context retrieval
*/

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create class_documents table
CREATE TABLE IF NOT EXISTS class_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  upload_date timestamptz DEFAULT now(),
  processing_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on class_documents
ALTER TABLE class_documents ENABLE ROW LEVEL SECURITY;

-- Policies for class_documents
CREATE POLICY "Users can view documents from their classes"
  ON class_documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can upload documents to their classes"
  ON class_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents"
  ON class_documents
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create document_chunks table with vector embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES class_documents(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  chunk_index integer NOT NULL,
  embedding vector(768),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on document_chunks
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Policies for document_chunks
CREATE POLICY "Users can view chunks from their classes"
  ON document_chunks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service can insert chunks"
  ON document_chunks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_class_documents_class_id ON class_documents(class_id);
CREATE INDEX IF NOT EXISTS idx_class_documents_user_id ON class_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_class_id ON document_chunks(class_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_user_id ON document_chunks(user_id);

-- Create vector similarity search index using HNSW (Hierarchical Navigable Small World)
-- This enables fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks 
  USING hnsw (embedding vector_cosine_ops);

-- Create function for similarity search
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(768),
  match_class_id uuid,
  match_user_id uuid,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  FROM document_chunks
  WHERE document_chunks.class_id = match_class_id
    AND document_chunks.user_id = match_user_id
    AND 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
