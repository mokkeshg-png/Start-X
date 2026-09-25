import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Search, Users, CheckSquare, FileText, MessageSquare, Sparkles, X } from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, teams, tasks, documents, discussions } = useApp();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const filteredTeams = teams.filter(
    (t) => t.name.toLowerCase().includes(query.toLowerCase()) || t.projectTitle.toLowerCase().includes(query.toLowerCase())
  );
  const filteredTasks = tasks.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()));
  const filteredDocs = documents.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()));
  const filteredDiscussions = discussions.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (path: string) => {
    setIsCommandPaletteOpen(false);
    setQuery('');
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Search Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search teams, projects, tasks, documents, discussions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-sm"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim() === '' && (
            <div className="p-4 text-xs text-slate-400 text-center">
              Type keywords to search across APEX Platform. Try <span className="font-mono text-indigo-500">"Alpha"</span>, <span className="font-mono text-indigo-500">"Auth"</span>, or <span className="font-mono text-indigo-500">"API"</span>.
            </div>
          )}

          {filteredTeams.length > 0 && (
            <div className="mb-3">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Teams & Projects
              </div>
              {filteredTeams.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelect(`/teams/${t.id}`)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm"
                >
                  <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-900 dark:text-white">{t.name}</span>
                    <span className="text-slate-500 text-xs ml-2 truncate">({t.projectTitle})</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredTasks.length > 0 && (
            <div className="mb-3">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Tasks
              </div>
              {filteredTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelect(`/teams/${t.teamId}/tasks`)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm"
                >
                  <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-medium text-slate-900 dark:text-white truncate">{t.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 ml-auto">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {filteredDocs.length > 0 && (
            <div className="mb-3">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Documents
              </div>
              {filteredDocs.map((d) => (
                <div
                  key={d.id}
                  onClick={() => handleSelect(`/teams/${d.teamId}/documents`)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm"
                >
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="font-medium text-slate-900 dark:text-white truncate">{d.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
          <span>Navigate with mouse or arrow keys</span>
          <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">ESC to close</span>
        </div>
      </div>
    </div>
  );
};
