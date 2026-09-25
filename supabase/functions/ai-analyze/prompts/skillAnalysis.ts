/**
 * MODULE 1 — Student Profile & Skill Analysis
 *
 * Reads: students, student_profiles, skills, projects, skill_evidence_map
 * Writes (via writers): skills (evidence_strength update), skill_evidence_map
 */

import type { PromptContext, PromptResult } from "./index.ts";

export async function buildSkillAnalysisPrompt(ctx: PromptContext): Promise<PromptResult> {
  const supabase = ctx.supabase as any;

  if (!ctx.studentId) throw new Error("skill_analysis requires studentId");

  // ── Student record ────────────────────────────────────────────────────────
  const { data: student, error: stdErr } = await supabase
    .from("students")
    .select("student_id, program, year_of_study, enrollment_year")
    .eq("student_id", ctx.studentId)
    .single();

  if (stdErr) throw new Error(`Student not found: ${stdErr.message}`);

  // ── Profile ────────────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("student_profiles")
    .select("profile_id, github_url, linkedin_url, portfolio_url, bio, availability")
    .eq("student_id", ctx.studentId)
    .maybeSingle();

  // ── Claimed skills ─────────────────────────────────────────────────────────
  const profileId = profile?.profile_id;
  let skills: any[] = [];
  if (profileId) {
    const { data } = await supabase
      .from("skills")
      .select("skill_id, skill_name, category, proficiency_level, is_verified, evidence_strength")
      .eq("profile_id", profileId);
    skills = data ?? [];
  }

  // ── Portfolio projects ────────────────────────────────────────────────────
  let projects: any[] = [];
  if (profileId) {
    const { data } = await supabase
      .from("projects")
      .select("project_id, project_name, description, technologies, repository_url, demo_url, submitted_at")
      .eq("profile_id", profileId)
      .limit(10);
    projects = data ?? [];
  }

  // ── Existing skill evidence ────────────────────────────────────────────────
  const skillIds = skills.map((s: any) => s.skill_id);
  let evidenceMap: any[] = [];
  if (skillIds.length > 0) {
    const { data } = await supabase
      .from("skill_evidence_map")
      .select("skill_id, project_id, evidence_type, evidence_strength, analysis_notes")
      .in("skill_id", skillIds);
    evidenceMap = data ?? [];
  }

  const systemPrompt = `You are a skill verification analyst for a college project platform.
Analyse a student's claimed skills against evidence from their portfolio projects.
A claimed skill is NOT verified unless there is supporting project evidence.
Return ONLY valid JSON:
{
  "skills": [
    {
      "skill_id": "string (from claimed skills list, or null if new)",
      "skill_name": "string",
      "proficiency_level": "beginner|intermediate|advanced|expert",
      "is_demonstrated": true/false,
      "evidence_strength": 0.0-1.0,
      "evidence_source": "string (project name or 'no evidence')",
      "analysis_notes": "string"
    }
  ],
  "skill_evidence_map": [
    {
      "skill_id": "string",
      "project_id": "string",
      "evidence_type": "string (e.g. repository, description, demo)",
      "evidence_strength": 0.0-1.0,
      "analysis_notes": "string"
    }
  ],
  "strengths": ["string"],
  "missing_evidence": ["string (claimed skills with no project support)"],
  "summary": "string (2-3 sentences)",
  "confidence": 0.0-1.0
}

Rules:
- is_demonstrated = true ONLY when a portfolio project contains clear evidence of that skill.
- evidence_strength: 1.0 = repository + demo + detailed description; 0.2 = mentioned once.
- DO NOT automatically trust claimed proficiency_level — assess from project evidence.
- Include only skills where project_id maps to a real project in the provided list.
- skill_evidence_map entries must reference real skill_id and project_id values from the input.`;

  const userMessage = `Student: ${ctx.studentId}
Program: ${student.program ?? "unknown"}
Year: ${student.year_of_study ?? "unknown"}
Bio: ${profile?.bio ?? "none"}
GitHub: ${profile?.github_url ?? "none"}
LinkedIn: ${profile?.linkedin_url ?? "none"}
Portfolio: ${profile?.portfolio_url ?? "none"}

Claimed skills (${skills.length}):
${JSON.stringify(skills, null, 2)}

Portfolio projects (${projects.length}):
${JSON.stringify(projects, null, 2)}

Existing skill evidence (${evidenceMap.length}):
${JSON.stringify(evidenceMap, null, 2)}`;

  return { systemPrompt, userMessage };
}
