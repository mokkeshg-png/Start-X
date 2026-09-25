import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { canViewChat } from '../auth/authorization';
import { AccessRestrictedPage } from '../auth/accessControl';
import { MessageSquare, Send } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

import { Avatar } from '../components/common/Avatar';

export const PrivateChatPage: React.FC = () => {
  const { currentUser } = useApp();

  if (!canViewChat(currentUser, 'team-alpha')) {
    return <AccessRestrictedPage reason="Private team chat workspaces are restricted to assigned team members and team leaders." />;
  }

  const [messages, setMessages] = useState<Array<{ id: string; senderName: string; avatar: string; text: string; time: string }>>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: String(Date.now()),
      senderName: currentUser.name,
      avatar: currentUser.avatar,
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500" /> Private Team Workspace Chat
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Encrypted team workspace messaging for real-time sprint coordination.
        </p>
      </div>

      <Card className="p-6 h-[500px] flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto space-y-3 p-2 text-xs">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <MessageSquare className="w-10 h-10 stroke-1" />
              <div className="font-bold text-slate-700 dark:text-slate-300">No chat messages yet</div>
              <p className="text-[11px] max-w-xs">Start the real-time sprint discussion with your team members below.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="flex items-start gap-2.5">
                <Avatar src={m.avatar} name={m.senderName} size="sm" />
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl max-w-[80%] space-y-1">
                  <div className="flex justify-between items-center gap-4">
                    <span className="font-bold text-slate-900 dark:text-white">{m.senderName}</span>
                    <span className="text-[9px] text-slate-400">{m.time}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <input
            type="text"
            placeholder="Type team message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs focus:outline-none"
          />
          <Button variant="primary" size="sm" onClick={handleSend} icon={<Send className="w-3.5 h-3.5" />} />
        </div>
      </Card>
    </div>
  );
};
