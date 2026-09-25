import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { canViewProject, canManageProject } from '../auth/authorization';
import { AccessRestrictedPage } from '../auth/accessControl';
import {
  Users,
  BarChart3,
  MessageSquare,
  FileText,
  Sparkles,
  AlertTriangle,
  Download,
  Plus,
  Brain,
  ChevronRight,
  Send,
  Upload,
  UserCheck,
  ShieldAlert,
  Trash2,
  Edit3,
  File,
  FolderGit2,
  X,
  CheckCircle2,
  Calendar,
  Layers,
  GraduationCap
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { Spinner } from '../components/common/Spinner';
import { AIInsightsPanel } from '../components/AIInsightsPanel';
import { apiService } from '../services/apiService';
import { clientStorage } from '../storage/clientStorage';
import { Project, ProjectDocument, StudentContribution, Message, User } from '../types';

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser, showToast } = useApp();
  const navigate = useNavigate();

  if (!currentUser) {
    return null;
  }

  const [project, setProject] = useState<Project | null>(null);
  const [teacher, setTeacher] = useState<User | null>(null);
  const [teamLeader, setTeamLeader] = useState<User | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [contributions, setContributions] = useState<StudentContribution[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active tab state
  const [activeTab, setActiveTab] = useState<
    'overview' | 'members' | 'contributions' | 'documents' | 'chat' | 'mentor' | 'ai_insights'
  >('overview');

  // Contribution upload/edit modal
  const [isContribModalOpen, setIsContribModalOpen] = useState(false);
  const [editingContribId, setEditingContribId] = useState<string | null>(null);
  const [contribTitle, setContribTitle] = useState('');
  const [contribDesc, setContribDesc] = useState('');
  const [contribFileName, setContribFileName] = useState('');
  const [contribFileSize, setContribFileSize] = useState('');

  // Document upload modal (Teacher)
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<ProjectDocument['type']>('PDF');

  // Chat input
  const [chatText, setChatText] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');

  // Selected student profile modal
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);

  const loadProjectData = async () => {
    setIsLoading(true);
    try {
      const allProjects = clientStorage.getProjects();
      const currentProj = allProjects.find((p) => p.id === id) || allProjects[0];

      if (!currentProj) {
        setProject(null);
        setIsLoading(false);
        return;
      }

      setProject(currentProj);

      // Load Users
      const users = clientStorage.getUsers();
      const teacherUser = users.find((u) => u.id === currentProj.teacherId) || null;
      setTeacher(teacherUser);

      const leaderUser = currentProj.teamLeaderId
        ? users.find((u) => u.id === currentProj.teamLeaderId) || null
        : null;
      setTeamLeader(leaderUser);

      const membersList = users.filter((u) => currentProj.memberIds.includes(u.id));
      setTeamMembers(membersList);

      // Load docs and contributions
      const docs = await apiService.getProjectDocuments(currentProj.id);
      setDocuments(docs);

      const contribs = await apiService.getStudentContributions(currentProj.id);
      setContributions(contribs);

      // Load messages
      const msgs = await apiService.getMessages('TEAM_CHAT', currentProj.id);
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [id, currentUser.id]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading project workspace telemetry...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-16 max-w-md mx-auto text-center space-y-4">
        <EmptyState
          icon={<FolderGit2 className="w-12 h-12 text-slate-500" />}
          title="Project Not Found"
          description="The requested project does not exist or has not been finalized yet."
          action={
            <Button size="sm" variant="primary" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  // Authorization check: Is user allowed to view this project?
  if (!canViewProject(currentUser, project)) {
    return (
      <AccessRestrictedPage
        reason={`You are not authorized to access Project ${project.id}. Only the supervising faculty and assigned team members can enter this workspace.`}
      />
    );
  }

  const isTeacherOwner = currentUser.role === 'TEACHER' && project.teacherId === currentUser.id;
  const isAssignedLeader = project.teamLeaderId === currentUser.id;
  const isAssignedMember = project.memberIds.includes(currentUser.id) || isAssignedLeader;

  // Handle contribution submit
  const handleSaveContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribTitle.trim()) return;

    try {
      if (editingContribId) {
        await apiService.updateStudentContribution(editingContribId, currentUser.id, {
          title: contribTitle,
          description: contribDesc
        });
        showToast('Updated', 'Contribution record updated.', 'success');
      } else {
        await apiService.addStudentContribution({
          projectId: project.id,
          studentId: currentUser.id,
          studentName: currentUser.name,
          title: contribTitle,
          description: contribDesc,
          fileName: contribFileName || 'work_submission.zip',
          fileSize: contribFileSize || '1.8 MB'
        });
        showToast('Uploaded', 'Your work has been submitted to the project.', 'success');
      }

      setIsContribModalOpen(false);
      setEditingContribId(null);
      setContribTitle('');
      setContribDesc('');
      setContribFileName('');
      loadProjectData();
    } catch (err: any) {
      showToast('Error', err.message || 'Operation failed', 'error');
    }
  };

  const handleDeleteContribution = async (contribId: string) => {
    try {
      await apiService.deleteStudentContribution(contribId, currentUser.id);
      showToast('Removed', 'Contribution deleted.', 'info');
      loadProjectData();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to delete contribution', 'error');
    }
  };

  // Handle sending chat message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;

    const channelType = activeTab === 'mentor' ? 'MENTOR' : 'TEAM_CHAT';
    const channelId = project.id;

    await apiService.sendMessage({
      channelType,
      channelId,
      sender: currentUser,
      text: chatText,
      recipientId: activeTab === 'mentor' ? project.teacherId : selectedRecipientId || undefined
    });

    setChatText('');
    const updated = await apiService.getMessages(channelType, channelId);
    setMessages(updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Project Banner */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs bg-indigo-950/90 text-indigo-400 font-bold px-2.5 py-1 rounded-md border border-indigo-800/50">
                {project.id}
              </span>
              <Badge variant={project.status === 'ACTIVE' ? 'success' : 'warning'}>
                {project.status}
              </Badge>
              <span className="text-xs text-slate-400">{project.category}</span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">{project.duration}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{project.name}</h1>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              {project.description || project.problemStatement}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            {isTeacherOwner && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/teams/new?edit=${project.id}`)}
                icon={<Edit3 className="w-4 h-4" />}
              >
                Edit Project & Roles
              </Button>
            )}
            {isAssignedMember && (
              <Button
                variant="ai"
                size="sm"
                onClick={() => {
                  setEditingContribId(null);
                  setContribTitle('');
                  setContribDesc('');
                  setContribFileName('');
                  setIsContribModalOpen(true);
                }}
                icon={<Upload className="w-4 h-4" />}
              >
                Upload My Work
              </Button>
            )}
          </div>
        </div>

        {/* Quick Meta Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Faculty Mentor</span>
            <span className="text-slate-200 font-medium">{teacher?.name || 'Prof. Faculty'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Team Leader</span>
            <span className="text-emerald-400 font-medium">
              {teamLeader?.name || 'Unassigned'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">Team Size</span>
            <span className="text-slate-200 font-medium">
              {(project.teamLeaderId ? 1 : 0) + project.memberIds.length} Assigned Students
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">My Status</span>
            <span className="text-indigo-400 font-bold">
              {isTeacherOwner
                ? 'Faculty Supervisor'
                : isAssignedLeader
                ? 'Assigned Team Leader'
                : project.memberRoles[currentUser.id] || 'Team Member'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800 flex items-center gap-1 overflow-x-auto">
        {[
          { key: 'overview', label: 'Project Overview' },
          { key: 'members', label: `Team Roster (${(project.teamLeaderId ? 1 : 0) + project.memberIds.length})` },
          { key: 'contributions', label: `Submissions (${contributions.length})` },
          { key: 'documents', label: `PRD & Docs (${documents.length})` },
          { key: 'chat', label: 'Team Chat' },
          { key: 'mentor', label: 'Mentor Discussion' },
          { key: 'ai_insights', label: 'AI Insights' }
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === t.key
                ? 'border-indigo-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: AI INSIGHTS */}
      {activeTab === 'ai_insights' && (
        <div className="space-y-6">
          <AIInsightsPanel 
            title="Collective Project Insight"
            analysisType="collective_insight"
            teamId={project.id}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AIInsightsPanel 
              title="Progress Analysis"
              analysisType="progress_analysis"
              teamId={project.id}
            />
            <AIInsightsPanel 
              title="Collaboration Gaps"
              analysisType="collaboration_gap"
              teamId={project.id}
            />
          </div>
          <AIInsightsPanel 
            title="Team Recommendations"
            analysisType="collaboration_recommendation"
            teamId={project.id}
          />
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Problem Statement & Required Skills */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Problem Statement & Objectives
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {project.problemStatement}
                </p>

                <div className="pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Required Competencies & Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.requiredSkills.map((sk) => (
                      <span
                        key={sk}
                        className="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 text-xs font-medium"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Submissions Preview */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Recent Member Submissions ({contributions.length})
                  </h3>
                  <button
                    onClick={() => setActiveTab('contributions')}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    View All
                  </button>
                </div>

                {contributions.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No contributions uploaded yet. Team members can upload work submissions.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {contributions.slice(0, 3).map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-white block">{c.title}</span>
                          <span className="text-[11px] text-slate-400">
                            By {c.studentName} • {c.fileName || 'file'} ({c.fileSize})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(c.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right Col: Team Leader & Quick Info */}
            <div className="space-y-6">
              {/* Leader Card */}
              <Card className="p-6 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Designated Team Leader
                </span>
                {teamLeader ? (
                  <div className="flex items-center gap-3 pt-1">
                    <img
                      src={teamLeader.avatar}
                      alt={teamLeader.name}
                      className="w-12 h-12 rounded-full bg-slate-800"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">{teamLeader.name}</h4>
                      <p className="text-xs font-mono text-indigo-400">
                        {teamLeader.studentId || 'ID Pending'}
                      </p>
                      <p className="text-[11px] text-slate-400">{teamLeader.department}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No Team Leader assigned yet.</p>
                )}
              </Card>

              {/* Attached Docs Preview */}
              <Card className="p-6 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  PRD & Requirement Files
                </span>
                {documents.length === 0 ? (
                  <p className="text-xs text-slate-500">No files attached to this project.</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((d) => (
                      <div
                        key={d.id}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                          <span className="truncate text-slate-200">{d.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 flex-shrink-0">{d.size}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERS */}
      {activeTab === 'members' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Assigned Team Roster
              </h2>
              <p className="text-xs text-slate-400">
                Official students assigned to this project by faculty supervisor
              </p>
            </div>
            {isTeacherOwner && (
              <Button
                variant="primary"
                size="xs"
                onClick={() => navigate(`/teams/new?edit=${project.id}`)}
              >
                Re-assign Roles & Members
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team Leader first if present */}
            {teamLeader && (
              <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/50 ring-1 ring-indigo-500/20 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={teamLeader.avatar}
                    alt={teamLeader.name}
                    className="w-10 h-10 rounded-full bg-slate-800"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{teamLeader.name}</span>
                      <Badge variant="purple">Team Leader</Badge>
                    </div>
                    <span className="font-mono text-xs text-indigo-400 block">
                      {teamLeader.studentId}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {teamLeader.department} • {teamLeader.year || '3rd Year'}
                    </span>
                  </div>
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setSelectedProfileUser(teamLeader)}
                >
                  Profile
                </Button>
              </div>
            )}

            {/* Other Members */}
            {teamMembers
              .filter((m) => m.id !== project.teamLeaderId)
              .map((member) => {
                const assignedRole = project.memberRoles[member.id] || 'Team Member';
                return (
                  <div
                    key={member.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full bg-slate-800"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{member.name}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-semibold">
                            {assignedRole}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-indigo-400 block">
                          {member.studentId || 'ID Pending'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {member.department} • {member.year || '3rd Year'}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setSelectedProfileUser(member)}
                    >
                      Profile
                    </Button>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* TAB 3: CONTRIBUTIONS */}
      {activeTab === 'contributions' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Student Work Submissions & Contributions
              </h2>
              <p className="text-xs text-slate-400">
                Runtime submissions by team members. Students can edit and delete only their own uploaded content.
              </p>
            </div>
            {isAssignedMember && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingContribId(null);
                  setContribTitle('');
                  setContribDesc('');
                  setContribFileName('');
                  setIsContribModalOpen(true);
                }}
                icon={<Upload className="w-4 h-4" />}
              >
                Upload My Work
              </Button>
            )}
          </div>

          {contributions.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<FileText className="w-12 h-12 text-slate-500" />}
                title="No Submissions Yet"
                description="Team members can upload code artifacts, schemas, sprint deliverables, and test reports here."
                action={
                  isAssignedMember ? (
                    <Button
                      variant="primary"
                      onClick={() => setIsContribModalOpen(true)}
                      icon={<Upload className="w-4 h-4" />}
                    >
                      Submit First Contribution
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {contributions.map((c) => {
                const isMyUpload = c.studentId === currentUser.id;
                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{c.title}</h4>
                        {isMyUpload && <Badge variant="success">My Upload</Badge>}
                      </div>
                      <p className="text-xs text-slate-300">{c.description}</p>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1">
                        <span className="text-indigo-300 font-medium">Uploaded by {c.studentName}</span>
                        <span>•</span>
                        <span>{c.fileName}</span>
                        <span>•</span>
                        <span>{c.fileSize}</span>
                        <span>•</span>
                        <span>{new Date(c.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isMyUpload && (
                        <>
                          <button
                            onClick={() => {
                              setEditingContribId(c.id);
                              setContribTitle(c.title);
                              setContribDesc(c.description);
                              setContribFileName(c.fileName || '');
                              setIsContribModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            title="Edit Submission"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContribution(c.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-950/40 transition-colors"
                            title="Delete My Submission"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: DOCUMENTS & PRD */}
      {activeTab === 'documents' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                PRD & Requirement Documents
              </h2>
              <p className="text-xs text-slate-400">
                Official requirement specifications uploaded by faculty supervisor
              </p>
            </div>
            {isTeacherOwner && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsDocModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Upload PRD File
              </Button>
            )}
          </div>

          {documents.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<FileText className="w-12 h-12 text-slate-500" />}
                title="No Requirement Documents"
                description="Faculty can attach architectural PRD files, database schemas, and requirement documents."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800/60 text-indigo-400 flex items-center justify-center">
                      <File className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{d.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {d.size} • Uploaded by {d.uploadedByName} on{' '}
                        {new Date(d.uploadedAt).toLocaleDateString()}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          d.analysisAvailable ? 'text-emerald-400 font-medium' : 'text-amber-400'
                        }`}
                      >
                        {d.analysisNote || (d.analysisAvailable ? 'Processed for AI Analysis' : 'Binary format preserved')}
                      </p>
                    </div>
                  </div>

                  {isTeacherOwner && (
                    <button
                      onClick={async () => {
                        await apiService.deleteProjectDocument(d.id, currentUser.id);
                        showToast('Deleted', 'Requirement document removed.', 'info');
                        loadProjectData();
                      }}
                      className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 5: TEAM CHAT & TAB 6: MENTOR DISCUSSION */}
      {(activeTab === 'chat' || activeTab === 'mentor') && (
        <Card className="p-6 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {activeTab === 'mentor' ? 'Faculty Mentor Communication' : 'Project Team Channel'}
            </h2>
            <p className="text-xs text-slate-400">
              {activeTab === 'mentor'
                ? `Direct communication with supervising mentor ${teacher?.name || 'Faculty'}`
                : 'Scoped to assigned team members and faculty'}
            </p>
          </div>

          {/* Messages list */}
          <div className="space-y-3 min-h-[260px] max-h-[400px] overflow-y-auto p-4 rounded-xl bg-slate-950 border border-slate-800/80">
            {messages.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No messages in this channel yet. Say hello to your team!
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === currentUser.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-300">{m.senderName}</span>
                      <span>({m.senderRole})</span>
                      <span>•</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div
                      className={`max-w-md px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder={
                activeTab === 'mentor'
                  ? 'Message your faculty supervisor...'
                  : 'Send a message to your team...'
              }
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button type="submit" variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
              Send
            </Button>
          </form>
        </Card>
      )}

      {/* Contribution Upload Modal */}
      <Modal
        isOpen={isContribModalOpen}
        onClose={() => setIsContribModalOpen(false)}
        title={editingContribId ? 'Edit Work Submission' : 'Submit Project Work / Deliverable'}
      >
        <form onSubmit={handleSaveContribution} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Deliverable Title *
            </label>
            <input
              type="text"
              required
              value={contribTitle}
              onChange={(e) => setContribTitle(e.target.value)}
              placeholder="e.g. Frontend Auth & API Client Integration"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description / Notes *
            </label>
            <textarea
              rows={3}
              required
              value={contribDesc}
              onChange={(e) => setContribDesc(e.target.value)}
              placeholder="Detail your contribution, architecture decisions, and deliverables..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                File / Artifact Name
              </label>
              <input
                type="text"
                value={contribFileName}
                onChange={(e) => setContribFileName(e.target.value)}
                placeholder="e.g. auth_module.zip"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Artifact Size
              </label>
              <input
                type="text"
                value={contribFileSize}
                onChange={(e) => setContribFileSize(e.target.value)}
                placeholder="e.g. 2.4 MB"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsContribModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingContribId ? 'Update Submission' : 'Submit Deliverable'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Document Upload Modal (Teacher) */}
      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Upload Project Requirement Document"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!docName.trim()) return;
            await apiService.uploadProjectDocument(project.id, {
              name: docName,
              type: docType,
              size: '450 KB',
              uploadedById: currentUser.id,
              uploadedByName: currentUser.name
            });
            showToast('Document Uploaded', 'New requirement file indexed.', 'success');
            setIsDocModalOpen(false);
            setDocName('');
            loadProjectData();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Document Name *
            </label>
            <input
              type="text"
              required
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. System_PRD_Specification_v1.pdf"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Format Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="PDF">PDF Document</option>
              <option value="DOCX">DOCX Specification</option>
              <option value="Markdown">Markdown Architecture</option>
              <option value="Code">API Schema / Code</option>
              <option value="ZIP">ZIP Archive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDocModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>

      {/* Teammate Profile Modal */}
      {selectedProfileUser && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Student Teammate Profile</h3>
              <button
                onClick={() => setSelectedProfileUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={selectedProfileUser.avatar}
                alt={selectedProfileUser.name}
                className="w-12 h-12 rounded-full bg-slate-800"
              />
              <div>
                <h4 className="text-sm font-bold text-white">{selectedProfileUser.name}</h4>
                <p className="text-xs text-indigo-400 font-mono">
                  {selectedProfileUser.studentId || 'ID Pending'}
                </p>
                <p className="text-[11px] text-slate-400">{selectedProfileUser.email}</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p><strong>Department:</strong> {selectedProfileUser.department}</p>
              <p><strong>Year:</strong> {selectedProfileUser.year || '3rd Year'}</p>
              {selectedProfileUser.bio && <p><strong>Bio:</strong> {selectedProfileUser.bio}</p>}
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase">Skills:</span>
              <div className="flex flex-wrap gap-1">
                {(selectedProfileUser.skills || []).map((sk) => (
                  <span key={sk} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-200">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button size="sm" variant="outline" onClick={() => setSelectedProfileUser(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
