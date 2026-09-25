/**
 * Collaboration Gap Writer
 * Tables: collaboration_gaps, dependency_gaps
 * Deduplicates by team + gap_type + title to avoid repeated inserts.
 */

import type { WriterContext } from "./index.ts";

const VALID_SEVERITY = new Set(["low", "medium", "high", "critical"]);

export async function writeCollaborationGap(
  result: Record<string, unknown>,
  ctx: WriterContext
): Promise<Record<string, unknown>> {
  const db = ctx.supabase as any;

  if (!ctx.teamId) throw new Error("collaborationGapWriter: teamId required");

  const collabGapsInserted: string[] = [];
  const depGapsInserted: string[] = [];

  // ── collaboration_gaps ────────────────────────────────────────────────────
  const collabGaps = Array.isArray(result.collaboration_gaps)
    ? (result.collaboration_gaps as Array<Record<string, unknown>>)
    : [];

  for (const gap of collabGaps) {
    if (!gap.gap_type || !gap.title) continue;

    const severity = VALID_SEVERITY.has(gap.severity as string)
      ? (gap.severity as string)
      : "medium";

    // Deduplication check: skip if an open gap with same type+title exists
    const { data: existing } = await db
      .from("collaboration_gaps")
      .select("gap_id")
      .eq("team_id", ctx.teamId)
      .eq("gap_type", gap.gap_type)
      .ilike("title", gap.title as string)
      .eq("is_resolved", false)
      .limit(1)
      .maybeSingle();

    if (existing) continue; // Already exists — skip

    const { data: inserted, error } = await db
      .from("collaboration_gaps")
      .insert({
        team_id: ctx.teamId,
        gap_type: gap.gap_type,
        title: gap.title,
        description: gap.description ?? null,
        severity,
        evidence: typeof gap.evidence === "object" ? gap.evidence : { detail: String(gap.evidence ?? "") },
        is_resolved: false,
      })
      .select("gap_id")
      .single();

    if (error) {
      console.error("collaboration_gaps insert error (non-fatal):", error.message);
      continue;
    }
    collabGapsInserted.push(inserted.gap_id);
  }

  // ── dependency_gaps ────────────────────────────────────────────────────────
  const depGaps = Array.isArray(result.dependency_gaps)
    ? (result.dependency_gaps as Array<Record<string, unknown>>)
    : [];

  for (const gap of depGaps) {
    if (!gap.gap_type || !gap.title) continue;

    const severity = VALID_SEVERITY.has(gap.severity as string)
      ? (gap.severity as string)
      : "medium";

    // Deduplication
    const { data: existing } = await db
      .from("dependency_gaps")
      .select("gap_id")
      .eq("team_id", ctx.teamId)
      .eq("gap_type", gap.gap_type)
      .ilike("title", gap.title as string)
      .eq("is_resolved", false)
      .limit(1)
      .maybeSingle();

    if (existing) continue;

    const { data: inserted, error } = await db
      .from("dependency_gaps")
      .insert({
        team_id: ctx.teamId,
        source_task_id: gap.source_task_id ?? null,
        gap_type: gap.gap_type,
        title: gap.title,
        description: gap.description ?? null,
        severity,
        evidence: typeof gap.evidence === "object" ? gap.evidence : { detail: String(gap.evidence ?? "") },
        is_resolved: false,
      })
      .select("gap_id")
      .single();

    if (error) {
      console.error("dependency_gaps insert error (non-fatal):", error.message);
      continue;
    }
    depGapsInserted.push(inserted.gap_id);
  }

  return {
    collaboration_gaps_inserted: collabGapsInserted.length,
    dependency_gaps_inserted: depGapsInserted.length,
    team_id: ctx.teamId,
  };
}
