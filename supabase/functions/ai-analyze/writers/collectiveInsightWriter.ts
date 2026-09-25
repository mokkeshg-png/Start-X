/**
 * Collective Insight Writer
 * Tables: collective_insights, team_summaries
 */

import type { WriterContext } from "./index.ts";

export async function writeCollectiveInsight(
  result: Record<string, unknown>,
  ctx: WriterContext
): Promise<Record<string, unknown>> {
  const db = ctx.supabase as any;

  if (!ctx.teamId) throw new Error("collectiveInsightWriter: teamId required");

  // ── collective_insights ────────────────────────────────────────────────────
  const { data: insight, error: iErr } = await db
    .from("collective_insights")
    .insert({
      team_id: ctx.teamId,
      insight_type: "project_summary",
      title: `AI Project Summary — ${new Date().toLocaleDateString()}`,
      content: typeof result.summary === "string" ? result.summary : "AI analysis completed.",
      data: {
        project_status: result.project_status ?? "unknown",
        major_progress: result.major_progress ?? [],
        important_decisions: result.important_decisions ?? [],
        current_blockers: result.current_blockers ?? [],
        team_strengths: result.team_strengths ?? [],
        risks: result.risks ?? [],
        next_steps: result.next_steps ?? [],
      },
      confidence: typeof result.confidence === "number" ? result.confidence : null,
      is_actioned: false,
    })
    .select()
    .single();

  if (iErr) throw new Error(`collective_insights insert failed: ${iErr.message}`);

  // ── team_summaries (weekly) ────────────────────────────────────────────────
  const now = new Date();
  const periodStart = getWeekStart(now);
  const periodEnd = getWeekEnd(now);

  const { data: summary, error: sErr } = await db
    .from("team_summaries")
    .insert({
      team_id: ctx.teamId,
      summary_type: "weekly",
      period_start: periodStart,
      period_end: periodEnd,
      content: typeof result.summary === "string" ? result.summary : "Weekly summary generated.",
      highlights: Array.isArray(result.major_progress) ? result.major_progress : [],
      risks: Array.isArray(result.risks) ? result.risks : [],
      recommendations: Array.isArray(result.next_steps) ? result.next_steps : [],
      ai_metadata: {
        project_status: result.project_status ?? null,
        confidence: result.confidence ?? null,
      },
    })
    .select()
    .single();

  if (sErr) {
    // Non-fatal: insight was written
    console.error("team_summaries insert failed (non-fatal):", sErr.message);
  }

  return {
    insight_id: insight.insight_id,
    summary_id: summary?.summary_id ?? null,
    team_id: ctx.teamId,
  };
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function getWeekEnd(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}
