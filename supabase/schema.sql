-- =============================================================================
-- START-X: COMPLETE DATABASE SCHEMA
-- =============================================================================
-- AI-Powered Student Project Collaboration & Monitoring Platform
-- PostgreSQL / Supabase PostgreSQL
--
-- Run order:
--   1. functions.sql
--   2. schema.sql     ← this file
--   3. indexes.sql
--   4. rls.sql
--   5. seed.sql       (optional, dev only)
--
-- Prerequisites:
--   - pgcrypto extension (already installed on Supabase)
--   - uuid-ossp extension (already installed on Supabase)
--   - Supabase Auth (auth.users table provided by Supabase)
--   - functions.sql must be applied first (update_updated_at_column trigger)
-- =============================================================================

-- =============================================================================
-- SECTION 1: ENUMS
-- =============================================================================

CREATE TYPE user_role_type AS ENUM ('student', 'staff', 'department_head', 'admin');
CREATE TYPE team_status AS ENUM ('draft', 'active', 'completed', 'archived');
CREATE TYPE discussion_status AS ENUM ('open', 'closed', 'archived');
CREATE TYPE message_type AS ENUM ('text', 'file', 'system', 'ai_summary');
CREATE TYPE contribution_type AS ENUM ('code', 'design', 'research', 'documentation', 'testing', 'other');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done', 'blocked');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE collab_request_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE notification_type AS ENUM ('team_invite', 'task_assigned', 'message', 'contribution_reviewed', 'gap_alert', 'system', 'collab_request');
CREATE TYPE proficiency_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE activity_level AS ENUM ('none', 'low', 'medium', 'high', 'very_high');
CREATE TYPE trend_type AS ENUM ('improving', 'stable', 'declining');
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS');
CREATE TYPE document_type AS ENUM ('report', 'proposal', 'presentation', 'code', 'design', 'research', 'other');
CREATE TYPE knowledge_node_type AS ENUM ('concept', 'technology', 'method', 'tool', 'domain', 'person');
CREATE TYPE gap_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- =============================================================================
-- SECTION 2: CORE / AUTH / ORGANIZATION
-- =============================================================================

