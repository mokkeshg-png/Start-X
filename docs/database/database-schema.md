# Start-X Database Schema

**Platform:** AI-Powered Student Project Collaboration & Monitoring  
**Database:** Supabase PostgreSQL  
**Total Tables:** 45  
**Schema Version:** 1.0.0

---

## Architecture

```
React / Vite Frontend
        ↓
Java Spring Boot Backend  (service-role key — bypasses RLS)
        ↓
Supabase PostgreSQL  (RLS active for direct / anon access)
        ↑
Supabase Auth  (auth.users → public.users bridge)
```

---

## Migration Run Order

```
1. supabase/functions.sql   — trigger functions
2. supabase/schema.sql      — all 45 tables + enums + triggers
3. supabase/indexes.sql     — 90+ indexes
4. supabase/rls.sql         — Row Level Security policies
5. supabase/seed.sql        — dev-only reference data (optional)
```

---

## Enums

| Enum | Values |
|------|--------|
| `user_role_type` | `student`, `staff`, `department_head`, `admin` |
| `team_status` | `draft`, `active`, `completed`, `archived` |
| `discussion_status` | `open`, `closed`, `archived` |
| `message_type` | `text`, `file`, `system`, `ai_summary` |
| `contribution_type` | `code`, `design`, `research`, `documentation`, `testing`, `other` |
| `task_status` | `todo`, `in_progress`, `review`, `done`, `blocked` |
| `task_priority` | `low`, `medium`, `high`, `critical` |
| `collab_request_status` | `pending`, `accepted`, `rejected`, `withdrawn` |
| `notification_type` | `team_invite`, `task_assigned`, `message`, `contribution_reviewed`, `gap_alert`, `system`, `collab_request` |
| `proficiency_level` | `beginner`, `intermediate`, `advanced`, `expert` |
| `activity_level` | `none`, `low`, `medium`, `high`, `very_high` |
| `trend_type` | `improving`, `stable`, `declining` |
| `audit_action` | `INSERT`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `ACCESS` |
| `document_type` | `report`, `proposal`, `presentation`, `code`, `design`, `research`, `other` |
| `knowledge_node_type` | `concept`, `technology`, `method`, `tool`, `domain`, `person` |
| `gap_severity` | `low`, `medium`, `high`, `critical` |

---

## Section 1 — Core / Auth / Organization

### 1. `users`
Bridge between `auth.users` and application data. No password column.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | `UUID PK` | References `auth.users(id)` |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL, format-checked |
| `full_name` | `VARCHAR(255)` | NOT NULL |
| `avatar_url` | `TEXT` | |
| `role` | `user_role_type` | DEFAULT `student` |
| `is_active` | `BOOLEAN` | DEFAULT `true` |
| `last_login_at` | `TIMESTAMPTZ` | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() |
| `updated_at` | `TIMESTAMPTZ` | Auto-updated by trigger |

---

### 2. `departments`

| Column | Type | Notes |
|--------|------|-------|
| `department_id` | `UUID PK` | |
| `name` | `VARCHAR(255)` | UNIQUE |
| `code` | `VARCHAR(20)` | UNIQUE |
| `description` | `TEXT` | |
| `head_user_id` | `UUID FK → users` | |
| `is_active` | `BOOLEAN` | |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | |

---

### 3. `students`

| Column | Type | Notes |
|--------|------|-------|
| `student_id` | `UUID PK` | |
| `user_id` | `UUID FK → users` | UNIQUE |
| `department_id` | `UUID FK → departments` | |
| `student_number` | `VARCHAR(50)` | UNIQUE |
| `enrollment_year` | `INTEGER` | 2000–2100 |
| `program` | `VARCHAR(255)` | |
| `year_of_study` | `INTEGER` | 1–10 |
| `is_active` | `BOOLEAN` | |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | |

---

### 4. `staff`

| Column | Type | Notes |
|--------|------|-------|
| `staff_id` | `UUID PK` | |
| `user_id` | `UUID FK → users` | UNIQUE |
| `department_id` | `UUID FK → departments` | |
| `staff_number` | `VARCHAR(50)` | UNIQUE |
| `title` | `VARCHAR(100)` | |
| `specialization` | `VARCHAR(255)` | |
| `is_active` | `BOOLEAN` | |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | |

