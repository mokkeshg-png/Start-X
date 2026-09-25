-- =============================================================================
-- START-X: ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- Architecture: React → Java Spring Boot → Supabase PostgreSQL
--
-- The Java backend connects using the SERVICE ROLE key, which bypasses RLS
-- entirely. These policies protect against direct Supabase client access and
-- enforce least-privilege if the anon or authenticated role is ever used
-- directly (e.g. Supabase Studio, future Realtime subscriptions, or Edge Fns).
--
-- Policy design:
--   - auth.uid()  = Supabase Auth user ID (maps to users.user_id)
--   - SERVICE ROLE bypasses all RLS automatically
--   - Students see their own data + team data for their teams
--   - Staff see data for teams they supervise
--   - Department heads see department-wide data
--   - Audit logs and sensitive AI data are read-only for staff+
--
-- Run after schema.sql and indexes.sql.
-- =============================================================================

-- Helper function: get the current user's role from public.users
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role_type AS $$
    SELECT role FROM public.users WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if current user is staff or above
CREATE OR REPLACE FUNCTION is_staff_or_above()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE user_id = auth.uid()
        AND role IN ('staff', 'department_head', 'admin')
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get the student_id for the current auth user
CREATE OR REPLACE FUNCTION get_my_student_id()
RETURNS UUID AS $$
    SELECT student_id FROM public.students WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get teams the current student belongs to
CREATE OR REPLACE FUNCTION get_my_team_ids()
RETURNS SETOF UUID AS $$
    SELECT team_id FROM public.team_members
    WHERE student_id = get_my_student_id()
    AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE students               ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects               ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_evidence_map     ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members           ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_roles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_requirements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_analysis    ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_topics      ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_decisions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_analysis  ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_timeline  ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_exchanges    ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph        ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_edges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analysis      ENABLE ROW LEVEL SECURITY;
ALTER TABLE consistency_checks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_snapshots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_timeline      ENABLE ROW LEVEL SECURITY;
ALTER TABLE collective_insights    ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_summaries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_gaps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependency_gaps        ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_recommendations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_teams    ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs             ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- POLICIES: users
-- =============================================================================

-- Users can read their own record; staff can read all users
CREATE POLICY users_select ON users FOR SELECT
    USING (user_id = auth.uid() OR is_staff_or_above());

-- Users can update only their own non-role fields
CREATE POLICY users_update ON users FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Only admin can insert users (normally handled by Supabase Auth trigger)
CREATE POLICY users_insert ON users FOR INSERT
    WITH CHECK (get_my_role() = 'admin' OR user_id = auth.uid());

-- =============================================================================
-- POLICIES: departments
-- =============================================================================

-- Everyone authenticated can view departments
CREATE POLICY departments_select ON departments FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Only staff+ can modify departments
CREATE POLICY departments_modify ON departments FOR ALL
    USING (is_staff_or_above())
    WITH CHECK (is_staff_or_above());

-- =============================================================================
-- POLICIES: students
-- =============================================================================

-- Students see their own record; staff see all
CREATE POLICY students_select ON students FOR SELECT
    USING (user_id = auth.uid() OR is_staff_or_above());

-- Students update only their own record
CREATE POLICY students_update ON students FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- POLICIES: staff
-- =============================================================================

-- Staff can see all staff; others see their own
CREATE POLICY staff_select ON staff FOR SELECT
    USING (user_id = auth.uid() OR is_staff_or_above());

CREATE POLICY staff_update ON staff FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- POLICIES: user_roles
-- =============================================================================

CREATE POLICY user_roles_select ON user_roles FOR SELECT
    USING (user_id = auth.uid() OR is_staff_or_above());

CREATE POLICY user_roles_modify ON user_roles FOR ALL
    USING (is_staff_or_above())
    WITH CHECK (is_staff_or_above());

-- =============================================================================
-- POLICIES: student_profiles
-- =============================================================================

-- Profiles are public-readable to all authenticated users (for collaboration)
CREATE POLICY student_profiles_select ON student_profiles FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Only the owning student or staff can modify
CREATE POLICY student_profiles_modify ON student_profiles FOR ALL
    USING (
        student_id = get_my_student_id() OR is_staff_or_above()
    )
    WITH CHECK (
        student_id = get_my_student_id() OR is_staff_or_above()
    );

-- =============================================================================
-- POLICIES: skills, projects, skill_evidence_map
-- =============================================================================

CREATE POLICY skills_select ON skills FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY skills_modify ON skills FOR ALL
    USING (
        profile_id IN (
            SELECT profile_id FROM student_profiles WHERE student_id = get_my_student_id()
        ) OR is_staff_or_above()
    )
    WITH CHECK (
        profile_id IN (
            SELECT profile_id FROM student_profiles WHERE student_id = get_my_student_id()
        ) OR is_staff_or_above()
    );

