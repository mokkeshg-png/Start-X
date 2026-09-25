-- Migration: Create ai_analysis table

CREATE TABLE IF NOT EXISTS public.ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(team_id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(student_id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL,
    input_reference TEXT,
    result_json JSONB NOT NULL,
    summary TEXT,
    confidence NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_analysis_team ON public.ai_analysis(team_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_student ON public.ai_analysis(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_type ON public.ai_analysis(analysis_type);

-- RLS Policies
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;

-- Allow read access based on role
CREATE POLICY "Students can view AI analysis for their own team or themselves"
    ON public.ai_analysis FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            student_id IN (SELECT student_id FROM students WHERE user_id = auth.uid()) OR
            team_id IN (SELECT team_id FROM team_members tm JOIN students s ON tm.student_id = s.student_id WHERE s.user_id = auth.uid()) OR
            (auth.jwt()->>'app_metadata')::jsonb->>'role' IN ('admin', 'staff', 'department_head')
        )
    );

-- Allow Edge Functions (using service_role) to insert/update
-- Service role bypasses RLS by default, but we can explicitly add it if needed.
