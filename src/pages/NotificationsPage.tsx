import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Check, FolderGit2, MessageSquare, CheckSquare, Sparkles, ArrowRight } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { useNavigate } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-white">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-400" /> Platform Notifications
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Faculty project assignments, team formation notices, and collaboration messages.
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={<Bell className="w-12 h-12 text-slate-500" />}
            title="No Notifications"
            description="You are all caught up! New project assignments and team messages will appear here."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              onClick={() => {
                markNotificationRead(n.id);
                if (n.actionUrl) {
                  // If it's a /projects/PRJ-XXX URL, navigate to /teams/PRJ-XXX
                  const target = n.actionUrl.replace('/projects/', '/teams/');
                  navigate(target);
                }
              }}
              className={`p-4 cursor-pointer transition-all hover:border-indigo-500/50 ${
                !n.read
                  ? 'bg-slate-900 border-indigo-500/40 ring-1 ring-indigo-500/20'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex justify-between items-start text-xs gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{n.title}</span>
                    <Badge
                      variant={
                        n.category === 'PROJECT_ASSIGNMENT'
                          ? 'success'
                          : n.category === 'ROLE_CHANGE'
                          ? 'purple'
                          : 'info'
                      }
                      size="sm"
                    >
                      {n.category.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{n.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                    <span>{new Date(n.timestamp).toLocaleString()}</span>
                    {n.actionUrl && (
                      <span className="text-indigo-400 font-semibold flex items-center gap-1">
                        Open Project Workspace <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {!n.read && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationRead(n.id);
                    }}
                    icon={<Check className="w-3.5 h-3.5" />}
                  >
                    Mark Read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
