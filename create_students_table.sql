-- Drop existing table to ensure the new photo_base64 column is added
DROP TABLE IF EXISTS public.students_data CASCADE;

-- Create students_data table to store registered students and their face descriptors
CREATE TABLE IF NOT EXISTS public.students_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    year VARCHAR(20) NOT NULL,
    section VARCHAR(20) NOT NULL,
    reg_no VARCHAR(50) UNIQUE NOT NULL,
    parent_no VARCHAR(20) NOT NULL,
    face_descriptor TEXT NOT NULL,
    photo_base64 TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on reg_no
CREATE INDEX IF NOT EXISTS idx_students_data_reg_no ON public.students_data(reg_no);

-- Set up Row Level Security
ALTER TABLE public.students_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read student data" ON public.students_data;
DROP POLICY IF EXISTS "Users can insert student data" ON public.students_data;
DROP POLICY IF EXISTS "Users can update student data" ON public.students_data;

-- Allow all users (including anonymous since app uses custom Admin login) to read student data
CREATE POLICY "Users can read student data" ON public.students_data
    FOR SELECT USING (true);

-- Allow all users to insert student data
CREATE POLICY "Users can insert student data" ON public.students_data
    FOR INSERT WITH CHECK (true);

-- Allow all users to update student data
CREATE POLICY "Users can update student data" ON public.students_data
    FOR UPDATE USING (true);
