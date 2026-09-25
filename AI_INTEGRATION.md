# AI Integration — START-X Platform

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Edge Function](#2-edge-function)
3. [OpenAI Integration](#3-openai-integration)
4. [Existing Tables Used by Each AI Module](#4-existing-tables-used-by-each-ai-module)
5. [New Tables Created](#5-new-tables-created)
6. [Environment Variables](#6-environment-variables)
7. [Local Setup](#7-local-setup)
8. [Production Setup](#8-production-setup)
9. [Deployment](#9-deployment)
10. [Testing the First AI Feature](#10-testing-the-first-ai-feature)
11. [Security](#11-security)
12. [AI Limitations & Caveats](#12-ai-limitations--caveats)

---

## 1. Architecture Overview

```
Browser (React + Vite)
        │
        │  supabase.functions.invoke('ai-analyze', { body: request })
        │  (Supabase JWT attached automatically — never an OpenAI key)
        ▼
Supabase Edge Function  ─── supabase/functions/ai-analyze/
        │
        ├── Verifies Supabase JWT (auth.getUser())
        ├── Rate-limits per user (10 calls/min, in-memory)
        ├── Checks ai_analysis cache table (TTL per analysis type)
        │
        ├── Reads source data via authenticated user client (RLS enforced)
        │
        ├── Calls OpenAI API  ──► OPENAI_API_KEY  (server-side secret only)
        │       model: OPENAI_MODEL (default gpt-4o-mini)
        │       response_format: json_object
        │
        ├── Validates structured JSON response
        ├── Writes to dedicated AI tables via service-role client
        ├── Writes to ai_analysis cache table
        ├── Writes to audit_logs
        │
        └── Returns { success, data, dedicated, cached }
                │
                ▼
        React components display structured results
        from dedicated AI tables + ai_analysis cache
```

**Security constraint**: The browser never calls OpenAI directly. The API key lives exclusively in Supabase Edge Function secrets.

---

## 2. Edge Function

### Location

```
supabase/functions/ai-analyze/
├── index.ts                        ← Main handler (auth, rate limit, cache, OpenAI, audit)
├── prompts/
│   ├── index.ts                    ← Router: analysisType → prompt builder
│   ├── discussionAnalysis.ts       ← Module 3
│   ├── contributionAnalysis.ts     ← Module 4
│   ├── documentIntelligence.ts     ← Module 6
│   ├── progressAnalysis.ts         ← Module 7
│   ├── collectiveInsight.ts        ← Module 8
│   ├── collaborationGap.ts         ← Module 9
│   ├── recommendation.ts           ← Module 10
│   ├── skillAnalysis.ts            ← Module 1
│   ├── teamFormation.ts            ← Module 2
│   └── knowledgeExchange.ts        ← Module 5
└── writers/
    ├── index.ts                    ← Router: analysisType → writer
    ├── discussionWriter.ts         → discussion_analysis, discussion_topics, discussion_decisions, discussion_action_items
    ├── contributionWriter.ts       → contribution_analysis, contribution_timeline
    ├── documentWriter.ts           → document_analysis
    ├── progressWriter.ts           → progress_snapshots, progress_timeline
    ├── collectiveInsightWriter.ts  → collective_insights, team_summaries
    ├── collaborationGapWriter.ts   → collaboration_gaps, dependency_gaps (with deduplication)
    ├── recommendationWriter.ts     → gap_recommendations, recommendations
    ├── skillWriter.ts              → skills (evidence_strength only), skill_evidence_map
    ├── teamFormationWriter.ts      → compatibility_analysis, recommendations
    └── knowledgeExchangeWriter.ts  → knowledge_exchanges, knowledge_graph, knowledge_edges
```

### Request Body

```json
{
  "analysisType": "discussion_analysis",
  "teamId": "uuid",
  "studentId": "uuid",
  "discussionId": "uuid",
  "documentId": "uuid",
  "contributionId": "uuid",
  "inputData": {}
}
```

Only the fields required for the chosen `analysisType` are needed.

### Response Body

```json
{
  "success": true,
  "data": { /* ai_analysis cache row */ },
  "dedicated": { /* result from the dedicated table writer */ },
  "cached": false
}
```

### Required Fields Per Analysis Type

| analysisType                | Required fields              |
|-----------------------------|------------------------------|
| `discussion_analysis`       | `discussionId` OR `teamId`   |
| `contribution_analysis`     | `teamId` + `studentId`       |
| `document_intelligence`     | `documentId`                 |
| `progress_analysis`         | `teamId`                     |
| `collective_insight`        | `teamId`                     |
| `collaboration_gap`         | `teamId`                     |
| `collaboration_recommendation` | `teamId`                  |
| `skill_analysis`            | `studentId`                  |
| `team_formation`            | `teamId`                     |
| `knowledge_exchange`        | `teamId`                     |

---

## 3. Gemini Integration

- **SDK**: `@google/generative-ai` via `https://esm.sh/@google/generative-ai@0.21.0` (Deno-compatible)
- **API**: `generateContent` with `responseMimeType: "application/json"` for structured output
- **Model**: Read from `GEMINI_MODEL` secret (default `gemini-1.5-flash`)
- **Temperature**: `0.3` — low variance for consistent structured output
- **Max tokens**: `2000` per call
- **System instruction**: Passed via `systemInstruction` (supported on `gemini-1.5-flash` and `gemini-1.5-pro`)
- **Key location**: Supabase Edge Function secret `GEMINI_API_KEY` — never in frontend code, never in `.env`, never logged

### Supported models

| Model | Use case |
|-------|----------|
| `gemini-1.5-flash` | Default — fast, cost-effective, supports JSON mode + system instructions |
| `gemini-1.5-pro` | Higher reasoning quality, slower, higher cost |
| `gemini-2.0-flash` | Fastest, latest generation |

Set via the `GEMINI_MODEL` secret. Change at any time without redeploying code.

### JSON output handling

Gemini with `responseMimeType: "application/json"` returns structured JSON directly. The Edge Function additionally strips any accidental markdown code fences (` ```json `) before parsing, for robustness.

### Document Intelligence

For PDF and binary documents, the frontend must extract text content and pass it as `inputData.documentText`. Text files (`text/*`, `application/json`) are extracted automatically in the `DocumentAnalysisPanel` component via a signed URL fetch. Content is truncated at 6000 characters to stay within token limits.

---

## 4. Existing Tables Used by Each AI Module

### Module 1 — Skill Analysis
- **Reads**: `students`, `student_profiles`, `skills`, `projects`, `skill_evidence_map`
- **Writes**: `skills` (updates `evidence_strength` only, never overwrites `is_verified=true`), `skill_evidence_map`

### Module 2 — Team Formation
- **Reads**: `teams`, `team_roles`, `team_requirements`, `team_members`, `students`, `student_profiles`, `skills`
- **Writes**: `compatibility_analysis`, `recommendations`

### Module 3 — Discussion Analysis ← First vertical slice
- **Reads**: `discussions`, `messages`
- **Writes**: `discussion_analysis`, `discussion_topics`, `discussion_decisions`, `discussion_action_items`

### Module 4 — Contribution Analysis
- **Reads**: `contributions`, `team_members`, `tasks`
- **Writes**: `contribution_analysis`, `contribution_timeline`

### Module 5 — Knowledge Exchange
- **Reads**: `messages`, `discussions`, `discussion_analysis`, `documents`, `team_members`
- **Writes**: `knowledge_exchanges`, `knowledge_graph`, `knowledge_edges`

### Module 6 — Document Intelligence
- **Reads**: `documents` (metadata), text content via frontend extraction
- **Writes**: `document_analysis`

### Module 7 — Progress Analysis
- **Reads**: `tasks`, `progress_snapshots`, `team_requirements`
- **Writes**: `progress_snapshots`, `progress_timeline`

### Module 8 — Collective Insight
- **Reads**: `teams`, `tasks`, `discussion_analysis`, `collaboration_gaps`, `contributions`, `progress_snapshots`
- **Writes**: `collective_insights`, `team_summaries`

### Module 9 — Collaboration Gap Detection
- **Reads**: `tasks`, `team_members`, `contributions`, `discussion_analysis`, `collaboration_gaps` (for deduplication)
- **Writes**: `collaboration_gaps`, `dependency_gaps`
- **Deduplication**: Checks for existing open gaps with same `gap_type` + `title` before inserting

### Module 10 — AI Recommendations
- **Reads**: `collaboration_gaps`, `dependency_gaps`, `progress_snapshots`, `knowledge_exchanges`
- **Writes**: `gap_recommendations`, `recommendations`

### All Modules
- **Writes**: `ai_analysis` (cache table), `audit_logs`

---

## 5. New Tables Created

Only one new migration was created. Everything else reuses existing schema tables.

### Migration 004 — pgvector + student_embeddings

**File**: `supabase/migrations/004_pgvector_embeddings.sql`

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.student_embeddings (
    embedding_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id    UUID NOT NULL UNIQUE REFERENCES students(student_id) ON DELETE CASCADE,
    content       TEXT NOT NULL,
    embedding     vector(1536),   -- text-embedding-3-small dimensions
    metadata      JSONB NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose**: Enables semantic similarity search for team formation. Used to pre-filter student candidates by embedding similarity before sending to OpenAI, so the entire student database is never sent to the LLM.

**HNSW index**: Created for fast approximate nearest-neighbour cosine similarity search.

**Helper function**: `find_similar_students(query_embedding, match_threshold, match_count)` — callable from the Edge Function.

**Was pgvector already enabled?**: Unknown at inspection time. The migration uses `CREATE EXTENSION IF NOT EXISTS vector` — safe to run even if already enabled.

---

## 6. Environment Variables

### Frontend (`.env` — safe for browser)

| Variable              | Description                          |
|-----------------------|--------------------------------------|
| `VITE_SUPABASE_URL`   | Your Supabase project URL            |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key          |
| `VITE_BACKEND_URL`    | Optional Java backend URL            |

### Edge Function Secrets (server-only — set via Supabase CLI or Dashboard)

| Variable         | Description                                             |
|------------------|---------------------------------------------------------|
| `GEMINI_API_KEY` | Your Google Gemini API key — **NEVER put this in `.env`** |
| `GEMINI_MODEL`   | Model name, e.g. `gemini-1.5-flash` or `gemini-1.5-pro` |

These are automatically available inside the Edge Function via `Deno.env.get("OPENAI_API_KEY")`.

The following are injected automatically by Supabase — you do not set them:

| Variable                    | Set by        |
|-----------------------------|---------------|
| `SUPABASE_URL`              | Supabase auto |
| `SUPABASE_ANON_KEY`         | Supabase auto |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase auto |

---

## 7. Local Setup

### Prerequisites

- Node.js 18+
- Supabase CLI: `npm install -g supabase`
- Docker Desktop (for local Supabase)

### Steps

```bash
# 1. Clone and install frontend dependencies
npm install

# 2. Start local Supabase
supabase start

# 3. Apply migrations
supabase db reset        # runs all migrations including 004_pgvector_embeddings.sql
# OR apply individually:
# supabase db push

# 4. Set Edge Function secrets locally
supabase secrets set GEMINI_API_KEY=AIza-your-key-here
supabase secrets set GEMINI_MODEL=gemini-1.5-flash

# 5. Serve the Edge Function locally
supabase functions serve ai-analyze --env-file .env.local

# 6. Start the frontend
npm run dev
```

### Local `.env`

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<your-local-anon-key-from-supabase-start-output>
```

---

## 8. Production Setup

### 1. Apply the pgvector migration

Run in the Supabase SQL Editor or via CLI:

```bash
supabase db push
```

Or paste `supabase/migrations/004_pgvector_embeddings.sql` into the SQL Editor.

### 2. Add the Edge Function secrets

**Supabase Dashboard → Project → Edge Functions → Manage Secrets**

Add:

| Name             | Value                                    |
|------------------|------------------------------------------|
| `GEMINI_API_KEY` | `AIza...` (your real key from Google AI Studio) |
| `GEMINI_MODEL`   | `gemini-1.5-flash`                       |

Or via CLI:

```bash
supabase secrets set --project-ref YOUR_PROJECT_REF GEMINI_API_KEY=AIza...
supabase secrets set --project-ref YOUR_PROJECT_REF GEMINI_MODEL=gemini-1.5-flash
```

### 3. Deploy the Edge Function

```bash
supabase functions deploy ai-analyze --project-ref YOUR_PROJECT_REF
```

### 4. Deploy the frontend

```bash
npm run build
# Deploy dist/ to your hosting provider (Vercel, Netlify, etc.)
```

---

## 9. Deployment

### Edge Function deploy command

```bash
supabase functions deploy ai-analyze
```

This uploads the entire `supabase/functions/ai-analyze/` directory including all subdirectories (`prompts/`, `writers/`).

### Verify deployment

```bash
# Check function is listed
supabase functions list

# Check secrets are set
supabase secrets list
```

### Confirm the function works via curl

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai-analyze \
  -H "Authorization: Bearer YOUR_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "analysisType": "discussion_analysis",
    "discussionId": "YOUR_DISCUSSION_UUID",
    "teamId": "YOUR_TEAM_UUID"
  }'
```

Expected response:

```json
{
  "success": true,
  "data": { "id": "...", "analysis_type": "discussion_analysis", ... },
  "dedicated": { "analysis_id": "...", "discussion_id": "..." },
  "cached": false
}
```

---

## 10. Testing the First AI Feature

**Discussion Analysis** is the first vertical slice.

### Step-by-step

1. **Log in** to the app with a student or staff account.

2. **Navigate** to a project workspace (`/teams/:id`).

3. **Open the "Team Chat" tab** — send a few test messages first if the discussion is empty. The Edge Function requires at least one message to analyse.

4. **Scroll to the bottom** of the Team Chat tab — the `DiscussionAnalysisPanel` appears automatically when messages exist.

5. **Click "Analyse Discussion"** — this calls the Edge Function.

6. **Wait 10–30 seconds** — the AI analysis runs.

7. **Observe the results**: topics, decisions, action items, blockers, sentiment.

8. **Verify database writes** in the Supabase Table Editor:
   - `discussion_analysis` — new row for the discussion
   - `discussion_topics` — one row per identified topic
   - `discussion_decisions` — one row per decision
   - `discussion_action_items` — one row per action item
   - `ai_analysis` — cache row with `analysis_type = 'discussion_analysis'`
   - `audit_logs` — one row with `table_name = 'ai_analysis'`

9. **Click "Analyse Discussion" again** immediately — the result is served from cache (no new OpenAI call). The `AIStatusBadge` shows the cached time.

10. **Check the AI Insights tab** — also shows collective insight, progress, and gap panels.

### What to look for if it fails

| Symptom | Likely cause |
|---------|--------------|
| `"AI service is not configured"` | `GEMINI_API_KEY` secret not set |
| `"Unauthorized"` | User JWT not attached or expired — check Supabase auth |
| `"No messages found"` | Discussion has zero messages — add messages first |
| `"Data fetch error"` | RLS policy blocking the query — check user is a team member |
| `"Rate limit exceeded"` | Called more than 10 times in 1 minute — wait and retry |
| `"AI processing failed: 429"` | Gemini quota exceeded on your account — check Google AI Studio usage |

---

## 11. Security

### What is secured

| Concern | Implementation |
|---------|----------------|
| Gemini key exposure | Key is a Supabase Edge Function secret only. Never in frontend env. Never logged. |
| Unauthorized access | Every Edge Function call verifies the Supabase JWT via `auth.getUser()`. Unauthenticated calls receive 401. |
| Cross-user data access | Source data is fetched using the authenticated user client — RLS is enforced on all reads. |
| Service-role key | Used only for writing to AI result tables and audit_logs inside the Edge Function. Never exposed to the frontend. |
| Rate limiting | 10 calls per user per minute (in-memory, per Edge Function instance). |
| Verified skills protection | The skill writer never updates `is_verified = true` skills. |
| Gap deduplication | Collaboration gap writer checks for existing open gaps before inserting — prevents flooding the table. |
| Audit trail | Every AI invocation writes a row to `audit_logs` (success and failure). The API key is never recorded. |
| Input sanitisation | AI prompts use structured JSON inputs — no raw user string interpolation that could prompt-inject. |
| Document text | Truncated at 6000 chars before sending to OpenAI. Never sent beyond what is needed. |

### What you should additionally do in production

- Restrict the `Access-Control-Allow-Origin` header in `index.ts` from `*` to your actual frontend domain.
- Enable Supabase's built-in rate limiting on Edge Functions if available on your plan.
- Rotate your OpenAI API key periodically.
- Set OpenAI spending limits on your OpenAI account dashboard.
- Review RLS policies in `rls.sql` — ensure staff only see teams they manage.

---

## 12. AI Limitations & Caveats

### General

- All AI results are **estimates**, not authoritative assessments. Display them as "AI-derived" and communicate this to users.
- OpenAI responses can vary even at `temperature: 0.3`. Two identical inputs may produce slightly different outputs.
- The Edge Function captures the AI response as-is. If the model returns an unexpected JSON structure, the writer will throw and the analysis will not be saved. This is intentional — corrupt data is never written.

### Skill Analysis

- A student claiming a skill in their profile does **not** mean it is verified. The AI only elevates `evidence_strength` when portfolio project data supports it.
- `is_verified = true` skills set by staff are **never overwritten** by the AI writer.

### Discussion Analysis

- The AI can only analyse what is in the messages. If team members communicate outside the platform (WhatsApp, email), those discussions are invisible to the analysis.
- Action item `assignee_hint` is inferred from message content and may be wrong. Do not treat it as an assignment — use it as a suggestion only.
- Decisions identified by the AI reflect conversational signals. Verify important decisions independently.

### Contribution Analysis

- Scores (`role_alignment_score`, `quality_score`, `complexity_score`) are evidence-based estimates from task and contribution metadata. They are **not grades** and should not be used for formal assessment without human review.
- If a student has no tasks assigned, the AI has very little data and will return low-confidence results.

### Document Intelligence

- PDF binary files require the frontend to extract and pass text. The current `DocumentAnalysisPanel` automatically extracts `text/*` and `application/json` files only. PDFs need a PDF parsing library (e.g. `pdfjs-dist`) added to the frontend if required.
- Content is truncated at 6000 characters — very long documents will have their tail cut off.

### Team Formation

- Recommendations are based on skills, proficiency level, evidence strength, program, and availability only. Sensitive personal characteristics are never used.
- The candidate pool is capped at 30 students per call. For large cohorts, the pgvector `find_similar_students` function should be used to pre-filter before sending to OpenAI.
- `student_embeddings` must be populated separately (not yet automated in v1 — add an embedding generation step to the team formation prompt if needed).

### Rate Limits

- The in-memory rate limiter (10/min/user) resets per Edge Function **instance**. Supabase may run multiple instances — the effective limit per user could be higher than 10 if requests hit different instances.
- Gemini has its own rate limits. `gemini-1.5-flash` has a generous free tier and paid quota. If you hit 429s frequently, check your Google AI Studio usage dashboard or upgrade your plan.

### Caching

| Analysis Type        | Cache TTL |
|----------------------|-----------|
| `discussion_analysis`| 60 min    |
| `progress_analysis`  | 60 min    |
| `contribution_analysis` | 60 min |
| `collective_insight` | 120 min   |
| `collaboration_gap`  | 120 min   |
| `knowledge_exchange` | 120 min   |
| `collaboration_recommendation` | 120 min |
| `document_intelligence` | 24 h  |
| `skill_analysis`     | 24 h      |
| `team_formation`     | 24 h      |

Cache hits are served instantly and do not call OpenAI. Force-refresh by clicking "Refresh" in any AI panel.

---

*Document generated as part of the START-X AI integration. Last updated: 2026-09-26.*
