import React, { useState, useEffect } from 'react';
import { Brain, RefreshCw, AlertCircle } from 'lucide-react';
import { aiAnalysisService, AIAnalysisRequest } from '../services/aiAnalysisService';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Spinner } from './common/Spinner';

interface AIInsightsPanelProps {
  analysisType: AIAnalysisRequest['analysisType'];
  teamId?: string;
  studentId?: string;
  inputData?: any;
  title: string;
}

export function AIInsightsPanel({ analysisType, teamId, studentId, inputData, title }: AIInsightsPanelProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!forceRefresh) {
        const existing = await aiAnalysisService.getExistingAnalysis(analysisType, teamId, studentId);
        if (existing) {
          setAnalysis(existing.result_json);
          setIsLoading(false);
          return;
        }
      }

      const result = await aiAnalysisService.runAnalysis({
        analysisType,
        teamId,
        studentId,
        inputData
      });
      setAnalysis(result.result_json);
    } catch (err: any) {
      setError(err.message || 'AI analysis is currently unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [analysisType, teamId, studentId]);

  return (
    <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border-indigo-900/30">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Brain className="w-32 h-32 text-indigo-400" />
      </div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAnalysis(true)}
          disabled={isLoading}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          {isLoading ? 'AI is analyzing project data...' : 'Refresh AI Analysis'}
        </Button>
      </div>

      <div className="relative z-10 min-h-[100px]">
        {isLoading && !analysis ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Spinner className="w-6 h-6 text-indigo-500 mb-3" />
            <p className="text-xs text-slate-400">AI is analyzing project data...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-4 bg-red-950/20 text-red-400 rounded-lg text-sm border border-red-900/30">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            {analysis.summary && (
              <div className="p-4 bg-indigo-950/20 rounded-lg border border-indigo-500/20">
                <p className="text-sm text-indigo-100">{analysis.summary}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analysis).map(([key, value]) => {
                if (key === 'summary' || key === 'confidence' || key === 'student_id' || key === 'project_id') return null;
                
                return (
                  <div key={key} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                    <h3 className="text-xs font-semibold text-slate-400 capitalize mb-2">
                      {key.replace(/_/g, ' ')}
                    </h3>
                    {Array.isArray(value) ? (
                      <ul className="space-y-1">
                        {value.map((item: any, i: number) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-indigo-500 mt-0.5">•</span>
                            <span>{typeof item === 'object' ? JSON.stringify(item) : item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-300">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 text-right mt-2 font-mono">
              AI analysis updated. Confidence: {analysis.confidence ? (analysis.confidence * 100).toFixed(0) + '%' : 'N/A'}
            </p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
