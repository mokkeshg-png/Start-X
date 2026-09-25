/**
 * MODULE 8 — Collective Insight Generation
 *
 * Reads: teams, tasks, discussion_analysis (latest), document_analysis (latest),
 *        progress_snapshots (latest), collaboration_gaps (open), contributions
 * Writes (via writers): collective_insights, team_summaries
 */

import type { PromptContext, PromptResult } from "./index.ts";

export async function buildCollectiveInsightPrompt(ctx: PromptContext): Promise<PromptResult> {
  const supabase = ctx.supabase as any;

  if (!ctx.teamId) throw new Error("collective_insight requires teamId");

  // ── Team ──────────────────────────────────────────────────────────────────
  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .select("team_id, team_name, problem_statement, description, status, created_at")
    .eq("team_id", ctx.teamId)
    .single();

  if (teamErr) throw new Error(`Team not found: ${teamErr.message}`);

  // ── Tasks summary ──────────────────────────────────────────────────────────
  const { data: tasks } = await supabase
    .from("tasks")
    .select("title, status, priority, due_date")
    .eq("team_id", ctx.teamId)
    .limit(80);

  const total = tasks?.length ?? 0;
  const done = tasks?.filter((t: any) => t.status === "done").length ?? 0;
  const blocked = tasks?.filter((t: any) => t.status === "blocked").length ?? 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  // ── Latest progress snapshot ───────────────────────────────────────────────
  const { data: snapshot } = await supabase
    .from("progress_snapshots")
    .select("overall_progress, health_score, notes, snapped_at")
    .eq("team_id", ctx.teamId)
    .order("snapped_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // ── Latest discussion analysis ─────────────────────────────────────────────
  const { data: discAnalysis } = await supabase
    .from("discussion_analysis")
    .select("topics, decisions, action_items, analyzed_at")
    .in(
      "discussion_id",
      (
        await supabase
          .from("discussions")
          .select("discussion_id")
          .eq("team_id", ctx.teamId)
      ).data?.map((d: any) => d.discussion_id) ?? []
    )
    .order("analyzed_at", { ascending: false })
    .limit(3);

  // ── Open collaboration gaps ────────────────────────────────────────────────
  const { data: gaps } = await supabase
    .from("collaboration_gaps")
    .select("gap_type, title, severity, description")
    .eq("team_id", ctx.teamId)
    .eq("is_resolved", false)
    .limit(10);

  // ── Recent contributions ───────────────────────────────────────────────────
  const { data: contributions } = await supabase
    .from("contributions")
    .select("contribution_type, title, submitted_at")
    .eq("team_id", ctx.teamId)
    .order("submitted_at", { ascending: false })
    .limit(20);

  const systemPrompt = `You are a senior project intelligence analyst for a college project monitoring platform.
Combine all available data into a high-level project summary for staff and team members.
Return ONLY valid JSON:
{
  "project_status": "on_track|at_risk|blocked|completed",
  "major_progress": ["string"],
  "important_decisions": ["string"],
  "current_blockers": ["string"],
  "team_strengths": ["string"],
  "risks": ["string"],
  "next_steps": ["string (prioritised)"],
  "summary": "string (3-5 sentences, suitable for a dashboard card)",
  "confidence": 0.0-1.0
}

Rules:
- project_status must be one of the four enum values.
- Base every item on the supplied data — do not hallucinate.
- If data is sparse, reflect that in confidence and note it in the summary.
- Avoid repeating the same point in multiple arrays.`;

  const userMessage = `Team: "${team.team_name}"
Problem: ${team.problem_statement ?? "not specified"}
Status: ${team.status}
Created: ${team.created_at}

Progress: ${progress}% (${done}/${total} tasks done, ${blocked} blocked)
Latest health score: ${snapshot?.health_score ?? "none"}
Latest snapshot: ${snapshot?.snapped_at ?? "never"}

Open collaboration gaps (${gaps?.length ?? 0}):
${JSON.stringify(gaps ?? [], null, 2)}

Recent contributions (${contributions?.length ?? 0}):
${JSON.stringify(contributions ?? [], null, 2)}

Latest discussion analyses (${discAnalysis?.length ?? 0}):
${JSON.stringify(discAnalysis ?? [], null, 2)}`;

  return { systemPrompt, userMessage };
}
