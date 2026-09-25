/**
 * Document Intelligence Writer
 * Tables: document_analysis
 */

import type { WriterContext } from "./index.ts";

export async function writeDocumentAnalysis(
  result: Record<string, unknown>,
  ctx: WriterContext
): Promise<Record<string, unknown>> {
  const db = ctx.supabase as any;

  if (!ctx.documentId) throw new Error("documentWriter: documentId required");

  // Validate
  if (!Array.isArray(result.extracted_topics)) {
    throw new Error("AI result missing 'extracted_topics' array");
  }

  const { data: analysis, error } = await db
    .from("document_analysis")
    .insert({
      document_id: ctx.documentId,
      extracted_topics: result.extracted_topics,
      technical_decisions: Array.isArray(result.technical_decisions)
        ? result.technical_decisions
        : [],
      contributions_mentioned: Array.isArray(result.contributions_mentioned)
        ? result.contributions_mentioned
        : [],
      summary: typeof result.summary === "string" ? result.summary : null,
      ai_metadata: {
        requirements: result.requirements ?? [],
        risks: result.risks ?? [],
        missing_information: result.missing_information ?? [],
        concepts: result.concepts ?? [],
        confidence: result.confidence ?? null,
      },
    })
    .select()
    .single();

  if (error) throw new Error(`document_analysis insert failed: ${error.message}`);

  return { analysis_id: analysis.analysis_id, document_id: ctx.documentId };
}
