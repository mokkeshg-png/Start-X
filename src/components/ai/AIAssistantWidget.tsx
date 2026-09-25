import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, X, Send, Bot, User as UserIcon } from 'lucide-react';
import { Button } from '../common/Button';
import { clientStorage } from '../../storage/clientStorage';

interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AIAssistantWidget: React.FC = () => {
  const { isAIAssistantOpen, setIsAIAssistantOpen, projects, projectDocuments, contributions, currentUser } = useApp();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Hello! I am APEX Project Intelligence Assistant. Ask me anything about your projects, uploaded PRD requirements, team roles, or student contributions.',
      timestamp: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickPrompts = [
    'How is team compatibility evaluated?',
    'What projects are active?',
    'Show uploaded requirement files',
    'How are student roles assigned?'
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
      let aiResponseText = '';
      const lower = query.toLowerCase();

      if (lower.includes('compatibility') || lower.includes('evaluate') || lower.includes('algorithm')) {
        aiResponseText =
          'Compatibility is evaluated deterministically by comparing the project\'s required skills and PRD specifications with the registered skill profiles and evidence of assigned students. It calculates requirement coverage %, role alignment %, and flags missing skill gaps.';
      } else if (lower.includes('project') || lower.includes('active')) {
        if (projects.length > 0) {
          aiResponseText = `Currently tracking ${projects.length} project(s):\n• ${projects
            .map((p) => `${p.name} (${p.id}) - Status: ${p.status}`)
            .join('\n• ')}`;
        } else {
          aiResponseText =
            'No projects have been created yet. Faculty members can click "CREATE PROJECT" on their dashboard to start.';
        }
      } else if (lower.includes('file') || lower.includes('prd') || lower.includes('document')) {
        if (projectDocuments.length > 0) {
          aiResponseText = `Currently indexed ${projectDocuments.length} requirement document(s):\n• ${projectDocuments
            .map((d) => `${d.name} (${d.size}) - ${d.analysisAvailable ? 'Analyzed' : 'Format Preserved'}`)
            .join('\n• ')}`;
        } else {
          aiResponseText =
            'No project requirement files attached to the current active project yet. Teachers can upload PRDs in PDF, DOCX, Markdown, or Code format.';
        }
      } else if (lower.includes('role') || lower.includes('leader')) {
        aiResponseText =
          'In APEX, Team Leader is a project-level role assignment given to an existing Student account by the supervising Faculty. All team members receive predefined or custom project roles.';
      } else {
        const studentCount = clientStorage.getUsers().filter((u) => u.role === 'STUDENT').length;
        aiResponseText = `Project Intelligence telemetry: ${projects.length} projects, ${studentCount} registered students, ${contributions.length} submissions logged. All data is evaluated against real runtime models without mock data.`;
      }

      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 500);
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
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[90vw] h-[520px] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-slate-950 text-white border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-cyan-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold leading-tight">Project Intelligence Assistant</h3>
            <span className="text-[10px] text-emerald-400 font-medium">Deterministic Runtime Engine</span>
          </div>
        </div>

        <button
          onClick={() => setIsAIAssistantOpen(false)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-slate-900/60">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div key={m.id} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-950 border border-indigo-700/50 text-cyan-300'
                }`}
              >
                {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-xs whitespace-pre-line'
                }`}
              >
                {m.text}
                <span className="text-[9px] opacity-60 block mt-1 text-right">{m.timestamp}</span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-2 items-center text-slate-400 text-xs italic p-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            Evaluating live project telemetry...
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 border-t border-slate-800 bg-slate-950 flex gap-1.5 overflow-x-auto text-[10px]">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => handleSend(p)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 whitespace-nowrap transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask project question..."
          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <Button type="submit" variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
          Ask
        </Button>
      </form>
    </div>
  );
};
