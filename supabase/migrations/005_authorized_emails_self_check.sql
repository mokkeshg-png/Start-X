-- =============================================================================
-- MIGRATION 005: Allow unauthenticated/authenticated check of own email
-- =============================================================================
-- The registration flow needs to verify whether an email is authorized
-- BEFORE the user has a Supabase Auth account. The Java backend handles this
-- via its service-role connection, so no extra Supabase policy is needed here.
--
-- However, for the Node.js backend health check path (anon client) and any
-- direct Supabase client authorization check during sign-up, we add a
-- permissive SELECT policy that allows a user to check ONLY their own email.
-- This does NOT leak the full list to non-admins.
-- =============================================================================

-- Allow any authenticated user to check if their OWN email is in the list
-- (needed for the frontend registration validation fallback)
DROP POLICY IF EXISTS authorized_emails_select_own ON public.authorized_emails;
CREATE POLICY authorized_emails_select_own
    ON public.authorized_emails FOR SELECT
    USING (
        get_my_role() = 'admin'          -- full list for admins (existing)
        OR email = lower(trim(           -- own email only for others
            (SELECT email FROM auth.users WHERE id = auth.uid())
        ))
    );

-- Note: the existing authorized_emails_select_admin policy should be
-- dropped first if it conflicts. Use DROP IF EXISTS + CREATE pattern:
DROP POLICY IF EXISTS authorized_emails_select_admin ON public.authorized_emails;
-- Re-create merged policy above covers the admin case too.
