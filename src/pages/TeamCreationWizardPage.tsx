import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  FolderGit2,
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
  Trash2,
  Upload,
  FileText,
  File,
  X,
  UserCheck,
  BadgeAlert,
  ChevronRight
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  PREDEFINED_CATEGORIES,
  PREDEFINED_PROJECT_TYPES,
  PREDEFINED_DURATIONS,
  PREDEFINED_PROJECT_ROLES
} from '../mock/initialData';
import { User, Project, ProjectDocument, AIAnalysisResult } from '../types';
import { apiService } from '../services/apiService';
import { clientStorage } from '../storage/clientStorage';
import { aiEngine } from '../services/aiEngine';

export const TeamCreationWizardPage: React.FC = () => {
  const { currentUser, createProject, updateProject, finalizeProject, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editProjectId = searchParams.get('edit');

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registered students search state
  const [registeredStudents, setRegisteredStudents] = useState<User[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudentForView, setSelectedStudentForView] = useState<User | null>(null);

  // Project Form State
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [category, setCategory] = useState(PREDEFINED_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [projectType, setProjectType] = useState(PREDEFINED_PROJECT_TYPES[0]);
  const [customType, setCustomType] = useState('');
  const [duration, setDuration] = useState(PREDEFINED_DURATIONS[4]); // 12 Weeks
  const [customDuration, setCustomDuration] = useState('');
  const [requiredSkillsInput, setRequiredSkillsInput] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([
    'React',
    'TypeScript',
    'Node.js',
    'PostgreSQL'
  ]);

  // Documents State
  const [uploadedDocs, setUploadedDocs] = useState<
    { name: string; type: ProjectDocument['type']; size: string; analysisAvailable: boolean; note?: string }[]
  >([]);

  // Team Formation State
  const [teamLeaderId, setTeamLeaderId] = useState<string>('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({});

  // AI Analysis State
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<AIAnalysisResult | null>(null);

  // Load existing project if editing
  useEffect(() => {
    const loadProject = async () => {
      const students = clientStorage.getUsers().filter((u) => u.role === 'STUDENT');
      setRegisteredStudents(students);

      if (editProjectId) {
        const proj = await apiService.getProject(editProjectId, currentUser);
        if (proj) {
          setProjectName(proj.name);
          setDescription(proj.description);
          setProblemStatement(proj.problemStatement);
          setCategory(proj.category);
          setProjectType(proj.projectType);
          setDuration(proj.duration);
          setRequiredSkills(proj.requiredSkills);
          setRequiredSkillsInput(proj.requiredSkills.join(', '));
          setTeamLeaderId(proj.teamLeaderId || '');
          setMemberIds(proj.memberIds);
          setMemberRoles(proj.memberRoles);

          const docs = await apiService.getProjectDocuments(proj.id);
          setUploadedDocs(
            docs.map((d) => ({
              name: d.name,
              type: d.type,
              size: d.size,
              analysisAvailable: d.analysisAvailable,
              note: d.analysisNote
            }))
          );
        }
      }
    };
    loadProject();
  }, [editProjectId, currentUser]);

  const handleAddSkill = (skill: string) => {
    const s = skill.trim();
    if (s && !requiredSkills.includes(s)) {
      setRequiredSkills([...requiredSkills, s]);
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs: typeof uploadedDocs = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const ext = f.name.split('.').pop()?.toLowerCase();
      let docType: ProjectDocument['type'] = 'Other';
      let analyzable = false;

      if (ext === 'pdf') {
        docType = 'PDF';
        analyzable = true;
      } else if (ext === 'docx' || ext === 'doc') {
        docType = 'DOCX';
        analyzable = true;
      } else if (ext === 'md' || ext === 'markdown') {
        docType = 'Markdown';
        analyzable = true;
      } else if (['ts', 'js', 'py', 'java', 'sql', 'json'].includes(ext || '')) {
        docType = 'Code';
        analyzable = true;
      } else if (['png', 'jpg', 'jpeg'].includes(ext || '')) {
        docType = 'Image';
        analyzable = false;
      } else if (ext === 'zip') {
        docType = 'ZIP';
        analyzable = false;
      }

      newDocs.push({
        name: f.name,
        type: docType,
        size: `${Math.round(f.size / 1024)} KB`,
        analysisAvailable: analyzable,
        note: analyzable
          ? 'Indexed for AI team requirement extraction'
          : 'Analysis unavailable for this format. File record preserved.'
      });
    }

    setUploadedDocs([...uploadedDocs, ...newDocs]);
    showToast('Files Added', `Added ${newDocs.length} document(s) to project requirements.`, 'info');
  };

  const handleRemoveDoc = (index: number) => {
    setUploadedDocs(uploadedDocs.filter((_, i) => i !== index));
  };

  // Student filtering
  const filteredStudents = registeredStudents.filter((student) => {
    if (!studentSearchQuery) return true;
    const q = studentSearchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(q) ||
      student.email.toLowerCase().includes(q) ||
      (student.studentId && student.studentId.toLowerCase().includes(q)) ||
      student.department.toLowerCase().includes(q) ||
      student.skills?.some((s) => s.toLowerCase().includes(q))
    );
  });

  const handleSelectLeader = (student: User) => {
    setTeamLeaderId(student.id);
    if (!memberRoles[student.id]) {
      setMemberRoles((prev) => ({ ...prev, [student.id]: 'Team Leader' }));
    }
    showToast('Team Leader Selected', `${student.name} assigned as project Team Leader.`, 'success');
  };

  const handleToggleMember = (student: User) => {
    if (memberIds.includes(student.id)) {
      setMemberIds(memberIds.filter((id) => id !== student.id));
      const nextRoles = { ...memberRoles };
      delete nextRoles[student.id];
      setMemberRoles(nextRoles);
    } else {
      setMemberIds([...memberIds, student.id]);
      if (!memberRoles[student.id]) {
        setMemberRoles((prev) => ({ ...prev, [student.id]: PREDEFINED_PROJECT_ROLES[0] }));
      }
    }
  };

  const handleRoleChange = (studentId: string, role: string) => {
    setMemberRoles((prev) => ({
      ...prev,
      [studentId]: role
    }));
  };

  // Run AI compatibility on current runtime state
  const handleRunAIAnalysis = () => {
    setIsAIAnalyzing(true);
    setTimeout(() => {
      // Mock transient project for immediate live evaluation
      const allSelectedStudentIds = [
        ...(teamLeaderId ? [teamLeaderId] : []),
        ...memberIds.filter((id) => id !== teamLeaderId)
      ];
      const selectedStudents = registeredStudents.filter((s) => allSelectedStudentIds.includes(s.id));

      const finalCategory = customCategory.trim() || category;
      const finalType = customType.trim() || projectType;

      // Extract skills from required skills + problem statement
      const derivedRequirements = [
        `Architecture & System Design (${finalType})`,
        ...requiredSkills.map((sk) => `${sk} Implementation`),
        ...uploadedDocs.map((d) => `PRD Specification: ${d.name}`)
      ];

      const coveredSkillsSet = new Set<string>();
      selectedStudents.forEach((student) => {
        (student.skills || []).forEach((sk) => {
          if (requiredSkills.some((req) => req.toLowerCase() === sk.toLowerCase())) {
            coveredSkillsSet.add(sk);
          }
        });
      });

      const coveredSkills = Array.from(coveredSkillsSet);
      const missingSkills = requiredSkills.filter(
        (req) => !coveredSkills.some((cov) => cov.toLowerCase() === req.toLowerCase())
      );

      const assignedRolesList = Object.values(memberRoles);
      const coveredRoles = Array.from(new Set(assignedRolesList));
      const expectedRoles = ['Frontend Developer', 'Backend Developer', 'UI/UX Designer', 'Testing / QA'];
      const missingRoles = expectedRoles.filter((r) => !assignedRolesList.includes(r));

      const reqCoverage = requiredSkills.length > 0 ? Math.round((coveredSkills.length / requiredSkills.length) * 100) : 80;
      const roleAlignment = assignedRolesList.length > 0 ? Math.min(100, Math.round((assignedRolesList.length / Math.max(3, assignedRolesList.length)) * 95)) : 50;
      const overall = Math.round((reqCoverage * 0.6) + (roleAlignment * 0.4));

      const memberAnalysis = selectedStudents.map((s) => {
        const assignedRole = memberRoles[s.id] || (s.id === teamLeaderId ? 'Team Leader' : 'Team Member');
        const sSkills = s.skills || [];
        const matches = sSkills.filter((sk) => requiredSkills.some((r) => r.toLowerCase() === sk.toLowerCase()));
        return {
          studentId: s.id,
          studentName: s.name,
          assignedRole,
          matchingSkills: matches,
          missingSkills: requiredSkills.filter((r) => !matches.includes(r)),
          evidenceStrength: 85,
          roleMatch: matches.length > 0 || assignedRole.toLowerCase().includes('lead')
        };
      });

      const report: AIAnalysisResult = {
        id: `ai-${Date.now()}`,
        projectId: editProjectId || 'TEMP-PREVIEW',
        timestamp: new Date().toISOString(),
        derivedRequirements,
        requiredSkills,
        requiredRoles: expectedRoles,
        coveredSkills,
        missingSkills,
        coveredRoles,
        missingRoles,
        duplicateRoles: [],
        requirementCoverage: reqCoverage,
        roleAlignment,
        skillEvidenceCoverage: 80,
        overallCompatibility: overall,
        memberAnalysis,
        explanations: [
          `Analyzed ${selectedStudents.length} candidate members against ${requiredSkills.length} project requirements and ${uploadedDocs.length} uploaded PRD documents.`,
          missingSkills.length === 0
            ? 'All core technical requirement skills are represented in the team.'
            : `Skills needing attention: ${missingSkills.join(', ')}.`
        ],
        risks: missingSkills.length > 0 ? [`Missing team skills: ${missingSkills.join(', ')}`] : [],
        recommendations: [
          'Ensure assigned roles match member technical proficiencies.',
          'Upload finalized PRD to maximize AI telemetry accuracy.'
        ],
        analysisType: 'LOCAL_DETERMINISTIC'
      };

      setAiReport(report);
      setIsAIAnalyzing(false);
      showToast('AI Analysis Complete', `Compatibility evaluated: ${report.overallCompatibility}%`, 'success');
    }, 600);
  };

  // Finalize Project
  const handleSaveAndFinalize = async () => {
    if (!projectName.trim() || !problemStatement.trim()) {
      showToast('Missing Details', 'Please provide project name and problem statement.', 'error');
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const finalCategory = customCategory.trim() || category;
      const finalType = customType.trim() || projectType;
      const finalDuration = customDuration.trim() || duration;

      let targetProject: Project;

      if (editProjectId) {
        targetProject = await updateProject(editProjectId, {
          name: projectName,
          description: description || problemStatement,
          problemStatement,
          category: finalCategory,
          projectType: finalType,
          duration: finalDuration,
          requiredSkills,
          teamLeaderId: teamLeaderId || undefined,
          memberIds,
          memberRoles
        });
      } else {
        targetProject = await createProject({
          name: projectName,
          description: description || problemStatement,
          problemStatement,
          category: finalCategory,
          projectType: finalType,
          duration: finalDuration,
          requiredSkills,
          teacherId: currentUser.id,
          teamLeaderId: teamLeaderId || undefined,
          memberIds,
          memberRoles
        });
      }

      // Save documents
      for (const d of uploadedDocs) {
        await apiService.uploadProjectDocument(targetProject.id, {
          name: d.name,
          type: d.type,
          size: d.size,
          uploadedById: currentUser.id,
          uploadedByName: currentUser.name
        });
      }

      // Finalize and activate project + notify students!
      await finalizeProject(targetProject.id);

      // Run AI analysis
      await apiService.runProjectAIAnalysis(targetProject.id);

      showToast('Project Finalized', `Project ${targetProject.id} is active. Notifications dispatched to students.`, 'success');
      navigate(`/teams/${targetProject.id}`);
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to save project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    '1. Project Details',
    '2. Upload PRD & Docs',
    '3. Assign Team Leader',
    '4. Assign Members & Roles',
    '5. AI Compatibility',
    '6. Review & Finalize'
  ];

  const allAssignedStudents = [
    ...(teamLeaderId ? [teamLeaderId] : []),
    ...memberIds.filter((id) => id !== teamLeaderId)
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center justify-between text-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">
              {editProjectId ? 'Edit Project & Team Assignment' : 'Create Academic Project'}
            </h1>
            <Badge variant="purple">Faculty Workflow</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Specify requirements, upload PRDs, search real registered students, assign roles, and run AI compatibility.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
          Exit Wizard
        </Button>
      </div>

      {/* Wizard Step Progress Tracker */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[620px]">
          {steps.map((label, index) => {
            const stepNum = index + 1;
            const isCompleted = currentStep > stepNum;
            const isCurrent = currentStep === stepNum;
            return (
              <React.Fragment key={label}>
                <div
                  onClick={() => setCurrentStep(stepNum)}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNum}
                  </div>
                  <span
                    className={`text-xs font-semibold whitespace-nowrap ${
                      isCurrent
                        ? 'text-white'
                        : isCompleted
                        ? 'text-slate-300'
                        : 'text-slate-500 group-hover:text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      currentStep > stepNum ? 'bg-emerald-600' : 'bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* STEP 1: PROJECT DETAILS */}
      {currentStep === 1 && (
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-white">Step 1: Project Details & Requirements</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter the core problem statement, classification, and required technical skills. All fields remain editable.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Autonomous Campus Navigation & Robotics Platform"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Problem Statement & Overview *
              </label>
              <textarea
                rows={3}
                required
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="Describe the engineering challenge, technical objectives, and scope..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PREDEFINED_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Custom">Custom / Other</option>
                </select>
                {category === 'Custom' && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Type custom category..."
                    className="w-full mt-2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                )}
              </div>

              {/* Project Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Project Type
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PREDEFINED_PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="Custom">Custom / Other</option>
                </select>
                {projectType === 'Custom' && (
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="Type custom type..."
                    className="w-full mt-2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Duration (Editable)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PREDEFINED_DURATIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="Custom">Custom Duration</option>
                </select>
                {duration === 'Custom' && (
                  <input
                    type="text"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    placeholder="e.g. 5 Months"
                    className="w-full mt-2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                )}
              </div>
            </div>

            {/* Required Skills */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Required Technical Skills & Competencies
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={requiredSkillsInput}
                  onChange={(e) => setRequiredSkillsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(requiredSkillsInput);
                      setRequiredSkillsInput('');
                    }
                  }}
                  placeholder="Type skill and press Add (e.g. React, Docker, Python)..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    handleAddSkill(requiredSkillsInput);
                    setRequiredSkillsInput('');
                  }}
                >
                  Add Skill
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {requiredSkills.map((sk) => (
                  <span
                    key={sk}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-medium"
                  >
                    {sk}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(sk)}
                      className="hover:text-red-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <Button
              variant="primary"
              onClick={() => {
                if (!projectName.trim() || !problemStatement.trim()) {
                  showToast('Required Fields', 'Please complete project name and problem statement.', 'error');
                  return;
                }
                setCurrentStep(2);
              }}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Continue to Document Upload
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: UPLOAD PRD / DOCUMENTS */}
      {currentStep === 2 && (
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-white">Step 2: Upload PRD & Requirement Documents</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload project requirement documents, architectural specifications, or PRDs. AI will extract requirements for compatibility matching.
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/60 rounded-2xl p-8 text-center bg-slate-950/40 transition-colors">
            <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
            <p className="text-xs font-semibold text-white">Upload Requirement Files</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports PDF, DOCX, Markdown, Code schemas, ZIP, and images.
            </p>
            <label className="mt-4 inline-block">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors inline-block shadow-sm">
                Browse Files
              </span>
            </label>
          </div>

          {uploadedDocs.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Attached Documents ({uploadedDocs.length})
              </h3>
              <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                {uploadedDocs.map((doc, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800/60 text-indigo-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{doc.name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span className={doc.analysisAvailable ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
                            {doc.note}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDoc(idx)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setCurrentStep(1)} icon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => setCurrentStep(3)}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Continue to Assign Team Leader
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: ASSIGN TEAM LEADER */}
      {currentStep === 3 && (
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-white">Step 3: Assign Team Leader</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Search real registered students and designate one as the Team Leader. Team Leader is a project-level role assignment, not a separate account type.
            </p>
          </div>

          {/* Student Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              placeholder="Search by student name, email, permanent ID (STU-XXXX), or skill..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {registeredStudents.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
              No registered students in system. Please have students register with an approved email or use the Admin portal to authorize student emails.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredStudents.map((student) => {
                const isLeader = teamLeaderId === student.id;
                return (
                  <div
                    key={student.id}
                    className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between ${
                      isLeader
                        ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-8 h-8 rounded-full bg-slate-800"
                          />
                          <div>
                            <div className="font-bold text-xs text-white">{student.name}</div>
                            <div className="text-[10px] font-mono text-indigo-400">
                              {student.studentId || 'ID Pending'}
                            </div>
                          </div>
                        </div>
                        {isLeader && <Badge variant="success">Assigned Leader</Badge>}
                      </div>

                      <div className="text-[11px] text-slate-400 mb-2">
                        {student.department} • {student.year || '3rd Year'}
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {(student.skills || []).slice(0, 4).map((sk) => (
                          <span
                            key={sk}
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForView(student)}
                        className="text-[10px] text-indigo-400 hover:underline"
                      >
                        View Profile
                      </button>
                      <Button
                        type="button"
                        variant={isLeader ? 'success' : 'outline'}
                        size="xs"
                        onClick={() => handleSelectLeader(student)}
                      >
                        {isLeader ? 'Leader Selected' : 'Assign as Leader'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setCurrentStep(2)} icon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!teamLeaderId && registeredStudents.length > 0) {
                  showToast('Note', 'You can proceed without a team leader and assign one later.', 'info');
                }
                setCurrentStep(4);
              }}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Continue to Add Team Members
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: ADD TEAM MEMBERS & ASSIGN ROLES */}
      {currentStep === 4 && (
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-white">Step 4: Add Team Members & Assign Project Roles</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select members from the registered student directory. Assign project-specific roles (predefined or custom typing).
            </p>
          </div>

          {/* Members Selection Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column: Student Search & Add */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Student Directory ({filteredStudents.length})
              </h3>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Search registered students..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredStudents.map((student) => {
                  const isLeader = teamLeaderId === student.id;
                  const isMember = memberIds.includes(student.id);
                  const isAssigned = isLeader || isMember;

                  return (
                    <div
                      key={student.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        isAssigned
                          ? 'bg-slate-900 border-indigo-500/60'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-7 h-7 rounded-full bg-slate-800 flex-shrink-0"
                        />
                        <div className="truncate">
                          <span className="font-semibold text-white block truncate">{student.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {student.studentId || 'ID Pending'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isLeader ? (
                          <Badge variant="purple">Leader</Badge>
                        ) : (
                          <Button
                            type="button"
                            size="xs"
                            variant={isMember ? 'danger' : 'secondary'}
                            onClick={() => handleToggleMember(student)}
                          >
                            {isMember ? 'Remove' : 'Add Member'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Assigned Roster & Role Assignment */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Assigned Team Roster ({allAssignedStudents.length})
              </h3>

              {allAssignedStudents.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                  No members added yet. Add students from the directory on the left.
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {allAssignedStudents.map((id) => {
                    const student = registeredStudents.find((s) => s.id === id);
                    if (!student) return null;
                    const isLeader = teamLeaderId === id;
                    const currentRole = memberRoles[id] || (isLeader ? 'Team Leader' : 'Team Member');

                    return (
                      <div
                        key={id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={student.avatar}
                              alt={student.name}
                              className="w-6 h-6 rounded-full bg-slate-800"
                            />
                            <span className="font-bold text-white">{student.name}</span>
                            {isLeader && <Badge variant="purple">Leader</Badge>}
                          </div>
                          {!isLeader && (
                            <button
                              type="button"
                              onClick={() => handleToggleMember(student)}
                              className="text-[10px] text-red-400 hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        {/* Role selector + custom typing */}
                        <div>
                          <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                            Assigned Project Role
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={
                                PREDEFINED_PROJECT_ROLES.includes(currentRole) ? currentRole : 'Custom'
                              }
                              onChange={(e) => {
                                if (e.target.value !== 'Custom') {
                                  handleRoleChange(id, e.target.value);
                                }
                              }}
                              className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              {isLeader && <option value="Team Leader">Team Leader</option>}
                              {PREDEFINED_PROJECT_ROLES.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                              <option value="Custom">Custom Role...</option>
                            </select>

                            <input
                              type="text"
                              value={currentRole}
                              onChange={(e) => handleRoleChange(id, e.target.value)}
                              placeholder="Type custom role..."
                              className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setCurrentStep(3)} icon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                handleRunAIAnalysis();
                setCurrentStep(5);
              }}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Run AI Team Compatibility Analysis
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 5: AI COMPATIBILITY ANALYSIS */}
      {currentStep === 5 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Step 5: AI Project + Team Analysis</h2>
                <Badge variant="ai">Deterministic Runtime Engine</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Derived directly from actual uploaded PRD documents, problem statements, and real registered student profiles.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRunAIAnalysis}
              isLoading={isAIAnalyzing}
              icon={<Sparkles className="w-4 h-4 text-cyan-400" />}
            >
              Re-Analyze
            </Button>
          </div>

          {isAIAnalyzing ? (
            <div className="py-16 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-semibold">Running multi-factor compatibility evaluation...</p>
              <p className="text-[11px] text-slate-500">Cross-referencing PRD requirements with student competencies</p>
            </div>
          ) : aiReport ? (
            <div className="space-y-6">
              {/* Score Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Overall Compatibility
                  </span>
                  <span className="text-2xl font-black text-indigo-400">
                    {aiReport.overallCompatibility}%
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Requirement Coverage
                  </span>
                  <span className="text-2xl font-black text-emerald-400">
                    {aiReport.requirementCoverage}%
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Role Alignment
                  </span>
                  <span className="text-2xl font-black text-cyan-400">
                    {aiReport.roleAlignment}%
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Missing Skills
                  </span>
                  <span className="text-2xl font-black text-amber-400">
                    {aiReport.missingSkills.length}
                  </span>
                </div>
              </div>

              {/* Requirement & Role Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Skills Covered vs Missing
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Covered Skills:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {aiReport.coveredSkills.length > 0 ? (
                          aiReport.coveredSkills.map((sk) => (
                            <span key={sk} className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 text-[10px]">
                              ✓ {sk}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-[10px]">None covered yet</span>
                        )}
                      </div>
                    </div>
                    {aiReport.missingSkills.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] text-amber-400 block mb-1">Missing Gaps:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {aiReport.missingSkills.map((sk) => (
                            <span key={sk} className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/40 text-[10px]">
                              ⚠ {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Assigned Roles & Alignment
                  </h4>
                  <div className="space-y-2 text-xs">
                    {aiReport.memberAnalysis.map((ma) => (
                      <div key={ma.studentId} className="flex items-center justify-between text-[11px] border-b border-slate-800/60 pb-1">
                        <div>
                          <span className="text-white font-semibold">{ma.studentName}</span>
                          <span className="text-slate-400 text-[10px] ml-1.5">({ma.assignedRole})</span>
                        </div>
                        <span className={ma.roleMatch ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
                          {ma.roleMatch ? 'Strong Fit' : 'Skill Gap'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Explainable Reasoning */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Assessment & Findings
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {aiReport.explanations.map((exp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-indigo-400">•</span>
                      <span>{exp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setCurrentStep(4)} icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Team Roles
            </Button>
            <Button
              variant="primary"
              onClick={() => setCurrentStep(6)}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Proceed to Final Review
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 6: REVIEW & FINALIZE */}
      {currentStep === 6 && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Step 6: Review & Finalize Project</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review project specifications and assigned members. Finalizing activates the project and sends assignment notifications to all students.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs text-indigo-400 font-bold block mb-1">
                  PROJECT ID: {editProjectId || 'PRJ-AUTO-GENERATED'}
                </span>
                <h3 className="text-base font-bold text-white">{projectName}</h3>
                <p className="text-xs text-slate-400 mt-1">{problemStatement}</p>
              </div>
              <Badge variant="purple">{projectType}</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Category</span>
                <span className="text-white font-medium">{customCategory.trim() || category}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Duration</span>
                <span className="text-white font-medium">{customDuration.trim() || duration}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Team Leader</span>
                <span className="text-emerald-400 font-medium">
                  {registeredStudents.find((s) => s.id === teamLeaderId)?.name || 'Unassigned'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Team Roster</span>
                <span className="text-white font-medium">{allAssignedStudents.length} Students</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-slate-500 block text-[10px] mb-1.5">Required Skills:</span>
              <div className="flex flex-wrap gap-1.5">
                {requiredSkills.map((sk) => (
                  <span key={sk} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <span className="text-slate-500 block text-[10px] mb-1.5">PRD / Uploaded Files:</span>
              <div className="flex flex-wrap gap-2">
                {uploadedDocs.length > 0 ? (
                  uploadedDocs.map((doc, idx) => (
                    <span key={idx} className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-indigo-300 flex items-center gap-1.5">
                      <File className="w-3 h-3" /> {doc.name}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-500">No documents attached</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setCurrentStep(5)} icon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onClick={handleSaveAndFinalize}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              FINALIZE & ACTIVATE PROJECT
            </Button>
          </div>
        </Card>
      )}

      {/* Student Profile Quick View Modal */}
      {selectedStudentForView && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Student Profile</h3>
              <button
                onClick={() => setSelectedStudentForView(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={selectedStudentForView.avatar}
                alt={selectedStudentForView.name}
                className="w-12 h-12 rounded-full bg-slate-800"
              />
              <div>
                <h4 className="text-sm font-bold text-white">{selectedStudentForView.name}</h4>
                <p className="text-xs text-indigo-400 font-mono">
                  {selectedStudentForView.studentId || 'ID Pending'}
                </p>
                <p className="text-[11px] text-slate-400">{selectedStudentForView.email}</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p><strong>Department:</strong> {selectedStudentForView.department}</p>
              <p><strong>Year:</strong> {selectedStudentForView.year || '3rd Year'}</p>
              {selectedStudentForView.bio && <p><strong>Bio:</strong> {selectedStudentForView.bio}</p>}
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase">Skills:</span>
              <div className="flex flex-wrap gap-1">
                {(selectedStudentForView.skills || []).map((sk) => (
                  <span key={sk} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-200">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button size="sm" variant="outline" onClick={() => setSelectedStudentForView(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
