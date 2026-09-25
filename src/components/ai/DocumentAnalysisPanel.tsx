/**
 * DocumentAnalysisPanel
 * Analyzes a single document. Text extraction is done client-side
 * for text/* files and passed to the Edge Function via inputData.
 */
import React, { useState, useEffect } from 'react';
import {
  Brain, FileText, Tag, ShieldAlert,
  Lightbulb, AlertTriangle, RefreshCw
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';
import { AIErrorBox } from './AIErrorBox';
import { AIStatusBadge } from './AIStatusBadge';
import { useAIAnalysis } from './useAIAnalysis';
import { aiAnalysisService } from '../../services/aiAnalysisService';

interface Props {
  documentId: string;
  documentName: string;
  /** Pass if you already have signed URL */
  documentUrl?: string;
  fileMimeType?: string;
}

export function DocumentAnalysisPanel({ documentId, documentName, documentUrl, fileMimeType }: Props) {
  const [documentText, setDocumentText] = useState<string | undefined>(undefined);
  const [extracting, setExtracting] = useState(false);
  const [storedAnalysis, setStoredAnalysis] = useState<any>(null);

  // Fetch existing analysis from DB on mount
  useEffect(() => {
    aiAnalysisService.getDocumentAnalysis(documentId).then(setStoredAnalysis).catch(() => {});
  }, [documentId]);

  // Extract text from text/* documents
  useEffect(() => {
    if (!documentUrl || !fileMimeType) return;
    const isTextFile = fileMimeType.startsWith('text/') || fileMimeType === 'application/json';
    if (!isTextFile) return;

    setExtracting(true);
    fetch(documentUrl)
      .then((r) => r.text())
      .then((text) => setDocumentText(text.slice(0, 8000)))
      .catch(() => setDocumentText('[Could not extract text from this document]'))
      .finally(() => setExtracting(false));
  }, [documentUrl, fileMimeType]);

  const { result, isLoading, error, cached, analyzedAt, run } = useAIAnalysis(
    {
      analysisType: 'document_intelligence',
      documentId,
      inputData: documentText ? { documentText } : undefined,
    },
    { autoRun: false }
  );

  const displayed = result ?? (storedAnalysis ? {
    extracted_topics: storedAnalysis.extracted_topics ?? [],
    technical_decisions: storedAnalysis.technical_decisions ?? [],
    contributions_mentioned: storedAnalysis.contributions_mentioned ?? [],
    summary: storedAnalysis.summary,
    ...storedAnalysis.ai_metadata,
  } : null);

  return (
    <Card className="p-5 space-y-4 bg-gradient-to-br from-slate-900 to-slate-950 border-indigo-900/30">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Document Analysis</span>
          {displayed && <AIStatusBadge cached={cached || !!storedAnalysis} analyzedAt={analyzedAt ?? storedAnalysis?.analyzed_at} />}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => run(true)}
          disabled={isLoading || extracting}
          icon={<Brain className={`w-3.5 h-3.5 ${isLoading ? 'animate-pulse' : ''}`} />}
        >
          {extracting ? 'Extracting text…' : isLoading ? 'Analysing…' : 'Analyse Document'}
        </Button>
      </div>

      <p className="text-xs text-slate-500">
        <FileText className="w-3 h-3 inline mr-1 text-indigo-400" />
        {documentName}
        {!documentUrl && (
          <span className="ml-2 text-amber-500 text-[10px]">
            (Note: PDF/binary files require text extraction. Plain text files are extracted automatically.)
          </span>
        )}
      </p>

      {isLoading && !displayed && (
        <div className="flex items-center justify-center py-8 gap-3">
          <Spinner className="w-5 h-5 text-indigo-500" />
          <span className="text-xs text-slate-400">Analysing document content…</span>
        </div>
      )}

      {error && <AIErrorBox error={error} onRetry={() => run(true)} />}

      {!displayed && !isLoading && !error && (
        <p className="text-xs text-slate-500 py-4 text-center">
          Click <span className="text-indigo-400 font-semibold">Analyse Document</span> to extract topics, requirements, and decisions.
        </p>
      )}

      {displayed && (
        <div className="space-y-3">
          {displayed.summary && (
            <div className="p-3 bg-indigo-950/20 rounded-xl border border-indigo-500/20">
              <p className="text-xs text-indigo-100 leading-relaxed">{displayed.summary}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayed.extracted_topics?.length > 0 && (
              <DocSection icon={<Tag className="w-3 h-3 text-indigo-400" />} title="Topics">
                {displayed.extracted_topics.map((t: any, i: number) => (
                  <li key={i} className="text-xs text-slate-300">
                    • {typeof t === 'object' ? (t.topic ?? JSON.stringify(t)) : t}
                    {typeof t === 'object' && t.importance && (
                      <span className="text-[10px] text-slate-500 ml-1">({t.importance})</span>
                    )}
                  </li>
                ))}
              </DocSection>
            )}

            {displayed.technical_decisions?.length > 0 && (
              <DocSection icon={<Lightbulb className="w-3 h-3 text-amber-400" />} title="Technical Decisions">
                {displayed.technical_decisions.map((d: string, i: number) => (
                  <li key={i} className="text-xs text-amber-200">• {d}</li>
                ))}
              </DocSection>
            )}

            {displayed.requirements?.length > 0 && (
              <DocSection icon={<FileText className="w-3 h-3 text-emerald-400" />} title="Requirements">
                {displayed.requirements.map((r: string, i: number) => (
                  <li key={i} className="text-xs text-emerald-200">• {r}</li>
                ))}
              </DocSection>
            )}

            {displayed.risks?.length > 0 && (
              <DocSection icon={<AlertTriangle className="w-3 h-3 text-red-400" />} title="Risks">
                {displayed.risks.map((r: string, i: number) => (
                  <li key={i} className="text-xs text-red-300">• {r}</li>
                ))}
              </DocSection>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function DocSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
      </div>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}
