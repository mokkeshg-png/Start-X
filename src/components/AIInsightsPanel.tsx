/**
 * AIInsightsPanel — generic AI analysis card.
 * Used in team and student dashboards.
 * Renders the result_json from any analysis type in a structured way.
 */
import React from 'react';
import { Brain, RefreshCw } from 'lucide-react';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Spinner } from './common/Spinner';
import { AIErrorBox } from './ai/AIErrorBox';
import { AIStatusBadge } from './ai/AIStatusBadge';
import { useAIAnalysis } from './ai/useAIAnalysis';
import type { AIAnalysisRequest } from '../services/aiAnalysisService';

interface AIInsightsPanelProps extends AIAnalysisRequest {
  title: string;
  /** If true, shows the Analyze button only — does not auto-run */
  manualOnly?: boolean;
}

// Keys to hide from the generic renderer (shown separately or internal)
const SKIP_KEYS = new Set([
  'summary', 'confidence', 'student_id', 'project_id', 'team_id',
]);

export function AIInsightsPanel({
  title,
  manualOnly = false,
  ...request
}: AIInsightsPanelProps) {
  const { result, isLoading, error, cached, analyzedAt, run } = useAIAnalysis(
    request as AIAnalysisRequest,
    { autoRun: !manualOnly }
  );

  return (
    <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border-indigo-900/30">
      {/* background decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
        <Brain className="w-32 h-32 text-indigo-400" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h2>
          {result && (
            <AIStatusBadge cached={cached} analyzedAt={analyzedAt ?? undefined} />
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => run(true)}
          disabled={isLoading}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          {isLoading
            ? 'Analysing…'
            : result
            ? 'Refresh'
            : 'Analyse'}
        </Button>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-[80px]">
        {isLoading && !result && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Spinner className="w-6 h-6 text-indigo-500" />
            <p className="text-xs text-slate-400">AI is analysing… this may take 10–30 seconds</p>
          </div>
        )}

        {error && !isLoading && (
          <AIErrorBox error={error} onRetry={() => run(true)} />
        )}

        {!error && !isLoading && !result && (
          <div className="py-8 text-center">
            <p className="text-xs text-slate-500">
              Click <span className="text-indigo-400 font-semibold">Analyse</span> to run AI analysis on this data.
            </p>
          </div>
        )}

        {result && !error && (
          <div className="space-y-4">
            {/* Summary card */}
            {(result as any).summary && (
              <div className="p-4 bg-indigo-950/20 rounded-xl border border-indigo-500/20">
                <p className="text-sm text-indigo-100 leading-relaxed">{(result as any).summary}</p>
              </div>
            )}

            {/* Confidence */}
            {typeof (result as any).confidence === 'number' && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">AI Confidence</span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${Math.round((result as any).confidence * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {Math.round((result as any).confidence * 100)}%
                </span>
              </div>
            )}

            {/* Generic key→value renderer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(result as Record<string, unknown>).map(([key, value]) => {
                if (SKIP_KEYS.has(key)) return null;
                if (value === null || value === undefined) return null;
                if (Array.isArray(value) && value.length === 0) return null;
                if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0) return null;

                return (
                  <div
                    key={key}
                    className="p-3 bg-slate-900/60 rounded-xl border border-slate-800"
                  >
                    <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      {key.replace(/_/g, ' ')}
                    </h3>
                    <AIValueRenderer value={value} />
                  </div>
                );
              })}
            </div>

            {/* Timestamp */}
            {analyzedAt && (
              <p className="text-[10px] text-slate-600 text-right font-mono">
                Analysed {new Date(analyzedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Loading overlay when refreshing existing result */}
        {isLoading && result && (
          <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center rounded-xl z-20">
            <Spinner className="w-6 h-6 text-indigo-500" />
          </div>
        )}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Value renderer — handles arrays, objects, and primitives
// ─────────────────────────────────────────────────────────────────────────────

function AIValueRenderer({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1">
        {(value as unknown[]).map((item, i) => (
          <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5 flex-shrink-0">•</span>
            <span>
              {typeof item === 'object' && item !== null
                ? formatObjectItem(item as Record<string, unknown>)
                : String(item)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <div className="space-y-1">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="text-xs text-slate-400">
            <span className="text-slate-500">{k.replace(/_/g, ' ')}: </span>
            <span className="text-slate-300">{String(v)}</span>
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-xs text-slate-300">{String(value)}</p>;
}

function formatObjectItem(obj: Record<string, unknown>): string {
  // For action items, decisions, topics — try to extract the most useful field
  const preferredKeys = [
    'topic_name', 'decision_text', 'description', 'recommendation',
    'title', 'label', 'name', 'action', 'text',
  ];

  for (const key of preferredKeys) {
    if (obj[key]) return String(obj[key]);
  }

  return Object.entries(obj)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' | ');
}
