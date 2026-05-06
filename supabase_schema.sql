-- SUPABASE SQL SCHEMA FOR SDMS (Student Data Management System)
-- Copy and paste this into your Supabase SQL Editor

-- 1. Users Table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('admin', 'staff', 'student')),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Cases Table (Main table for case management)
CREATE TABLE public.cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(100) NOT NULL,
    case_type VARCHAR(50) NOT NULL CHECK (case_type IN ('software', 'web', 'mobile', 'database', 'integration', 'consulting')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'solved', 'cancelled')),
    description TEXT,
    deadline DATE,
    assigned_to UUID REFERENCES public.users(id),
    created_by UUID REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Case History Table (Track all case activities)
CREATE TABLE public.case_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    performed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Case Comments Table (Comments and notes on cases)
CREATE TABLE public.case_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Case Attachments Table (File attachments for cases)
CREATE TABLE public.case_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Notifications Table (System notifications)
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. System Settings Table (App configuration)
CREATE TABLE public.settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for better performance
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_priority ON public.cases(priority);
CREATE INDEX idx_cases_created_by ON public.cases(created_by);
CREATE INDEX idx_cases_assigned_to ON public.cases(assigned_to);
CREATE INDEX idx_cases_created_at ON public.cases(created_at);
CREATE INDEX idx_case_history_case_id ON public.case_history(case_id);
CREATE INDEX idx_case_comments_case_id ON public.case_comments(case_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Users can view cases they created or are assigned to
CREATE POLICY "Users can view relevant cases" ON public.cases
    FOR SELECT USING (
        auth.uid() = created_by OR 
        auth.uid() = assigned_to OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- Users can create cases
CREATE POLICY "Users can create cases" ON public.cases
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update cases they created or are assigned to
CREATE POLICY "Users can update relevant cases" ON public.cases
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        auth.uid() = assigned_to OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- Case history policies
CREATE POLICY "Users can view case history for accessible cases" ON public.case_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cases 
            WHERE id = case_id AND (
                created_by = auth.uid() OR 
                assigned_to = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND role IN ('admin', 'staff')
                )
            )
        )
    );

-- Case comments policies
CREATE POLICY "Users can view comments for accessible cases" ON public.case_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cases 
            WHERE id = case_id AND (
                created_by = auth.uid() OR 
                assigned_to = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND role IN ('admin', 'staff')
                )
            )
        )
    );

CREATE POLICY "Users can create comments for accessible cases" ON public.case_comments
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM public.cases 
            WHERE id = case_id AND (
                created_by = auth.uid() OR 
                assigned_to = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND role IN ('admin', 'staff')
                )
            )
        )
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Settings policies (admin only)
CREATE POLICY "Admin can manage settings" ON public.settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
('app_name', 'PMC Tech SDMS', 'Application name'),
('app_version', '1.0.0', 'Application version'),
('max_file_size', '10485760', 'Maximum file upload size in bytes (10MB)'),
('allowed_file_types', 'pdf,doc,docx,jpg,jpeg,png,txt', 'Allowed file extensions'),
('default_case_priority', 'medium', 'Default priority for new cases'),
('notification_email', 'admin@pmctech.com', 'Default notification email');

-- Note: Sample data will be created automatically when users start using the application
-- The sample data below can be inserted manually after authentication is working:
--
-- INSERT INTO public.cases (case_number, client_name, case_type, priority, status, description, deadline, created_by) VALUES
-- ('PMC001', 'John Doe', 'software', 'high', 'pending', 'Software development project for inventory management', '2025-11-15', auth.uid()),
-- ('PMC002', 'Jane Smith', 'web', 'medium', 'in_progress', 'Website redesign for corporate portal', '2025-12-01', auth.uid()),
-- ('PMC003', 'ABC Corp', 'database', 'low', 'solved', 'Database optimization and performance tuning', '2025-10-20', auth.uid());

-- Functions for common operations
CREATE OR REPLACE FUNCTION get_case_stats()
RETURNS TABLE(
    total_cases BIGINT,
    pending_cases BIGINT,
    in_progress_cases BIGINT,
    solved_cases BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_cases,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_cases,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_cases,
        COUNT(*) FILTER (WHERE status = 'solved') as solved_cases
    FROM public.cases
    WHERE (
        created_by = auth.uid() OR 
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create case history entry
CREATE OR REPLACE FUNCTION add_case_history(
    p_case_id UUID,
    p_action VARCHAR(100),
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    history_id UUID;
BEGIN
    INSERT INTO public.case_history (case_id, action, description, performed_by)
    VALUES (p_case_id, p_action, p_description, auth.uid())
    RETURNING id INTO history_id;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate case number
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    next_number INTEGER;
    case_number VARCHAR(50);
BEGIN
    -- Get the next number in sequence
    SELECT COALESCE(MAX(CAST(SUBSTRING(case_number FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.cases
    WHERE case_number ~ '^PMC[0-9]+$';
    
    -- Format as PMC001, PMC002, etc.
    case_number := 'PMC' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN case_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create user profile trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow users to insert their own profile during signup
CREATE POLICY "Enable insert for users during signup" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);