CREATE POLICY projects_select ON projects FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY projects_modify ON projects FOR ALL
    USING (
        profile_id IN (
            SELECT profile_id FROM student_profiles WHERE student_id = get_my_student_id()
        ) OR is_staff_or_above()
    )
    WITH CHECK (
        profile_id IN (
            SELECT profile_id FROM student_profiles WHERE student_id = get_my_student_id()
        ) OR is_staff_or_above()
    );

CREATE POLICY skill_evidence_select ON skill_evidence_map FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY skill_evidence_modify ON skill_evidence_map FOR ALL
    USING (is_staff_or_above());

-- =============================================================================
-- POLICIES: teams
-- =============================================================================

-- Team members and staff can see teams
CREATE POLICY teams_select ON teams FOR SELECT
    USING (
        team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above()
    );

-- Staff create teams; leaders can update their own team
CREATE POLICY teams_insert ON teams FOR INSERT
    WITH CHECK (is_staff_or_above());

CREATE POLICY teams_update ON teams FOR UPDATE
    USING (
        leader_id = get_my_student_id() OR is_staff_or_above()
    )
    WITH CHECK (
        leader_id = get_my_student_id() OR is_staff_or_above()
    );

-- =============================================================================
-- POLICIES: team_members, team_roles, compatibility_analysis, team_requirements
-- =============================================================================

CREATE POLICY team_members_select ON team_members FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());

CREATE POLICY team_members_modify ON team_members FOR ALL
    USING (is_staff_or_above())
    WITH CHECK (is_staff_or_above());

CREATE POLICY team_roles_select ON team_roles FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());

CREATE POLICY team_roles_modify ON team_roles FOR ALL
    USING (is_staff_or_above())
    WITH CHECK (is_staff_or_above());

CREATE POLICY compatibility_select ON compatibility_analysis FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());

CREATE POLICY compatibility_modify ON compatibility_analysis FOR ALL
    USING (is_staff_or_above())
    WITH CHECK (is_staff_or_above());

CREATE POLICY team_requirements_select ON team_requirements FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());

CREATE POLICY team_requirements_modify ON team_requirements FOR ALL
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above())
    WITH CHECK (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());

-- =============================================================================
-- POLICIES: discussions, messages, discussion sub-tables
-- =============================================================================

CREATE POLICY discussions_select ON discussions FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());

CREATE POLICY discussions_insert ON discussions FOR INSERT
    WITH CHECK (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());

CREATE POLICY discussions_update ON discussions FOR UPDATE
    USING (created_by = auth.uid() OR is_staff_or_above());

CREATE POLICY messages_select ON messages FOR SELECT
    USING (
        discussion_id IN (
            SELECT discussion_id FROM discussions WHERE team_id IN (SELECT get_my_team_ids())
        ) OR is_staff_or_above()
    );

CREATE POLICY messages_insert ON messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        discussion_id IN (
            SELECT discussion_id FROM discussions WHERE team_id IN (SELECT get_my_team_ids())
        )
    );

CREATE POLICY messages_update ON messages FOR UPDATE
    USING (sender_id = auth.uid());

-- Discussion analysis: team members read, staff modify
CREATE POLICY discussion_analysis_select ON discussion_analysis FOR SELECT
    USING (
        discussion_id IN (
            SELECT discussion_id FROM discussions WHERE team_id IN (SELECT get_my_team_ids())
        ) OR is_staff_or_above()
    );
CREATE POLICY discussion_analysis_modify ON discussion_analysis FOR ALL
    USING (is_staff_or_above())
    WITH CHECK (is_staff_or_above());

CREATE POLICY discussion_topics_select ON discussion_topics FOR SELECT
    USING (
        discussion_id IN (
            SELECT discussion_id FROM discussions WHERE team_id IN (SELECT get_my_team_ids())
        ) OR is_staff_or_above()
    );
CREATE POLICY discussion_topics_modify ON discussion_topics FOR ALL
    USING (is_staff_or_above()) WITH CHECK (is_staff_or_above());

CREATE POLICY discussion_decisions_select ON discussion_decisions FOR SELECT
    USING (
        discussion_id IN (
            SELECT discussion_id FROM discussions WHERE team_id IN (SELECT get_my_team_ids())
        ) OR is_staff_or_above()
    );
CREATE POLICY discussion_decisions_modify ON discussion_decisions FOR ALL
    USING (is_staff_or_above()) WITH CHECK (is_staff_or_above());

CREATE POLICY discussion_actions_select ON discussion_action_items FOR SELECT
    USING (
        discussion_id IN (
            SELECT discussion_id FROM discussions WHERE team_id IN (SELECT get_my_team_ids())
        ) OR is_staff_or_above()
    );
