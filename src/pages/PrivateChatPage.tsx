import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, Send, Users, ShieldAlert } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { apiService } from '../services/apiService';
import { Message, Project } from '../types';

export const PrivateChatPage: React.FC = () => {
  const { currentUser, projects } = useApp();

  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  // Find user's accessible projects
  const userProjects = projects.filter((p) => {
    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.role === 'TEACHER') return p.teacherId === currentUser.id;
    return p.teamLeaderId === currentUser.id || p.memberIds.includes(currentUser.id);
  });

  useEffect(() => {
    if (userProjects.length > 0 && !activeProject) {
      setActiveProject(userProjects[0]);
    }
  }, [userProjects]);

  useEffect(() => {
    if (activeProject) {
      apiService.getMessages('TEAM_CHAT', activeProject.id).then(setMessages);
    }
  }, [activeProject]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeProject) return;

    await apiService.sendMessage({
      channelType: 'TEAM_CHAT',
      channelId: activeProject.id,
      sender: currentUser,
      text: input.trim()
    });

    setInput('');
    const updated = await apiService.getMessages('TEAM_CHAT', activeProject.id);
    setMessages(updated);
  };

  if (userProjects.length === 0) {
    return (
      <div className="p-8 text-center space-y-3 bg-slate-900 border border-slate-800 rounded-2xl max-w-lg mx-auto text-white mt-12">
        <MessageSquare className="w-10 h-10 text-slate-500 mx-auto" />
        <h2 className="text-base font-bold">No Active Project Chat Available</h2>
        <p className="text-xs text-slate-400">
          You are not currently assigned to any active project teams. Once assigned by a faculty member, your team channel will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" /> Scoped Project Team Chat
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Communication channel scoped strictly to assigned project team members.
          </p>
        </div>

        {userProjects.length > 1 && (
          <select
            value={activeProject?.id}
            onChange={(e) => {
              const found = userProjects.find((p) => p.id === e.target.value);
              if (found) setActiveProject(found);
            }}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
          >
            {userProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id})
              </option>
            ))}
          </select>
        )}
      </div>

      <Card className="p-6 h-[520px] flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
          <span>Active Channel: <strong className="text-white">{activeProject?.name}</strong></span>
          <span className="font-mono text-indigo-400">{activeProject?.id}</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 p-2 text-xs">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <MessageSquare className="w-10 h-10 stroke-1 text-slate-600" />
              <div className="font-bold text-slate-300">No chat messages yet</div>
              <p className="text-[11px] max-w-xs text-slate-500">
                Start the real-time project collaboration discussion with your team below.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === currentUser.id;
              return (
                <div key={m.id} className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <Avatar src={m.senderAvatar} name={m.senderName} size="sm" />
                  <div
                    className={`p-3 rounded-xl max-w-[80%] space-y-1 ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-xs'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-4 text-[10px]">
                      <span className="font-bold">{m.senderName} ({m.senderRole})</span>
                      <span className="opacity-70">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="leading-relaxed text-xs">{m.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-slate-800">
          <input
            type="text"
            placeholder="Type your team message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Button type="submit" variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
};
