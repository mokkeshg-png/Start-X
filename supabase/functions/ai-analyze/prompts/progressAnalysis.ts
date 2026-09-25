/**
 * MODULE 7 — Task & Progress Analysis
 *
 * Reads: tasks, progress_snapshots, team_requirements
 * Writes (via writers): progress_snapshots, progress_timeline
 *
 * SQL/application code handles percentage maths.
 * OpenAI is used for interpretation: blockers, dependencies, risk patterns.
 */

import type { PromptContext, PromptResult } from "./index.ts";

export async function buildProgressPrompt(ctx: PromptContext): Promise<PromptResult> {
  const supabase = ctx.supabase as any;

  if (!ctx.teamId) throw new Error("progress_analysis requires teamId");

  // ── Fetch tasks ───────────────────────────────────────────────────────────
  const { data: tasks, error: taskErr } = await supabase
    .from("tasks")
    .select("task_id, title, description, status, priority, due_date, completed_at, tags, parent_task_id, assigned_to")
    .eq("team_id", ctx.teamId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (taskErr) throw new Error(`tasks query failed: ${taskErr.message}`);

  // ── Compute metrics in application code (not asking OpenAI for maths) ────
  const total = tasks?.length ?? 0;
  const completed = tasks?.filter((t: any) => t.status === "done").length ?? 0;
  const inProgress = tasks?.filter((t: any) => t.status === "in_progress").length ?? 0;
  const blocked = tasks?.filter((t: any) => t.status === "blocked").length ?? 0;
  const todo = tasks?.filter((t: any) => t.status === "todo").length ?? 0;
  const overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

  // ── Requirements ──────────────────────────────────────────────────────────
  const { data: requirements } = await supabase
    .from("team_requirements")
    .select("requirement, category, priority, is_met")
    .eq("team_id", ctx.teamId);

  // ── Most recent snapshot ──────────────────────────────────────────────────
  const { data: lastSnapshot } = await supabase
    .from("progress_snapshots")
    .select("overall_progress, tasks_total, tasks_completed, health_score, snapped_at")
    .eq("team_id", ctx.teamId)
    .order("snapped_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const systemPrompt = `You are an expert project health analyst for a college team project platform.
The percentage calculations have already been done. Your job is to interpret patterns.
Return ONLY valid JSON:
{
  "overall_progress": <pass through the computed_progress value>,
  "completed_work": ["string (task title or description)"],
  "active_work": ["string"],
  "blocked_work": ["string"],
  "dependencies": ["string (which task blocks which)"],
  "risks": ["string"],
  "health_score": 0-100,
  "notes": "string",
  "next_actions": ["string (prioritised, concrete)"],
  "summary": "string (2-3 sentences)",
  "confidence": 0.0-1.0
}

Rules:
- overall_progress must equal the computed_progress value I provide — do NOT recalculate it.
- health_score: factor in blocked tasks, overdue tasks, and velocity vs last snapshot.
- Identify actual blockers from task descriptions, not from the word "blocked" alone.
- next_actions should be specific and prioritised.`;

  const userMessage = `Team ID: ${ctx.teamId}
Computed progress: ${overallProgress}%
Tasks: total=${total}, done=${completed}, in_progress=${inProgress}, blocked=${blocked}, todo=${todo}
Previous snapshot: ${lastSnapshot ? `progress=${lastSnapshot.overall_progress}%, health=${lastSnapshot.health_score}, at=${lastSnapshot.snapped_at}` : "none"}

Requirements (${requirements?.length ?? 0}):
${JSON.stringify(requirements ?? [], null, 2)}

Task details:
${JSON.stringify(tasks ?? [], null, 2)}`;

  return { systemPrompt, userMessage };
}
