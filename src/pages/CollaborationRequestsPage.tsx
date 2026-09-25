import React from 'react';
import { useApp } from '../context/AppContext';
import { Send, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const CollaborationRequestsPage: React.FC = () => {
  const { requests, respondCollaborationRequest } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-500" /> Collaboration Requests Management
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review pending team invitations and collaboration requests from other student teams.
        </p>
      </div>

      <div className="space-y-4">
        {requests.map((req) => (
          <Card key={req.id} className="p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src={req.senderAvatar} alt={req.senderName} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{req.senderName}</h4>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold block">{req.suggestedRole}</span>
                </div>
              </div>
              <Badge variant={req.status === 'Accepted' ? 'success' : req.status === 'Pending' ? 'warning' : 'error'}>
                {req.status}
              </Badge>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold block text-slate-900 dark:text-white mb-1">Project: {req.projectTitle}</span>
              "{req.message}"
            </div>

            {req.status === 'Pending' && (
              <div className="flex gap-2 justify-end pt-1 text-xs">
                <Button size="sm" variant="danger" onClick={() => respondCollaborationRequest(req.id, 'Rejected')}>
                  Reject Request
                </Button>
                <Button size="sm" variant="primary" onClick={() => respondCollaborationRequest(req.id, 'Accepted')}>
                  Accept Invitation
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
