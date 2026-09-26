/**
 * ProjectAIInsightsDashboard
 * The AI Insights tab in TeamDetailPage.
 * Orchestrates all AI panels for a team.
 * Staff see everything; students see appropriate subset.
 */
import React, { useState } from 'react';
import {
  Brain, BarChart3, Lightbulb, ShieldAlert,
  Star, TrendingUp, Users, Sparkles
} from 'lucide-react';
import { AIInsightsPanel } from '../AIInsightsPanel';
import { CollaborationGapsPanel } from './CollaborationGapsPanel';
import { Button } from '../common/Button';

interface Props {
  teamId: string;
  studentId?: string;
  isStaff: boolean;
  /** Optional: if a specific discussion exists */
  discussionId?: string;
}

type ActiveView = 'overview' | 'gaps' | 'skills' | 'team_formation';

export function ProjectAIInsightsDashboard({ teamId, studentId, isStaff, discussionId }: Props) {
  const [activeView, setActiveView] = useState<ActiveView>('overview');

  const tabs: { key: ActiveView; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Project Overview', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'gaps', label: 'Gaps & Recommendations', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    ...(isStaff
      ? [
          { key: 'skills' as ActiveView, label: 'Skills', icon: <Star className="w-3.5 h-3.5" /> },
          { key: 'team_formation' as ActiveView, label: 'Team Formation', icon: <Users className="w-3.5 h-3.5" /> },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tab nav */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveView(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeView === t.key
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          <AIInsightsPanel
            title="Collective Project Summary"
            analysisType="collective_insight"
            teamId={teamId}
            manualOnly={true}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AIInsightsPanel
              title="Progress Analysis"
              analysisType="progress_analysis"
              teamId={teamId}
              manualOnly={true}
            />
            <AIInsightsPanel
              title="Knowledge Exchange"
              analysisType="knowledge_exchange"
              teamId={teamId}
              manualOnly={true}
            />
          </div>

          {isStaff && (
            <AIInsightsPanel
              title="AI Recommendations"
              analysisType="collaboration_recommendation"
              teamId={teamId}
              manualOnly={true}
            />
          )}

          {studentId && !isStaff && (
            <AIInsightsPanel
              title="My Contribution Analysis"
              analysisType="contribution_analysis"
              teamId={teamId}
              studentId={studentId}
              manualOnly={true}
            />
          )}
        </div>
      )}

      {/* Gaps */}
      {activeView === 'gaps' && (
        <div className="space-y-6">
          <CollaborationGapsPanel teamId={teamId} />
          <AIInsightsPanel
            title="AI Recommendations"
            analysisType="collaboration_recommendation"
            teamId={teamId}
            manualOnly={true}
          />
        </div>
      )}

      {/* Skills (staff only) */}
      {activeView === 'skills' && isStaff && (
        <div className="space-y-6">
          {studentId ? (
            <AIInsightsPanel
              title="Student Skill Analysis"
              analysisType="skill_analysis"
              studentId={studentId}
              manualOnly={true}
            />
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              Select a student to analyse their skills.
            </div>
          )}
        </div>
      )}

      {/* Team Formation (staff only) */}
      {activeView === 'team_formation' && isStaff && (
        <div className="space-y-6">
          <AIInsightsPanel
            title="AI Team Formation"
            analysisType="team_formation"
            teamId={teamId}
            manualOnly={true}
          />
        </div>
      )}
    </div>
  );
}