-- Table 1: users
-- Bridge between Supabase Auth (auth.users) and application data.
-- No password column — auth is delegated entirely to Supabase Auth.
CREATE TABLE users (
    user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    full_name       VARCHAR(255) NOT NULL,
    avatar_url      TEXT,
    role            user_role_type NOT NULL DEFAULT 'student',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Table 2: departments
CREATE TABLE departments (
    department_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL UNIQUE,
    code            VARCHAR(20) NOT NULL UNIQUE,
    description     TEXT,
    head_user_id    UUID REFERENCES users(user_id) ON DELETE SET NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 3: students
CREATE TABLE students (
    student_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    department_id   UUID REFERENCES departments(department_id) ON DELETE SET NULL,
    student_number  VARCHAR(50) UNIQUE,
    enrollment_year INTEGER CHECK (enrollment_year >= 2000 AND enrollment_year <= 2100),
    program         VARCHAR(255),
    year_of_study   INTEGER CHECK (year_of_study >= 1 AND year_of_study <= 10),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 4: staff
CREATE TABLE staff (
    staff_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    department_id   UUID REFERENCES departments(department_id) ON DELETE SET NULL,
    staff_number    VARCHAR(50) UNIQUE,
    title           VARCHAR(100),
    specialization  VARCHAR(255),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 5: user_roles
-- Fine-grained role assignments (a user can have multiple contextual roles).
CREATE TABLE user_roles (
    role_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role            user_role_type NOT NULL,
    context_id      UUID,           -- e.g. team_id or department_id for scoped roles
    context_type    VARCHAR(50),    -- 'team', 'department', 'global'
    granted_by      UUID REFERENCES users(user_id) ON DELETE SET NULL,
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    CONSTRAINT user_roles_unique UNIQUE (user_id, role, context_id)
);

-- =============================================================================
-- SECTION 3: STUDENT PROFILE / SKILLS
-- =============================================================================

-- Table 6: student_profiles
CREATE TABLE student_profiles (
    profile_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL UNIQUE REFERENCES students(student_id) ON DELETE CASCADE,
    github_url      TEXT,
    linkedin_url    TEXT,
    portfolio_url   TEXT,
    bio             TEXT,
    availability    VARCHAR(100),
    looking_for_team BOOLEAN NOT NULL DEFAULT false,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT github_url_format CHECK (github_url IS NULL OR github_url ~* '^https?://(www\.)?github\.com/'),
    CONSTRAINT linkedin_url_format CHECK (linkedin_url IS NULL OR linkedin_url ~* '^https?://(www\.)?linkedin\.com/')
);

-- Table 7: skills
CREATE TABLE skills (
    skill_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id      UUID NOT NULL REFERENCES student_profiles(profile_id) ON DELETE CASCADE,
    skill_name      VARCHAR(255) NOT NULL,
    category        VARCHAR(100),
    proficiency_level proficiency_level NOT NULL DEFAULT 'beginner',
    is_verified     BOOLEAN NOT NULL DEFAULT false,
    evidence_strength NUMERIC(3,2) CHECK (evidence_strength >= 0.0 AND evidence_strength <= 1.0),
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT skills_unique_per_profile UNIQUE (profile_id, skill_name)
);

-- Table 8: projects (student portfolio projects)
CREATE TABLE projects (
    project_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id      UUID NOT NULL REFERENCES student_profiles(profile_id) ON DELETE CASCADE,
    project_name    VARCHAR(255) NOT NULL,
    description     TEXT,
    technologies    JSONB NOT NULL DEFAULT '[]',
    repository_url  TEXT,
    demo_url        TEXT,
    files           JSONB NOT NULL DEFAULT '[]',
    is_featured     BOOLEAN NOT NULL DEFAULT false,
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 9: skill_evidence_map
CREATE TABLE skill_evidence_map (
    mapping_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id        UUID NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    project_id      UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    evidence_type   VARCHAR(100) NOT NULL,
    evidence_strength NUMERIC(3,2) NOT NULL CHECK (evidence_strength >= 0.0 AND evidence_strength <= 1.0),
    analysis_notes  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT skill_evidence_unique UNIQUE (skill_id, project_id)
);

-- =============================================================================
-- SECTION 4: TEAM FORMATION
-- =============================================================================

-- Table 10: teams
CREATE TABLE teams (
    team_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name         VARCHAR(255) NOT NULL,
    problem_statement TEXT,
    description       TEXT,
    leader_id         UUID REFERENCES students(student_id) ON DELETE SET NULL,
    created_by        UUID REFERENCES staff(staff_id) ON DELETE SET NULL,
    department_id     UUID REFERENCES departments(department_id) ON DELETE SET NULL,
    status            team_status NOT NULL DEFAULT 'draft',
    max_members       INTEGER NOT NULL DEFAULT 6 CHECK (max_members >= 1 AND max_members <= 20),
    metadata          JSONB NOT NULL DEFAULT '{}',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 11: team_members
CREATE TABLE team_members (
    member_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    role            VARCHAR(100) NOT NULL DEFAULT 'member',
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at         TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT team_members_unique UNIQUE (team_id, student_id)
);

-- Table 12: team_roles
-- Defines the skill-based roles required within a team.
CREATE TABLE team_roles (
    role_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    role_name       VARCHAR(255) NOT NULL,
    description     TEXT,
    required_skills JSONB NOT NULL DEFAULT '[]',
    is_filled       BOOLEAN NOT NULL DEFAULT false,
    filled_by       UUID REFERENCES students(student_id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 13: compatibility_analysis
CREATE TABLE compatibility_analysis (
    analysis_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id           UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    required_skills   JSONB NOT NULL DEFAULT '[]',
    covered_skills    JSONB NOT NULL DEFAULT '[]',
    missing_skills    JSONB NOT NULL DEFAULT '[]',
    compatibility_score NUMERIC(5,2) CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
    ai_reasoning      JSONB NOT NULL DEFAULT '{}',
    analyzed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 14: team_requirements
CREATE TABLE team_requirements (
    requirement_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    requirement     TEXT NOT NULL,
    category        VARCHAR(100),
    priority        task_priority NOT NULL DEFAULT 'medium',
    is_met          BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SECTION 5: DISCUSSION ANALYSIS
-- =============================================================================

-- Table 15: discussions
CREATE TABLE discussions (
    discussion_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    created_by      UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    status          discussion_status NOT NULL DEFAULT 'open',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 16: messages
CREATE TABLE messages (
    message_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id   UUID NOT NULL REFERENCES discussions(discussion_id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    content         TEXT NOT NULL,
    message_type    message_type NOT NULL DEFAULT 'text',
    attachments     JSONB NOT NULL DEFAULT '[]',
    is_edited       BOOLEAN NOT NULL DEFAULT false,
    edited_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 17: discussion_analysis
CREATE TABLE discussion_analysis (
    analysis_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id   UUID NOT NULL REFERENCES discussions(discussion_id) ON DELETE CASCADE,
    topics          JSONB NOT NULL DEFAULT '[]',
    decisions       JSONB NOT NULL DEFAULT '[]',
    problems        JSONB NOT NULL DEFAULT '[]',
    action_items    JSONB NOT NULL DEFAULT '[]',
    sentiment       JSONB NOT NULL DEFAULT '{}',
    is_resolved     BOOLEAN NOT NULL DEFAULT false,
    analyzed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 18: discussion_topics
CREATE TABLE discussion_topics (
    topic_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id   UUID NOT NULL REFERENCES discussions(discussion_id) ON DELETE CASCADE,
    topic_name      VARCHAR(255) NOT NULL,
    relevance_score NUMERIC(3,2) CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0),
    keywords        JSONB NOT NULL DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 19: discussion_decisions
CREATE TABLE discussion_decisions (
    decision_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id   UUID NOT NULL REFERENCES discussions(discussion_id) ON DELETE CASCADE,
    decision_text   TEXT NOT NULL,
    decided_by      UUID REFERENCES users(user_id) ON DELETE SET NULL,
    confidence      NUMERIC(3,2) CHECK (confidence >= 0.0 AND confidence <= 1.0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 20: discussion_action_items
CREATE TABLE discussion_action_items (
    action_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id   UUID NOT NULL REFERENCES discussions(discussion_id) ON DELETE CASCADE,
    description     TEXT NOT NULL,
    assigned_to     UUID REFERENCES users(user_id) ON DELETE SET NULL,
    due_date        DATE,
    is_completed    BOOLEAN NOT NULL DEFAULT false,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SECTION 6: CONTRIBUTION ANALYSIS
-- =============================================================================

-- Table 21: contributions
CREATE TABLE contributions (
    contribution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    contribution_type contribution_type NOT NULL DEFAULT 'other',
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    files           JSONB NOT NULL DEFAULT '[]',
    tags            JSONB NOT NULL DEFAULT '[]',
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 22: contribution_analysis
CREATE TABLE contribution_analysis (
    analysis_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contribution_id     UUID NOT NULL REFERENCES contributions(contribution_id) ON DELETE CASCADE,
    role_alignment_score  NUMERIC(5,2) CHECK (role_alignment_score >= 0 AND role_alignment_score <= 100),
    quality_score         NUMERIC(5,2) CHECK (quality_score >= 0 AND quality_score <= 100),
    complexity_score      NUMERIC(5,2) CHECK (complexity_score >= 0 AND complexity_score <= 100),
    analysis_notes        TEXT,
    ai_metadata           JSONB NOT NULL DEFAULT '{}',
    analyzed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 23: contribution_timeline
CREATE TABLE contribution_timeline (
    timeline_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    team_id             UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    week_number         INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 52),
    year                INTEGER NOT NULL CHECK (year >= 2000),
    activity_level      activity_level NOT NULL DEFAULT 'none',
    contribution_count  INTEGER NOT NULL DEFAULT 0 CHECK (contribution_count >= 0),
    contribution_score  NUMERIC(5,2) CHECK (contribution_score >= 0 AND contribution_score <= 100),
    trend               trend_type NOT NULL DEFAULT 'stable',
    recorded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT contribution_timeline_unique UNIQUE (student_id, team_id, week_number, year)
);

-- =============================================================================
-- SECTION 7: KNOWLEDGE EXCHANGE
-- =============================================================================

-- Table 24: knowledge_exchanges
CREATE TABLE knowledge_exchanges (
    exchange_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    from_student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    to_student_id   UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    topic           VARCHAR(255) NOT NULL,
    description     TEXT,
    exchange_type   VARCHAR(100) NOT NULL DEFAULT 'peer_learning',
    metadata        JSONB NOT NULL DEFAULT '{}',
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT knowledge_exchange_not_self CHECK (from_student_id <> to_student_id)
);

-- Table 25: knowledge_graph
-- Nodes in the team knowledge graph.
CREATE TABLE knowledge_graph (
    node_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    label           VARCHAR(255) NOT NULL,
    node_type       knowledge_node_type NOT NULL DEFAULT 'concept',
    description     TEXT,
    weight          NUMERIC(5,2) DEFAULT 1.0,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 26: knowledge_edges
-- Directed edges between knowledge graph nodes.
CREATE TABLE knowledge_edges (
    edge_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_node_id    UUID NOT NULL REFERENCES knowledge_graph(node_id) ON DELETE CASCADE,
    to_node_id      UUID NOT NULL REFERENCES knowledge_graph(node_id) ON DELETE CASCADE,
    relationship    VARCHAR(100) NOT NULL DEFAULT 'related_to',
    strength        NUMERIC(3,2) CHECK (strength >= 0.0 AND strength <= 1.0),
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT knowledge_edges_no_self_loop CHECK (from_node_id <> to_node_id),
    CONSTRAINT knowledge_edges_unique UNIQUE (from_node_id, to_node_id, relationship)
);

-- =============================================================================
-- SECTION 8: DOCUMENT INTELLIGENCE
-- =============================================================================

-- Table 27: documents
CREATE TABLE documents (
    document_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    uploaded_by     UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    file_name       VARCHAR(255) NOT NULL,
    file_type       document_type NOT NULL DEFAULT 'other',
    file_mime_type  VARCHAR(100),
    file_path       TEXT NOT NULL,
    file_size       BIGINT CHECK (file_size > 0),
    version         INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    is_latest       BOOLEAN NOT NULL DEFAULT true,
    parent_document_id UUID REFERENCES documents(document_id) ON DELETE SET NULL,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 28: document_analysis
CREATE TABLE document_analysis (
    analysis_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id             UUID NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    extracted_topics        JSONB NOT NULL DEFAULT '[]',
    technical_decisions     JSONB NOT NULL DEFAULT '[]',
    contributions_mentioned JSONB NOT NULL DEFAULT '[]',
    summary                 TEXT,
    ai_metadata             JSONB NOT NULL DEFAULT '{}',
    analyzed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 29: consistency_checks
CREATE TABLE consistency_checks (
    check_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id             UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    source_document_id  UUID NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    target_document_id  UUID NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    consistency_score   NUMERIC(5,2) CHECK (consistency_score >= 0 AND consistency_score <= 100),
    issues_found        JSONB NOT NULL DEFAULT '[]',
    checked_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT consistency_check_different_docs CHECK (source_document_id <> target_document_id)
);

-- Table 30: document_relationships
CREATE TABLE document_relationships (
    relationship_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_document_id  UUID NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    target_document_id  UUID NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    relationship_type   VARCHAR(100) NOT NULL DEFAULT 'references',
    description         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT document_relationships_no_self CHECK (source_document_id <> target_document_id),
    CONSTRAINT document_relationships_unique UNIQUE (source_document_id, target_document_id, relationship_type)
);

-- =============================================================================
-- SECTION 9: TASK / PROGRESS
-- =============================================================================

-- Table 31: tasks
CREATE TABLE tasks (
    task_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    assigned_to     UUID REFERENCES students(student_id) ON DELETE SET NULL,
    created_by      UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    status          task_status NOT NULL DEFAULT 'todo',
    priority        task_priority NOT NULL DEFAULT 'medium',
    due_date        DATE,
    completed_at    TIMESTAMPTZ,
    parent_task_id  UUID REFERENCES tasks(task_id) ON DELETE SET NULL,
    tags            JSONB NOT NULL DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 32: progress_snapshots
-- Point-in-time snapshot of team progress.
CREATE TABLE progress_snapshots (
    snapshot_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id             UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    overall_progress    NUMERIC(5,2) CHECK (overall_progress >= 0 AND overall_progress <= 100),
    tasks_total         INTEGER NOT NULL DEFAULT 0 CHECK (tasks_total >= 0),
    tasks_completed     INTEGER NOT NULL DEFAULT 0 CHECK (tasks_completed >= 0),
    tasks_in_progress   INTEGER NOT NULL DEFAULT 0 CHECK (tasks_in_progress >= 0),
    tasks_blocked       INTEGER NOT NULL DEFAULT 0 CHECK (tasks_blocked >= 0),
    health_score        NUMERIC(5,2) CHECK (health_score >= 0 AND health_score <= 100),
    notes               TEXT,
    metadata            JSONB NOT NULL DEFAULT '{}',
    snapped_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 33: progress_timeline
-- Weekly progress data points for trend analysis.
CREATE TABLE progress_timeline (
    timeline_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id             UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    week_number         INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 52),
    year                INTEGER NOT NULL CHECK (year >= 2000),
    progress_score      NUMERIC(5,2) CHECK (progress_score >= 0 AND progress_score <= 100),
    velocity            NUMERIC(5,2),
    trend               trend_type NOT NULL DEFAULT 'stable',
    milestones_hit      JSONB NOT NULL DEFAULT '[]',
    recorded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT progress_timeline_unique UNIQUE (team_id, week_number, year)
);

-- =============================================================================
-- SECTION 10: AI INSIGHTS / GAPS
-- =============================================================================

-- Table 34: collective_insights
CREATE TABLE collective_insights (
    insight_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    insight_type    VARCHAR(100) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,
    data            JSONB NOT NULL DEFAULT '{}',
    confidence      NUMERIC(3,2) CHECK (confidence >= 0.0 AND confidence <= 1.0),
    is_actioned     BOOLEAN NOT NULL DEFAULT false,
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 35: team_summaries
CREATE TABLE team_summaries (
    summary_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    summary_type    VARCHAR(100) NOT NULL DEFAULT 'weekly',
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    content         TEXT NOT NULL,
    highlights      JSONB NOT NULL DEFAULT '[]',
    risks           JSONB NOT NULL DEFAULT '[]',
    recommendations JSONB NOT NULL DEFAULT '[]',
    ai_metadata     JSONB NOT NULL DEFAULT '{}',
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT team_summaries_period_valid CHECK (period_end >= period_start)
);

-- Table 36: collaboration_gaps
-- AI-identified skill or collaboration gaps within a team.
CREATE TABLE collaboration_gaps (
    gap_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    gap_type        VARCHAR(100) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    severity        gap_severity NOT NULL DEFAULT 'medium',
    evidence        JSONB NOT NULL DEFAULT '{}',
    is_resolved     BOOLEAN NOT NULL DEFAULT false,
    resolved_at     TIMESTAMPTZ,
    identified_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 37: dependency_gaps
-- AI-identified dependency or blocker gaps between tasks/teams.
CREATE TABLE dependency_gaps (
    gap_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    source_task_id  UUID REFERENCES tasks(task_id) ON DELETE SET NULL,
    gap_type        VARCHAR(100) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    severity        gap_severity NOT NULL DEFAULT 'medium',
    evidence        JSONB NOT NULL DEFAULT '{}',
    is_resolved     BOOLEAN NOT NULL DEFAULT false,
    resolved_at     TIMESTAMPTZ,
    identified_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 38: gap_recommendations
CREATE TABLE gap_recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gap_id           UUID NOT NULL,
    gap_table        VARCHAR(50) NOT NULL CHECK (gap_table IN ('collaboration_gaps', 'dependency_gaps')),
    team_id          UUID NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    recommendation   TEXT NOT NULL,
    action_type      VARCHAR(100),
    priority         task_priority NOT NULL DEFAULT 'medium',
    is_actioned      BOOLEAN NOT NULL DEFAULT false,
    actioned_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SECTION 11: STUDENT COLLABORATION
-- =============================================================================

-- Table 39: collaboration_requests
CREATE TABLE collaboration_requests (
    request_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id           UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    receiver_id         UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    project_description TEXT,
    required_skills     JSONB NOT NULL DEFAULT '[]',
    message             TEXT,
    status              collab_request_status NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at        TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT collab_request_not_self CHECK (sender_id <> receiver_id)
);

-- Table 40: collaboration_teams
-- Lightweight teams formed through student collaboration requests.
CREATE TABLE collaboration_teams (
    collab_team_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name           VARCHAR(255) NOT NULL,
    created_by          UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    project_description TEXT,
    required_skills     JSONB NOT NULL DEFAULT '[]',
    is_open             BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 41: collaboration_members
CREATE TABLE collaboration_members (
    member_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collab_team_id  UUID NOT NULL REFERENCES collaboration_teams(collab_team_id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    role            VARCHAR(100) NOT NULL DEFAULT 'member',
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT collaboration_members_unique UNIQUE (collab_team_id, student_id)
);

-- Table 42: collaboration_messages
CREATE TABLE collaboration_messages (
    message_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collab_team_id  UUID NOT NULL REFERENCES collaboration_teams(collab_team_id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    attachments     JSONB NOT NULL DEFAULT '[]',
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 43: recommendations
-- AI-generated student-to-student collaboration recommendations.
CREATE TABLE recommendations (
    recommendation_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id            UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    recommended_student_id  UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    match_score             NUMERIC(5,2) CHECK (match_score >= 0 AND match_score <= 100),
    match_reasons           JSONB NOT NULL DEFAULT '[]',
    context                 JSONB NOT NULL DEFAULT '{}',
    is_dismissed            BOOLEAN NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT recommendation_not_self CHECK (requester_id <> recommended_student_id),
    CONSTRAINT recommendation_unique UNIQUE (requester_id, recommended_student_id)
);

-- =============================================================================
-- SECTION 12: SYSTEM
-- =============================================================================

-- Table 44: notifications
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type            notification_type NOT NULL DEFAULT 'system',
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    data            JSONB NOT NULL DEFAULT '{}',
    is_read         BOOLEAN NOT NULL DEFAULT false,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 45: audit_logs
-- Immutable audit trail — no updated_at, no DELETE via application.
CREATE TABLE audit_logs (
    log_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action          audit_action NOT NULL,
    table_name      VARCHAR(100),
    record_id       UUID,
    old_data        JSONB,
    new_data        JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SECTION 13: updated_at TRIGGERS
-- =============================================================================
-- Apply the trigger function (defined in functions.sql) to every mutable table.

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_students_updated_at
    BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_staff_updated_at
    BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_student_profiles_updated_at
    BEFORE UPDATE ON student_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_skills_updated_at
    BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_teams_updated_at
    BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_team_requirements_updated_at
    BEFORE UPDATE ON team_requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_discussions_updated_at
    BEFORE UPDATE ON discussions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_discussion_action_items_updated_at
    BEFORE UPDATE ON discussion_action_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_contributions_updated_at
    BEFORE UPDATE ON contributions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_collaboration_requests_updated_at
    BEFORE UPDATE ON collaboration_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_collaboration_teams_updated_at
    BEFORE UPDATE ON collaboration_teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
