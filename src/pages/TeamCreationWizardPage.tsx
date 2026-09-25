import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  UserPlus,
  CheckCircle2,
  Brain,
  Sparkles,
  Search,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Users,
  ShieldCheck,
  Check,
  Plus,
  Trash2
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { INITIAL_USERS } from '../mock/initialData';
import { User } from '../types';

export const TeamCreationWizardPage: React.FC = () => {
  const { createTeam, showToast } = useApp();
  const navigate = useNavigate();

  const availableStudents: User[] = INITIAL_USERS.filter((u: User) => u.role !== 'STAFF_COORDINATOR' && u.role !== 'DEPARTMENT_HEAD');

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 State
  const [teamName, setTeamName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Full Stack Web Application');
  const [expectedDuration, setExpectedDuration] = useState('12 Weeks');

  // Step 2 & 3 State
  const [selectedLeaderId, setSelectedLeaderId] = useState(availableStudents[0]?.id || 'user-alice');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    availableStudents.slice(0, 3).map((s) => s.id)
  );
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({
    'user-alice': 'Lead Frontend & UI/UX',
    'user-bob': 'Backend Engineer',
    'user-carol': 'Database Specialist'
  });

  // Step 5 AI Analysis State
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiReportGenerated, setAiReportGenerated] = useState(false);

  const handleRunAICompatibility = () => {
    setIsAIAnalyzing(true);
    setTimeout(() => {
      setIsAIAnalyzing(false);
      setAiReportGenerated(true);
      showToast("AI Compatibility Analysis Complete", "Generated skill coverage & risk assessment.", "success");
    }, 900);
  };

  const handleCreateTeamFinal = async () => {
    if (!teamName || !projectTitle || !problemStatement) {
      showToast("Validation Error", "Please fill in all required project details.", "error");
      return;
    }

    const newTeam = await createTeam({
      name: teamName,
      projectTitle,
      problemStatement,
      description,
      category,
      expectedDuration,
      leaderId: selectedLeaderId,
      memberIds: selectedMemberIds,
      memberRoles,
      status: 'Planning'
    });

    navigate(`/teams/${newTeam.id}`);
  };

  const steps = [
    '1. Project Details',
    '2. Select Leader',
    '3. Add Members',
    '4. Assign Roles',
    '5. AI Compatibility',
    '6. Review & Create'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-500" /> Create New Student Project Team
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Guided 6-step creation flow with automated AI compatibility check and role gap verification.
          </p>
        </div>
        <Badge variant="ai">Wizard v2.4</Badge>
      </div>

      {/* Step Stepper Navigation */}
      <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-semibold">
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = currentStep === stepNum;
          const isDone = currentStep > stepNum;
          return (
            <button
              key={stepNum}
              onClick={() => stepNum < currentStep && setCurrentStep(stepNum)}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-xs'
                  : isDone
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400'
              }`}
            >
              {isDone ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* STEP 1: Project Details */}
      {currentStep === 1 && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Step 1: Project Information & Specifications
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Team Identifier Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Team Delta"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Autonomous Campus Drone Telemetry"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Problem Statement *
              </label>
              <textarea
                rows={2}
                placeholder="State the core engineering problem, institutional requirements, and expected goals..."
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Scope Description
              </label>
              <textarea
                rows={3}
                placeholder="Provide functional specs, technology preferences, and deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              >
                <option>Full Stack Web Application</option>
                <option>AI / Machine Learning</option>
                <option>IoT & Embedded Systems</option>
                <option>Mobile App Development</option>
                <option>Cloud Infrastructure & DevOps</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expected Duration
              </label>
              <select
                value={expectedDuration}
                onChange={(e) => setExpectedDuration(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              >
                <option>8 Weeks</option>
                <option>10 Weeks</option>
                <option>12 Weeks</option>
                <option>16 Weeks</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: Select Leader */}
      {currentStep === 2 && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Step 2: Assign Team Leader
          </h3>
          <p className="text-xs text-slate-500">
            Select a student to serve as Team Leader. Leaders possess administrative rights over tasks and submissions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {availableStudents.map((student: User) => {
              const isSelected = selectedLeaderId === student.id;
              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedLeaderId(student.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={student.avatar} alt={student.name} className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{student.name}</div>
                      <div className="text-[11px] text-slate-500">{student.department} • {student.year}</div>
                    </div>
                  </div>
                  {isSelected && <Badge variant="info">Selected Leader</Badge>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* STEP 3: Add Members */}
      {currentStep === 3 && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Step 3: Select Team Members
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {availableStudents.map((student: User) => {
              const isSelected = selectedMemberIds.includes(student.id);
              return (
                <div
                  key={student.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== student.id));
                    } else {
                      setSelectedMemberIds([...selectedMemberIds, student.id]);
                    }
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={student.avatar} alt={student.name} className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{student.name}</div>
                      <div className="text-[11px] text-slate-500">{student.skills?.join(', ')}</div>
                    </div>
                  </div>
                  <Button size="sm" variant={isSelected ? 'danger' : 'outline'}>
                    {isSelected ? 'Remove' : 'Add'}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* STEP 4: Assign Roles */}
      {currentStep === 4 && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Step 4: Assign Specific Project Roles
          </h3>

          <div className="space-y-3 text-xs">
            {selectedMemberIds.map((mId) => {
              const student = availableStudents.find((s: User) => s.id === mId);
              return (
                <div
                  key={mId}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img src={student?.avatar} alt={student?.name} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{student?.name}</span>
                      <span className="text-[11px] text-slate-500 block">{student?.department}</span>
                    </div>
                  </div>

                  <select
                    value={memberRoles[mId] || 'Frontend Developer'}
                    onChange={(e) => setMemberRoles({ ...memberRoles, [mId]: e.target.value })}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    <option>Team Leader & Lead Frontend</option>
                    <option>Frontend Developer</option>
                    <option>Backend Engineer</option>
                    <option>Database Specialist</option>
                    <option>UI/UX Designer</option>
                    <option>AI/ML Lead</option>
                    <option>DevOps Engineer</option>
                    <option>QA & Documentation</option>
                  </select>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* STEP 5: AI Compatibility Check */}
      {currentStep === 5 && (
        <Card variant="ai" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-500" /> Step 5: AI Team Compatibility Assessment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluates team skill coverage against project requirements using verified profile evidence.
              </p>
            </div>
            <Button
              variant="ai"
              size="sm"
              isLoading={isAIAnalyzing}
              onClick={handleRunAICompatibility}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Analyze Team Compatibility
            </Button>
          </div>

          {aiReportGenerated ? (
            <div className="space-y-4 pt-2 border-t border-indigo-200/50 dark:border-indigo-900/50 animate-in fade-in duration-300">
              <div className="flex items-center justify-between p-4 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">AI Compatibility Score</span>
                  <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">88%</div>
                </div>
                <Badge variant="success">High Team Synergy</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block">Covered Skills:</span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Frontend (React/TS) ✓, Backend (Node/REST) ✓, UI/UX ✓
                  </p>
                </div>
                <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1">
                  <span className="font-bold text-amber-800 dark:text-amber-300 block">Identified Gap / Missing Skill:</span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Database Optimization / PostgreSQL ✕ (Consider adding Carol Davis)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center border-2 border-dashed border-indigo-200 dark:border-indigo-900 rounded-xl">
              <Brain className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-bounce" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Click "Analyze Team Compatibility" to generate AI skill coverage matrix.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* STEP 6: Review & Create */}
      {currentStep === 6 && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Step 6: Review & Confirm Team Creation
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-slate-400 block font-semibold">Project Name & Category</span>
              <div className="font-bold text-slate-900 dark:text-white text-sm">{teamName || 'Team Name'} — {projectTitle || 'Project Title'}</div>
              <span className="text-slate-500">{category} • {expectedDuration}</span>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-slate-400 block font-semibold mb-2">Assigned Team Roster ({selectedMemberIds.length} members)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedMemberIds.map((mId) => {
                  const s = availableStudents.find((st: User) => st.id === mId);
                  return (
                    <div key={mId} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <img src={s?.avatar} alt={s?.name} className="w-7 h-7 rounded-full" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{s?.name}</span>
                        <span className="text-[10px] text-indigo-500 block">{memberRoles[mId] || 'Member'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Wizard Footer Controls */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Button
          variant="outline"
          size="sm"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep(currentStep - 1)}
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Previous Step
        </Button>

        {currentStep < 6 ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCurrentStep(currentStep + 1)}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            iconPosition="right"
          >
            Continue to Step {currentStep + 1}
          </Button>
        ) : (
          <Button
            variant="ai"
            size="md"
            onClick={handleCreateTeamFinal}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            Confirm & Launch Project Team
          </Button>
        )}
      </div>
    </div>
  );
};
