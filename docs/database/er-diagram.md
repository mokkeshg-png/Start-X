# Start-X ER Diagram

**All 45 tables — complete entity-relationship diagram**

```mermaid
erDiagram

    %% =========================================================
    %% CORE / AUTH / ORGANIZATION
    %% =========================================================

    USERS {
        uuid user_id PK
        varchar email
        varchar full_name
        user_role_type role
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    DEPARTMENTS {
        uuid department_id PK
        varchar name
        varchar code
        uuid head_user_id FK
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    STUDENTS {
        uuid student_id PK
        uuid user_id FK
        uuid department_id FK
        varchar student_number
        integer enrollment_year
        varchar program
        integer year_of_study
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    STAFF {
        uuid staff_id PK
        uuid user_id FK
        uuid department_id FK
        varchar staff_number
        varchar title
        varchar specialization
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    USER_ROLES {
        uuid role_id PK
        uuid user_id FK
        user_role_type role
        uuid context_id
        varchar context_type
        uuid granted_by FK
        timestamptz granted_at
        timestamptz expires_at
    }

    %% =========================================================
    %% STUDENT PROFILE / SKILLS
    %% =========================================================

    STUDENT_PROFILES {
        uuid profile_id PK
        uuid student_id FK
        text github_url
        text linkedin_url
        text portfolio_url
        text bio
        boolean looking_for_team
        timestamptz updated_at
    }

    SKILLS {
        uuid skill_id PK
        uuid profile_id FK
        varchar skill_name
        varchar category
        proficiency_level proficiency_level
        boolean is_verified
        numeric evidence_strength
        timestamptz created_at
        timestamptz updated_at
    }

    PROJECTS {
        uuid project_id PK
        uuid profile_id FK
        varchar project_name
        text description
        jsonb technologies
        text repository_url
        jsonb files
        boolean is_featured
        timestamptz submitted_at
        timestamptz updated_at
    }

    SKILL_EVIDENCE_MAP {
        uuid mapping_id PK
        uuid skill_id FK
        uuid project_id FK
        varchar evidence_type
        numeric evidence_strength
        text analysis_notes
        timestamptz created_at
    }

    %% =========================================================
    %% TEAM FORMATION
    %% =========================================================

    TEAMS {
        uuid team_id PK
        varchar team_name
        text problem_statement
        uuid leader_id FK
        uuid created_by FK
        uuid department_id FK
        team_status status
        integer max_members
        jsonb metadata
        timestamptz created_at
        timestamptz updated_at
    }

    TEAM_MEMBERS {
        uuid member_id PK
        uuid team_id FK
        uuid student_id FK
        varchar role
        timestamptz joined_at
        boolean is_active
    }

    TEAM_ROLES {
        uuid role_id PK
        uuid team_id FK
        varchar role_name
        jsonb required_skills
        boolean is_filled
        uuid filled_by FK
        timestamptz created_at
    }

    COMPATIBILITY_ANALYSIS {
        uuid analysis_id PK
        uuid team_id FK
        jsonb required_skills
        jsonb covered_skills
        jsonb missing_skills
        numeric compatibility_score
        jsonb ai_reasoning
        timestamptz analyzed_at
    }

    TEAM_REQUIREMENTS {
        uuid requirement_id PK
        uuid team_id FK
        text requirement
        varchar category
        task_priority priority
        boolean is_met
        timestamptz created_at
        timestamptz updated_at
    }

    %% =========================================================
    %% DISCUSSION ANALYSIS
    %% =========================================================

    DISCUSSIONS {
        uuid discussion_id PK
        uuid team_id FK
        varchar title
        uuid created_by FK
        discussion_status status
        timestamptz created_at
        timestamptz updated_at
    }

    MESSAGES {
        uuid message_id PK
        uuid discussion_id FK
        uuid sender_id FK
        text content
        message_type message_type
        jsonb attachments
        boolean is_edited
        timestamptz created_at
    }

    DISCUSSION_ANALYSIS {
        uuid analysis_id PK
        uuid discussion_id FK
        jsonb topics
        jsonb decisions
        jsonb problems
        jsonb action_items
        jsonb sentiment
        boolean is_resolved
        timestamptz analyzed_at
    }

    DISCUSSION_TOPICS {
        uuid topic_id PK
        uuid discussion_id FK
        varchar topic_name
        numeric relevance_score
        jsonb keywords
        timestamptz created_at
    }

    DISCUSSION_DECISIONS {
        uuid decision_id PK
        uuid discussion_id FK
        text decision_text
        uuid decided_by FK
        numeric confidence
        timestamptz created_at
    }

    DISCUSSION_ACTION_ITEMS {
        uuid action_id PK
        uuid discussion_id FK
        text description
        uuid assigned_to FK
        date due_date
        boolean is_completed
        timestamptz created_at
        timestamptz updated_at
    }

    %% =========================================================
    %% CONTRIBUTION ANALYSIS
    %% =========================================================

    CONTRIBUTIONS {
        uuid contribution_id PK
        uuid team_id FK
        uuid student_id FK
        contribution_type contribution_type
        varchar title
        text description
        jsonb files
        jsonb tags
        timestamptz submitted_at
        timestamptz updated_at
    }

    CONTRIBUTION_ANALYSIS {
        uuid analysis_id PK
        uuid contribution_id FK
        numeric role_alignment_score
        numeric quality_score
        numeric complexity_score
        text analysis_notes
        jsonb ai_metadata
        timestamptz analyzed_at
    }

    CONTRIBUTION_TIMELINE {
        uuid timeline_id PK
        uuid student_id FK
        uuid team_id FK
        integer week_number
        integer year
        activity_level activity_level
        integer contribution_count
        numeric contribution_score
        trend_type trend
        timestamptz recorded_at
    }

    %% =========================================================
    %% KNOWLEDGE EXCHANGE
    %% =========================================================

    KNOWLEDGE_EXCHANGES {
        uuid exchange_id PK
        uuid team_id FK
        uuid from_student_id FK
        uuid to_student_id FK
        varchar topic
        varchar exchange_type
        jsonb metadata
        timestamptz occurred_at
    }

    KNOWLEDGE_GRAPH {
        uuid node_id PK
        uuid team_id FK
        varchar label
        knowledge_node_type node_type
        numeric weight
        jsonb metadata
        timestamptz created_at
    }

    KNOWLEDGE_EDGES {
        uuid edge_id PK
        uuid from_node_id FK
        uuid to_node_id FK
        varchar relationship
        numeric strength
        jsonb metadata
        timestamptz created_at
    }

    %% =========================================================
    %% DOCUMENT INTELLIGENCE
    %% =========================================================

    DOCUMENTS {
        uuid document_id PK
        uuid team_id FK
        uuid uploaded_by FK
        varchar file_name
        document_type file_type
        text file_path
        bigint file_size
        integer version
        boolean is_latest
        uuid parent_document_id FK
        timestamptz uploaded_at
    }

    DOCUMENT_ANALYSIS {
        uuid analysis_id PK
        uuid document_id FK
        jsonb extracted_topics
        jsonb technical_decisions
        jsonb contributions_mentioned
        text summary
        jsonb ai_metadata
        timestamptz analyzed_at
    }

    CONSISTENCY_CHECKS {
        uuid check_id PK
        uuid team_id FK
        uuid source_document_id FK
        uuid target_document_id FK
        numeric consistency_score
        jsonb issues_found
        timestamptz checked_at
    }

    DOCUMENT_RELATIONSHIPS {
        uuid relationship_id PK
        uuid source_document_id FK
        uuid target_document_id FK
        varchar relationship_type
        text description
        timestamptz created_at
    }

    %% =========================================================
    %% TASK / PROGRESS
    %% =========================================================

    TASKS {
        uuid task_id PK
        uuid team_id FK
        varchar title
        uuid assigned_to FK
        uuid created_by FK
        task_status status
        task_priority priority
        date due_date
        uuid parent_task_id FK
        jsonb tags
        timestamptz created_at
        timestamptz updated_at
    }

    PROGRESS_SNAPSHOTS {
        uuid snapshot_id PK
        uuid team_id FK
        numeric overall_progress
        integer tasks_total
        integer tasks_completed
        integer tasks_in_progress
        integer tasks_blocked
        numeric health_score
        jsonb metadata
        timestamptz snapped_at
    }

    PROGRESS_TIMELINE {
        uuid timeline_id PK
        uuid team_id FK
        integer week_number
        integer year
        numeric progress_score
        numeric velocity
        trend_type trend
        jsonb milestones_hit
        timestamptz recorded_at
    }

    %% =========================================================
    %% AI INSIGHTS / GAPS
    %% =========================================================

    COLLECTIVE_INSIGHTS {
        uuid insight_id PK
        uuid team_id FK
        varchar insight_type
        varchar title
        text content
        jsonb data
        numeric confidence
        boolean is_actioned
        timestamptz generated_at
    }

    TEAM_SUMMARIES {
        uuid summary_id PK
        uuid team_id FK
        varchar summary_type
        date period_start
        date period_end
        text content
        jsonb highlights
        jsonb risks
        jsonb recommendations
        timestamptz generated_at
    }

    COLLABORATION_GAPS {
        uuid gap_id PK
        uuid team_id FK
        varchar gap_type
        varchar title
        gap_severity severity
        jsonb evidence
        boolean is_resolved
        timestamptz identified_at
    }

    DEPENDENCY_GAPS {
        uuid gap_id PK
        uuid team_id FK
        uuid source_task_id FK
        varchar gap_type
        varchar title
        gap_severity severity
        jsonb evidence
        boolean is_resolved
        timestamptz identified_at
    }

    GAP_RECOMMENDATIONS {
        uuid recommendation_id PK
        uuid gap_id
        varchar gap_table
        uuid team_id FK
        text recommendation
        task_priority priority
        boolean is_actioned
        timestamptz created_at
    }

    %% =========================================================
    %% STUDENT COLLABORATION
    %% =========================================================

    COLLABORATION_REQUESTS {
        uuid request_id PK
        uuid sender_id FK
        uuid receiver_id FK
        text project_description
        jsonb required_skills
        collab_request_status status
        timestamptz created_at
        timestamptz responded_at
        timestamptz updated_at
    }

    COLLABORATION_TEAMS {
        uuid collab_team_id PK
        varchar team_name
        uuid created_by FK
        text project_description
        jsonb required_skills
        boolean is_open
        timestamptz created_at
        timestamptz updated_at
    }

    COLLABORATION_MEMBERS {
        uuid member_id PK
        uuid collab_team_id FK
        uuid student_id FK
        varchar role
        timestamptz joined_at
    }

    COLLABORATION_MESSAGES {
        uuid message_id PK
        uuid collab_team_id FK
        uuid sender_id FK
        text content
        jsonb attachments
        timestamptz sent_at
    }

    RECOMMENDATIONS {
        uuid recommendation_id PK
        uuid requester_id FK
        uuid recommended_student_id FK
        numeric match_score
        jsonb match_reasons
        jsonb context
        boolean is_dismissed
        timestamptz created_at
    }

    %% =========================================================
    %% SYSTEM
    %% =========================================================

    NOTIFICATIONS {
        uuid notification_id PK
        uuid user_id FK
        notification_type type
        varchar title
        text body
        jsonb data
        boolean is_read
        timestamptz read_at
        timestamptz created_at
    }

    AUDIT_LOGS {
        uuid log_id PK
        uuid user_id FK
        audit_action action
        varchar table_name
        uuid record_id
        jsonb old_data
        jsonb new_data
        inet ip_address
        timestamptz created_at
    }

    %% =========================================================
    %% RELATIONSHIPS
    %% =========================================================

    USERS ||--o| STUDENTS : "has profile"
    USERS ||--o| STAFF : "has profile"
    USERS ||--o{ USER_ROLES : "assigned"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_LOGS : "generates"
    DEPARTMENTS ||--o{ STUDENTS : "contains"
    DEPARTMENTS ||--o{ STAFF : "contains"
    DEPARTMENTS ||--o{ TEAMS : "owns"
    DEPARTMENTS ||--o| USERS : "headed by"

    STUDENTS ||--|| STUDENT_PROFILES : "has"
    STUDENT_PROFILES ||--o{ SKILLS : "lists"
    STUDENT_PROFILES ||--o{ PROJECTS : "showcases"
    SKILLS ||--o{ SKILL_EVIDENCE_MAP : "evidenced by"
    PROJECTS ||--o{ SKILL_EVIDENCE_MAP : "provides evidence"

    STAFF ||--o{ TEAMS : "creates"
    STUDENTS ||--o| TEAMS : "leads"
    TEAMS ||--o{ TEAM_MEMBERS : "has"
    STUDENTS ||--o{ TEAM_MEMBERS : "joins"
    TEAMS ||--o{ TEAM_ROLES : "defines"
    STUDENTS ||--o{ TEAM_ROLES : "fills"
    TEAMS ||--o{ COMPATIBILITY_ANALYSIS : "analyzed by"
    TEAMS ||--o{ TEAM_REQUIREMENTS : "has"

    TEAMS ||--o{ DISCUSSIONS : "has"
    USERS ||--o{ DISCUSSIONS : "creates"
    DISCUSSIONS ||--o{ MESSAGES : "contains"
    USERS ||--o{ MESSAGES : "sends"
    DISCUSSIONS ||--o{ DISCUSSION_ANALYSIS : "analyzed by"
    DISCUSSIONS ||--o{ DISCUSSION_TOPICS : "has"
    DISCUSSIONS ||--o{ DISCUSSION_DECISIONS : "produces"
    DISCUSSIONS ||--o{ DISCUSSION_ACTION_ITEMS : "generates"
    USERS ||--o{ DISCUSSION_DECISIONS : "decides"
    USERS ||--o{ DISCUSSION_ACTION_ITEMS : "assigned"

    TEAMS ||--o{ CONTRIBUTIONS : "receives"
    STUDENTS ||--o{ CONTRIBUTIONS : "submits"
    CONTRIBUTIONS ||--o{ CONTRIBUTION_ANALYSIS : "analyzed by"
    STUDENTS ||--o{ CONTRIBUTION_TIMELINE : "tracked in"
    TEAMS ||--o{ CONTRIBUTION_TIMELINE : "tracks"

    TEAMS ||--o{ KNOWLEDGE_EXCHANGES : "hosts"
    STUDENTS ||--o{ KNOWLEDGE_EXCHANGES : "transfers from"
    STUDENTS ||--o{ KNOWLEDGE_EXCHANGES : "receives to"
    TEAMS ||--o{ KNOWLEDGE_GRAPH : "has nodes"
    KNOWLEDGE_GRAPH ||--o{ KNOWLEDGE_EDGES : "connected from"
    KNOWLEDGE_GRAPH ||--o{ KNOWLEDGE_EDGES : "connected to"

    TEAMS ||--o{ DOCUMENTS : "owns"
    USERS ||--o{ DOCUMENTS : "uploads"
    DOCUMENTS ||--o{ DOCUMENT_ANALYSIS : "analyzed by"
    TEAMS ||--o{ CONSISTENCY_CHECKS : "checked in"
    DOCUMENTS ||--o{ CONSISTENCY_CHECKS : "source"
    DOCUMENTS ||--o{ CONSISTENCY_CHECKS : "target"
    DOCUMENTS ||--o{ DOCUMENT_RELATIONSHIPS : "source of"
    DOCUMENTS ||--o{ DOCUMENT_RELATIONSHIPS : "target of"
    DOCUMENTS ||--o| DOCUMENTS : "versioned from"

    TEAMS ||--o{ TASKS : "has"
    STUDENTS ||--o{ TASKS : "assigned"
    USERS ||--o{ TASKS : "creates"
    TASKS ||--o| TASKS : "subtask of"
    TEAMS ||--o{ PROGRESS_SNAPSHOTS : "snapped"
    TEAMS ||--o{ PROGRESS_TIMELINE : "tracked"
    TASKS ||--o{ DEPENDENCY_GAPS : "source"

    TEAMS ||--o{ COLLECTIVE_INSIGHTS : "generates"
    TEAMS ||--o{ TEAM_SUMMARIES : "summarized by"
    TEAMS ||--o{ COLLABORATION_GAPS : "has"
    TEAMS ||--o{ DEPENDENCY_GAPS : "has"
    TEAMS ||--o{ GAP_RECOMMENDATIONS : "receives"

    STUDENTS ||--o{ COLLABORATION_REQUESTS : "sends"
    STUDENTS ||--o{ COLLABORATION_REQUESTS : "receives"
    STUDENTS ||--o{ COLLABORATION_TEAMS : "creates"
    COLLABORATION_TEAMS ||--o{ COLLABORATION_MEMBERS : "has"
    STUDENTS ||--o{ COLLABORATION_MEMBERS : "joins"
    COLLABORATION_TEAMS ||--o{ COLLABORATION_MESSAGES : "contains"
    STUDENTS ||--o{ COLLABORATION_MESSAGES : "sends"
    STUDENTS ||--o{ RECOMMENDATIONS : "requests"
    STUDENTS ||--o{ RECOMMENDATIONS : "recommended"
```
