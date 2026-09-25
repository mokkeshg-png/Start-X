/**
 * aiAnalysisService.ts
 * Typed, browser-safe wrapper around the ai-analyze Supabase Edge Function.
 *
 * SECURITY:
 *  - Never calls OpenAI directly.
 *  - Never uses VITE_OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY.
 *  - The Supabase client attaches the user's JWT automatically — the Edge
 *    Function verifies it and enforces RLS.
 */

import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AnalysisType =
  | 'discussion_analysis'
  | 'contribution_analysis'
  | 'document_intelligence'
  | 'progress_analysis'
  | 'collective_insight'
  | 'collaboration_gap'
  | 'collaboration_recommendation'
  | 'skill_analysis'
  | 'team_formation'
  | 'knowledge_exchange';

export interface AIAnalysisRequest {
  analysisType: AnalysisType;
  teamId?: string;
  studentId?: string;
  discussionId?: string;
  documentId?: string;
  contributionId?: string;
  /** For document_intelligence: pass { documentText: string } */
  inputData?: Record<string, unknown>;
}

export interface AIAnalysisResponse {
  /** The ai_analysis cache row */
  data: {
    id: string;
    team_id: string | null;
    student_id: string | null;
    analysis_type: string;
    input_reference: string;
    result_json: Record<string, unknown>;
    summary: string | null;
    confidence: number | null;
    created_at: string;
  };
  /** Result from the dedicated AI table writer */
  dedicated?: Record<string, unknown>;
  /** True when the result was served from cache */
  cached: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache TTL map (mirrors Edge Function values)
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_TTL_MINUTES: Record<AnalysisType, number> = {
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

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

class AIAnalysisService {
  // ── Run analysis (calls Edge Function) ─────────────────────────────────────
  async runAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const { data, error } = await supabase.functions.invoke<AIAnalysisResponse>(
      'ai-analyze',
      { body: request }
    );

    if (error) {
      // Supabase wraps non-2xx responses as FunctionsHttpError
      const msg = (error as any)?.context?.json?.error
        || (error as any)?.message
        || 'AI analysis failed';
      throw new AIAnalysisError(msg, (error as any)?.context?.status ?? 0);
    }

    if (!data || !(data as any).success) {
      const msg = (data as any)?.error || 'AI analysis returned an empty response';
      throw new AIAnalysisError(msg, 0);
    }

    return data as unknown as AIAnalysisResponse;
  }

  // ── Check cache before calling the Edge Function ───────────────────────────
  async getCachedAnalysis(
    analysisType: AnalysisType,
    ids: {
      teamId?: string;
      studentId?: string;
      discussionId?: string;
      documentId?: string;
      contributionId?: string;
    }
  ): Promise<AIAnalysisResponse['data'] | null> {
    const inputRef = buildInputReference(analysisType, ids);
    const ttlMinutes = CACHE_TTL_MINUTES[analysisType] ?? 60;
    const threshold = new Date(Date.now() - ttlMinutes * 60 * 1000).toISOString();

    let query = supabase
      .from('ai_analysis')
      .select('*')
      .eq('analysis_type', analysisType)
      .eq('input_reference', inputRef)
      .gte('created_at', threshold)
      .order('created_at', { ascending: false })
      .limit(1);

    const { data, error } = await query;

    if (error || !data || data.length === 0) return null;
    return data[0] as AIAnalysisResponse['data'];
  }

  // ── Convenience: check cache first, fall back to Edge Function ────────────
  async getOrRunAnalysis(
    request: AIAnalysisRequest,
    forceRefresh = false
  ): Promise<{ result: AIAnalysisResponse['data']['result_json']; cached: boolean }> {
    if (!forceRefresh) {
      const cached = await this.getCachedAnalysis(request.analysisType, {
        teamId: request.teamId,
        studentId: request.studentId,
        discussionId: request.discussionId,
        documentId: request.documentId,
        contributionId: request.contributionId,
      });

      if (cached) {
        return { result: cached.result_json, cached: true };
      }
    }

    const response = await this.runAnalysis(request);
    return { result: response.data.result_json, cached: false };
  }

  // ── Fetch latest discussion analyses for a team ───────────────────────────
  async getDiscussionAnalyses(discussionId: string) {
    const { data, error } = await supabase
      .from('discussion_analysis')
      .select(`
        analysis_id,
        discussion_id,
        topics,
        decisions,
        problems,
        action_items,
        sentiment,
        is_resolved,
        analyzed_at
      `)
      .eq('discussion_id', discussionId)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Failed to load discussion analysis: ${error.message}`);
    return data;
  }

  // ── Fetch latest progress snapshot for a team ─────────────────────────────
  async getLatestProgressSnapshot(teamId: string) {
    const { data, error } = await supabase
      .from('progress_snapshots')
      .select('*')
      .eq('team_id', teamId)
      .order('snapped_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Failed to load progress snapshot: ${error.message}`);
    return data;
  }

  // ── Fetch open collaboration gaps for a team ──────────────────────────────
  async getCollaborationGaps(teamId: string) {
    const { data, error } = await supabase
      .from('collaboration_gaps')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_resolved', false)
      .order('identified_at', { ascending: false });

    if (error) throw new Error(`Failed to load collaboration gaps: ${error.message}`);
    return data ?? [];
  }

  // ── Fetch open dependency gaps for a team ────────────────────────────────
  async getDependencyGaps(teamId: string) {
    const { data, error } = await supabase
      .from('dependency_gaps')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_resolved', false)
      .order('identified_at', { ascending: false });

    if (error) throw new Error(`Failed to load dependency gaps: ${error.message}`);
    return data ?? [];
  }

  // ── Fetch latest collective insight for a team ────────────────────────────
  async getLatestCollectiveInsight(teamId: string) {
    const { data, error } = await supabase
      .from('collective_insights')
      .select('*')
      .eq('team_id', teamId)
      .eq('insight_type', 'project_summary')
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Failed to load collective insight: ${error.message}`);
    return data;
  }

  // ── Fetch gap recommendations for a team ─────────────────────────────────
  async getGapRecommendations(teamId: string) {
    const { data, error } = await supabase
      .from('gap_recommendations')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_actioned', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new Error(`Failed to load recommendations: ${error.message}`);
    return data ?? [];
  }

  // ── Fetch contribution analysis for a student's contribution ─────────────
  async getContributionAnalysis(contributionId: string) {
    const { data, error } = await supabase
      .from('contribution_analysis')
      .select('*')
      .eq('contribution_id', contributionId)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Failed to load contribution analysis: ${error.message}`);
    return data;
  }

  // ── Fetch document analysis ───────────────────────────────────────────────
  async getDocumentAnalysis(documentId: string) {
    const { data, error } = await supabase
      .from('document_analysis')
      .select('*')
      .eq('document_id', documentId)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Failed to load document analysis: ${error.message}`);
    return data;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Error class
// ─────────────────────────────────────────────────────────────────────────────

export class AIAnalysisError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 0
  ) {
    super(message);
    this.name = 'AIAnalysisError';
  }

  get isRateLimit() {
    return this.statusCode === 429;
  }

  get isUnauthorized() {
    return this.statusCode === 401;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
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
  return parts.join(':');
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton export
// ─────────────────────────────────────────────────────────────────────────────

export const aiAnalysisService = new AIAnalysisService();
