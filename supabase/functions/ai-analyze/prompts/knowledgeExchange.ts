/**
 * MODULE 5 — Knowledge Exchange Mapping
 *
 * Reads: messages (recent), discussion_analysis (latest), documents (metadata)
 * Writes (via writers): knowledge_exchanges, knowledge_graph nodes + edges
 */

import type { PromptContext, PromptResult } from "./index.ts";

export async function buildKnowledgeExchangePrompt(ctx: PromptContext): Promise<PromptResult> {
  const supabase = ctx.supabase as any;

  if (!ctx.teamId) throw new Error("knowledge_exchange requires teamId");

  // ── Team members (to get student_id → sender_id mapping via user_id) ──────
  const { data: members } = await supabase
    .from("team_members")
    .select("student_id, role")
    .eq("team_id", ctx.teamId)
    .eq("is_active", true);

  // ── Discussions for this team ─────────────────────────────────────────────
  const { data: discussions } = await supabase
    .from("discussions")
    .select("discussion_id, title")
    .eq("team_id", ctx.teamId);

  const discussionIds = (discussions ?? []).map((d: any) => d.discussion_id);

  // ── Recent messages (cap 150) ─────────────────────────────────────────────
  let messages: any[] = [];
  if (discussionIds.length > 0) {
    const { data } = await supabase
      .from("messages")
      .select("message_id, discussion_id, sender_id, content, created_at")
      .in("discussion_id", discussionIds)
      .order("created_at", { ascending: false })
      .limit(150);
    messages = data ?? [];
  }

  // ── Latest discussion analysis ─────────────────────────────────────────────
  const { data: discAnalyses } = await supabase
    .from("discussion_analysis")
    .select("topics, decisions")
    .in("discussion_id", discussionIds)
    .order("analyzed_at", { ascending: false })
    .limit(3);

  // ── Documents ─────────────────────────────────────────────────────────────
  const { data: documents } = await supabase
    .from("documents")
    .select("file_name, file_type, uploaded_by, uploaded_at")
    .eq("team_id", ctx.teamId)
    .limit(10);

  const systemPrompt = `You are a knowledge mapping AI for a college project collaboration platform.
Identify explicit knowledge-sharing events in team communications.
Return ONLY valid JSON:
{
  "knowledge_flows": [
    {
      "from_student_id": "string (student_id, NOT user_id)",
      "to_student_id": "string (student_id, NOT user_id)",
      "topic": "string (what was taught/shared)",
      "exchange_type": "peer_learning|mentoring|code_review|documentation|demo",
      "evidence": "string (quote or paraphrase from message)",
      "occurred_at": "ISO 8601 datetime string"
    }
  ],
  "knowledge_graph_nodes": [
    {
      "label": "string (concept or technology)",
      "node_type": "concept|technology|method|tool|domain",
      "description": "string",
      "weight": 1.0-5.0
    }
  ],
  "knowledge_graph_edges": [
    {
      "from_label": "string",
      "to_label": "string",
      "relationship": "string (e.g. requires, builds_on, implements)",
      "strength": 0.1-1.0
    }
  ],
  "knowledge_gaps": ["string (topics the team clearly needs but hasn't discussed)"],
  "summary": "string (1-2 sentences)",
  "confidence": 0.0-1.0
}

Rules:
- ONLY create a knowledge_flow when there is explicit evidence (e.g. explanation, question-answer, demo).
- from_student_id and to_student_id must come from the team members list — use student_id values.
- If sender_id (user_id) maps to a student, use that student_id. If the mapping is unclear, skip the flow.
- Do NOT infer knowledge sharing from social messages ("thanks!", "ok").
- knowledge_graph_nodes represent concepts/technologies discussed — not people.`;

  const userMessage = `Team ID: ${ctx.teamId}

Team members (student_id → role):
${JSON.stringify(members ?? [], null, 2)}

Messages (${messages.length}, most recent first):
${messages
    .slice(0, 100)
    .map(
      (m: any) =>
        `[${m.created_at}] sender_user_id:${m.sender_id}\n${m.content}`
    )
    .join("\n---\n")}

Discussion analyses (${discAnalyses?.length ?? 0}):
${JSON.stringify(discAnalyses ?? [], null, 2)}

Documents uploaded:
${JSON.stringify(documents ?? [], null, 2)}`;

  return { systemPrompt, userMessage };
}
