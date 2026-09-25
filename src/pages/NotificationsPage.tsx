import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Check, Sparkles, MessageSquare, CheckSquare, Send } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useNavigate } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-500" /> Platform Notification Center
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Automated AI alerts, task updates, and collaboration invites.
        </p>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card
            key={n.id}
            onClick={() => {
              markNotificationRead(n.id);
              if (n.actionUrl) navigate(n.actionUrl);
            }}
            className={`p-4 cursor-pointer transition-all ${
              !n.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800' : ''
            }`}
          >
            <div className="flex justify-between items-start text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{n.title}</span>
                  <Badge variant={n.category === 'AI Alert' ? 'error' : 'info'} size="sm">{n.category}</Badge>
                </div>
                <p className="text-slate-600 dark:text-slate-400">{n.description}</p>
                <span className="text-[10px] text-slate-400 block pt-1">{n.timestamp}</span>
              </div>

              {!n.read && (
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); markNotificationRead(n.id); }} icon={<Check className="w-3.5 h-3.5" />}>
                  Mark Read
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
