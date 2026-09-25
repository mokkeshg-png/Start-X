import React from 'react';
import { useApp } from '../context/AppContext';
import { Send, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

export const CollaborationRequestsPage: React.FC = () => {
  const { requests, respondCollaborationRequest } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-white">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-400" /> Collaboration Requests Management
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review incoming and outgoing team invitations and student collaboration requests.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={<Send className="w-12 h-12 text-slate-500" />}
            title="No Collaboration Requests"
            description="You currently have no pending invitations. You can explore students and send invites from the Find Collaborators page."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={req.senderAvatar} alt={req.senderName} className="w-10 h-10 rounded-full object-cover bg-slate-800" />
                  <div>
                    <h4 className="font-bold text-white text-sm">{req.senderName}</h4>
                    <span className="text-xs text-indigo-400 font-semibold block">{req.suggestedRole}</span>
                  </div>
                </div>
                <Badge variant={req.status === 'Accepted' ? 'success' : req.status === 'Pending' ? 'warning' : 'error'}>
                  {req.status}
                </Badge>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
                <span className="font-semibold block text-white mb-1">Project: {req.projectTitle}</span>
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
      )}
    </div>
  );
};
