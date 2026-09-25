# Start-X AI Integration Architecture

This document outlines the architecture, configuration, and security model for the Start-X AI intelligence layer.

## Objective
Provide deep, personalized AI-driven insights for students, teachers, and coordinators without exposing secrets to the client, while maintaining the application's existing UI and Java backend.

## Architecture Pattern
**Frontend -> Supabase Edge Function -> OpenAI API -> Supabase DB -> Frontend**

1. **Frontend Request**: The React frontend (`src/services/aiAnalysisService.ts`) requests an analysis via the `supabase.functions.invoke('ai-analyze', ...)` method.
2. **Authentication Check**: The Edge Function (`supabase/functions/ai-analyze/index.ts`) verifies the user's JWT automatically provided by the Supabase client.
3. **Data Fetching (RLS)**: The Edge Function fetches the necessary contextual data (profiles, projects, messages) from Supabase on behalf of the user using their authenticated token, ensuring Row Level Security (RLS) is respected.
4. **Prompt Engineering**: The Edge Function compiles the data and selects the correct system prompt (`prompts.ts`) for the specified analysis type (e.g., `skill_analysis`, `team_formation`).
5. **OpenAI Call**: The Edge Function securely communicates with the OpenAI API using the server-side `OPENAI_API_KEY`.
6. **Data Persistence (Service Role)**: The Edge Function bypasses RLS using the `SUPABASE_SERVICE_ROLE_KEY` to insert the resulting analysis into the `ai_analysis` database table.
7. **Frontend Render**: The frontend receives the response or fetches it from the cache (`ai_analysis` table) and displays it using the reusable `AIInsightsPanel.tsx` component.

## Database Schema
The `ai_analysis` table stores the generated insights.

- `id`: UUID (Primary Key)
- `analysis_type`: String (e.g., 'skill_analysis', 'team_formation')
- `project_id`: UUID (Optional, links to `projects`)
- `team_id`: UUID (Optional, links to `teams`)
- `student_id`: UUID (Optional, links to `public_users`)
- `input_reference`: String (Optional, hash or identifier of input data)
- `result_json`: JSONB (The structured AI response)
- `created_at`: Timestamp

**RLS Policies on `ai_analysis`**:
- **Read**: Users can read analyses relevant to them (e.g., matching `student_id`, or if they belong to the `team_id` or `project_id`).
- **Write**: Only the Service Role (Edge Function) can insert or update rows.

## Supported Analysis Types
1. `skill_analysis`: Evaluates a student's skills and suggests improvements.
2. `team_formation`: Suggests optimal team formations for coordinators based on student profiles.
3. `discussion_analysis`: Summarizes team chat and identifies action items.
4. `contribution_analysis`: Assesses the quality and impact of student work submissions.
5. `knowledge_exchange`: Identifies peer learning opportunities within a team.
6. `document_intelligence`: Analyzes PRDs to extract key requirements and suggest technical stacks.
7. `progress_analysis`: Evaluates project velocity and predicts potential blockers.
8. `collective_insight`: Synthesizes overall project health and team dynamics.
9. `collaboration_gap`: Identifies missing skills or communication silos within a team.
10. `collaboration_recommendation`: Provides actionable advice to improve team performance.

## Security & Configuration
- **No Client-Side Secrets**: The `OPENAI_API_KEY` is NEVER exposed to the React frontend or checked into version control. It must be set as an environment variable in the Supabase project configuration (`.env`).
- **Edge Function Security**: The Edge Function acts as a secure proxy, enforcing authentication and structuring the request before communicating with OpenAI.
- **Data Privacy**: The Edge Function only accesses data the requesting user is authorized to see (via RLS).

### Setup Instructions
1. Deploy the Supabase Edge Function:
   ```bash
   supabase functions deploy ai-analyze
   ```
2. Set the OpenAI API key securely in Supabase:
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-...
   ```
3. Update local `.env` for local testing (Do not use `VITE_` prefix for OpenAI keys):
   ```
   OPENAI_API_KEY=sk-...
   ```
