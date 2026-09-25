/**
 * Recommendation Writer
 * Tables: gap_recommendations, recommendations
 */

import type { WriterContext } from "./index.ts";

const VALID_PRIORITY = new Set(["low", "medium", "high", "critical"]);
const VALID_GAP_TABLE = new Set(["collaboration_gaps", "dependency_gaps"]);

export async function writeRecommendations(
  result: Record<string, unknown>,
  ctx: WriterContext
): Promise<Record<string, unknown>> {
  const db = ctx.supabase as any;

  if (!ctx.teamId) throw new Error("recommendationWriter: teamId required");

  const gapRecsInserted: string[] = [];
  const studentRecsInserted: string[] = [];

  // ── gap_recommendations ───────────────────────────────────────────────────
  const gapRecs = Array.isArray(result.gap_recommendations)
    ? (result.gap_recommendations as Array<Record<string, unknown>>)
    : [];

  for (const rec of gapRecs) {
    if (!rec.recommendation) continue;

    const priority = VALID_PRIORITY.has(rec.priority as string)
      ? (rec.priority as string)
      : "medium";

    const gapTable = VALID_GAP_TABLE.has(rec.gap_table as string)
      ? (rec.gap_table as string)
      : "collaboration_gaps";

    const { data: inserted, error } = await db
      .from("gap_recommendations")
      .insert({
        gap_id: rec.gap_id ?? "00000000-0000-0000-0000-000000000000",
        gap_table: gapTable,
        team_id: ctx.teamId,
        recommendation: rec.recommendation,
        action_type: rec.action_type ?? null,
        priority,
        is_actioned: false,
      })
      .select("recommendation_id")
      .single();

    if (error) {
      console.error("gap_recommendations insert error (non-fatal):", error.message);
      continue;
    }
    gapRecsInserted.push(inserted.recommendation_id);
  }

  // ── recommendations (student-to-student) ──────────────────────────────────
  const studentRecs = Array.isArray(result.student_recommendations)
    ? (result.student_recommendations as Array<Record<string, unknown>>)
    : [];

  for (const rec of studentRecs) {
    // Skip if no target student or no requester (team context only)
    if (!rec.recommended_student_id || !ctx.studentId) continue;
    if (rec.recommended_student_id === ctx.studentId) continue;

    const { data: inserted, error } = await db
      .from("recommendations")
      .upsert(
        {
          requester_id: ctx.studentId,
          recommended_student_id: rec.recommended_student_id,
          match_score: typeof rec.match_score === "number"
            ? Math.min(100, Math.max(0, rec.match_score))
            : null,
          match_reasons: Array.isArray(rec.match_reasons) ? rec.match_reasons : [],
          context: typeof rec.context === "object" ? rec.context : {},
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
    studentRecsInserted.push(inserted.recommendation_id);
  }

  return {
    gap_recommendations_inserted: gapRecsInserted.length,
    student_recommendations_inserted: studentRecsInserted.length,
    team_id: ctx.teamId,
  };
}
