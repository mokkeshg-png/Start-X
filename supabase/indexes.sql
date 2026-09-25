-- =============================================================================
-- START-X: INDEXES
-- =============================================================================
-- Run after schema.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CORE / AUTH / ORGANIZATION
-- -----------------------------------------------------------------------------
CREATE INDEX idx_users_email           ON users(email);
CREATE INDEX idx_users_role            ON users(role);
CREATE INDEX idx_students_user_id      ON students(user_id);
CREATE INDEX idx_students_department   ON students(department_id);
CREATE INDEX idx_students_active       ON students(is_active);
CREATE INDEX idx_staff_user_id         ON staff(user_id);
CREATE INDEX idx_staff_department      ON staff(department_id);
CREATE INDEX idx_departments_code      ON departments(code);
CREATE INDEX idx_user_roles_user_id    ON user_roles(user_id);
CREATE INDEX idx_user_roles_context    ON user_roles(context_id, context_type);

-- -----------------------------------------------------------------------------
-- STUDENT PROFILE / SKILLS
-- -----------------------------------------------------------------------------
CREATE INDEX idx_student_profiles_student ON student_profiles(student_id);
CREATE INDEX idx_skills_profile_id        ON skills(profile_id);
CREATE INDEX idx_skills_name              ON skills(skill_name);
CREATE INDEX idx_skills_verified          ON skills(is_verified);
CREATE INDEX idx_projects_profile_id      ON projects(profile_id);
CREATE INDEX idx_skill_evidence_skill     ON skill_evidence_map(skill_id);
CREATE INDEX idx_skill_evidence_project   ON skill_evidence_map(project_id);

-- -----------------------------------------------------------------------------
-- TEAMS
-- -----------------------------------------------------------------------------
CREATE INDEX idx_teams_leader_id      ON teams(leader_id);
CREATE INDEX idx_teams_created_by     ON teams(created_by);
CREATE INDEX idx_teams_department     ON teams(department_id);
CREATE INDEX idx_teams_status         ON teams(status);
CREATE INDEX idx_team_members_team    ON team_members(team_id);
CREATE INDEX idx_team_members_student ON team_members(student_id);
CREATE INDEX idx_team_members_active  ON team_members(team_id, is_active);
CREATE INDEX idx_team_roles_team      ON team_roles(team_id);
CREATE INDEX idx_compatibility_team   ON compatibility_analysis(team_id);
CREATE INDEX idx_team_requirements_team ON team_requirements(team_id);

-- -----------------------------------------------------------------------------
-- DISCUSSIONS
-- -----------------------------------------------------------------------------
CREATE INDEX idx_discussions_team        ON discussions(team_id);
CREATE INDEX idx_discussions_created_by  ON discussions(created_by);
CREATE INDEX idx_discussions_status      ON discussions(status);
CREATE INDEX idx_messages_discussion     ON messages(discussion_id);
CREATE INDEX idx_messages_sender         ON messages(sender_id);
CREATE INDEX idx_messages_created_at     ON messages(created_at DESC);
CREATE INDEX idx_discussion_analysis_disc ON discussion_analysis(discussion_id);
CREATE INDEX idx_discussion_topics_disc   ON discussion_topics(discussion_id);
CREATE INDEX idx_discussion_decisions_disc ON discussion_decisions(discussion_id);
CREATE INDEX idx_discussion_actions_disc  ON discussion_action_items(discussion_id);
CREATE INDEX idx_discussion_actions_assigned ON discussion_action_items(assigned_to);

-- -----------------------------------------------------------------------------
-- CONTRIBUTIONS
-- -----------------------------------------------------------------------------
CREATE INDEX idx_contributions_team      ON contributions(team_id);
CREATE INDEX idx_contributions_student   ON contributions(student_id);
CREATE INDEX idx_contributions_type      ON contributions(contribution_type);
CREATE INDEX idx_contribution_analysis_contrib ON contribution_analysis(contribution_id);
CREATE INDEX idx_contribution_timeline_student ON contribution_timeline(student_id);
CREATE INDEX idx_contribution_timeline_team    ON contribution_timeline(team_id);
CREATE INDEX idx_contribution_timeline_period  ON contribution_timeline(year, week_number);

-- -----------------------------------------------------------------------------
-- KNOWLEDGE
-- -----------------------------------------------------------------------------
CREATE INDEX idx_knowledge_exchanges_team    ON knowledge_exchanges(team_id);
CREATE INDEX idx_knowledge_exchanges_from    ON knowledge_exchanges(from_student_id);
CREATE INDEX idx_knowledge_exchanges_to      ON knowledge_exchanges(to_student_id);
CREATE INDEX idx_knowledge_graph_team        ON knowledge_graph(team_id);
CREATE INDEX idx_knowledge_graph_type        ON knowledge_graph(node_type);
CREATE INDEX idx_knowledge_edges_from        ON knowledge_edges(from_node_id);
CREATE INDEX idx_knowledge_edges_to          ON knowledge_edges(to_node_id);

