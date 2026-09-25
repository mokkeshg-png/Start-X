/**
 * MODULE 6 — Document Intelligence
 *
 * Reads: documents metadata; text content is provided by the caller via inputData.documentText
 * because the Edge Function cannot directly fetch Supabase Storage URLs without
 * an extra signed-URL step. The frontend fetches the signed URL, downloads the
 * text content, and sends it in inputData.documentText.
 *
 * Writes (via writers): document_analysis, consistency_checks (if multiple docs)
 */

import type { PromptContext, PromptResult } from "./index.ts";

export async function buildDocumentPrompt(ctx: PromptContext): Promise<PromptResult> {
  const supabase = ctx.supabase as any;
  const input = ctx.inputData as Record<string, unknown> | undefined;

  if (!ctx.documentId) {
    throw new Error("document_intelligence requires documentId");
  }

  // ── Fetch document metadata ────────────────────────────────────────────────
  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .select("document_id, file_name, file_type, file_mime_type, file_path, team_id, uploaded_at")
    .eq("document_id", ctx.documentId)
    .single();

  if (docErr) throw new Error(`Document not found: ${docErr.message}`);

  // ── Get text content ──────────────────────────────────────────────────────
  // Frontend must supply documentText for files it can read (text, PDF via extraction).
  // Supported MIME types for text extraction: text/*, application/json
  const documentText =
    (input?.documentText as string | undefined) ??
    "[Document text not provided. Frontend must extract and send text content via inputData.documentText]";

  // Truncate to avoid token overflow (~6000 chars ≈ 1500 tokens leaving room for prompt)
  const safeText = documentText.slice(0, 6000);

  const systemPrompt = `You are an expert technical document analyst for a college project platform.
Analyse the provided document and extract structured intelligence.
Return ONLY valid JSON matching this exact schema:
{
  "extracted_topics": [{"topic": "string", "importance": "high|medium|low"}],
  "technical_decisions": ["string"],
  "requirements": ["string"],
  "contributions_mentioned": ["string (names or roles)"],
  "risks": ["string"],
  "missing_information": ["string"],
  "concepts": ["string"],
  "summary": "string (2-4 sentences)",
  "confidence": 0.0-1.0
}

Rules:
- Base every output on the supplied document text only.
- If the text is incomplete or truncated, note it in missing_information.
- Do NOT invent requirements not present in the document.
- confidence reflects text quality (1.0 = rich detailed document, 0.3 = empty or unreadable).`;

  const userMessage = `Document: "${doc.file_name}"
Type: ${doc.file_type}
MIME: ${doc.file_mime_type ?? "unknown"}
Uploaded: ${doc.uploaded_at}

Content (may be truncated at 6000 chars):
---
${safeText}
---`;

  return { systemPrompt, userMessage };
}
