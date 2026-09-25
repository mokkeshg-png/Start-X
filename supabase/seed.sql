-- =============================================================================
-- START-X: SEED DATA (Development Only)
-- =============================================================================
-- WARNING: Do NOT run this in production.
-- This file inserts reference / lookup data only.
-- User records depend on Supabase Auth — do not insert fake auth.users rows.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Departments
-- -----------------------------------------------------------------------------
INSERT INTO departments (department_id, name, code, description) VALUES
    (gen_random_uuid(), 'Computer Science',           'CS',   'Software, AI, and Systems'),
    (gen_random_uuid(), 'Information Technology',     'IT',   'Infrastructure and networks'),
    (gen_random_uuid(), 'Software Engineering',       'SE',   'Engineering practices and methodologies'),
    (gen_random_uuid(), 'Data Science',               'DS',   'Data analysis and machine learning'),
    (gen_random_uuid(), 'Cybersecurity',              'CYB',  'Security and digital forensics'),
    (gen_random_uuid(), 'Business Information Systems','BIS', 'Business + technology intersection')
ON CONFLICT (code) DO NOTHING;
