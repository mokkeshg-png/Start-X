/**
 * Contribution Analysis Writer
 * Tables: contribution_analysis, contribution_timeline
 */

import type { WriterContext } from "./index.ts";

export async function writeContributionAnalysis(
  result: Record<string, unknown>,
  ctx: WriterContext
): Promise<Record<string, unknown>> {
  const db = ctx.supabase as any;

  if (!ctx.contributionId && !ctx.studentId) {
    throw new Error("contributionWriter: contributionId or studentId required");
  }

  // Resolve contributionId: if not passed, find the most recent one for this student/team
  let contributionId = ctx.contributionId;

  if (!contributionId && ctx.studentId && ctx.teamId) {
    const { data: latest } = await db
      .from("contributions")
      .select("contribution_id")
      .eq("team_id", ctx.teamId)
      .eq("student_id", ctx.studentId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    contributionId = latest?.contribution_id ?? null;
  }

  if (!contributionId) {
    // No contribution record to attach to — still return gracefully
    return { message: "No contribution record found; analysis not persisted to contribution_analysis" };
  }

  // ── contribution_analysis ─────────────────────────────────────────────────
  const { data: analysis, error: aErr } = await db
    .from("contribution_analysis")
    .insert({
      contribution_id: contributionId,
      role_alignment_score: typeof result.role_alignment_score === "number"
        ? Math.min(100, Math.max(0, result.role_alignment_score))
        : null,
      quality_score: typeof result.quality_score === "number"
        ? Math.min(100, Math.max(0, result.quality_score))
        : null,
      complexity_score: typeof result.complexity_score === "number"
        ? Math.min(100, Math.max(0, result.complexity_score))
        : null,
      analysis_notes: typeof result.summary === "string" ? result.summary : null,
      ai_metadata: {
        completed_responsibilities: result.completed_responsibilities ?? [],
        incomplete_responsibilities: result.incomplete_responsibilities ?? [],
        evidence: result.evidence ?? [],
        blockers: result.blockers ?? [],
        next_action: result.next_action ?? null,
        collaboration_notes: result.collaboration_notes ?? null,
        confidence: result.confidence ?? null,
      },
    })
    .select()
    .single();

  if (aErr) throw new Error(`contribution_analysis insert failed: ${aErr.message}`);

  // ── contribution_timeline (weekly record) ──────────────────────────────────
  if (ctx.studentId && ctx.teamId) {
    const now = new Date();
    const weekNumber = getISOWeek(now);
    const year = now.getFullYear();

    // Derive activity_level from quality_score
    const qualityScore = typeof result.quality_score === "number" ? result.quality_score : 0;
    const activityLevel =
      qualityScore >= 80 ? "very_high"
      : qualityScore >= 60 ? "high"
      : qualityScore >= 40 ? "medium"
      : qualityScore >= 20 ? "low"
      : "none";

    await db.from("contribution_timeline").upsert(
      {
        student_id: ctx.studentId,
        team_id: ctx.teamId,
        week_number: weekNumber,
        year,
        activity_level: activityLevel,
        contribution_count: 1,
        contribution_score: qualityScore,
        trend: "stable",
      },
      { onConflict: "student_id,team_id,week_number,year" }
    );
  }

  return { analysis_id: analysis.analysis_id, contribution_id: contributionId };
}

function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
