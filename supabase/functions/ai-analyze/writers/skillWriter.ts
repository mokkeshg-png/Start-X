/**
 * Skill Analysis Writer
 * Tables: skills (update evidence_strength), skill_evidence_map
 *
 * IMPORTANT: Does NOT overwrite is_verified=true skills without explicit authorization.
 */

import type { WriterContext } from "./index.ts";

const VALID_PROFICIENCY = new Set(["beginner", "intermediate", "advanced", "expert"]);

export async function writeSkillAnalysis(
  result: Record<string, unknown>,
  ctx: WriterContext
): Promise<Record<string, unknown>> {
  const db = ctx.supabase as any;

  if (!ctx.studentId) throw new Error("skillWriter: studentId required");

  const skills = Array.isArray(result.skills)
    ? (result.skills as Array<Record<string, unknown>>)
    : [];

  const evidenceMap = Array.isArray(result.skill_evidence_map)
    ? (result.skill_evidence_map as Array<Record<string, unknown>>)
    : [];

  const updatedSkills: string[] = [];
  const insertedEvidence: string[] = [];

  // ── Update skills evidence_strength (never overwrite verified skills) ──────
  for (const skill of skills) {
    if (!skill.skill_id || typeof skill.skill_id !== "string") continue;

    const evidenceStrength =
      typeof skill.evidence_strength === "number"
        ? Math.min(1.0, Math.max(0.0, skill.evidence_strength))
        : null;

    if (evidenceStrength === null) continue;

    // Fetch current skill to check is_verified
    const { data: existing } = await db
      .from("skills")
      .select("skill_id, is_verified, evidence_strength")
      .eq("skill_id", skill.skill_id)
      .maybeSingle();

    if (!existing) continue;
    if (existing.is_verified) continue; // Do not overwrite manually verified skills

    const proficiency = VALID_PROFICIENCY.has(skill.proficiency_level as string)
      ? (skill.proficiency_level as string)
      : undefined;

    const updateData: Record<string, unknown> = { evidence_strength: evidenceStrength };
    if (proficiency) updateData.proficiency_level = proficiency;

    const { error } = await db
      .from("skills")
      .update(updateData)
      .eq("skill_id", skill.skill_id);

    if (error) {
      console.error("skills update error (non-fatal):", error.message);
      continue;
    }
    updatedSkills.push(skill.skill_id as string);
  }

  // ── Upsert skill_evidence_map ──────────────────────────────────────────────
  for (const entry of evidenceMap) {
    if (!entry.skill_id || !entry.project_id) continue;

    const evidenceStrength =
      typeof entry.evidence_strength === "number"
        ? Math.min(1.0, Math.max(0.0, entry.evidence_strength))
        : 0.5;

    const { data: inserted, error } = await db
      .from("skill_evidence_map")
      .upsert(
        {
          skill_id: entry.skill_id,
          project_id: entry.project_id,
          evidence_type: entry.evidence_type ?? "ai_analysis",
          evidence_strength: evidenceStrength,
          analysis_notes: entry.analysis_notes ?? null,
        },
        { onConflict: "skill_id,project_id" }
      )
      .select("mapping_id")
      .single();

    if (error) {
      console.error("skill_evidence_map upsert error (non-fatal):", error.message);
      continue;
    }
    insertedEvidence.push(inserted.mapping_id);
  }

  return {
    skills_updated: updatedSkills.length,
    evidence_entries_written: insertedEvidence.length,
    student_id: ctx.studentId,
  };
}