-- -----------------------------------------------------------------------------
-- DOCUMENTS
-- -----------------------------------------------------------------------------
CREATE INDEX idx_documents_team          ON documents(team_id);
CREATE INDEX idx_documents_uploaded_by   ON documents(uploaded_by);
CREATE INDEX idx_documents_file_type     ON documents(file_type);
CREATE INDEX idx_documents_latest        ON documents(team_id, is_latest);
CREATE INDEX idx_document_analysis_doc   ON document_analysis(document_id);
CREATE INDEX idx_consistency_checks_team ON consistency_checks(team_id);
CREATE INDEX idx_consistency_source      ON consistency_checks(source_document_id);
CREATE INDEX idx_consistency_target      ON consistency_checks(target_document_id);
CREATE INDEX idx_doc_relationships_source ON document_relationships(source_document_id);
CREATE INDEX idx_doc_relationships_target ON document_relationships(target_document_id);

-- -----------------------------------------------------------------------------
-- TASKS / PROGRESS
-- -----------------------------------------------------------------------------
CREATE INDEX idx_tasks_team            ON tasks(team_id);
CREATE INDEX idx_tasks_assigned_to     ON tasks(assigned_to);
CREATE INDEX idx_tasks_status          ON tasks(status);
CREATE INDEX idx_tasks_priority        ON tasks(priority);
CREATE INDEX idx_tasks_due_date        ON tasks(due_date);
CREATE INDEX idx_tasks_parent          ON tasks(parent_task_id);
CREATE INDEX idx_progress_snapshots_team ON progress_snapshots(team_id);
CREATE INDEX idx_progress_snapshots_at   ON progress_snapshots(snapped_at DESC);
CREATE INDEX idx_progress_timeline_team  ON progress_timeline(team_id);
CREATE INDEX idx_progress_timeline_period ON progress_timeline(year, week_number);

-- -----------------------------------------------------------------------------
-- AI INSIGHTS / GAPS
-- -----------------------------------------------------------------------------
CREATE INDEX idx_collective_insights_team    ON collective_insights(team_id);
CREATE INDEX idx_collective_insights_type    ON collective_insights(insight_type);
CREATE INDEX idx_team_summaries_team         ON team_summaries(team_id);
CREATE INDEX idx_team_summaries_period       ON team_summaries(period_start, period_end);
CREATE INDEX idx_collaboration_gaps_team     ON collaboration_gaps(team_id);
CREATE INDEX idx_collaboration_gaps_severity ON collaboration_gaps(severity);
CREATE INDEX idx_dependency_gaps_team        ON dependency_gaps(team_id);
CREATE INDEX idx_dependency_gaps_task        ON dependency_gaps(source_task_id);
CREATE INDEX idx_gap_recommendations_team    ON gap_recommendations(team_id);
CREATE INDEX idx_gap_recommendations_gap     ON gap_recommendations(gap_id);

-- -----------------------------------------------------------------------------
-- STUDENT COLLABORATION
-- -----------------------------------------------------------------------------
CREATE INDEX idx_collab_requests_sender   ON collaboration_requests(sender_id);
CREATE INDEX idx_collab_requests_receiver ON collaboration_requests(receiver_id);
CREATE INDEX idx_collab_requests_status   ON collaboration_requests(status);
CREATE INDEX idx_collab_teams_created_by  ON collaboration_teams(created_by);
CREATE INDEX idx_collab_members_team      ON collaboration_members(collab_team_id);
CREATE INDEX idx_collab_members_student   ON collaboration_members(student_id);
CREATE INDEX idx_collab_messages_team     ON collaboration_messages(collab_team_id);
CREATE INDEX idx_collab_messages_sender   ON collaboration_messages(sender_id);
CREATE INDEX idx_collab_messages_sent_at  ON collaboration_messages(sent_at DESC);
CREATE INDEX idx_recommendations_requester   ON recommendations(requester_id);
CREATE INDEX idx_recommendations_recommended ON recommendations(recommended_student_id);

-- -----------------------------------------------------------------------------
-- SYSTEM
-- -----------------------------------------------------------------------------
CREATE INDEX idx_notifications_user      ON notifications(user_id);
CREATE INDEX idx_notifications_unread    ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type      ON notifications(type);
CREATE INDEX idx_notifications_created   ON notifications(created_at DESC);
CREATE INDEX idx_audit_logs_user_id      ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name   ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id    ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_created      ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action       ON audit_logs(action);

-- -----------------------------------------------------------------------------
-- COMPOSITE INDEXES (frequently queried together)
-- -----------------------------------------------------------------------------
CREATE INDEX idx_team_members_composite      ON team_members(team_id, student_id, is_active);
CREATE INDEX idx_contributions_composite     ON contributions(team_id, student_id, contribution_type);
CREATE INDEX idx_tasks_team_status           ON tasks(team_id, status);
CREATE INDEX idx_notifications_user_read     ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_audit_logs_user_action      ON audit_logs(user_id, action, created_at DESC);