---

### 5. `user_roles`
Fine-grained, scoped role assignments.

| Column | Type | Notes |
|--------|------|-------|
| `role_id` | `UUID PK` | |
| `user_id` | `UUID FK → users` | |
| `role` | `user_role_type` | |
| `context_id` | `UUID` | team_id or department_id |
| `context_type` | `VARCHAR(50)` | `team`, `department`, `global` |
| `granted_by` | `UUID FK → users` | |
| `granted_at` | `TIMESTAMPTZ` | |
| `expires_at` | `TIMESTAMPTZ` | |

UNIQUE on `(user_id, role, context_id)`.

---

## Section 2 — Student Profile / Skills

### 6. `student_profiles`

| Column | Type | Notes |
|--------|------|-------|
| `profile_id` | `UUID PK` | |
| `student_id` | `UUID FK → students` | UNIQUE |
| `github_url` | `TEXT` | Format-checked |
| `linkedin_url` | `TEXT` | Format-checked |
| `portfolio_url` | `TEXT` | |
| `bio` | `TEXT` | |
| `availability` | `VARCHAR(100)` | |
| `looking_for_team` | `BOOLEAN` | |
| `updated_at` | `TIMESTAMPTZ` | Auto-updated |

---

### 7. `skills`

| Column | Type | Notes |
|--------|------|-------|
| `skill_id` | `UUID PK` | |
| `profile_id` | `UUID FK → student_profiles` | |
| `skill_name` | `VARCHAR(255)` | UNIQUE per profile |
| `category` | `VARCHAR(100)` | |
| `proficiency_level` | `proficiency_level` | |
| `is_verified` | `BOOLEAN` | |
| `evidence_strength` | `NUMERIC(3,2)` | 0.0–1.0 |
| `verified_at` | `TIMESTAMPTZ` | |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | |

---

### 8. `projects` (portfolio)

| Column | Type | Notes |
|--------|------|-------|
| `project_id` | `UUID PK` | |
| `profile_id` | `UUID FK → student_profiles` | |
| `project_name` | `VARCHAR(255)` | |
| `description` | `TEXT` | |
| `technologies` | `JSONB` | Array of strings |
| `repository_url` | `TEXT` | |
| `demo_url` | `TEXT` | |
| `files` | `JSONB` | Array of file objects |
| `is_featured` | `BOOLEAN` | |
| `submitted_at` / `updated_at` | `TIMESTAMPTZ` | |

---

### 9. `skill_evidence_map`

| Column | Type | Notes |
|--------|------|-------|
| `mapping_id` | `UUID PK` | |
| `skill_id` | `UUID FK → skills` | |
| `project_id` | `UUID FK → projects` | |
| `evidence_type` | `VARCHAR(100)` | |
| `evidence_strength` | `NUMERIC(3,2)` | 0.0–1.0 |
| `analysis_notes` | `TEXT` | |
| `created_at` | `TIMESTAMPTZ` | |

UNIQUE on `(skill_id, project_id)`.

---

## Section 3 — Team Formation

### 10. `teams`

| Column | Type | Notes |
|--------|------|-------|
| `team_id` | `UUID PK` | |
| `team_name` | `VARCHAR(255)` | |
| `problem_statement` | `TEXT` | |
| `description` | `TEXT` | |
| `leader_id` | `UUID FK → students` | |
| `created_by` | `UUID FK → staff` | |
| `department_id` | `UUID FK → departments` | |
| `status` | `team_status` | DEFAULT `draft` |
| `max_members` | `INTEGER` | 1–20, DEFAULT 6 |
| `metadata` | `JSONB` | |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | |

---

### 11. `team_members`

| Column | Type | Notes |
|--------|------|-------|
| `member_id` | `UUID PK` | |
| `team_id` | `UUID FK → teams` | |
| `student_id` | `UUID FK → students` | |
| `role` | `VARCHAR(100)` | DEFAULT `member` |
| `joined_at` | `TIMESTAMPTZ` | |
| `left_at` | `TIMESTAMPTZ` | |
| `is_active` | `BOOLEAN` | |

