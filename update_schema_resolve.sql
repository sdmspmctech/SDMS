-- Add resolution fields to cases_ table
-- This allows tracking when cases are resolved and storing resolution notes

-- Add resolved_at column to track when a case was resolved
ALTER TABLE public.cases_ 
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

-- Add resolution_notes column to store admin notes about the resolution
ALTER TABLE public.cases_ 
ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Add a comment to document the new columns
COMMENT ON COLUMN public.cases_.resolved_at IS 'Timestamp when the case was marked as resolved';
COMMENT ON COLUMN public.cases_.resolution_notes IS 'Optional notes from admin about how the case was resolved';

-- Create an index on resolved_at for better query performance when filtering resolved/pending cases
CREATE INDEX IF NOT EXISTS idx_cases_resolved_at ON public.cases_(resolved_at);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cases_' 
AND table_schema = 'public'
ORDER BY ordinal_position;