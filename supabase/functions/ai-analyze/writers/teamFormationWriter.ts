/**
 * Team Formation Writer
 * Tables: compatibility_analysis, recommendations
 */

import type { WriterContext } from "./index.ts";

export async function writeTeamFormation(
  result: Record<string, unknown>,
  ctx: WriterContext
): Promise<Record<string, unknown>> {
  const db = ctx.supabase as any;

  if (!ctx.teamId) throw new Error("teamFormationWriter: teamId required");

  // ── compatibility_analysis ────────────────────────────────────────────────
  const score =
    typeof result.compatibility_score === "number"
      ? Math.min(100, Math.max(0, result.compatibility_score))
      : null;

  const { data: analysis, error: aErr } = await db
    .from("compatibility_analysis")
    .insert({
      team_id: ctx.teamId,
      required_skills: Array.isArray(result.required_skills) ? result.required_skills : [],
      covered_skills: Array.isArray(result.covered_skills) ? result.covered_skills : [],
      missing_skills: Array.isArray(result.missing_skills) ? result.missing_skills : [],
      compatibility_score: score,
      ai_reasoning: {
        approach: result.ai_reasoning?.approach ?? null,
        key_factors: result.ai_reasoning?.key_factors ?? [],
        recommended_students: result.recommended_students ?? [],
        unfilled_roles: result.unfilled_roles ?? [],
        confidence: result.confidence ?? null,
      },
    })
    .select()
    .single();

  if (aErr) throw new Error(`compatibility_analysis insert failed: ${aErr.message}`);

  // ── recommendations (student-level) ──────────────────────────────────────
  const recommended = Array.isArray(result.recommended_students)
    ? (result.recommended_students as Array<Record<string, unknown>>)
    : [];

  // We need a requester_id — use teamId context; but recommendations table requires student_id.
  // If the caller provided a studentId (the team leader or the requesting student), use that.
  const requesterId = ctx.studentId ?? null;
  const insertedRecs: string[] = [];

  if (requesterId) {
    for (const rec of recommended) {
      if (!rec.student_id || rec.student_id === requesterId) continue;

      const { data: inserted, error } = await db
        .from("recommendations")
        .upsert(
          {
            requester_id: requesterId,
            recommended_student_id: rec.student_id,
            match_score:
              typeof rec.match_score === "number"
                ? Math.min(100, Math.max(0, rec.match_score))
                : null,
            match_reasons: Array.isArray(rec.match_reasons) ? rec.match_reasons : [],
            context: {
              team_id: ctx.teamId,
              matched_skills: rec.matched_skills ?? [],
              potential_gaps: rec.potential_gaps ?? [],
              reason: rec.reason ?? null,
            },
            is_dismissed: false,
          },
          { onConflict: "requester_id,recommended_student_id" }
        )
        .select("recommendation_id")
        .single();

      if (error) {
        console.error("recommendations upsert error (non-fatal):", error.message);
        continue;
      }
      insertedRecs.push(inserted.recommendation_id);
    }
  }

  return {
    analysis_id: analysis.analysis_id,
    compatibility_score: score,
    recommendations_inserted: insertedRecs.length,
    team_id: ctx.teamId,
  };
}
