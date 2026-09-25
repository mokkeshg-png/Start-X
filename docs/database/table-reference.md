# Start-X Table Reference

Quick-reference index for all 45 tables.

---

## Table Index

| # | Table | Section | PK | Key FKs | Has updated_at | Has JSONB |
|---|-------|---------|-----|---------|:-:|:-:|
| 1 | `users` | Core | `user_id` | `auth.users` | ✓ | |
| 2 | `departments` | Core | `department_id` | `users` | ✓ | |
| 3 | `students` | Core | `student_id` | `users`, `departments` | ✓ | |
| 4 | `staff` | Core | `staff_id` | `users`, `departments` | ✓ | |
| 5 | `user_roles` | Core | `role_id` | `users` | | |
| 6 | `student_profiles` | Profile | `profile_id` | `students` | ✓ | |
| 7 | `skills` | Profile | `skill_id` | `student_profiles` | ✓ | |
| 8 | `projects` | Profile | `project_id` | `student_profiles` | ✓ | ✓ |
| 9 | `skill_evidence_map` | Profile | `mapping_id` | `skills`, `projects` | | |
| 10 | `teams` | Teams | `team_id` | `students`, `staff`, `departments` | ✓ | ✓ |
| 11 | `team_members` | Teams | `member_id` | `teams`, `students` | | |
| 12 | `team_roles` | Teams | `role_id` | `teams`, `students` | | ✓ |
| 13 | `compatibility_analysis` | Teams | `analysis_id` | `teams` | | ✓ |
| 14 | `team_requirements` | Teams | `requirement_id` | `teams` | ✓ | |
| 15 | `discussions` | Discussions | `discussion_id` | `teams`, `users` | ✓ | |
| 16 | `messages` | Discussions | `message_id` | `discussions`, `users` | | ✓ |
| 17 | `discussion_analysis` | Discussions | `analysis_id` | `discussions` | | ✓ |
| 18 | `discussion_topics` | Discussions | `topic_id` | `discussions` | | ✓ |
| 19 | `discussion_decisions` | Discussions | `decision_id` | `discussions`, `users` | | |
| 20 | `discussion_action_items` | Discussions | `action_id` | `discussions`, `users` | ✓ | |
| 21 | `contributions` | Contributions | `contribution_id` | `teams`, `students` | ✓ | ✓ |
| 22 | `contribution_analysis` | Contributions | `analysis_id` | `contributions` | | ✓ |
| 23 | `contribution_timeline` | Contributions | `timeline_id` | `students`, `teams` | | |
| 24 | `knowledge_exchanges` | Knowledge | `exchange_id` | `teams`, `students` ×2 | | ✓ |
| 25 | `knowledge_graph` | Knowledge | `node_id` | `teams` | | ✓ |
| 26 | `knowledge_edges` | Knowledge | `edge_id` | `knowledge_graph` ×2 | | ✓ |
| 27 | `documents` | Documents | `document_id` | `teams`, `users`, `documents` | | |
| 28 | `document_analysis` | Documents | `analysis_id` | `documents` | | ✓ |
| 29 | `consistency_checks` | Documents | `check_id` | `teams`, `documents` ×2 | | ✓ |
| 30 | `document_relationships` | Documents | `relationship_id` | `documents` ×2 | | |
| 31 | `tasks` | Tasks | `task_id` | `teams`, `students`, `users`, `tasks` | ✓ | ✓ |
| 32 | `progress_snapshots` | Progress | `snapshot_id` | `teams` | | ✓ |
| 33 | `progress_timeline` | Progress | `timeline_id` | `teams` | | ✓ |
| 34 | `collective_insights` | AI/Gaps | `insight_id` | `teams` | | ✓ |
| 35 | `team_summaries` | AI/Gaps | `summary_id` | `teams` | | ✓ |
| 36 | `collaboration_gaps` | AI/Gaps | `gap_id` | `teams` | | ✓ |
| 37 | `dependency_gaps` | AI/Gaps | `gap_id` | `teams`, `tasks` | | ✓ |
| 38 | `gap_recommendations` | AI/Gaps | `recommendation_id` | `teams` | | |
| 39 | `collaboration_requests` | Collaboration | `request_id` | `students` ×2 | ✓ | ✓ |
| 40 | `collaboration_teams` | Collaboration | `collab_team_id` | `students` | ✓ | ✓ |
| 41 | `collaboration_members` | Collaboration | `member_id` | `collaboration_teams`, `students` | | |
| 42 | `collaboration_messages` | Collaboration | `message_id` | `collaboration_teams`, `students` | | ✓ |
| 43 | `recommendations` | Collaboration | `recommendation_id` | `students` ×2 | | ✓ |
| 44 | `notifications` | System | `notification_id` | `users` | | ✓ |
| 45 | `audit_logs` | System | `log_id` | `users` | | ✓ |

---

## Key Constraints Summary

