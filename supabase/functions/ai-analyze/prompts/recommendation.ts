/**
 * MODULE 10 — AI Collaboration Recommendations
 *
 * Reads: collaboration_gaps, dependency_gaps, discussion_analysis,
 *        progress_snapshots, contribution_analysis, knowledge_exchanges
 * Writes (via writers): gap_recommendations, recommendations
 */

import type { PromptContext, PromptResult } from "./index.ts";

export async function buildRecommendationPrompt(ctx: PromptContext): Promise<PromptResult> {
  const supabase = ctx.supabase as any;

  if (!ctx.teamId) throw new Error("collaboration_recommendation requires teamId");

  // ── Open collaboration gaps ────────────────────────────────────────────────
  const { data: collabGaps } = await supabase
    .from("collaboration_gaps")
    .select("gap_id, gap_type, title, severity, description")
    .eq("team_id", ctx.teamId)
    .eq("is_resolved", false)
    .limit(20);

  // ── Open dependency gaps ──────────────────────────────────────────────────
  const { data: depGaps } = await supabase
    .from("dependency_gaps")
    .select("gap_id, gap_type, title, severity, description")
    .eq("team_id", ctx.teamId)
    .eq("is_resolved", false)
    .limit(20);

  // ── Latest progress snapshot ───────────────────────────────────────────────
  const { data: snapshot } = await supabase
    .from("progress_snapshots")
    .select("overall_progress, health_score, notes")
    .eq("team_id", ctx.teamId)
    .order("snapped_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // ── Knowledge exchanges ────────────────────────────────────────────────────
  const { data: knowledge } = await supabase
    .from("knowledge_exchanges")
    .select("from_student_id, to_student_id, topic, exchange_type, occurred_at")
    .eq("team_id", ctx.teamId)
    .order("occurred_at", { ascending: false })
    .limit(20);

  const systemPrompt = `You are a project advisor AI for a college project collaboration platform.
Generate specific, actionable recommendations based on detected gaps and project state.
Return ONLY valid JSON:
{
  "gap_recommendations": [
    {
      "gap_id": "string (from the gap that triggered this recommendation)",
      "gap_table": "collaboration_gaps|dependency_gaps",
      "recommendation": "string (clear, actionable)",
      "action_type": "string (e.g. schedule_meeting, reassign_task, pair_programming)",
      "priority": "low|medium|high|critical",
      "reason": "string",
      "evidence": "string"
    }
  ],
  "student_recommendations": [
    {
      "recommended_student_id": "string or null (if applicable)",
      "match_score": 0-100,
      "match_reasons": ["string"],
      "context": {"team_id": "string", "suggestion": "string"}
    }
  ],
  "summary": "string (2-3 sentences)",
  "confidence": 0.0-1.0
}

Rules:
- Every recommendation must link to a real gap_id from the supplied gap lists.
- If no gaps are present, generate general health recommendations with null gap_id.
- priority must match the severity of the linked gap unless there is a reason to escalate.
- Recommendations must be specific enough to take direct action.
- DO NOT recommend changes to students' personal lives or non-project matters.`;

  const userMessage = `Team ID: ${ctx.teamId}
Progress: ${snapshot?.overall_progress ?? "unknown"}%
Health score: ${snapshot?.health_score ?? "unknown"}

Open collaboration gaps (${collabGaps?.length ?? 0}):
${JSON.stringify(collabGaps ?? [], null, 2)}

Open dependency gaps (${depGaps?.length ?? 0}):
${JSON.stringify(depGaps ?? [], null, 2)}

Knowledge exchanges (${knowledge?.length ?? 0}):
${JSON.stringify(knowledge ?? [], null, 2)}`;

  return { systemPrompt, userMessage };
}
