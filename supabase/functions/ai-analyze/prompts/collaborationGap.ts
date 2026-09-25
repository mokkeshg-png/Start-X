/**
 * MODULE 9 — Collaboration Gap Detection
 *
 * Reads: tasks, team_members, contributions, discussion_analysis (latest),
 *        collaboration_gaps (existing open — for deduplication)
 * Writes (via writers): collaboration_gaps, dependency_gaps
 */

import type { PromptContext, PromptResult } from "./index.ts";

export async function buildCollaborationGapPrompt(ctx: PromptContext): Promise<PromptResult> {
  const supabase = ctx.supabase as any;

  if (!ctx.teamId) throw new Error("collaboration_gap requires teamId");

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const { data: tasks } = await supabase
    .from("tasks")
    .select("task_id, title, status, priority, due_date, assigned_to, parent_task_id, description")
    .eq("team_id", ctx.teamId)
    .limit(80);

  // ── Team members ───────────────────────────────────────────────────────────
  const { data: members } = await supabase
    .from("team_members")
    .select("student_id, role, is_active")
    .eq("team_id", ctx.teamId)
    .eq("is_active", true);

  // ── Contributions per student ──────────────────────────────────────────────
  const { data: contributions } = await supabase
    .from("contributions")
    .select("student_id, contribution_type, submitted_at")
    .eq("team_id", ctx.teamId)
    .order("submitted_at", { ascending: false })
    .limit(60);

  // ── Existing open gaps (to prevent duplicates) ────────────────────────────
  const { data: existingGaps } = await supabase
    .from("collaboration_gaps")
    .select("gap_type, title")
    .eq("team_id", ctx.teamId)
    .eq("is_resolved", false);

  // ── Latest discussion analysis ─────────────────────────────────────────────
  const { data: latestDiscAnalysis } = await supabase
    .from("discussion_analysis")
    .select("problems, unresolved_issues: action_items, analyzed_at")
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
    .limit(1)
    .maybeSingle();

  const systemPrompt = `You are an expert collaboration analyst for a college project platform.
Detect real collaboration gaps in a team. Return ONLY valid JSON:
{
  "collaboration_gaps": [
    {
      "gap_type": "communication|knowledge|role_coordination|participation",
      "title": "string (concise)",
      "description": "string",
      "severity": "low|medium|high|critical",
      "evidence": {"detail": "string", "affected_students": ["student_id strings"]}
    }
  ],
  "dependency_gaps": [
    {
      "gap_type": "task_dependency|blocker|unassigned_work",
      "source_task_id": "string or null",
      "title": "string",
      "description": "string",
      "severity": "low|medium|high|critical",
      "evidence": {"detail": "string"}
    }
  ],
  "summary": "string (1-2 sentences)",
  "confidence": 0.0-1.0
}

Rules:
- Only identify gaps with clear evidence in the supplied data.
- DO NOT duplicate gaps that already exist in the existing_open_gaps list.
- A gap is real if: a student has tasks but zero contributions, or a blocked task with no note explaining why.
- severity must be one of the four enum values.
- If no meaningful gaps are found, return empty arrays (not fabricated entries).`;

  const userMessage = `Team ID: ${ctx.teamId}
Active members (${members?.length ?? 0}):
${JSON.stringify(members ?? [], null, 2)}

Tasks (${tasks?.length ?? 0}):
${JSON.stringify(tasks ?? [], null, 2)}

Recent contributions (${contributions?.length ?? 0}):
${JSON.stringify(contributions ?? [], null, 2)}

Existing open gaps (skip these — do not duplicate):
${JSON.stringify(existingGaps ?? [], null, 2)}

Latest discussion problems/unresolved items:
${JSON.stringify(latestDiscAnalysis ?? null, null, 2)}`;

  return { systemPrompt, userMessage };
}
