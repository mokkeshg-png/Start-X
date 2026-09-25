import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HelpCircle, X, Send, Bot, User as UserIcon } from 'lucide-react';
import { Button } from '../common/Button';

interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AIAssistantWidget: React.FC = () => {
  const { isAIAssistantOpen, setIsAIAssistantOpen, projects } = useApp();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Welcome to the Agni Project Intelligence Assistant. You can query project criteria, PRD requirement guidelines, compatibility analytics, or submission workflows.',
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
          aiResponseText = 'No active academic projects are currently recorded in the system.';
        }
      } else if (lower.includes('document') || lower.includes('prd') || lower.includes('requirement')) {
        aiResponseText =
          'Requirement documents (PRD, SRS, Architecture Specs) can be uploaded directly by the faculty supervisor during project creation or via the Project Workspace Documents tab.';
      } else if (lower.includes('role') || lower.includes('leader') || lower.includes('assign')) {
        aiResponseText =
          'Faculty supervisors assign students to teams with predefined roles (Frontend, Backend, AI/ML, QA, etc.) or custom roles. A designated Team Leader is assigned from within the team to coordinate milestones.';
      } else {
        aiResponseText = `Project Intelligence response for "${query}": All project requirements, student skill profiles, and contribution submissions are validated against official institutional criteria.`;
      }

      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 400);
  };

  if (!isAIAssistantOpen) {
    return (
      <button
        onClick={() => setIsAIAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg shadow-xl transition-all hover:border-slate-600 text-xs font-medium cursor-pointer"
        title="Institutional Project Assistant"
      >
        <HelpCircle className="w-4 h-4 text-blue-400" />
        <span className="font-semibold tracking-wide">Project Assistant</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[90vw] h-[500px] bg-slate-900 rounded-lg shadow-2xl border border-slate-700 flex flex-col overflow-hidden text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 text-white border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-blue-500/20 text-blue-400">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold leading-tight">Project Intelligence Assistant</h3>
            <span className="text-[10px] text-slate-400">Agni Institutional Knowledge Base</span>
          </div>
        </div>

        <button
          onClick={() => setIsAIAssistantOpen(false)}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-slate-900">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div key={m.id} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-blue-400'
                }`}
              >
                {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`p-3 rounded-lg max-w-[80%] leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 whitespace-pre-line'
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
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Querying academic project records...
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 border-t border-slate-800 bg-slate-950 flex gap-1.5 overflow-x-auto text-[10px]">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => handleSend(p)}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 whitespace-nowrap transition-colors"
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
          placeholder="Type an academic project inquiry..."
          className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <Button type="submit" variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
          Send
        </Button>
      </form>
    </div>
  );
};
