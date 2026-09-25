import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Users, Plus, Search, Filter, Sparkles, ChevronRight } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';

export const TeamsListPage: React.FC = () => {
  const { teams } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const navigate = useNavigate();

  const filteredTeams = teams.filter((t) => {
    const matchesQuery = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.projectTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || t.category === categoryFilter;
    return matchesQuery && matchesCat;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" /> Registered Student Project Teams
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse active engineering teams, progress telemetry, and health scores across departments.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/teams/new')}
          icon={<Plus className="w-4 h-4" />}
        >
          Create Project Team
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search teams by name or project title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
        >
          <option value="All">All Categories</option>
          <option value="Full Stack Web Application">Full Stack Web Application</option>
          <option value="AI / Machine Learning">AI / Machine Learning</option>
          <option value="IoT & Analytics">IoT & Analytics</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <Card
            key={team.id}
            onClick={() => navigate(`/teams/${team.id}`)}
            className="p-5 flex flex-col justify-between cursor-pointer hover:border-indigo-400 group"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 transition-colors">
                    {team.name}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium block">{team.projectTitle}</span>
                </div>
                <Badge variant={team.healthScore >= 80 ? 'success' : team.healthScore >= 60 ? 'warning' : 'error'}>
                  Health: {team.healthScore}/100
                </Badge>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {team.problemStatement}
              </p>

              <ProgressBar value={team.progress} label="Sprint Progress" size="sm" />
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">{team.memberIds.length} Members</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                View Intelligence <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
