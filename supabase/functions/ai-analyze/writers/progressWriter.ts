/**
 * Progress Analysis Writer
 * Tables: progress_snapshots, progress_timeline
 */

import type { WriterContext } from "./index.ts";

export async function writeProgressAnalysis(
  result: Record<string, unknown>,
  ctx: WriterContext
): Promise<Record<string, unknown>> {
  const db = ctx.supabase as any;

  if (!ctx.teamId) throw new Error("progressWriter: teamId required");

  const overallProgress =
    typeof result.overall_progress === "number"
      ? Math.min(100, Math.max(0, result.overall_progress))
      : 0;

  const healthScore =
    typeof result.health_score === "number"
      ? Math.min(100, Math.max(0, result.health_score))
      : null;

  // ── progress_snapshots ────────────────────────────────────────────────────
  const { data: snapshot, error: sErr } = await db
    .from("progress_snapshots")
    .insert({
      team_id: ctx.teamId,
      overall_progress: overallProgress,
      tasks_total: 0,  // Computed by application; AI doesn't count
      tasks_completed: 0,
      tasks_in_progress: 0,
      tasks_blocked: 0,
      health_score: healthScore,
      notes: typeof result.summary === "string" ? result.summary : null,
      metadata: {
        completed_work: result.completed_work ?? [],
        active_work: result.active_work ?? [],
        blocked_work: result.blocked_work ?? [],
        dependencies: result.dependencies ?? [],
        risks: result.risks ?? [],
        next_actions: result.next_actions ?? [],
        confidence: result.confidence ?? null,
      },
    })
    .select()
    .single();

  if (sErr) throw new Error(`progress_snapshots insert failed: ${sErr.message}`);

  // ── progress_timeline (weekly) ─────────────────────────────────────────────
  const now = new Date();
  const weekNumber = getISOWeek(now);
  const year = now.getFullYear();

  await db.from("progress_timeline").upsert(
    {
      team_id: ctx.teamId,
      week_number: weekNumber,
      year,
      progress_score: overallProgress,
      velocity: null,
      trend: "stable",
      milestones_hit: [],
    },
    { onConflict: "team_id,week_number,year" }
  );

  return { snapshot_id: snapshot.snapshot_id, team_id: ctx.teamId };
}

function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