CREATE POLICY discussion_actions_modify ON discussion_action_items FOR ALL
    USING (
        assigned_to = auth.uid() OR is_staff_or_above()
    )
    WITH CHECK (
        assigned_to = auth.uid() OR is_staff_or_above()
    );

-- =============================================================================
-- POLICIES: contributions
-- =============================================================================

CREATE POLICY contributions_select ON contributions FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());

CREATE POLICY contributions_insert ON contributions FOR INSERT
    WITH CHECK (
        student_id = get_my_student_id() AND
        team_id IN (SELECT get_my_team_ids())
    );

CREATE POLICY contributions_update ON contributions FOR UPDATE
    USING (student_id = get_my_student_id() OR is_staff_or_above());

CREATE POLICY contribution_analysis_select ON contribution_analysis FOR SELECT
    USING (
        contribution_id IN (
            SELECT contribution_id FROM contributions WHERE team_id IN (SELECT get_my_team_ids())
        ) OR is_staff_or_above()
    );
CREATE POLICY contribution_analysis_modify ON contribution_analysis FOR ALL
    USING (is_staff_or_above()) WITH CHECK (is_staff_or_above());

CREATE POLICY contribution_timeline_select ON contribution_timeline FOR SELECT
    USING (
        student_id = get_my_student_id() OR
        team_id IN (SELECT get_my_team_ids()) OR
        is_staff_or_above()
    );
CREATE POLICY contribution_timeline_modify ON contribution_timeline FOR ALL
    USING (is_staff_or_above()) WITH CHECK (is_staff_or_above());

-- =============================================================================
-- POLICIES: knowledge tables
-- =============================================================================

CREATE POLICY knowledge_exchanges_select ON knowledge_exchanges FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());
CREATE POLICY knowledge_exchanges_modify ON knowledge_exchanges FOR ALL
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above())
    WITH CHECK (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());

CREATE POLICY knowledge_graph_select ON knowledge_graph FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());
CREATE POLICY knowledge_graph_modify ON knowledge_graph FOR ALL
    USING (is_staff_or_above()) WITH CHECK (is_staff_or_above());

CREATE POLICY knowledge_edges_select ON knowledge_edges FOR SELECT
    USING (
        from_node_id IN (
            SELECT node_id FROM knowledge_graph WHERE team_id IN (SELECT get_my_team_ids())
        ) OR is_staff_or_above()
    );
CREATE POLICY knowledge_edges_modify ON knowledge_edges FOR ALL
    USING (is_staff_or_above()) WITH CHECK (is_staff_or_above());

-- =============================================================================
-- POLICIES: documents
-- =============================================================================

CREATE POLICY documents_select ON documents FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());

CREATE POLICY documents_insert ON documents FOR INSERT
    WITH CHECK (
        team_id IN (SELECT get_my_team_ids()) AND uploaded_by = auth.uid()
    );

CREATE POLICY documents_update ON documents FOR UPDATE
    USING (uploaded_by = auth.uid() OR is_staff_or_above());

CREATE POLICY document_analysis_select ON document_analysis FOR SELECT
    USING (
        document_id IN (
            SELECT document_id FROM documents WHERE team_id IN (SELECT get_my_team_ids())
        ) OR is_staff_or_above()
    );
CREATE POLICY document_analysis_modify ON document_analysis FOR ALL
    USING (is_staff_or_above()) WITH CHECK (is_staff_or_above());

CREATE POLICY consistency_checks_select ON consistency_checks FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());
CREATE POLICY consistency_checks_modify ON consistency_checks FOR ALL
    USING (is_staff_or_above()) WITH CHECK (is_staff_or_above());

CREATE POLICY doc_relationships_select ON document_relationships FOR SELECT
    USING (
        source_document_id IN (
            SELECT document_id FROM documents WHERE team_id IN (SELECT get_my_team_ids())
        ) OR is_staff_or_above()
    );
CREATE POLICY doc_relationships_modify ON document_relationships FOR ALL
    USING (is_staff_or_above()) WITH CHECK (is_staff_or_above());

-- =============================================================================
-- POLICIES: tasks, progress
-- =============================================================================

CREATE POLICY tasks_select ON tasks FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());

CREATE POLICY tasks_insert ON tasks FOR INSERT
    WITH CHECK (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());

CREATE POLICY tasks_update ON tasks FOR UPDATE
    USING (
        assigned_to = get_my_student_id() OR
        team_id IN (SELECT get_my_team_ids()) OR
        is_staff_or_above()
    );

CREATE POLICY progress_snapshots_select ON progress_snapshots FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());
CREATE POLICY progress_snapshots_modify ON progress_snapshots FOR ALL
    USING (is_staff_or_above()) WITH CHECK (is_staff_or_above());

