import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Search, FolderGit2, FileText, User, X, Mail } from 'lucide-react';
import { clientStorage } from '../../storage/clientStorage';

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, projects, projectDocuments, authorizedEmails } = useApp();
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

  const users = clientStorage.getUsers();

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.id.toLowerCase().includes(query.toLowerCase()) ||
      p.problemStatement.toLowerCase().includes(query.toLowerCase())
  );

  const filteredDocs = projectDocuments.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      (u.studentId && u.studentId.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelect = (path: string) => {
    setIsCommandPaletteOpen(false);
    setQuery('');
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 rounded-xl shadow-2xl border border-slate-800 overflow-hidden text-white">
        {/* Search Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search projects, students, documents, authorized emails..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-4 text-xs">
          {filteredProjects.length > 0 && (
            <div>
              <div className="px-3 py-1 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                Projects ({filteredProjects.length})
              </div>
              <div className="space-y-1">
                {filteredProjects.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(`/teams/${p.id}`)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FolderGit2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-semibold text-white group-hover:text-indigo-400 truncate">
                        {p.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">{p.id}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredUsers.length > 0 && (
            <div>
              <div className="px-3 py-1 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                Registered Students & Faculty ({filteredUsers.length})
              </div>
              <div className="space-y-1">
                {filteredUsers.slice(0, 4).map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelect(u.role === 'STUDENT' ? '/find-teammates' : '/dashboard')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <User className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-white group-hover:text-emerald-400 truncate">
                        {u.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {u.studentId || u.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredDocs.length > 0 && (
            <div>
              <div className="px-3 py-1 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                Requirement Documents ({filteredDocs.length})
              </div>
              <div className="space-y-1">
                {filteredDocs.slice(0, 3).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelect(`/teams/${d.projectId}`)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-white group-hover:text-cyan-400 truncate">
                        {d.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{d.size}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredProjects.length === 0 && filteredUsers.length === 0 && filteredDocs.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching records found for "{query}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-[10px] text-slate-500">
          <span>Navigate with mouse or keyboard</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
