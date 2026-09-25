/**
 * AIErrorBox — shows user-friendly AI error messages.
 * Never exposes internal secrets or stack traces.
 */
import React from 'react';
import { AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { AIAnalysisError } from '../../services/aiAnalysisService';

interface Props {
  error: string | Error;
  onRetry?: () => void;
}

export function AIErrorBox({ error, onRetry }: Props) {
  const isAIError = error instanceof AIAnalysisError;
  const isRateLimit = isAIError && (error as AIAnalysisError).isRateLimit;
  const isAuth = isAIError && (error as AIAnalysisError).isUnauthorized;

  const message = isRateLimit
    ? 'AI rate limit reached. Please wait a minute and try again.'
    : isAuth
    ? 'You are not authorised to run this analysis.'
    : error instanceof Error
    ? error.message
    : String(error);

  const Icon = isRateLimit ? Clock : AlertCircle;

  return (
    <div className="flex items-start gap-3 p-4 bg-red-950/20 border border-red-900/30 rounded-xl text-sm">
      <Icon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <p className="text-red-300">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