UNIQUE on `(team_id, student_id)`.

---

### 12. `team_roles`

| Column | Type | Notes |
|--------|------|-------|
| `role_id` | `UUID PK` | |
| `team_id` | `UUID FK → teams` | |
| `role_name` | `VARCHAR(255)` | |
| `description` | `TEXT` | |
| `required_skills` | `JSONB` | |
| `is_filled` | `BOOLEAN` | |
| `filled_by` | `UUID FK → students` | |
| `created_at` | `TIMESTAMPTZ` | |

---

### 13. `compatibility_analysis`

| Column | Type | Notes |
|--------|------|-------|
| `analysis_id` | `UUID PK` | |
| `team_id` | `UUID FK → teams` | |
| `required_skills` | `JSONB` | |
| `covered_skills` | `JSONB` | |
| `missing_skills` | `JSONB` | |
| `compatibility_score` | `NUMERIC(5,2)` | 0–100 |
| `ai_reasoning` | `JSONB` | |
| `analyzed_at` | `TIMESTAMPTZ` | |

---

### 14. `team_requirements`

| Column | Type | Notes |
|--------|------|-------|
| `requirement_id` | `UUID PK` | |
| `team_id` | `UUID FK → teams` | |
| `requirement` | `TEXT` | |
| `category` | `VARCHAR(100)` | |
| `priority` | `task_priority` | |
| `is_met` | `BOOLEAN` | |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | |

---

## Section 4 — Discussion Analysis

### 15. `discussions`

| Column | Type | Notes |
|--------|------|-------|
| `discussion_id` | `UUID PK` | |
| `team_id` | `UUID FK → teams` | |
| `title` | `VARCHAR(255)` | |
| `description` | `TEXT` | |
| `created_by` | `UUID FK → users` | |
| `status` | `discussion_status` | DEFAULT `open` |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | |

---

### 16. `messages`

| Column | Type | Notes |
|--------|------|-------|
| `message_id` | `UUID PK` | |
| `discussion_id` | `UUID FK → discussions` | |
| `sender_id` | `UUID FK → users` | |
| `content` | `TEXT` | NOT NULL |
| `message_type` | `message_type` | |
| `attachments` | `JSONB` | |
| `is_edited` | `BOOLEAN` | |
| `edited_at` | `TIMESTAMPTZ` | |
| `created_at` | `TIMESTAMPTZ` | |

---

### 17. `discussion_analysis`

| Column | Type | Notes |
|--------|------|-------|
| `analysis_id` | `UUID PK` | |
| `discussion_id` | `UUID FK → discussions` | |
| `topics` | `JSONB` | AI-extracted |
| `decisions` | `JSONB` | AI-extracted |
| `problems` | `JSONB` | AI-extracted |
| `action_items` | `JSONB` | AI-extracted |
| `sentiment` | `JSONB` | AI-generated |
| `is_resolved` | `BOOLEAN` | |
| `analyzed_at` | `TIMESTAMPTZ` | |

---

### 18. `discussion_topics`

| Column | Type | Notes |
|--------|------|-------|
| `topic_id` | `UUID PK` | |
| `discussion_id` | `UUID FK → discussions` | |
| `topic_name` | `VARCHAR(255)` | |
| `relevance_score` | `NUMERIC(3,2)` | 0.0–1.0 |
| `keywords` | `JSONB` | |
| `created_at` | `TIMESTAMPTZ` | |

---

### 19. `discussion_decisions`

| Column | Type | Notes |
|--------|------|-------|
| `decision_id` | `UUID PK` | |
| `discussion_id` | `UUID FK → discussions` | |
| `decision_text` | `TEXT` | |
| `decided_by` | `UUID FK → users` | |
| `confidence` | `NUMERIC(3,2)` | 0.0–1.0 |
| `created_at` | `TIMESTAMPTZ` | |

---

### 20. `discussion_action_items`

| Column | Type | Notes |
|--------|------|-------|
| `action_id` | `UUID PK` | |
| `discussion_id` | `UUID FK → discussions` | |
| `description` | `TEXT` | |
| `assigned_to` | `UUID FK → users` | |
| `due_date` | `DATE` | |
| `is_completed` | `BOOLEAN` | |
| `completed_at` | `TIMESTAMPTZ` | |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | |

---

## Section 5 — Contribution Analysis

### 21. `contributions`

| Column | Type | Notes |
|--------|------|-------|
| `contribution_id` | `UUID PK` | |
| `team_id` | `UUID FK → teams` | |
| `student_id` | `UUID FK → students` | |
| `contribution_type` | `contribution_type` | |
| `title` | `VARCHAR(255)` | |
| `description` | `TEXT` | |
| `files` | `JSONB` | |
| `tags` | `JSONB` | |
| `submitted_at` / `updated_at` | `TIMESTAMPTZ` | |

---

### 22. `contribution_analysis`

| Column | Type | Notes |
|--------|------|-------|
| `analysis_id` | `UUID PK` | |
| `contribution_id` | `UUID FK → contributions` | |
| `role_alignment_score` | `NUMERIC(5,2)` | 0–100 |
| `quality_score` | `NUMERIC(5,2)` | 0–100 |
| `complexity_score` | `NUMERIC(5,2)` | 0–100 |
| `analysis_notes` | `TEXT` | |
| `ai_metadata` | `JSONB` | |
| `analyzed_at` | `TIMESTAMPTZ` | |

---

### 23. `contribution_timeline`

| Column | Type | Notes |
|--------|------|-------|
| `timeline_id` | `UUID PK` | |
| `student_id` | `UUID FK → students` | |
| `team_id` | `UUID FK → teams` | |
| `week_number` | `INTEGER` | 1–52 |
| `year` | `INTEGER` | ≥ 2000 |
| `activity_level` | `activity_level` | |
| `contribution_count` | `INTEGER` | ≥ 0 |
| `contribution_score` | `NUMERIC(5,2)` | 0–100 |
| `trend` | `trend_type` | |
| `recorded_at` | `TIMESTAMPTZ` | |

UNIQUE on `(student_id, team_id, week_number, year)`.

---

## Section 6 — Knowledge Exchange

### 24. `knowledge_exchanges`

| Column | Type | Notes |
|--------|------|-------|
| `exchange_id` | `UUID PK` | |
| `team_id` | `UUID FK → teams` | |
| `from_student_id` | `UUID FK → students` | |
| `to_student_id` | `UUID FK → students` | |
| `topic` | `VARCHAR(255)` | |
| `description` | `TEXT` | |
| `exchange_type` | `VARCHAR(100)` | DEFAULT `peer_learning` |
| `metadata` | `JSONB` | |
| `occurred_at` | `TIMESTAMPTZ` | |

CHECK: `from_student_id <> to_student_id`

---

### 25. `knowledge_graph` (nodes)

| Column | Type | Notes |
|--------|------|-------|
| `node_id` | `UUID PK` | |
| `team_id` | `UUID FK → teams` | |
| `label` | `VARCHAR(255)` | |
| `node_type` | `knowledge_node_type` | |
| `description` | `TEXT` | |
| `weight` | `NUMERIC(5,2)` | |
| `metadata` | `JSONB` | |
| `created_at` | `TIMESTAMPTZ` | |

---

### 26. `knowledge_edges`

| Column | Type | Notes |
|--------|------|-------|
| `edge_id` | `UUID PK` | |
| `from_node_id` | `UUID FK → knowledge_graph` | |
| `to_node_id` | `UUID FK → knowledge_graph` | |
| `relationship` | `VARCHAR(100)` | DEFAULT `related_to` |
| `strength` | `NUMERIC(3,2)` | 0.0–1.0 |
| `metadata` | `JSONB` | |
| `created_at` | `TIMESTAMPTZ` | |

CHECK: no self-loops. UNIQUE on `(from_node_id, to_node_id, relationship)`.

---

## Section 7 — Document Intelligence

### 27. `documents`