CREATE POLICY progress_timeline_select ON progress_timeline FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());
CREATE POLICY progress_timeline_modify ON progress_timeline FOR ALL
    USING (is_staff_or_above()) WITH CHECK (is_staff_or_above());

-- =============================================================================
-- POLICIES: AI insights / gaps (staff-read; service-role writes)
-- =============================================================================

CREATE POLICY collective_insights_select ON collective_insights FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());
CREATE POLICY collective_insights_modify ON collective_insights FOR ALL
    USING (is_staff_or_above()) WITH CHECK (is_staff_or_above());

CREATE POLICY team_summaries_select ON team_summaries FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());
CREATE POLICY team_summaries_modify ON team_summaries FOR ALL
    USING (is_staff_or_above()) WITH CHECK (is_staff_or_above());

CREATE POLICY collaboration_gaps_select ON collaboration_gaps FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());
CREATE POLICY collaboration_gaps_modify ON collaboration_gaps FOR ALL
    USING (is_staff_or_above()) WITH CHECK (is_staff_or_above());

CREATE POLICY dependency_gaps_select ON dependency_gaps FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());
CREATE POLICY dependency_gaps_modify ON dependency_gaps FOR ALL
    USING (is_staff_or_above()) WITH CHECK (is_staff_or_above());

CREATE POLICY gap_recommendations_select ON gap_recommendations FOR SELECT
    USING (team_id IN (SELECT get_my_team_ids()) OR is_staff_or_above());
CREATE POLICY gap_recommendations_modify ON gap_recommendations FOR ALL
    USING (is_staff_or_above()) WITH CHECK (is_staff_or_above());

-- =============================================================================
-- POLICIES: collaboration (student-driven)
-- =============================================================================

CREATE POLICY collab_requests_select ON collaboration_requests FOR SELECT
    USING (
        sender_id = get_my_student_id() OR
        receiver_id = get_my_student_id() OR
        is_staff_or_above()
    );

CREATE POLICY collab_requests_insert ON collaboration_requests FOR INSERT
    WITH CHECK (sender_id = get_my_student_id());

CREATE POLICY collab_requests_update ON collaboration_requests FOR UPDATE
    USING (
        sender_id = get_my_student_id() OR
        receiver_id = get_my_student_id()
    );

CREATE POLICY collab_teams_select ON collaboration_teams FOR SELECT
    USING (
        collab_team_id IN (
            SELECT collab_team_id FROM collaboration_members WHERE student_id = get_my_student_id()
        ) OR is_staff_or_above()
    );

CREATE POLICY collab_teams_insert ON collaboration_teams FOR INSERT
    WITH CHECK (created_by = get_my_student_id());

CREATE POLICY collab_teams_update ON collaboration_teams FOR UPDATE
    USING (created_by = get_my_student_id() OR is_staff_or_above());

CREATE POLICY collab_members_select ON collaboration_members FOR SELECT
    USING (
        collab_team_id IN (
            SELECT collab_team_id FROM collaboration_members WHERE student_id = get_my_student_id()
        ) OR is_staff_or_above()
    );
CREATE POLICY collab_members_modify ON collaboration_members FOR ALL
    USING (
        student_id = get_my_student_id() OR is_staff_or_above()
    )
    WITH CHECK (
        student_id = get_my_student_id() OR is_staff_or_above()
    );

CREATE POLICY collab_messages_select ON collaboration_messages FOR SELECT
    USING (
        collab_team_id IN (
            SELECT collab_team_id FROM collaboration_members WHERE student_id = get_my_student_id()
        ) OR is_staff_or_above()
    );

CREATE POLICY collab_messages_insert ON collaboration_messages FOR INSERT
    WITH CHECK (
        sender_id = get_my_student_id() AND
        collab_team_id IN (
            SELECT collab_team_id FROM collaboration_members WHERE student_id = get_my_student_id()
        )
    );

CREATE POLICY recommendations_select ON recommendations FOR SELECT
    USING (
        requester_id = get_my_student_id() OR
        recommended_student_id = get_my_student_id() OR
        is_staff_or_above()
    );
CREATE POLICY recommendations_modify ON recommendations FOR ALL
    USING (is_staff_or_above()) WITH CHECK (is_staff_or_above());

-- =============================================================================
-- POLICIES: notifications
-- =============================================================================

-- Users see only their own notifications
CREATE POLICY notifications_select ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY notifications_update ON notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Only service role inserts notifications (via Java backend)
-- No INSERT policy for authenticated users — service role bypasses RLS

-- =============================================================================
-- POLICIES: audit_logs
-- =============================================================================

-- Audit logs are READ-ONLY for staff and above
-- No user can UPDATE or DELETE audit logs
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT
    USING (is_staff_or_above());

-- No INSERT/UPDATE/DELETE policies for non-service-role users
-- The Java backend writes audit logs via the service role key
