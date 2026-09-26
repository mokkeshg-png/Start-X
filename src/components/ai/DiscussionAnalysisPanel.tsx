/**
 * DiscussionAnalysisPanel
 * Shows structured AI analysis for a single discussion.
 * Triggered manually by the user — never auto-runs on every load.
 */
import React, { useEffect, useState } from 'react';
import {
  Brain, RefreshCw, MessageSquare, Lightbulb,
  CheckCircle2, AlertTriangle, ListTodo, Tag
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';
import { Badge } from '../common/Badge';
import { AIErrorBox } from './AIErrorBox';
import { AIStatusBadge } from './AIStatusBadge';
import { useAIAnalysis } from './useAIAnalysis';
import { aiAnalysisService } from '../../services/aiAnalysisService';

interface Props {
  discussionId: string;
  discussionTitle: string;
  teamId: string;
}

interface DiscussionAnalysisResult {
  topics: Array<{ topic_name: string; relevance_score?: number; keywords?: string[] }>;
  decisions: Array<{ decision_text: string; confidence?: number }>;
  action_items: Array<{ description: string; due_date_hint?: string | null; assignee_hint?: string | null }>;
  problems: string[];
  unresolved_issues: string[];
  blockers: string[];
  sentiment: { overall?: string; engagement?: string };
  summary: string;
  confidence: number;
}

export function DiscussionAnalysisPanel({ discussionId, discussionTitle, teamId }: Props) {
  const { result, isLoading, error, cached, analyzedAt, run } =
    useAIAnalysis<DiscussionAnalysisResult>(
      { analysisType: 'discussion_analysis', discussionId, teamId },
      { autoRun: false }
    );

  // Also try loading existing analysis from the dedicated table
  const [storedAnalysis, setStoredAnalysis] = useState<any>(null);
  const [loadingStored, setLoadingStored] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingStored(true);
    aiAnalysisService
      .getDiscussionAnalyses(discussionId)
      .then((data) => { if (active) setStoredAnalysis(data); })
      .catch(() => {})
      .finally(() => { if (active) setLoadingStored(false); });
    return () => { active = false; };
  }, [discussionId]);

  const displayed = result ?? (storedAnalysis ? {
    topics: storedAnalysis.topics ?? [],
    decisions: storedAnalysis.decisions ?? [],
    action_items: storedAnalysis.action_items ?? [],
    problems: storedAnalysis.problems ?? [],
    unresolved_issues: [],
    blockers: [],
    sentiment: storedAnalysis.sentiment ?? {},
    summary: null,
    confidence: null,
  } : null);

  return (
    <Card className="p-6 space-y-5 bg-gradient-to-br from-slate-900 to-slate-950 border-indigo-900/30">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Discussion Analysis
          </h3>
          {displayed && (
            <AIStatusBadge cached={cached || !!storedAnalysis} analyzedAt={analyzedAt ?? storedAnalysis?.analyzed_at} />
          )}
        </div>
        <Button
          variant="ai"
          size="sm"
          onClick={() => run(true)}
          disabled={isLoading}
          icon={<Brain className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />}
        >
          {isLoading ? 'Analysing Discussion…' : 'Analyse Discussion'}
        </Button>
      </div>

      {/* Context */}
      <p className="text-xs text-slate-500">
        Discussion: <span className="text-slate-300 font-medium">"{discussionTitle}"</span>
      </p>

      {/* States */}
      {isLoading && !displayed && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <Spinner className="w-6 h-6 text-indigo-500" />
          <p className="text-xs text-slate-400">Reading messages and analysing discussion…</p>
        </div>
      )}

      {loadingStored && !displayed && !isLoading && (
        <div className="flex items-center gap-2 py-4">
          <Spinner className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-500">Loading previous analysis…</span>
        </div>
      )}

      {error && <AIErrorBox error={error} onRetry={() => run(true)} />}

      {!displayed && !isLoading && !loadingStored && !error && (
        <div className="py-8 text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-500">
            No analysis yet. Click <span className="text-indigo-400 font-semibold">Analyse Discussion</span> to extract topics, decisions, and action items.
          </p>
        </div>
      )}

      {/* Results */}
      {displayed && (
        <div className="space-y-4">
          {/* Summary */}
          {displayed.summary && (
            <div className="p-4 bg-indigo-950/20 rounded-xl border border-indigo-500/20">
              <p className="text-sm text-indigo-100 leading-relaxed">{displayed.summary}</p>
            </div>
          )}

          {/* Sentiment */}
          {displayed.sentiment && (displayed.sentiment.overall || displayed.sentiment.engagement) && (
            <div className="flex items-center gap-3 text-xs">
              {displayed.sentiment.overall && (
                <span className={`px-2 py-1 rounded-full border font-medium ${
                  displayed.sentiment.overall === 'positive'
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400'
                    : displayed.sentiment.overall === 'negative'
                    ? 'bg-red-950/30 border-red-800/40 text-red-400'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400'
                }`}>
                  {displayed.sentiment.overall} sentiment
                </span>
              )}
              {displayed.sentiment.engagement && (
                <span className="px-2 py-1 rounded-full border bg-slate-800/50 border-slate-700 text-slate-400 font-medium">
                  {displayed.sentiment.engagement} engagement
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Topics */}
            {displayed.topics && displayed.topics.length > 0 && (
              <Section icon={<Tag className="w-3.5 h-3.5 text-indigo-400" />} title="Topics">
                {displayed.topics.map((t: any, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    <div>
                      <span className="text-xs text-slate-200 font-medium">{t.topic_name}</span>
                      {t.keywords && t.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {t.keywords.slice(0, 4).map((kw: string, ki: number) => (
                            <span key={ki} className="text-[10px] text-slate-500 bg-slate-800 rounded px-1">{kw}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {/* Decisions */}
            {displayed.decisions && displayed.decisions.length > 0 && (
              <Section icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />} title="Decisions">
                {displayed.decisions.map((d: any, i: number) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {d.decision_text}
                  </li>
                ))}
              </Section>
            )}

            {/* Action Items */}
            {displayed.action_items && displayed.action_items.length > 0 && (
              <Section icon={<ListTodo className="w-3.5 h-3.5 text-amber-400" />} title="Action Items">
                {displayed.action_items.map((a: any, i: number) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <ListTodo className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      {a.description}
                      {a.assignee_hint && (
                        <span className="text-[10px] text-slate-500 block">→ {a.assignee_hint}</span>
                      )}
                    </div>
                  </li>
                ))}
              </Section>
            )}

            {/* Blockers */}
            {displayed.blockers && displayed.blockers.length > 0 && (
              <Section icon={<AlertTriangle className="w-3.5 h-3.5 text-red-400" />} title="Blockers">
                {displayed.blockers.map((b: string, i: number) => (
                  <li key={i} className="text-xs text-red-300 flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </Section>
            )}

            {/* Problems */}
            {displayed.problems && displayed.problems.length > 0 && (
              <Section icon={<AlertTriangle className="w-3.5 h-3.5 text-orange-400" />} title="Problems">
                {displayed.problems.map((p: string, i: number) => (
                  <li key={i} className="text-xs text-orange-300 flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>
                    {p}
                  </li>
                ))}
              </Section>
            )}

            {/* Ideas */}
            {displayed.unresolved_issues && displayed.unresolved_issues.length > 0 && (
              <Section icon={<Lightbulb className="w-3.5 h-3.5 text-yellow-400" />} title="Unresolved Issues">
                {displayed.unresolved_issues.map((u, i) => (
                  <li key={i} className="text-xs text-yellow-300 flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5 flex-shrink-0">•</span>
                    {u}
                  </li>
                ))}
              </Section>
            )}
          </div>

          {/* Confidence */}
          {typeof displayed.confidence === 'number' && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">AI Confidence</span>
              <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${Math.round(displayed.confidence * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {Math.round(displayed.confidence * 100)}%
              </span>
            </div>
          )}

          {analyzedAt && (
            <p className="text-[10px] text-slate-600 text-right font-mono">
              {cached ? 'Cached' : 'Analysed'} {new Date(analyzedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {isLoading && displayed && (
        <div className="flex items-center gap-2 pt-2">
          <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          <span className="text-xs text-slate-400">Refreshing analysis…</span>
        </div>
      )}
    </Card>
  );
}

// ── Internal Section component ────────────────────────────────────────────────
function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{title}</h4>
      </div>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  );
}