| Table | Constraint Type | Description |
|-------|----------------|-------------|
| `users` | CHECK | Email format validated by regex |
| `users` | UNIQUE | `email` |
| `students` | UNIQUE | `user_id`, `student_number` |
| `staff` | UNIQUE | `user_id`, `staff_number` |
| `departments` | UNIQUE | `name`, `code` |
| `user_roles` | UNIQUE | `(user_id, role, context_id)` |
| `student_profiles` | UNIQUE | `student_id` |
| `student_profiles` | CHECK | `github_url` and `linkedin_url` format |
| `skills` | UNIQUE | `(profile_id, skill_name)` |
| `skill_evidence_map` | UNIQUE | `(skill_id, project_id)` |
| `team_members` | UNIQUE | `(team_id, student_id)` |
| `teams` | CHECK | `max_members` 1–20 |
| `compatibility_analysis` | CHECK | `compatibility_score` 0–100 |
| `contribution_timeline` | UNIQUE | `(student_id, team_id, week_number, year)` |
| `knowledge_exchanges` | CHECK | `from_student_id <> to_student_id` |
| `knowledge_edges` | CHECK | No self-loops |
| `knowledge_edges` | UNIQUE | `(from_node_id, to_node_id, relationship)` |
| `consistency_checks` | CHECK | `source_document_id <> target_document_id` |
| `document_relationships` | UNIQUE | `(source_document_id, target_document_id, relationship_type)` |
| `progress_timeline` | UNIQUE | `(team_id, week_number, year)` |
| `team_summaries` | CHECK | `period_end >= period_start` |
| `collaboration_requests` | CHECK | `sender_id <> receiver_id` |
| `collaboration_members` | UNIQUE | `(collab_team_id, student_id)` |
| `recommendations` | CHECK | `requester_id <> recommended_student_id` |
| `recommendations` | UNIQUE | `(requester_id, recommended_student_id)` |
| `gap_recommendations` | CHECK | `gap_table IN ('collaboration_gaps', 'dependency_gaps')` |

---

## ON DELETE Behavior

| FK Relationship | Behavior |
|----------------|----------|
| `users → auth.users` | CASCADE (auth delete removes user) |
| `students → users` | CASCADE |
| `staff → users` | CASCADE |
| `student_profiles → students` | CASCADE |
| `skills → student_profiles` | CASCADE |
| `projects → student_profiles` | CASCADE |
| `skill_evidence_map → skills/projects` | CASCADE |
| `team_members → teams/students` | CASCADE |
| `team_roles → teams` | CASCADE |
| `compatibility_analysis → teams` | CASCADE |
| `discussions → teams` | CASCADE |
| `messages → discussions` | CASCADE |
| `contributions → teams/students` | CASCADE |
| `tasks → teams` | CASCADE |
| `notifications → users` | CASCADE |
| `departments → head_user_id (users)` | SET NULL |
| `students → department_id` | SET NULL |
| `staff → department_id` | SET NULL |
| `teams → leader_id` | SET NULL |
| `teams → created_by (staff)` | SET NULL |
| `tasks → assigned_to` | SET NULL |
| `tasks → parent_task_id` | SET NULL |
| `documents → parent_document_id` | SET NULL |
| `audit_logs → user_id` | SET NULL |
| `discussions → created_by (users)` | RESTRICT |
| `messages → sender_id (users)` | RESTRICT |
| `documents → uploaded_by (users)` | RESTRICT |
| `tasks → created_by (users)` | RESTRICT |

---

## JSONB Fields Usage Guide

| Table | JSONB Column | Contents |
|-------|-------------|----------|
| `projects` | `technologies` | `["React", "TypeScript", ...]` |
| `projects` | `files` | `[{name, url, size, type}, ...]` |
| `teams` | `metadata` | Flexible team settings |
| `team_roles` | `required_skills` | `["Python", "ML", ...]` |
| `compatibility_analysis` | `required_skills`, `covered_skills`, `missing_skills` | Skill arrays |
| `compatibility_analysis` | `ai_reasoning` | AI explanation object |
| `messages` | `attachments` | `[{url, name, size}, ...]` |
| `discussion_analysis` | `topics`, `decisions`, `problems`, `action_items`, `sentiment` | AI-extracted content |
| `discussion_topics` | `keywords` | `["auth", "JWT", ...]` |
| `contributions` | `files`, `tags` | Files and classification tags |
| `contribution_analysis` | `ai_metadata` | AI model output |
| `knowledge_exchanges` | `metadata` | Exchange context |
| `knowledge_graph` | `metadata` | Node properties |
| `knowledge_edges` | `metadata` | Edge properties |
| `document_analysis` | `extracted_topics`, `technical_decisions`, `contributions_mentioned`, `ai_metadata` | AI document understanding |
| `consistency_checks` | `issues_found` | `[{type, description, severity}, ...]` |
| `tasks` | `tags` | Task labels |
| `progress_snapshots` | `metadata` | Snapshot context |
| `progress_timeline` | `milestones_hit` | `[{name, date}, ...]` |
| `collective_insights` | `data` | AI insight payload |
| `team_summaries` | `highlights`, `risks`, `recommendations`, `ai_metadata` | Summary sections |
| `collaboration_gaps` | `evidence` | Gap evidence from AI |
| `dependency_gaps` | `evidence` | Gap evidence from AI |
| `collaboration_requests` | `required_skills` | Skill requirements |
| `collaboration_teams` | `required_skills` | Skill requirements |
| `collaboration_messages` | `attachments` | Message files |
| `recommendations` | `match_reasons`, `context` | AI recommendation reasoning |
| `notifications` | `data` | Notification payload |
| `audit_logs` | `old_data`, `new_data` | Before/after snapshots |

---

## Tables with Self-References

| Table | Column | Purpose |
|-------|--------|---------|
| `tasks` | `parent_task_id` | Subtask hierarchy |
| `documents` | `parent_document_id` | Document versioning |

---

## RLS Policy Summary

| Role | Tables accessible |
|------|------------------|
| Service Role (Java backend) | All 45 tables — bypasses RLS |
| `student` | Own profile, own team data, own notifications |
| `staff` | All teams, all students, all AI analysis |
| `department_head` | Department-scoped data |
| `admin` | All data |
| Anonymous / unauthenticated | None |

Sensitive restrictions:
- `audit_logs` — SELECT only for `staff+`; no DELETE for anyone
- `notifications` — each user sees only their own rows
- AI analysis tables — team members read; only staff or service role write
