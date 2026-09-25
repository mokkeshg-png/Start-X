/**
 * CollaborationGapsPanel
 * Shows detected collaboration and dependency gaps for a team.
 * Loads from DB on mount; can trigger a fresh AI analysis.
 */
import React, { useEffect, useState } from 'react';
import { Brain, AlertTriangle, ShieldAlert, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';
import { Badge } from '../common/Badge';
import { AIErrorBox } from './AIErrorBox';
import { AIStatusBadge } from './AIStatusBadge';
import { useAIAnalysis } from './useAIAnalysis';
import { aiAnalysisService } from '../../services/aiAnalysisService';

interface Props { teamId: string; }

const SEVERITY_CLASSES: Record<string, string> = {
  critical: 'border-red-800/50 bg-red-950/20',
  high:     'border-orange-800/50 bg-orange-950/20',
  medium:   'border-amber-800/50 bg-amber-950/20',
  low:      'border-slate-700 bg-slate-900/40',
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-950 text-red-400 border border-red-800',
  high:     'bg-orange-950 text-orange-400 border border-orange-800',
  medium:   'bg-amber-950 text-amber-400 border border-amber-800',
  low:      'bg-slate-800 text-slate-400 border border-slate-700',
};

export function CollaborationGapsPanel({ teamId }: Props) {
  const { isLoading, error, analyzedAt, run } = useAIAnalysis(
    { analysisType: 'collaboration_gap', teamId },
    { autoRun: false }
  );

  const [collabGaps, setCollabGaps] = useState<any[]>([]);
  const [depGaps, setDepGaps] = useState<any[]>([]);
  const [loadingDB, setLoadingDB] = useState(true);

  const loadGaps = async () => {
    setLoadingDB(true);
    try {
      const [c, d] = await Promise.all([
        aiAnalysisService.getCollaborationGaps(teamId),
        aiAnalysisService.getDependencyGaps(teamId),
      ]);
      setCollabGaps(c);
      setDepGaps(d);
    } catch {
      // non-fatal
    } finally {
      setLoadingDB(false);
    }
  };

  useEffect(() => { loadGaps(); }, [teamId]);

  const handleRun = async () => {
    await run(true);
    await loadGaps();
  };

  const totalGaps = collabGaps.length + depGaps.length;

  return (
    <Card className="p-6 space-y-5 bg-gradient-to-br from-slate-900 to-slate-950 border-indigo-900/30">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-orange-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Collaboration Gaps</h3>
          {totalGaps > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-950 text-orange-400 border border-orange-800">
              {totalGaps} open
            </span>
          )}
          {analyzedAt && <AIStatusBadge cached={false} analyzedAt={analyzedAt} />}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRun}
          disabled={isLoading}
          icon={<Brain className={`w-3.5 h-3.5 ${isLoading ? 'animate-pulse' : ''}`} />}
        >
          {isLoading ? 'Detecting gaps…' : 'Detect Gaps'}
        </Button>
      </div>

      {(isLoading || loadingDB) && totalGaps === 0 && (
        <div className="flex items-center justify-center py-8 gap-3">
          <Spinner className="w-5 h-5 text-orange-500" />
          <span className="text-xs text-slate-400">{isLoading ? 'Running AI analysis…' : 'Loading gaps…'}</span>
        </div>
      )}

      {error && <AIErrorBox error={error} onRetry={handleRun} />}

      {!loadingDB && !isLoading && totalGaps === 0 && !error && (
        <div className="py-8 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <p className="text-xs text-slate-400">No open collaboration gaps detected.</p>
          <p className="text-[10px] text-slate-600">Click <span className="text-orange-400">Detect Gaps</span> to run AI analysis.</p>
        </div>
      )}

      {collabGaps.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Communication & Collaboration</h4>
          {collabGaps.map((gap) => (
            <GapCard key={gap.gap_id} gap={gap} />
          ))}
        </div>
      )}

      {depGaps.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Task Dependencies & Blockers</h4>
          {depGaps.map((gap) => (
            <GapCard key={gap.gap_id} gap={gap} />
          ))}
        </div>
      )}
    </Card>
  );
}

function GapCard({ gap }: { gap: any }) {
  const severity = gap.severity ?? 'medium';
  return (
    <div className={`p-3 rounded-xl border ${SEVERITY_CLASSES[severity] ?? SEVERITY_CLASSES.medium}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${SEVERITY_BADGE[severity] ?? SEVERITY_BADGE.medium}`}>
            {severity}
          </span>
          <span className="text-xs font-semibold text-slate-200">{gap.title}</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
          {gap.gap_type?.replace(/_/g, ' ')}
        </span>
      </div>
      {gap.description && (
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{gap.description}</p>
      )}
    </div>
  );
}
