/**
 * useAIAnalysis hook
 * Generic hook for any AI analysis module.
 * Handles loading, error, cache, and refresh state.
 */
import { useState, useCallback, useEffect } from 'react';
import { aiAnalysisService, AIAnalysisRequest, AnalysisType } from '../../services/aiAnalysisService';

export interface UseAIAnalysisOptions {
  /** Automatically run analysis on mount */
  autoRun?: boolean;
  /** Skip cache and always call the Edge Function */
  forceRefresh?: boolean;
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

  const run = useCallback(
    async (forceRefresh = false) => {
      if (!request) return;

      setIsLoading(true);
      setError(null);

      try {
        // 1. Check browser-side cache first (unless forceRefresh)
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
    },
    [JSON.stringify(request)] // stable dep
  );

  useEffect(() => {
    if (autoRun && request) {
      run(false);
    }
  }, [autoRun, JSON.stringify(request)]);

  return { result, isLoading, error, cached, analyzedAt, run };
}
