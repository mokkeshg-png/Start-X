/**
 * MODULE 2 — AI Team Formation
 *
 * Reads: teams, team_requirements, team_roles, students (candidate pool),
 *        student_profiles, skills, skill_evidence_map (for evidence quality)
 * Writes (via writers): compatibility_analysis, recommendations
 *
 * NOTE: We cap the candidate pool at 30 students to keep token usage safe.
 * Use embeddings (Phase 11) for large pools — fetch top candidates first.
 */

import type { PromptContext, PromptResult } from "./index.ts";

export async function buildTeamFormationPrompt(ctx: PromptContext): Promise<PromptResult> {
  const supabase = ctx.supabase as any;

  if (!ctx.teamId) throw new Error("team_formation requires teamId");

  // ── Team info ──────────────────────────────────────────────────────────────
  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .select("team_id, team_name, problem_statement, description, max_members")
    .eq("team_id", ctx.teamId)
    .single();

  if (teamErr) throw new Error(`Team not found: ${teamErr.message}`);

  // ── Required roles ─────────────────────────────────────────────────────────
  const { data: roles } = await supabase
    .from("team_roles")
    .select("role_id, role_name, description, required_skills, is_filled")
    .eq("team_id", ctx.teamId);

  // ── Requirements ──────────────────────────────────────────────────────────
  const { data: requirements } = await supabase
    .from("team_requirements")
    .select("requirement, category, priority")
    .eq("team_id", ctx.teamId);

  // ── Current members (exclude from candidates) ─────────────────────────────
  const { data: currentMembers } = await supabase
    .from("team_members")
    .select("student_id")
    .eq("team_id", ctx.teamId)
    .eq("is_active", true);

  const currentMemberIds = (currentMembers ?? []).map((m: any) => m.student_id);

  // ── Candidate pool: students with profiles + skills ────────────────────────
  // We fetch all active students and let OpenAI narrow to top matches.
  // For large universities, implement pgvector pre-filtering here.
  const { data: candidates } = await supabase
    .from("students")
    .select(`
      student_id,
      program,
      year_of_study,
      student_profiles (
        profile_id,
        bio,
        availability,
        looking_for_team,
        skills (skill_name, proficiency_level, evidence_strength, is_verified)
      )
    `)
    .eq("is_active", true)
    .not("student_id", "in", `(${currentMemberIds.join(",") || "null"})`)
    .limit(30);

  const systemPrompt = `You are a team formation AI for a college project platform.
Match students to unfilled team roles based on project requirements and demonstrated skills.
DO NOT use gender, ethnicity, age, or any personal characteristics — only project-relevant data.
Return ONLY valid JSON:
{
  "required_skills": ["string"],
  "covered_skills": ["string (skills already covered by current members)"],
  "missing_skills": ["string"],
  "compatibility_score": 0-100,
  "ai_reasoning": {
    "approach": "string",
    "key_factors": ["string"]
  },
  "recommended_students": [
    {
      "student_id": "string",
      "matched_skills": ["string"],
      "potential_gaps": ["string"],
      "reason": "string",
      "match_score": 0-100,
      "match_reasons": ["string"]
    }
  ],
  "unfilled_roles": ["string (role names still needing a person)"],
  "summary": "string (2-3 sentences)",
  "confidence": 0.0-1.0
}

Rules:
- Return top 3-5 candidate recommendations only.
- Match only on: skills, proficiency_level, evidence_strength, program, availability.
- Prefer students with is_verified=true skills and higher evidence_strength.
- Prefer students with looking_for_team=true.
- If the pool is small, note this in the summary and reduce confidence.
- compatibility_score reflects how well current + recommended members cover requirements.`;

  const userMessage = `Team: "${team.team_name}"
Problem: ${team.problem_statement ?? "not specified"}
Max members: ${team.max_members}

Unfilled roles (${(roles ?? []).filter((r: any) => !r.is_filled).length}):
${JSON.stringify((roles ?? []).filter((r: any) => !r.is_filled), null, 2)}

Requirements:
${JSON.stringify(requirements ?? [], null, 2)}

Candidate students (${candidates?.length ?? 0}):
${JSON.stringify(candidates ?? [], null, 2)}`;

  return { systemPrompt, userMessage };
}
