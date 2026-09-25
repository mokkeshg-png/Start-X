/**
 * Knowledge Exchange Writer
 * Tables: knowledge_exchanges, knowledge_graph, knowledge_edges
 */

import type { WriterContext } from "./index.ts";

const VALID_NODE_TYPES = new Set(["concept", "technology", "method", "tool", "domain", "person"]);
const VALID_EXCHANGE_TYPES = new Set([
  "peer_learning", "mentoring", "code_review", "documentation", "demo",
]);

export async function writeKnowledgeExchange(
  result: Record<string, unknown>,
  ctx: WriterContext
): Promise<Record<string, unknown>> {
  const db = ctx.supabase as any;

  if (!ctx.teamId) throw new Error("knowledgeExchangeWriter: teamId required");

  const flows = Array.isArray(result.knowledge_flows)
    ? (result.knowledge_flows as Array<Record<string, unknown>>)
    : [];

  const nodes = Array.isArray(result.knowledge_graph_nodes)
    ? (result.knowledge_graph_nodes as Array<Record<string, unknown>>)
    : [];

  const edges = Array.isArray(result.knowledge_graph_edges)
    ? (result.knowledge_graph_edges as Array<Record<string, unknown>>)
    : [];

  const insertedExchanges: string[] = [];

  // ── knowledge_exchanges ───────────────────────────────────────────────────
  for (const flow of flows) {
    if (!flow.from_student_id || !flow.to_student_id || !flow.topic) continue;
    if (flow.from_student_id === flow.to_student_id) continue;

    const exchangeType = VALID_EXCHANGE_TYPES.has(flow.exchange_type as string)
      ? (flow.exchange_type as string)
      : "peer_learning";

    const { data: inserted, error } = await db
      .from("knowledge_exchanges")
      .insert({
        team_id: ctx.teamId,
        from_student_id: flow.from_student_id,
        to_student_id: flow.to_student_id,
        topic: flow.topic,
        description: flow.evidence ?? null,
        exchange_type: exchangeType,
        metadata: { confidence: result.confidence ?? null },
        occurred_at: flow.occurred_at ?? new Date().toISOString(),
      })
      .select("exchange_id")
      .single();

    if (error) {
      console.error("knowledge_exchanges insert error (non-fatal):", error.message);
      continue;
    }
    insertedExchanges.push(inserted.exchange_id);
  }

  // ── knowledge_graph nodes ──────────────────────────────────────────────────
  const nodeIdMap: Record<string, string> = {};  // label → node_id

  for (const node of nodes) {
    if (!node.label) continue;

    const nodeType = VALID_NODE_TYPES.has(node.node_type as string)
      ? (node.node_type as string)
      : "concept";

    const { data: inserted, error } = await db
      .from("knowledge_graph")
      .insert({
        team_id: ctx.teamId,
        label: node.label,
        node_type: nodeType,
        description: node.description ?? null,
        weight: typeof node.weight === "number" ? node.weight : 1.0,
      })
      .select("node_id")
      .single();

    if (error) {
      console.error("knowledge_graph insert error (non-fatal):", error.message);
      continue;
    }
    nodeIdMap[node.label as string] = inserted.node_id;
  }

  // ── knowledge_edges ────────────────────────────────────────────────────────
  for (const edge of edges) {
    if (!edge.from_label || !edge.to_label) continue;

    const fromId = nodeIdMap[edge.from_label as string];
    const toId = nodeIdMap[edge.to_label as string];
    if (!fromId || !toId || fromId === toId) continue;

    const { error } = await db
      .from("knowledge_edges")
      .insert({
        from_node_id: fromId,
        to_node_id: toId,
        relationship: edge.relationship ?? "related_to",
        strength:
          typeof edge.strength === "number"
            ? Math.min(1.0, Math.max(0.0, edge.strength))
            : 0.5,
      });

    if (error) {
      // Unique constraint violations on repeat runs are expected — skip silently
      if (!error.message.includes("unique")) {
        console.error("knowledge_edges insert error (non-fatal):", error.message);
      }
    }
  }

  return {
    exchanges_inserted: insertedExchanges.length,
    nodes_inserted: Object.keys(nodeIdMap).length,
    team_id: ctx.teamId,
  };
}
