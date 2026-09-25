import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserSearch, Sparkles, Send, CheckCircle2, ShieldCheck, Brain, UserCheck } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { apiService } from '../services/apiService';
import { TeammateRecommendation } from '../types';

export const FindTeammatesPage: React.FC = () => {
  const { currentUser, sendCollaborationRequest, showToast } = useApp();

  const [prompt, setPrompt] = useState('Building a real-time smart campus energy monitoring dashboard.');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['React.js', 'PostgreSQL', 'Python']);
  const [isSearching, setIsSearching] = useState(false);
  const [recommendations, setRecommendations] = useState<TeammateRecommendation[]>([]);

  const availableSkillChips = ['React.js', 'Node.js', 'Python', 'PostgreSQL', 'UI/UX', 'AI/ML', 'DevOps', 'Docker', 'TypeScript'];

  const handleSearchTeammates = async () => {
    setIsSearching(true);
    const recs = await apiService.getTeammateRecommendations(prompt, selectedSkills);
    setRecommendations(recs);
    setIsSearching(false);
    showToast("AI Teammate Matching Complete", "Found verified student candidates.", "success");
  };

  const handleSendInvite = async (student: TeammateRecommendation) => {
    await sendCollaborationRequest({
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      receiverId: student.studentId,
      projectTitle: prompt.slice(0, 30) + '...',
      suggestedRole: student.recommendedRole,
      message: `Hi ${student.name}! We saw your verified profile evidence and match score. Would you like to join our project?`
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserSearch className="w-5 h-5 text-indigo-500" /> AI-Powered Teammate Discovery
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Discover compatible student teammates based on verified evidence artifacts and project requirements.
        </p>
      </div>

      {/* Query Form */}
      <Card variant="ai" className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
            What are you building?
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe project problem & required architecture..."
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
            Target Required Skills
          </label>
          <div className="flex flex-wrap gap-2 text-xs">
            {availableSkillChips.map((skill) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <button
                  key={skill}
                  onClick={() => {
                    if (isSelected) setSelectedSkills(selectedSkills.filter((s) => s !== skill));
                    else setSelectedSkills([...selectedSkills, skill]);
                  }}
                  className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          variant="ai"
          size="md"
          isLoading={isSearching}
          onClick={handleSearchTeammates}
          icon={<Sparkles className="w-4 h-4" />}
        >
          Find Compatible Teammates
        </Button>
      </Card>

      {/* Recommendations Output */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-500" /> AI Teammate Match Recommendations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <Card key={rec.studentId} className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <img src={rec.avatar} alt={rec.name} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{rec.name}</h4>
                      <span className="text-xs text-indigo-600 font-semibold block">{rec.recommendedRole}</span>
                      <span className="text-[11px] text-slate-500">{rec.department}</span>
                    </div>
                  </div>
                  <Badge variant="ai">AI Match: {rec.matchPercentage}%</Badge>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Match Rationale:</span>
                  <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 space-y-0.5 text-[11px]">
                    {rec.matchReasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex flex-wrap gap-1">
                    {rec.verifiedSkills.map((vs) => (
                      <Badge key={vs} variant="success" size="sm">{vs}</Badge>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleSendInvite(rec)}
                    icon={<Send className="w-3.5 h-3.5" />}
                  >
                    Send Invitation
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