| Column | Type | Notes |
|--------|------|-------|
| `document_id` | `UUID PK` | |
| `team_id` | `UUID FK → teams` | |
| `uploaded_by` | `UUID FK → users` | |
| `file_name` | `VARCHAR(255)` | |
| `file_type` | `document_type` | |
| `file_mime_type` | `VARCHAR(100)` | |
| `file_path` | `TEXT` | |
| `file_size` | `BIGINT` | > 0 |
| `version` | `INTEGER` | ≥ 1, DEFAULT 1 |
| `is_latest` | `BOOLEAN` | DEFAULT `true` |
| `parent_document_id` | `UUID FK → documents` | Self-ref for versioning |
| `uploaded_at` | `TIMESTAMPTZ` | |

---

### 28. `document_analysis`

| Column | Type | Notes |
|--------|------|-------|
| `analysis_id` | `UUID PK` | |
| `document_id` | `UUID FK → documents` | |
| `extracted_topics` | `JSONB` | |
| `technical_decisions` | `JSONB` | |
| `contributions_mentioned` | `JSONB` | |
| `summary` | `TEXT` | |
| `ai_metadata` | `JSONB` | |
| `analyzed_at` | `TIMESTAMPTZ` | |

---

### 29. `consistency_checks`

| Column | Type | Notes |
|--------|------|-------|
| `check_id` | `UUID PK` | |
| `team_id` | `UUID FK → teams` | |
| `source_document_id` | `UUID FK → documents` | |
| `target_document_id` | `UUID FK → documents` | |
| `consistency_score` | `NUMERIC(5,2)` | 0–100 |
| `issues_found` | `JSONB` | |
| `checked_at` | `TIMESTAMPTZ` | |

CHECK: source ≠ target.

---

### 30. `document_relationships`

| Column | Type | Notes |
|--------|------|-------|
| `relationship_id` | `UUID PK` | |
| `source_document_id` | `UUID FK → documents` | |
| `target_document_id` | `UUID FK → documents` | |
| `relationship_type` | `VARCHAR(100)` | DEFAULT `references` |
| `description` | `TEXT` | |
| `created_at` | `TIMESTAMPTZ` | |

UNIQUE on `(source_document_id, target_document_id, relationship_type)`.

---

## Section 8 — Task / Progress

### 31. `tasks`

| Column | Type | Notes |
|--------|------|-------|
| `task_id` | `UUID PK` | |
| `team_id` | `UUID FK → teams` | |
| `title` | `VARCHAR(255)` | |
| `description` | `TEXT` | |
| `assigned_to` | `UUID FK → students` | |
| `created_by` | `UUID FK → users` | |
| `status` | `task_status` | DEFAULT `todo` |
| `priority` | `task_priority` | DEFAULT `medium` |
| `due_date` | `DATE` | |
| `completed_at` | `TIMESTAMPTZ` | |
| `parent_task_id` | `UUID FK → tasks` | Self-ref for subtasks |
| `tags` | `JSONB` | |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | |

---

### 32. `progress_snapshots`

| Column | Type | Notes |
|--------|------|-------|
| `snapshot_id` | `UUID PK` | |
| `team_id` | `UUID FK → teams` | |
| `overall_progress` | `NUMERIC(5,2)` | 0–100 |
| `tasks_total` | `INTEGER` | |
| `tasks_completed` | `INTEGER` | |
| `tasks_in_progress` | `INTEGER` | |
| `tasks_blocked` | `INTEGER` | |
| `health_score` | `NUMERIC(5,2)` | 0–100 |
| `notes` | `TEXT` | |
| `metadata` | `JSONB` | |
| `snapped_at` | `TIMESTAMPTZ` | |

---

### 33. `progress_timeline`

| Column | Type | Notes |
|--------|------|-------|
| `timeline_id` | `UUID PK` | |
| `team_id` | `UUID FK → teams` | |
| `week_number` | `INTEGER` | 1–52 |
| `year` | `INTEGER` | ≥ 2000 |
| `progress_score` | `NUMERIC(5,2)` | 0–100 |
| `velocity` | `NUMERIC(5,2)` | |
| `trend` | `trend_type` | |
| `milestones_hit` | `JSONB` | |
| `recorded_at` | `TIMESTAMPTZ` | |

UNIQUE on `(team_id, week_number, year)`.

---

## Section 9 — AI Insights / Gaps

### 34. `collective_insights`

