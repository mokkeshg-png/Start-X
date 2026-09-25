# Start-X Supabase Database

This directory contains all SQL files for the Start-X PostgreSQL database hosted on Supabase.

## File Structure

```
supabase/
├── functions.sql   — Trigger functions (run first)
├── schema.sql      — All 45 tables, enums, constraints, triggers
├── indexes.sql     — 90+ indexes for query performance
├── rls.sql         — Row Level Security policies
├── seed.sql        — Dev-only reference data (departments)
└── README.md       — This file
```

## How to Apply

### Option A — Supabase Dashboard (recommended for first-time setup)

1. Open [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Run files in this exact order:

```
1. functions.sql
2. schema.sql
3. indexes.sql
4. rls.sql
5. seed.sql   ← optional, dev only
```

### Option B — Supabase CLI

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Link to your project
supabase link --project-ref rrosugsevmwzcailipyd

# Apply each file
supabase db execute --file supabase/functions.sql
supabase db execute --file supabase/schema.sql
supabase db execute --file supabase/indexes.sql
supabase db execute --file supabase/rls.sql
supabase db execute --file supabase/seed.sql   # optional
```

### Option C — psql direct

```bash
psql "$SUPABASE_DB_URL" -f supabase/functions.sql
psql "$SUPABASE_DB_URL" -f supabase/schema.sql
psql "$SUPABASE_DB_URL" -f supabase/indexes.sql
psql "$SUPABASE_DB_URL" -f supabase/rls.sql
psql "$SUPABASE_DB_URL" -f supabase/seed.sql   # optional
```

## Architecture

```
React / Vite Frontend
        ↓
Java Spring Boot Backend  ← uses SERVICE_ROLE_KEY (bypasses RLS)
        ↓
Supabase PostgreSQL       ← RLS active for direct/anon access
        ↑
Supabase Auth             ← auth.users.id → public.users.user_id
```

## Tables (45 total)

| Section | Tables |
|---------|--------|
| Core / Auth / Org | `users`, `departments`, `students`, `staff`, `user_roles` |
| Student Profile / Skills | `student_profiles`, `skills`, `projects`, `skill_evidence_map` |
| Team Formation | `teams`, `team_members`, `team_roles`, `compatibility_analysis`, `team_requirements` |
| Discussion Analysis | `discussions`, `messages`, `discussion_analysis`, `discussion_topics`, `discussion_decisions`, `discussion_action_items` |
| Contribution Analysis | `contributions`, `contribution_analysis`, `contribution_timeline` |
| Knowledge Exchange | `knowledge_exchanges`, `knowledge_graph`, `knowledge_edges` |
| Document Intelligence | `documents`, `document_analysis`, `consistency_checks`, `document_relationships` |
| Task / Progress | `tasks`, `progress_snapshots`, `progress_timeline` |
| AI Insights / Gaps | `collective_insights`, `team_summaries`, `collaboration_gaps`, `dependency_gaps`, `gap_recommendations` |
| Student Collaboration | `collaboration_requests`, `collaboration_teams`, `collaboration_members`, `collaboration_messages`, `recommendations` |
| System | `notifications`, `audit_logs` |

## Key Design Decisions

- **UUID primary keys** everywhere — globally unique, no sequential leak
- **`gen_random_uuid()`** default — no extra extension dependency on INSERT
- **JSONB** for AI-generated dynamic data — extracted topics, reasoning, evidence
- **Core entities normalized** — students, teams, tasks remain relational for JOINs
- **No `password` column** — auth delegated entirely to Supabase Auth
- **`updated_at` trigger** — applied automatically, cannot be forgotten by app code
- **`audit_logs` immutable** — no DELETE policy; only service role inserts
- **RLS never uses `USING (true)`** on sensitive tables

## Documentation

See `docs/database/` for:
- `database-schema.md` — full column-level schema reference
- `er-diagram.md` — Mermaid ER diagram (all 45 tables)
- `er-diagram.mmd` — raw Mermaid source
- `table-reference.md` — constraints, ON DELETE behavior, JSONB usage guide
