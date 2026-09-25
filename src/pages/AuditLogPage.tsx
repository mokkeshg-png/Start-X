import React from 'react';
import { useApp } from '../context/AppContext';
import { History, ShieldCheck } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

export const AuditLogPage: React.FC = () => {
  const { activityLogs } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" /> Institutional Audit Activity Timeline
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Governance log tracking team modifications, document submissions, and AI analyses.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4 text-xs">
          {activityLogs.map((log) => (
            <div key={log.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0">
                  {log.actorName[0]}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {log.actorName} <span className="text-slate-400 font-normal">({log.actorRole})</span> — <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{log.action}</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px] block mt-0.5">{log.object}</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400">{log.timestamp}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
