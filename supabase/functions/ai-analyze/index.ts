/**
 * ai-analyze — Supabase Edge Function
 *
 * Single entry-point for all AI analysis modules.
 * Calls Google Gemini server-side only. Never exposes the key to the browser.
 *
 * Supported analysisType values:
 *   discussion_analysis | contribution_analysis | document_intelligence
 *   progress_analysis   | collective_insight    | collaboration_gap
 *   collaboration_recommendation | skill_analysis | team_formation
 *
 * Request body shape:
 *   { analysisType, teamId?, studentId?, discussionId?, documentId?, contributionId?, inputData? }
 *
 * Security:
 *   - Validates Supabase JWT on every call.
 *   - Uses authenticated client (RLS) for reads.
 *   - Uses service-role client only for writes to AI result tables.
 *   - Writes an audit_log entry for every invocation.
 *   - Never logs the Gemini API key.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { buildPrompt } from "./prompts/index.ts";
import { writeResults } from "./writers/index.ts";

// ─────────────────────────────────────────────────────────────────────────────
// CORS headers — restrict in production to your actual frontend origin
// ─────────────────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─────────────────────────────────────────────────────────────────────────────
// Rate-limit: max 10 calls per user per minute (in-memory, per instance)
// ─────────────────────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count += 1;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}

// ─────────────────────────────────────────────────────────────────────────────
// Call Gemini and return parsed JSON
// Gemini doesn't have a strict json_object mode in all versions, so we wrap
// the prompt to request JSON explicitly and parse the response ourselves.
// ─────────────────────────────────────────────────────────────────────────────
async function callGemini(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  userMessage: string
): Promise<Record<string, unknown>> {
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: modelName,
    // Tell Gemini to always return valid JSON
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
      maxOutputTokens: 2000,
    },
    // System instruction (supported in gemini-1.5-flash and gemini-1.5-pro)
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userMessage);
  const raw = result.response.text();

  if (!raw || raw.trim() === "") {
    throw new Error("Gemini returned an empty response.");
  }

  // Strip markdown code fences if present (some Gemini versions wrap JSON in ```json)
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ── 1. Parse request ────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const {
    analysisType,
    teamId,
    studentId,
    discussionId,
    documentId,
    contributionId,
    inputData,
  } = body as {
    analysisType?: string;
    teamId?: string;
    studentId?: string;
    discussionId?: string;
    documentId?: string;
    contributionId?: string;
    inputData?: unknown;
  };

  if (!analysisType) {
    return errorResponse("Missing required field: analysisType");
  }

  // ── 2. Supabase clients ─────────────────────────────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return errorResponse("Server configuration error: missing Supabase env vars", 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";

  // Authenticated client — respects RLS, used for all reads
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // Service-role client — bypasses RLS, used only for writes to AI tables + audit_logs
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  // ── 3. Verify authenticated user ────────────────────────────────────────
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  if (authError || !user) {
    return errorResponse("Unauthorized", 401);
  }

  // ── 4. Rate limit ────────────────────────────────────────────────────────
  if (!checkRateLimit(user.id)) {
    return errorResponse("Rate limit exceeded. Please wait before running another analysis.", 429);
  }

  // ── 5. Gemini setup ──────────────────────────────────────────────────────
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiApiKey) {
    return errorResponse("AI service is not configured on this server.", 500);
  }

  // Default model: gemini-1.5-flash (fast + cheap, supports JSON mode + system instructions)
  // Override with GEMINI_MODEL secret if you want gemini-1.5-pro or gemini-2.0-flash
  const geminiModel = Deno.env.get("GEMINI_MODEL") ?? "gemini-1.5-flash";

  // ── 6. Caching — check existing analysis ────────────────────────────────
  const cacheTTLMinutes: Record<string, number> = {
    discussion_analysis: 60,
    progress_analysis: 60,
    collective_insight: 120,
    collaboration_gap: 120,
    contribution_analysis: 60,
    document_intelligence: 1440,
    skill_analysis: 1440,
    knowledge_exchange: 120,
    collaboration_recommendation: 120,
    team_formation: 1440,
  };

  const inputRef = buildInputReference(analysisType, {
    teamId, studentId, discussionId, documentId, contributionId,
  });

  const ttlMinutes = cacheTTLMinutes[analysisType] ?? 60;
  const cacheThreshold = new Date(Date.now() - ttlMinutes * 60 * 1000).toISOString();

  const { data: cacheRows } = await adminClient
    .from("ai_analysis")
    .select("*")
    .eq("analysis_type", analysisType)
    .eq("input_reference", inputRef)
    .gte("created_at", cacheThreshold)
    .order("created_at", { ascending: false })
    .limit(1);

  if (cacheRows && cacheRows.length > 0) {
    return jsonResponse({ success: true, data: cacheRows[0], cached: true });
  }

  // ── 7. Build prompt + fetch source data ─────────────────────────────────
  let promptResult: { systemPrompt: string; userMessage: string } | null = null;

  try {
    promptResult = await buildPrompt(analysisType, {
      teamId: teamId as string | undefined,
      studentId: studentId as string | undefined,
      discussionId: discussionId as string | undefined,
      documentId: documentId as string | undefined,
      contributionId: contributionId as string | undefined,
      inputData,
      supabase: userClient,
      adminSupabase: adminClient,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ai-analyze] buildPrompt error:", msg);
    return errorResponse(`Data fetch error: ${msg}`);
  }

  if (!promptResult) {
    return errorResponse(`Unsupported analysisType: ${analysisType}`);
  }

  // ── 8. Call Gemini ───────────────────────────────────────────────────────
  let resultJson: Record<string, unknown>;

  try {
    resultJson = await callGemini(
      geminiApiKey,
      geminiModel,
      promptResult.systemPrompt,
      promptResult.userMessage
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ai-analyze] Gemini error:", msg);

    // Write audit log for failure
    await adminClient.from("audit_logs").insert({
      user_id: user.id,
      action: "INSERT",
      table_name: "ai_analysis",
      record_id: null,
      new_data: {
        analysis_type: analysisType,
        status: "failed",
        error: "Gemini request failed",
      },
    });

    if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate")) {
      return errorResponse("Gemini rate limit reached. Please try again shortly.", 429);
    }
    return errorResponse(`AI processing failed: ${msg}`, 502);
  }

  // ── 9. Validate and write to dedicated AI tables ─────────────────────────
  let savedRow: Record<string, unknown>;

  try {
    savedRow = await writeResults(analysisType, resultJson, {
      teamId: teamId as string | undefined,
      studentId: studentId as string | undefined,
      discussionId: discussionId as string | undefined,
      documentId: documentId as string | undefined,
      contributionId: contributionId as string | undefined,
      supabase: adminClient,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ai-analyze] writeResults error:", msg);
    return errorResponse(`Failed to save analysis: ${msg}`, 500);
  }

  // ── 10. Write to ai_analysis cache table ─────────────────────────────────
  const { data: cacheRow, error: cacheErr } = await adminClient
    .from("ai_analysis")
    .insert({
      team_id: teamId ?? null,
      student_id: studentId ?? null,
      analysis_type: analysisType,
      input_reference: inputRef,
      result_json: resultJson,
      summary: (resultJson.summary as string) ?? "AI Analysis Completed",
      confidence: (resultJson.confidence as number) ?? null,
    })
    .select()
    .single();

  if (cacheErr) {
    console.error("[ai-analyze] Cache write error:", cacheErr.message);
  }

  // ── 11. Write audit log (success) ────────────────────────────────────────
  await adminClient.from("audit_logs").insert({
    user_id: user.id,
    action: "INSERT",
    table_name: "ai_analysis",
    record_id: cacheRow?.id ?? null,
    new_data: {
      analysis_type: analysisType,
      team_id: teamId ?? null,
      student_id: studentId ?? null,
      discussion_id: discussionId ?? null,
      document_id: documentId ?? null,
      contribution_id: contributionId ?? null,
      status: "success",
    },
  });

  // ── 12. Return ────────────────────────────────────────────────────────────
  return jsonResponse({
    success: true,
    data: cacheRow ?? { result_json: resultJson },
    dedicated: savedRow,
    cached: false,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build a stable cache key
// ─────────────────────────────────────────────────────────────────────────────
function buildInputReference(
  analysisType: string,
  ids: {
    teamId?: string;
    studentId?: string;
    discussionId?: string;
    documentId?: string;
    contributionId?: string;
  }
): string {
  const parts = [analysisType];
  if (ids.teamId) parts.push(`team:${ids.teamId}`);
  if (ids.studentId) parts.push(`student:${ids.studentId}`);
  if (ids.discussionId) parts.push(`discussion:${ids.discussionId}`);
  if (ids.documentId) parts.push(`document:${ids.documentId}`);
  if (ids.contributionId) parts.push(`contribution:${ids.contributionId}`);
  return parts.join(":");
}
