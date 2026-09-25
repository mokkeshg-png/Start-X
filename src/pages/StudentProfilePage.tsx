import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GraduationCap, Globe, CheckCircle2, ShieldCheck, Plus, Sparkles, FolderGit2, FileCode } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { INITIAL_USERS } from '../mock/initialData';

export const StudentProfilePage: React.FC = () => {
  const { currentUser, showToast } = useApp();

  const [newSkillName, setNewSkillName] = useState('');
  const userSkills = currentUser.skills || ["React.js", "TypeScript", "Tailwind CSS"];
  const [skillsList, setSkillsList] = useState<Array<{ name: string; proficiency: number; verificationState: string; evidenceCount: number }>>(
    userSkills.map((skName) => ({
      name: skName,
      proficiency: 85,
      verificationState: 'Verified',
      evidenceCount: 2
    }))
  );

  const evidenceMap = userSkills.map((skName) => ({
    skillName: skName,
    projectName: 'Academic Project Workspace',
    submittedWork: `${skName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_module.ts`,
    evidenceType: 'GitHub Commit & Review',
    evidenceStrength: 92
  }));

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    setSkillsList([
      ...skillsList,
      {
        name: newSkillName,
        proficiency: 80,
        verificationState: 'Partially Verified',
        evidenceCount: 1
      }
    ]);
    setNewSkillName('');
    showToast("Skill Added to Profile", `Added '${newSkillName}' for verification audit.`, "success");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Profile Header */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{currentUser.name}</h1>
                <Badge variant="success" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                  Verified Student Profile
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUser.department} • {currentUser.year || '4th Year'} • Student ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{currentUser.studentId || 'STU-2026-041'}</span>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 max-w-xl">
                {currentUser.bio || "Registered Student Contributor on the APEX Project Platform."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <a href={`https://${currentUser.github || 'github.com'}`} target="_blank" rel="noreferrer" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:text-indigo-500">
              <FolderGit2 className="w-4 h-4" />
            </a>
            <a href={`https://${currentUser.linkedin || 'linkedin.com'}`} target="_blank" rel="noreferrer" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:text-indigo-500">
              <Globe className="w-4 h-4" />
            </a>
          </div>
        </div>
      </Card>

      {/* Verified Skills & Add Skill */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Verified Skill Matrix
            </h3>
            <span className="text-xs text-slate-400">{skillsList.length} Skills Index</span>
          </div>

          <div className="space-y-3">
            {skillsList.map((sk) => (
              <div key={sk.name} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">{sk.name}</span>
                  <Badge variant={sk.verificationState === 'Verified' ? 'success' : 'warning'}>
                    {sk.verificationState} ({sk.evidenceCount} Evidence Artifacts)
                  </Badge>
                </div>
                <ProgressBar value={sk.proficiency} size="sm" color="ai" />
              </div>
            ))}
          </div>

          {/* Form to add skill */}
          <form onSubmit={handleAddSkill} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <input
              type="text"
              placeholder="Add new skill (e.g. GraphQL, Docker, Python)..."
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
            />
            <Button type="submit" size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
              Add Skill
            </Button>
          </form>
        </Card>

        {/* Skill Evidence Map */}
        <Card variant="ai" className="p-6 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Skill Evidence Map
          </h3>
          <p className="text-slate-500">
            Visual verification mapping linking claimed skills directly to code artifacts & PRD documents.
          </p>

          <div className="space-y-3">
            {evidenceMap.map((ev, idx) => (
              <div key={idx} className="p-3 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-indigo-200 dark:border-indigo-900 space-y-1">
                <div className="font-bold text-indigo-600 dark:text-indigo-400">{ev.skillName}</div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300">Project: {ev.projectName}</div>
                <div className="text-[10px] text-slate-500 font-mono">Artifact: {ev.submittedWork}</div>
                <div className="flex justify-between items-center text-[10px] pt-1">
                  <span className="text-slate-400">{ev.evidenceType}</span>
                  <span className="font-bold text-emerald-600">{ev.evidenceStrength}% Match</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Student Projects Showcase */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-indigo-500" /> Academic Project Portfolio
        </h3>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Active Engineering Capstone</h4>
            <span className="text-[10px] text-slate-400">Current Semester</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Active project participation registered under department coordinator supervision.
          </p>
          <div className="flex flex-wrap gap-1 pt-1">
            {userSkills.map((t) => (
              <Badge key={t} variant="neutral">{t}</Badge>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