| Column | Type | Notes |
|--------|------|-------|
| `insight_id` | `UUID PK` | |
| `team_id` | `UUID FK → teams` | |
| `insight_type` | `VARCHAR(100)` | |
| `title` | `VARCHAR(255)` | |
| `content` | `TEXT` | |
| `data` | `JSONB` | AI reasoning |
| `confidence` | `NUMERIC(3,2)` | 0.0–1.0 |
| `is_actioned` | `BOOLEAN` | |
| `generated_at` | `TIMESTAMPTZ` | |

---

### 35. `team_summaries`

| Column | Type | Notes |
|--------|------|-------|
| `summary_id` | `UUID PK` | |
| `team_id` | `UUID FK → teams` | |
| `summary_type` | `VARCHAR(100)` | DEFAULT `weekly` |
| `period_start` | `DATE` | |
| `period_end` | `DATE` | |
| `content` | `TEXT` | |
| `highlights` | `JSONB` | |
| `risks` | `JSONB` | |
| `recommendations` | `JSONB` | |
| `ai_metadata` | `JSONB` | |
| `generated_at` | `TIMESTAMPTZ` | |

CHECK: `period_end >= period_start`.

---

### 36. `collaboration_gaps`

| Column | Type | Notes |
|--------|------|-------|
| `gap_id` | `UUID PK` | |
| `team_id` | `UUID FK → teams` | |
| `gap_type` | `VARCHAR(100)` | |
| `title` | `VARCHAR(255)` | |
| `description` | `TEXT` | |
| `severity` | `gap_severity` | |
| `evidence` | `JSONB` | |
| `is_resolved` | `BOOLEAN` | |
| `resolved_at` | `TIMESTAMPTZ` | |
| `identified_at` | `TIMESTAMPTZ` | |

---

### 37. `dependency_gaps`

| Column | Type | Notes |
|--------|------|-------|
| `gap_id` | `UUID PK` | |
| `team_id` | `UUID FK → teams` | |
| `source_task_id` | `UUID FK → tasks` | Nullable |
| `gap_type` | `VARCHAR(100)` | |
| `title` | `VARCHAR(255)` | |
| `description` | `TEXT` | |
| `severity` | `gap_severity` | |
| `evidence` | `JSONB` | |
| `is_resolved` | `BOOLEAN` | |
| `resolved_at` | `TIMESTAMPTZ` | |
| `identified_at` | `TIMESTAMPTZ` | |

---

### 38. `gap_recommendations`

| Column | Type | Notes |
|--------|------|-------|
| `recommendation_id` | `UUID PK` | |
| `gap_id` | `UUID` | FK handled by app (polymorphic) |
| `gap_table` | `VARCHAR(50)` | `collaboration_gaps` or `dependency_gaps` |
| `team_id` | `UUID FK → teams` | |
| `recommendation` | `TEXT` | |
| `action_type` | `VARCHAR(100)` | |
| `priority` | `task_priority` | |
| `is_actioned` | `BOOLEAN` | |
| `actioned_at` | `TIMESTAMPTZ` | |
| `created_at` | `TIMESTAMPTZ` | |

---

## Section 10 — Student Collaboration

### 39. `collaboration_requests`

| Column | Type | Notes |
|--------|------|-------|
| `request_id` | `UUID PK` | |
| `sender_id` | `UUID FK → students` | |
| `receiver_id` | `UUID FK → students` | |
| `project_description` | `TEXT` | |
| `required_skills` | `JSONB` | |
| `message` | `TEXT` | |
| `status` | `collab_request_status` | DEFAULT `pending` |
| `created_at` | `TIMESTAMPTZ` | |
| `responded_at` | `TIMESTAMPTZ` | |
| `updated_at` | `TIMESTAMPTZ` | |

CHECK: `sender_id <> receiver_id`.

---

### 40. `collaboration_teams`

| Column | Type | Notes |
|--------|------|-------|
| `collab_team_id` | `UUID PK` | |
| `team_name` | `VARCHAR(255)` | |
| `created_by` | `UUID FK → students` | |
| `project_description` | `TEXT` | |
| `required_skills` | `JSONB` | |
| `is_open` | `BOOLEAN` | DEFAULT `true` |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | |

