/**
 * useAIAnalysis hook
 * Generic hook for any AI analysis module.
 * Handles loading, error, cache, and refresh state.
 *
 * IMPORTANT: autoRun defaults to FALSE. Panels must explicitly opt in.
 * This prevents Edge Function calls on every page load.
 */
import { useState, useCallback, useRef } from 'react';
import { aiAnalysisService, AIAnalysisRequest, AnalysisType } from '../../services/aiAnalysisService';

export interface UseAIAnalysisOptions {
  /** Automatically run analysis on mount — defaults to FALSE */
  autoRun?: boolean;
}

export interface UseAIAnalysisReturn<T = Record<string, unknown>> {
  result: T | null;
  isLoading: boolean;
  error: Error | null;
  cached: boolean;
  analyzedAt: string | null;
  run: (forceRefresh?: boolean) => Promise<void>;
}

export function useAIAnalysis<T = Record<string, unknown>>(
  request: AIAnalysisRequest | null,
  options: UseAIAnalysisOptions = {}
): UseAIAnalysisReturn<T> {
  const { autoRun = false } = options;

  const [result, setResult] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cached, setCached] = useState(false);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);

  // Track whether we've done the initial auto-run so we never do it twice
  const autoRanRef = useRef(false);

  const run = useCallback(async (forceRefresh = false) => {
    if (!request) return;
    // Guard: don't start a second call while one is in progress
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Check DB cache first (unless forceRefresh)
      if (!forceRefresh) {
        const cachedRow = await aiAnalysisService.getCachedAnalysis(
          request.analysisType as AnalysisType,
          {
            teamId: request.teamId,
            studentId: request.studentId,
            discussionId: request.discussionId,
            documentId: request.documentId,
            contributionId: request.contributionId,
          }
        );

        if (cachedRow) {
          setResult(cachedRow.result_json as T);
          setCached(true);
          setAnalyzedAt(cachedRow.created_at);
          setIsLoading(false);
          return;
        }
      }

      // 2. Call Edge Function
      const response = await aiAnalysisService.runAnalysis(request);
      setResult(response.data.result_json as T);
      setCached(response.cached ?? false);
      setAnalyzedAt(response.data.created_at ?? new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Only recreate when the meaningful request fields change
    request?.analysisType,
    request?.teamId,
    request?.studentId,
    request?.discussionId,
    request?.documentId,
    request?.contributionId,
  ]);

  // Auto-run once on mount — only if explicitly requested AND we have data
  // Use a ref so it never re-fires on re-renders
  if (autoRun && request && !autoRanRef.current && !isLoading && !result && !error) {
    autoRanRef.current = true;
    // Defer to next tick so component finishes mounting first
    Promise.resolve().then(() => run(false));
  }

  return { result, isLoading, error, cached, analyzedAt, run };
}
