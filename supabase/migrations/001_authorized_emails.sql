-- =============================================================================
-- MIGRATION 001: authorized_emails
-- College Admin pre-authorization table for the Start-X platform.
--
-- Run this in the Supabase Dashboard SQL Editor (or via a service-role client).
-- The backend also applies this idempotently on startup via
-- DatabaseMigrationRunner.java using the service-role JDBC URL.
--
-- SAFE: Uses IF NOT EXISTS throughout — will not harm existing data.
-- DO NOT add DROP TABLE or TRUNCATE anywhere in this file.
-- =============================================================================

-- Table
CREATE TABLE IF NOT EXISTS public.authorized_emails (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    email           varchar(255)  NOT NULL,
    role            user_role_type NOT NULL,      -- 'student' | 'staff' | 'admin'
    status          varchar(20)   NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','registered','active','revoked')),
    added_by        uuid          REFERENCES public.users(user_id) ON DELETE SET NULL,
    linked_user_id  uuid          REFERENCES public.users(user_id) ON DELETE SET NULL,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz   NOT NULL DEFAULT now()
);

-- Unique email constraint (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'authorized_emails_email_unique'
    ) THEN
        ALTER TABLE public.authorized_emails
            ADD CONSTRAINT authorized_emails_email_unique UNIQUE (email);
    END IF;
END$$;

-- Lowercase/trimmed email constraint (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'authorized_emails_email_lowercase'
    ) THEN
        ALTER TABLE public.authorized_emails
            ADD CONSTRAINT authorized_emails_email_lowercase
            CHECK (email = lower(trim(email)));
    END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_authorized_emails_email  ON public.authorized_emails (email);
CREATE INDEX IF NOT EXISTS idx_authorized_emails_role   ON public.authorized_emails (role);
CREATE INDEX IF NOT EXISTS idx_authorized_emails_status ON public.authorized_emails (status);

-- Auto-update trigger function
CREATE OR REPLACE FUNCTION public.update_authorized_emails_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_authorized_emails_updated_at ON public.authorized_emails;
CREATE TRIGGER trg_authorized_emails_updated_at
    BEFORE UPDATE ON public.authorized_emails
    FOR EACH ROW EXECUTE FUNCTION public.update_authorized_emails_updated_at();

-- RLS
ALTER TABLE public.authorized_emails ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies idempotently
DROP POLICY IF EXISTS authorized_emails_select_admin ON public.authorized_emails;
DROP POLICY IF EXISTS authorized_emails_insert_admin ON public.authorized_emails;
DROP POLICY IF EXISTS authorized_emails_update_admin ON public.authorized_emails;
DROP POLICY IF EXISTS authorized_emails_delete_admin ON public.authorized_emails;

-- Only admins can read the authorization list
CREATE POLICY authorized_emails_select_admin
    ON public.authorized_emails FOR SELECT
    USING (get_my_role() = 'admin');

-- Only admins can add authorized emails
CREATE POLICY authorized_emails_insert_admin
    ON public.authorized_emails FOR INSERT
    WITH CHECK (get_my_role() = 'admin');

-- Only admins can update (e.g. change status or role)
CREATE POLICY authorized_emails_update_admin
    ON public.authorized_emails FOR UPDATE
    USING    (get_my_role() = 'admin')
    WITH CHECK (get_my_role() = 'admin');

-- Only admins can hard-delete (soft-revoke preferred via status='revoked')
CREATE POLICY authorized_emails_delete_admin
    ON public.authorized_emails FOR DELETE
    USING (get_my_role() = 'admin');

-- Note: service_role key (used by the Spring Boot backend) bypasses RLS automatically.
-- No extra policy is needed for backend server-side operations.
