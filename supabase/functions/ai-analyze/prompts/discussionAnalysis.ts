/**
 * MODULE 3 — Discussion Analysis
 *
 * Reads: discussions, messages
 * Writes (via writers): discussion_analysis, discussion_topics,
 *                       discussion_decisions, discussion_action_items
 *
 * IMPORTANT: discussionId is required. teamId is used as fallback to find
 * the most recent open discussion if discussionId is not supplied.
 */

import type { PromptContext, PromptResult } from "./index.ts";

export async function buildDiscussionPrompt(ctx: PromptContext): Promise<PromptResult> {
  const supabase = ctx.supabase as any;

  if (!ctx.discussionId && !ctx.teamId) {
    throw new Error("discussion_analysis requires discussionId or teamId");
  }

  // ── Fetch the discussion ────────────────────────────────────────────────
  let discussion: Record<string, unknown> | null = null;

  if (ctx.discussionId) {
    const { data, error } = await supabase
      .from("discussions")
      .select("discussion_id, title, description, status, created_at, team_id")
      .eq("discussion_id", ctx.discussionId)
      .single();

    if (error) throw new Error(`Discussion not found: ${error.message}`);
    discussion = data;
  } else {
    // Fallback: latest open discussion for the team
    const { data, error } = await supabase
      .from("discussions")
      .select("discussion_id, title, description, status, created_at, team_id")
      .eq("team_id", ctx.teamId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) throw new Error(`No open discussion found for team: ${error.message}`);
    discussion = data;
  }

  const discussionId = discussion!.discussion_id as string;

  // ── Fetch messages (cap at 200 for token safety) ─────────────────────────
  const { data: messages, error: msgError } = await supabase
    .from("messages")
    .select("message_id, sender_id, content, message_type, created_at")
    .eq("discussion_id", discussionId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (msgError) throw new Error(`Failed to fetch messages: ${msgError.message}`);

  if (!messages || messages.length === 0) {
    throw new Error("No messages found in this discussion. Add messages before running analysis.");
  }

  // ── Build prompt ──────────────────────────────────────────────────────────
  const systemPrompt = `You are an expert AI analyst for a college project collaboration platform.
Your task is to analyse a team discussion and extract structured intelligence from the messages.

Return ONLY valid JSON matching this exact schema — no extra keys, no markdown:
{
  "topics": [{"topic_name": "string", "relevance_score": 0.0-1.0, "keywords": ["string"]}],
  "decisions": [{"decision_text": "string", "confidence": 0.0-1.0}],
  "action_items": [{"description": "string", "due_date_hint": "string or null", "assignee_hint": "string or null"}],
  "problems": ["string"],
  "unresolved_issues": ["string"],
  "blockers": ["string"],
  "sentiment": {"overall": "positive|neutral|negative", "engagement": "high|medium|low"},
  "summary": "string (2-3 sentences)",
  "confidence": 0.0-1.0
}

Rules:
- DO NOT invent decisions that are not clearly present in the messages.
- DO NOT infer blockers from tone alone — only include them if explicitly mentioned.
- If information is insufficient for a field, return an empty array or null.
- Base assignee_hint on names or pronouns in the messages, not guesswork.
- confidence reflects how complete the source data is (1.0 = rich data, 0.3 = sparse).`;

  const userMessage = `Discussion: "${discussion!.title}"
Status: ${discussion!.status}
Created: ${discussion!.created_at}
Total messages: ${messages.length}

Messages (chronological):
${messages
    .map(
      (m: any, i: number) =>
        `[${i + 1}] [${new Date(m.created_at).toISOString()}] sender:${m.sender_id}\n${m.content}`
    )
    .join("\n\n")}`;

  return { systemPrompt, userMessage };
}
