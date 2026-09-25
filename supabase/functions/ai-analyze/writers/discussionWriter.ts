/**
 * Discussion Analysis Writer
 * Tables: discussion_analysis, discussion_topics, discussion_decisions, discussion_action_items
 */

import type { WriterContext } from "./index.ts";

export async function writeDiscussionAnalysis(
  result: Record<string, unknown>,
  ctx: WriterContext
): Promise<Record<string, unknown>> {
  const db = ctx.supabase as any;

  if (!ctx.discussionId) throw new Error("discussionWriter: discussionId required");

  // ── Validate required fields ───────────────────────────────────────────────
  if (!Array.isArray(result.topics)) throw new Error("AI result missing 'topics' array");
  if (!Array.isArray(result.decisions)) throw new Error("AI result missing 'decisions' array");
  if (!Array.isArray(result.action_items)) throw new Error("AI result missing 'action_items' array");

  // ── 1. discussion_analysis ─────────────────────────────────────────────────
  const { data: analysis, error: aErr } = await db
    .from("discussion_analysis")
    .insert({
      discussion_id: ctx.discussionId,
      topics: result.topics,
      decisions: result.decisions,
      problems: Array.isArray(result.problems) ? result.problems : [],
      action_items: result.action_items,
      sentiment: typeof result.sentiment === "object" ? result.sentiment : {},
      is_resolved: false,
    })
    .select()
    .single();

  if (aErr) throw new Error(`discussion_analysis insert failed: ${aErr.message}`);

  // ── 2. discussion_topics ───────────────────────────────────────────────────
  const topics = result.topics as Array<{
    topic_name: string;
    relevance_score?: number;
    keywords?: string[];
  }>;

  for (const topic of topics) {
    if (!topic.topic_name) continue;
    await db.from("discussion_topics").insert({
      discussion_id: ctx.discussionId,
      topic_name: topic.topic_name,
      relevance_score: topic.relevance_score ?? null,
      keywords: topic.keywords ?? [],
    });
  }

  // ── 3. discussion_decisions ────────────────────────────────────────────────
  const decisions = result.decisions as Array<{
    decision_text: string;
    confidence?: number;
  }>;

  for (const dec of decisions) {
    if (!dec.decision_text) continue;
    await db.from("discussion_decisions").insert({
      discussion_id: ctx.discussionId,
      decision_text: dec.decision_text,
      confidence: dec.confidence ?? null,
    });
  }

  // ── 4. discussion_action_items ─────────────────────────────────────────────
  const actions = result.action_items as Array<{
    description: string;
    due_date_hint?: string | null;
    assignee_hint?: string | null;
  }>;

  for (const action of actions) {
    if (!action.description) continue;
    await db.from("discussion_action_items").insert({
      discussion_id: ctx.discussionId,
      description: action.description,
      due_date: action.due_date_hint ?? null,
      is_completed: false,
    });
  }

  return { analysis_id: analysis.analysis_id, discussion_id: ctx.discussionId };
}
