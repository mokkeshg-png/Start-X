/**
 * MODULE 4 — Contribution Analysis
 *
 * Reads: contributions, team_members, tasks, messages (recent)
 * Writes (via writers): contribution_analysis, contribution_timeline
 */

import type { PromptContext, PromptResult } from "./index.ts";

export async function buildContributionPrompt(ctx: PromptContext): Promise<PromptResult> {
  const supabase = ctx.supabase as any;

  if (!ctx.teamId || !ctx.studentId) {
    throw new Error("contribution_analysis requires teamId and studentId");
  }

  // ── Member record ─────────────────────────────────────────────────────────
  const { data: member, error: memberErr } = await supabase
    .from("team_members")
    .select("member_id, role, joined_at, is_active")
    .eq("team_id", ctx.teamId)
    .eq("student_id", ctx.studentId)
    .maybeSingle();

  if (memberErr) throw new Error(`team_members query failed: ${memberErr.message}`);

  // ── Contributions ─────────────────────────────────────────────────────────
  const { data: contributions, error: contribErr } = await supabase
    .from("contributions")
    .select("contribution_id, contribution_type, title, description, submitted_at, tags")
    .eq("team_id", ctx.teamId)
    .eq("student_id", ctx.studentId)
    .order("submitted_at", { ascending: false })
    .limit(50);

  if (contribErr) throw new Error(`contributions query failed: ${contribErr.message}`);

  // ── Assigned tasks ────────────────────────────────────────────────────────
  const { data: tasks, error: taskErr } = await supabase
    .from("tasks")
    .select("task_id, title, description, status, priority, due_date, completed_at, tags")
    .eq("team_id", ctx.teamId)
    .eq("assigned_to", ctx.studentId)
    .limit(50);

  if (taskErr) throw new Error(`tasks query failed: ${taskErr.message}`);

  // ── Recent messages by this student ──────────────────────────────────────
  // Messages sent by users don't have student_id directly; we skip to avoid a
  // complex join that might exceed RLS. We include task + contribution data only.

  const systemPrompt = `You are an expert AI analyst for a college project collaboration platform.
Analyse an individual student's contribution to a team project. Return ONLY valid JSON:
{
  "role": "string",
  "role_alignment_score": 0-100,
  "quality_score": 0-100,
  "complexity_score": 0-100,
  "completed_responsibilities": ["string"],
  "incomplete_responsibilities": ["string"],
  "evidence": ["string"],
  "blockers": ["string"],
  "collaboration_notes": "string",
  "next_action": "string",
  "summary": "string (2-3 sentences)",
  "confidence": 0.0-1.0
}

Rules:
- role_alignment_score: how well their submitted work matches their assigned role (0-100).
- quality_score: based on description richness and task completion — NOT a subjective grade.
- complexity_score: based on task priorities and contribution types.
- DO NOT fabricate a productivity percentage from insufficient data.
- If tasks are absent, say so in the summary rather than inventing a score.
- Mark scores as evidence-based estimates by keeping confidence < 0.7 when task data is sparse.`;

  const userMessage = `Student ID: ${ctx.studentId}
Team ID: ${ctx.teamId}
Assigned role: ${member?.role ?? "Unknown"}
Active member: ${member?.is_active ?? "unknown"}
Joined: ${member?.joined_at ?? "unknown"}

Contributions (${contributions?.length ?? 0}):
${JSON.stringify(contributions ?? [], null, 2)}

Assigned tasks (${tasks?.length ?? 0}):
${JSON.stringify(tasks ?? [], null, 2)}`;

  return { systemPrompt, userMessage };
}
