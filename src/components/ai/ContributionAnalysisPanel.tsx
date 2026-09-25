/**
 * ContributionAnalysisPanel
 * Shows AI analysis of a student's individual contribution to a team.
 * Triggered by an explicit user action.
 */
import React from 'react';
import {
  Brain, BarChart3, CheckCircle2, XCircle,
  AlertTriangle, ArrowRight, ShieldAlert
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';
import { AIErrorBox } from './AIErrorBox';
import { AIStatusBadge } from './AIStatusBadge';
import { useAIAnalysis } from './useAIAnalysis';

interface Props {
  teamId: string;
  studentId: string;
  contributionId?: string;
  /** Student display name for context */
  studentName?: string;
}

interface ContribResult {
  role: string;
  role_alignment_score: number;
  quality_score: number;
  complexity_score: number;
  completed_responsibilities: string[];
  incomplete_responsibilities: string[];
  evidence: string[];
  blockers: string[];
  collaboration_notes: string;
  next_action: string;
  summary: string;
  confidence: number;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 75 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{label}</span>
        <span className="font-mono text-slate-300">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function ContributionAnalysisPanel({ teamId, studentId, contributionId, studentName }: Props) {
  const { result, isLoading, error, cached, analyzedAt, run } =
    useAIAnalysis<ContribResult>(
      {
        analysisType: 'contribution_analysis',
        teamId,
        studentId,
        contributionId,
      },
      { autoRun: false }
    );

  return (
    <Card className="p-6 space-y-5 bg-gradient-to-br from-slate-900 to-slate-950 border-indigo-900/30">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Contribution Analysis
            {studentName && (
              <span className="ml-2 text-indigo-300 normal-case font-normal text-xs">— {studentName}</span>
            )}
          </h3>
          {result && <AIStatusBadge cached={cached} analyzedAt={analyzedAt ?? undefined} />}
        </div>
        <Button
          variant="ai"
          size="sm"
          onClick={() => run(true)}
          disabled={isLoading}
          icon={<Brain className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />}
        >
          {isLoading ? 'Analysing…' : 'Analyse Contribution'}
        </Button>
      </div>

      {isLoading && !result && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <Spinner className="w-6 h-6 text-indigo-500" />
          <p className="text-xs text-slate-400">Analysing tasks and contributions…</p>
        </div>
      )}

      {error && <AIErrorBox error={error} onRetry={() => run(true)} />}

      {!result && !isLoading && !error && (
        <p className="text-xs text-slate-500 py-6 text-center">
          Click <span className="text-indigo-400 font-semibold">Analyse Contribution</span> to evaluate role alignment and evidence.
        </p>
      )}

      {result && (
        <div className="space-y-4">
          {result.summary && (
            <div className="p-4 bg-indigo-950/20 rounded-xl border border-indigo-500/20">
              <p className="text-sm text-indigo-100">{result.summary}</p>
            </div>
          )}

          {result.role && (
            <p className="text-xs text-slate-400">
              Assigned role: <span className="text-white font-semibold">{result.role}</span>
            </p>
          )}

          {/* Score bars */}
          {(result.role_alignment_score || result.quality_score || result.complexity_score) && (
            <div className="space-y-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3">
                AI-Derived Scores (evidence-based estimates)
              </p>
              {result.role_alignment_score !== undefined && (
                <ScoreBar label="Role Alignment" value={result.role_alignment_score} />
              )}
              {result.quality_score !== undefined && (
                <ScoreBar label="Quality Indicator" value={result.quality_score} />
              )}
              {result.complexity_score !== undefined && (
                <ScoreBar label="Complexity" value={result.complexity_score} />
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.completed_responsibilities?.length > 0 && (
              <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-900/30">
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Completed</span>
                </div>
                <ul className="space-y-1">
                  {result.completed_responsibilities.map((r, i) => (
                    <li key={i} className="text-xs text-emerald-300 flex items-start gap-1.5">
                      <span className="mt-0.5 flex-shrink-0">✓</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.incomplete_responsibilities?.length > 0 && (
              <div className="p-3 bg-amber-950/20 rounded-xl border border-amber-900/30">
                <div className="flex items-center gap-1.5 mb-2">
                  <XCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Incomplete</span>
                </div>
                <ul className="space-y-1">
                  {result.incomplete_responsibilities.map((r, i) => (
                    <li key={i} className="text-xs text-amber-300 flex items-start gap-1.5">
                      <span className="mt-0.5 flex-shrink-0">○</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.blockers?.length > 0 && (
              <div className="p-3 bg-red-950/20 rounded-xl border border-red-900/30">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Blockers</span>
                </div>
                <ul className="space-y-1">
                  {result.blockers.map((b, i) => (
                    <li key={i} className="text-xs text-red-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />{b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.evidence?.length > 0 && (
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Evidence</span>
                </div>
                <ul className="space-y-1">
                  {result.evidence.map((e, i) => (
                    <li key={i} className="text-xs text-slate-300">• {e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {result.next_action && (
            <div className="flex items-start gap-2 p-3 bg-indigo-950/20 rounded-xl border border-indigo-800/30">
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider block mb-0.5">
                  Suggested Next Action
                </span>
                <p className="text-xs text-indigo-200">{result.next_action}</p>
              </div>
            </div>
          )}

          {typeof result.confidence === 'number' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">AI Confidence</span>
              <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.round(result.confidence * 100)}%` }} />
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{Math.round(result.confidence * 100)}%</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
