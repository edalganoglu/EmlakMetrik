-- Add pdf_generated flag to properties table
-- Run this in Supabase SQL Editor

ALTER TABLE properties ADD COLUMN IF NOT EXISTS pdf_generated BOOLEAN DEFAULT FALSE;

-- Add pdf_generated_at timestamp to track when PDF was created
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;
