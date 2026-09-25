import React from 'react';
import { useApp } from '../context/AppContext';
import { History, ShieldCheck } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

export const AuditLogPage: React.FC = () => {
  const { activityLogs } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-white">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" /> Institutional Audit Activity Timeline
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Governance log tracking authorized email additions, user registrations, project formations, and submissions.
        </p>
      </div>

      <Card className="p-6">
        {activityLogs.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<History className="w-12 h-12 text-slate-500" />}
              title="No Audit Activities Yet"
              description="System governance events such as user authorizations, registrations, and project creations will be recorded here."
            />
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-950 text-indigo-400 font-bold flex items-center justify-center shrink-0 border border-indigo-800/50">
                    {log.actorName[0] || 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-white">
                      {log.actorName} <span className="text-slate-400 font-normal">({log.actorRole})</span> —{' '}
                      <span className="text-indigo-400 font-semibold">{log.action}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px] block mt-0.5">{log.object}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
