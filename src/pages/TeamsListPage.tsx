import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { FolderGit2, Plus, Search, ChevronRight, Users, Calendar } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { PREDEFINED_CATEGORIES } from '../mock/initialData';

export const TeamsListPage: React.FC = () => {
  const { currentUser, projects } = useApp();

  if (!currentUser) {
    return null;
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const navigate = useNavigate();

  const isTeacher = currentUser.role === 'TEACHER';

  const filteredProjects = projects.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.problemStatement.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesQuery && matchesCat;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 text-white">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-indigo-400" /> Academic Projects Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isTeacher
              ? 'Manage and monitor all student project teams under your supervision.'
              : 'View academic projects and team rosters across the department.'}
          </p>
        </div>

        {isTeacher && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/teams/new')}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search projects by ID, name, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="All">All Categories</option>
          {PREDEFINED_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {filteredProjects.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={<FolderGit2 className="w-12 h-12 text-slate-500" />}
            title="No Projects Found"
            description={
              isTeacher
                ? "You haven't created any projects yet. Click 'Create Project' to set up a project and assign students."
                : "No projects match your filter criteria or you haven't been assigned to a project yet."
            }
            action={
              isTeacher ? (
                <Button variant="primary" onClick={() => navigate('/teams/new')} icon={<Plus className="w-4 h-4" />}>
                  Create Project
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => {
            const memberCount = (proj.teamLeaderId ? 1 : 0) + proj.memberIds.length;
            return (
              <Card
                key={proj.id}
                onClick={() => navigate(`/teams/${proj.id}`)}
                className="p-5 flex flex-col justify-between cursor-pointer hover:border-indigo-500/50 group transition-all"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-indigo-400 font-bold block mb-0.5">
                        {proj.id}
                      </span>
                      <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {proj.name}
                      </h3>
                    </div>
                    <Badge variant={proj.status === 'ACTIVE' ? 'success' : 'warning'}>
                      {proj.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {proj.description || proj.problemStatement}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                      {proj.category}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                      {proj.duration}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    {memberCount} Assigned Students
                  </span>
                  <span className="text-indigo-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Workspace <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
