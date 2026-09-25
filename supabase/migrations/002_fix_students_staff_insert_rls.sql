-- =============================================================================
-- MIGRATION 002: Add INSERT policies for students and staff
--
-- The existing schema has SELECT and UPDATE policies on students and staff,
-- but no INSERT policy. The Spring Boot backend (using service_role key)
-- bypasses RLS, so this only matters for direct Supabase client calls.
-- Included here for completeness and future-proofing.
--
-- SAFE: Uses IF NOT EXISTS via DROP IF EXISTS + CREATE pattern.
-- =============================================================================

-- Allow admins/staff to insert student records (admin provisioning flow)
DROP POLICY IF EXISTS students_insert ON public.students;
CREATE POLICY students_insert
    ON public.students FOR INSERT
    WITH CHECK (
        (user_id = auth.uid())           -- user inserting their own record
        OR is_staff_or_above()           -- or an admin/staff provisioning it
    );

-- Allow admins/staff to insert staff records
DROP POLICY IF EXISTS staff_insert ON public.staff;
CREATE POLICY staff_insert
    ON public.staff FOR INSERT
    WITH CHECK (
        (user_id = auth.uid())
        OR is_staff_or_above()
    );