---

### 41. `collaboration_members`

| Column | Type | Notes |
|--------|------|-------|
| `member_id` | `UUID PK` | |
| `collab_team_id` | `UUID FK → collaboration_teams` | |
| `student_id` | `UUID FK → students` | |
| `role` | `VARCHAR(100)` | DEFAULT `member` |
| `joined_at` | `TIMESTAMPTZ` | |

UNIQUE on `(collab_team_id, student_id)`.

---

### 42. `collaboration_messages`

| Column | Type | Notes |
|--------|------|-------|
| `message_id` | `UUID PK` | |
| `collab_team_id` | `UUID FK → collaboration_teams` | |
| `sender_id` | `UUID FK → students` | |
| `content` | `TEXT` | NOT NULL |
| `attachments` | `JSONB` | |
| `sent_at` | `TIMESTAMPTZ` | |

---

### 43. `recommendations`

| Column | Type | Notes |
|--------|------|-------|
| `recommendation_id` | `UUID PK` | |
| `requester_id` | `UUID FK → students` | |
| `recommended_student_id` | `UUID FK → students` | |
| `match_score` | `NUMERIC(5,2)` | 0–100 |
| `match_reasons` | `JSONB` | AI reasoning |
| `context` | `JSONB` | |
| `is_dismissed` | `BOOLEAN` | |
| `created_at` | `TIMESTAMPTZ` | |

CHECK: `requester_id <> recommended_student_id`. UNIQUE on `(requester_id, recommended_student_id)`.

---

## Section 11 — System

### 44. `notifications`

| Column | Type | Notes |
|--------|------|-------|
| `notification_id` | `UUID PK` | |
| `user_id` | `UUID FK → users` | |
| `type` | `notification_type` | |
| `title` | `VARCHAR(255)` | |
| `body` | `TEXT` | |
| `data` | `JSONB` | |
| `is_read` | `BOOLEAN` | DEFAULT `false` |
| `read_at` | `TIMESTAMPTZ` | |
| `created_at` | `TIMESTAMPTZ` | |

---

### 45. `audit_logs`
Immutable. No `updated_at`. Application cannot delete rows.

| Column | Type | Notes |
|--------|------|-------|
| `log_id` | `UUID PK` | |
| `user_id` | `UUID FK → users` | Nullable (SET NULL on delete) |
| `action` | `audit_action` | |
| `table_name` | `VARCHAR(100)` | |
| `record_id` | `UUID` | |
| `old_data` | `JSONB` | Pre-change snapshot |
| `new_data` | `JSONB` | Post-change snapshot |
| `ip_address` | `INET` | |
| `user_agent` | `TEXT` | |
| `created_at` | `TIMESTAMPTZ` | |

---

## Row Level Security Summary

| Access Level | Capability |
|---|---|
| **Service Role (Java backend)** | Bypasses all RLS — full read/write on all tables |
| **Student (authenticated)** | Own profile, own teams, own contributions, own notifications |
| **Staff** | All teams they supervise, all student data, AI analysis |
| **Department Head** | Department-wide data |
| **Admin** | All data |
| **Anon / unauthenticated** | No access to any table |

Key restrictions:
- `audit_logs` — staff+ read-only; no application DELETE
- `notifications` — users see only their own
- AI analysis tables — team members read, staff modify
- `USING (true)` policies — **never used** on sensitive tables

---

## Design Decisions

| Decision | Rationale |
|---|---|
| UUID PKs everywhere | Globally unique, safe for distributed inserts, no sequential leak |
| `gen_random_uuid()` default | No uuid-ossp dependency on insert |
| JSONB for AI data | AI output is schema-free; avoids ALTER TABLE on every model update |
| Core entities normalized | Students, teams, tasks remain relational for JOIN performance |
| No `password` column | Auth fully delegated to Supabase Auth |
| `audit_logs` no DELETE | Immutable trail; only service role inserts |
| `updated_at` trigger | Consistent, cannot be forgotten by application code |
| Polymorphic `gap_recommendations.gap_table` | Avoids two nearly identical FK columns; enforced by CHECK constraint |
