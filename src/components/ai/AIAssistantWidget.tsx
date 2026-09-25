import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, X, Send, Bot, User as UserIcon, CornerDownLeft } from 'lucide-react';
import { Button } from '../common/Button';

interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AIAssistantWidget: React.FC = () => {
  const { isAIAssistantOpen, setIsAIAssistantOpen, teams, tasks, gaps, discussions } = useApp();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Hello! I am APEX Project Intelligence AI. Ask me anything about your project teams, blocked tasks, active gaps, or contribution analysis.',
      timestamp: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickPrompts = [
    "Why is Team Alpha flagged?",
    "Which tasks are blocked?",
    "Show unresolved discussions",
    "Which role has the largest skill gap?"
  ];

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: AIMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let aiResponseText = "";
      const lower = query.toLowerCase();

      if (lower.includes("team alpha") || lower.includes("flagged")) {
        aiResponseText = "Team Alpha is flagged with health score 78/100 due to a critical dependency block on Task #5 (Payment Gateway API) and low QA participation for Jane Smith.";
      } else if (lower.includes("blocked") || lower.includes("task")) {
        const blocked = tasks.filter((t) => t.status === "Blocked");
        if (blocked.length > 0) {
          aiResponseText = `Currently ${blocked.length} blocked task(s):\n• ${blocked.map((b) => `${b.title} (Assigned: ${b.assignedToId})`).join('\n• ')}`;
        } else {
          aiResponseText = "No tasks are currently blocked across your active teams!";
        }
      } else if (lower.includes("unresolved") || lower.includes("discussion")) {
        const unres = discussions.filter((d) => !d.resolved);
        aiResponseText = `Found ${unres.length} unresolved discussion thread(s):\n• ${unres.map((d) => `${d.title} (${d.topic})`).join('\n• ')}`;
      } else if (lower.includes("skill gap") || lower.includes("role")) {
        aiResponseText = "The largest detected skill gap is for Database Specialist in Team Gamma (IoT Energy Grid), which currently lacks a dedicated database architect.";
      } else {
        const alpha = teams.find((t) => t.id === 'team-alpha');
        aiResponseText = `Project Intelligence Overview: Active Teams: ${teams.length}. Team Alpha is at ${alpha?.progress || 65}% progress. All AI insights are calculated from live project telemetry.`;
      }

      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  if (!isAIAssistantOpen) {
    return (
      <button
        onClick={() => setIsAIAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-full shadow-2xl hover:scale-105 transition-all ai-glow-border group cursor-pointer"
      >
        <Sparkles className="w-5 h-5 animate-pulse text-cyan-300" />
        <span className="text-sm font-semibold tracking-wide">Ask Project AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[90vw] h-[520px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-indigo-200 dark:border-indigo-900/60 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-800/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-cyan-300">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-1.5">
              APEX Project AI <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            </h4>
            <p className="text-[10px] text-indigo-200/80">Contextual Project Intelligence Assistant</p>
          </div>
        </div>
        <button
          onClick={() => setIsAIAssistantOpen(false)}
          className="text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 whitespace-pre-line ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none'
              }`}
            >
              <p className="leading-relaxed">{m.text}</p>
              <span className="block text-[9px] opacity-60 text-right mt-1">{m.timestamp}</span>
            </div>
            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-indigo-500 font-medium italic">
            <Bot className="w-4 h-4 animate-bounce" /> Analyzing project telemetry...
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask AI about teams, tasks, gaps..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 text-xs px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <Button
          size="sm"
          variant="ai"
          onClick={() => handleSend()}
          icon={<Send className="w-3.5 h-3.5" />}
        />
      </div>
    </div>
  );
};
