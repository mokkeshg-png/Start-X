import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { canViewTeam, canManageMembers, canAssignRoles, canResolveGap, canCreateTask } from '../auth/authorization';
import { AccessRestrictedPage, ProtectedAction } from '../auth/accessControl';
import {
  Users,
  BarChart3,
  MessageSquare,
  CheckSquare,
  FileText,
  Network,
  Sparkles,
  AlertTriangle,
  Download,
  Plus,
  Brain,
  ChevronRight,
  Send,
  Upload,
  Eye,
  UserCheck,
  ShieldAlert,
  UserX
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { Modal, Drawer } from '../components/common/Modal';
import { apiService } from '../services/apiService';
import { INITIAL_USERS } from '../mock/initialData';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip
} from 'recharts';

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const teamId = id || 'team-alpha';
  const {
    currentUser,
    teams,
    tasks,
    discussions,
    documents,
    gaps,
    insights,
    runAIAnalysis,
    resolveGap,
    updateTaskStatus,
    createTask,
    sendMessage,
    uploadDocument,
    showToast
  } = useApp();

  const navigate = useNavigate();

  // 1. Team Scope Authorization Check
  if (!canViewTeam(currentUser, teamId)) {
    return <AccessRestrictedPage reason={`Your role (${currentUser.role.replace('_', ' ')}) is not authorized to view ${teamId}'s private telemetry.`} />;
  }

  const team = teams.find((t) => t.id === teamId) || teams[0];

  if (!team) {
    return (
      <div className="p-8 text-center space-y-4 animate-in fade-in duration-200">
        <Card className="p-8 max-w-md mx-auto space-y-4 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">No Project Teams Found</h2>
          <p className="text-xs text-slate-500">
            No team exists matching ID '{teamId}' or system has no teams created yet.
          </p>
          <Button size="sm" variant="primary" onClick={() => navigate('/teams')}>
            View All Teams
          </Button>
        </Card>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<
    'overview' | 'members' | 'contributions' | 'discussions' | 'tasks' | 'documents' | 'knowledge' | 'insights' | 'gaps'
  >('overview');

  // Modals & Drawers state
  const [selectedMemberDrawer, setSelectedMemberDrawer] = useState<any | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isPreviewDocModalOpen, setIsPreviewDocModalOpen] = useState<any | null>(null);
  const [isConsistencyModalOpen, setIsConsistencyModalOpen] = useState<any | null>(null);
  const [activeDiscussionId, setActiveDiscussionId] = useState(discussions[0]?.id || 'disc-1');
  const [chatInput, setChatInput] = useState('');

  // Form State for new Task
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Frontend');
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [newTaskAssignee, setNewTaskAssignee] = useState(team.memberIds[0] || currentUser.id);

  // File Upload State
  const [uploadFileName, setUploadFileName] = useState('');

  const activeDiscussion = discussions.find((d) => d.id === activeDiscussionId) || discussions[0];

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeDiscussion) return;
    await sendMessage(activeDiscussion.id, chatInput);
    setChatInput('');
    showToast("Message Posted", "Discussion updated.", "success");
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    await createTask({
      teamId: team.id,
      title: newTaskTitle,
      description: newTaskDesc,
      assignedToId: newTaskAssignee,
      status: 'Pending',
      priority: newTaskPriority,
      category: newTaskCategory,
      dueDate: '2026-10-10'
    });
    setIsCreateTaskModalOpen(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName) return;
    await uploadDocument({
      teamId: team.id,
      name: uploadFileName,
      type: 'PDF',
      size: '1.4 MB',
      uploadedBy: currentUser.name,
      version: 'v1.0',
      url: '#'
    });
    setUploadFileName('');
  };

  const activeTasks = tasks.filter((t) => t.teamId === team.id);
  const activeGaps = gaps.filter((g) => g.teamId === team.id);

  // Role-aware Tab Filtering
  const isStaff = currentUser.role === 'STAFF_COORDINATOR' || currentUser.role === 'DEPARTMENT_HEAD';
  const isLeader = currentUser.role === 'TEAM_LEADER';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Team Intelligence Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{team.name}</h1>
              <Badge variant="purple">{team.status}</Badge>
              <Badge variant="ai">ID: {team.id}</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Project: <span className="text-slate-800 dark:text-slate-200 font-semibold">{team.projectTitle}</span> • Category: {team.category}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ProtectedAction permission="team:export">
              <Button
                size="sm"
                variant="outline"
                onClick={() => showToast("Exporting Team Audit", `Generated PDF report for ${team.name}.`, "info")}
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Export Report
              </Button>
            </ProtectedAction>

            <ProtectedAction permission="ai:run-team-analysis">
              <Button
                size="sm"
                variant="ai"
                onClick={() => runAIAnalysis(team.id)}
                icon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Run AI Analysis
              </Button>
            </ProtectedAction>
          </div>
        </div>

        {/* Quick Health Bar & Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Overall Progress</span>
            <div className="font-bold text-slate-900 dark:text-white text-base">{team.progress}%</div>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Health Score</span>
            <div className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{team.healthScore}/100</div>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Active Tasks</span>
            <div className="font-bold text-indigo-600 dark:text-indigo-400 text-base">{activeTasks.length}</div>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Collaboration Gaps</span>
            <div className="font-bold text-amber-600 dark:text-amber-400 text-base">{activeGaps.length} Open</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-semibold pb-1">
        {[
          { id: 'overview', label: 'Overview', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'members', label: 'Members', icon: <UserCheck className="w-3.5 h-3.5" /> },
          { id: 'contributions', label: currentUser.role === 'TEAM_MEMBER' ? 'My Contributions' : 'Contributions', icon: <BarChart3 className="w-3.5 h-3.5" /> },
          { id: 'discussions', label: 'Discussions', icon: <MessageSquare className="w-3.5 h-3.5" /> },
          { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-3.5 h-3.5" /> },
          { id: 'documents', label: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
          { id: 'knowledge', label: 'Knowledge Exchange', icon: <Network className="w-3.5 h-3.5" /> },
          { id: 'insights', label: 'AI Insights', icon: <Sparkles className="w-3.5 h-3.5" /> },
          { id: 'gaps', label: 'Collaboration Gaps', icon: <AlertTriangle className="w-3.5 h-3.5" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Project Milestone Progress Timeline
              </h3>
              <p className="text-xs text-slate-500">
                Weekly progress milestones based on verified repository commits and sprint tasks.
              </p>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              {[
                { week: 'Week 1', phase: 'Requirements & Architecture', progress: 100, status: 'Completed' },
                { week: 'Week 2', phase: 'Database Schema & Auth REST API', progress: 100, status: 'Completed' },
                { week: 'Week 3', phase: 'Product Grid & Redux Store', progress: 85, status: 'Completed' },
                { week: 'Week 4', phase: 'Cart State & Stripe Webhook', progress: 65, status: 'Ongoing' },
                { week: 'Week 5', phase: 'E2E Test Suites & QA Audit', progress: 20, status: 'Pending' }
              ].map((m) => (
                <div key={m.week} className="flex items-center justify-between text-xs p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 w-16">{m.week}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{m.phase}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={m.status === 'Completed' ? 'success' : m.status === 'Ongoing' ? 'purple' : 'neutral'}>
                      {m.status}
                    </Badge>
                    <span className="font-bold w-10 text-right">{m.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Role Progress Breakdown</h3>
            <div className="space-y-3">
              <ProgressBar label="Frontend Development" value={75} color="ai" />
              <ProgressBar label="Backend REST Microservices" value={60} color="brand" />
              <ProgressBar label="PostgreSQL Database Schema" value={85} color="emerald" />
              <ProgressBar label="Automated QA & Docs" value={40} color="amber" />
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: MEMBERS */}
      {activeTab === 'members' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {team.memberIds.map((mId) => {
            const student = INITIAL_USERS.find((u) => u.id === mId) || INITIAL_USERS[2];
            const roleName = team.memberRoles[mId] || 'Developer';

            return (
              <Card
                key={mId}
                onClick={() => setSelectedMemberDrawer(student)}
                className="p-5 flex flex-col justify-between cursor-pointer hover:border-indigo-400"
              >
                <div className="flex items-center gap-3">
                  <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{student.name}</h4>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold block">{roleName}</span>
                    <span className="text-[11px] text-slate-500">{student.department}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <Badge variant="success">Verified Contributor</Badge>
                  <span className="font-bold text-slate-700 dark:text-slate-300">View Profile & Evidence →</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 3: CONTRIBUTIONS */}
      {activeTab === 'contributions' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {currentUser.role === 'TEAM_MEMBER' ? 'My Contribution Analytics' : 'Member Contribution Intelligence'}
              </h3>
              <p className="text-xs text-slate-500">
                Weekly effort breakdown across Code, Documentation, Tasks, and Discussion activity.
              </p>
            </div>
            <Badge variant="ai">AI Verified</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { week: 'W1', Alice: 40, Bob: 35, Carol: 20, Jane: 10 },
                  { week: 'W2', Alice: 55, Bob: 45, Carol: 30, Jane: 15 },
                  { week: 'W3', Alice: 70, Bob: 50, Carol: 35, Jane: 5 },
                  { week: 'W4', Alice: 85, Bob: 60, Carol: 40, Jane: 2 }
                ]}
              >
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="Alice" stroke="#6366f1" strokeWidth={2} />
                <Line type="monotone" dataKey="Bob" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="Carol" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="Jane" stroke="#f43f5e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            ⚡ <span className="font-semibold">Disclaimer:</span> AI contribution assessments are assistive evaluations generated from project telemetry and evidence artifacts. Authorized staff review is recommended.
          </div>
        </Card>
      )}

      {/* TAB 4: DISCUSSIONS */}
      {activeTab === 'discussions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px]">
          {/* Left: Discussions List */}
          <Card className="p-4 overflow-y-auto space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Discussion Threads</h4>
            {discussions.map((d) => (
              <div
                key={d.id}
                onClick={() => setActiveDiscussionId(d.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                  activeDiscussionId === d.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900 dark:text-white">{d.title}</div>
                <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                  <span>{d.topic}</span>
                  <span>{d.messageCount} msgs</span>
                </div>
              </div>
            ))}
          </Card>

          {/* Center: Conversation & Composer */}
          <Card className="p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{activeDiscussion?.title}</h4>
              <Badge variant="purple">{activeDiscussion?.topic}</Badge>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3 text-xs">
              {activeDiscussion?.messages.map((m) => (
                <div key={m.id} className="flex items-start gap-2.5">
                  <img src={m.senderAvatar} alt={m.senderName} className="w-7 h-7 rounded-full object-cover shrink-0" />
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl max-w-[85%]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">{m.senderName}</span>
                      <span className="text-[9px] text-slate-400">{m.timestamp}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <input
                type="text"
                placeholder="Type message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs focus:outline-none"
              />
              <Button size="sm" variant="primary" onClick={handleSendMessage} icon={<Send className="w-3.5 h-3.5" />} />
            </div>
          </Card>

          {/* Right: AI Discussion Summarizer */}
          <Card variant="ai" className="p-4 space-y-4 text-xs overflow-y-auto">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
              <Brain className="w-4 h-4" /> AI Discussion Summarizer
            </div>

            <div>
              <span className="font-semibold text-emerald-600 block">Decisions Reached:</span>
              <ul className="list-disc pl-4 text-slate-600 dark:text-slate-300 space-y-1 mt-1">
                {activeDiscussion?.aiAnalysis.decisions.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>

            <div>
              <span className="font-semibold text-rose-600 block">Identified Problems:</span>
              <ul className="list-disc pl-4 text-slate-600 dark:text-slate-300 space-y-1 mt-1">
                {activeDiscussion?.aiAnalysis.problems.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Project Sprint Kanban Board</h3>
            <ProtectedAction permission="task:create">
              <Button size="sm" variant="primary" onClick={() => setIsCreateTaskModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                Create Task
              </Button>
            </ProtectedAction>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {(['Pending', 'Ongoing', 'Completed', 'Blocked'] as const).map((colStatus) => {
              const colTasks = activeTasks.filter((t) => t.status === colStatus);
              return (
                <div key={colStatus} className="bg-slate-100 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 min-h-[400px]">
                  <div className="flex items-center justify-between font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <span>{colStatus}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800">{colTasks.length}</span>
                  </div>

                  {colTasks.map((t) => (
                    <Card key={t.id} className="p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-slate-900 dark:text-white leading-tight">{t.title}</span>
                        <Badge variant={t.priority === 'Critical' ? 'error' : 'warning'} size="sm">
                          {t.priority}
                        </Badge>
                      </div>
                      <p className="text-slate-500 text-[11px] line-clamp-2">{t.description}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400">{t.dueDate}</span>
                        <select
                          value={t.status}
                          onChange={(e) => updateTaskStatus(t.id, e.target.value as any)}
                          className="text-[10px] bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 border border-slate-300 dark:border-slate-700 font-semibold"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Ongoing">Ongoing</option>
                          <option value="Completed">Completed</option>
                          <option value="Blocked">Blocked</option>
                        </select>
                      </div>
                    </Card>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upload New Project Document</h3>
            <form onSubmit={handleFileUpload} className="flex gap-3 text-xs">
              <input
                type="text"
                placeholder="Enter Document File Name (e.g. Stripe Integration Specs.pdf)"
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <Button type="submit" variant="primary" size="sm" icon={<Upload className="w-3.5 h-3.5" />}>
                Upload Document
              </Button>
            </form>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4 space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-900 dark:text-white leading-tight">{doc.name}</span>
                  <Badge variant={doc.aiStatus === 'MATCH' ? 'success' : 'warning'}>{doc.aiStatus}</Badge>
                </div>
                <div className="text-[11px] text-slate-500">{doc.size} • {doc.uploadedBy} • {doc.version}</div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => setIsPreviewDocModalOpen(doc)} icon={<Eye className="w-3.5 h-3.5" />}>
                    Preview
                  </Button>
                  <ProtectedAction permission="document:analyze-consistency">
                    <Button size="sm" variant="ai" onClick={() => setIsConsistencyModalOpen(doc)}>
                      AI Consistency Check
                    </Button>
                  </ProtectedAction>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: KNOWLEDGE EXCHANGE MAP */}
      {activeTab === 'knowledge' && (
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Network className="w-5 h-5 text-indigo-500" /> Interactive Knowledge Exchange Graph
              </h3>
              <p className="text-xs text-slate-500">Visualizes student communications, role topics, and isolated member risks.</p>
            </div>
            <Badge variant="error">1 Isolated Member Detected</Badge>
          </div>

          <div className="h-80 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
            <svg className="w-full h-full">
              <line x1="150" y1="100" x2="350" y2="100" stroke="#6366f1" strokeWidth="2" strokeDasharray="4" />
              <line x1="350" y1="100" x2="550" y2="100" stroke="#10b981" strokeWidth="2" />
              <line x1="350" y1="100" x2="350" y2="240" stroke="#f43f5e" strokeWidth="1" />

              <g transform="translate(150, 100)">
                <circle r="25" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#fff" fontSize="10">Alice</text>
              </g>
              <g transform="translate(350, 100)">
                <circle r="25" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#fff" fontSize="10">Bob</text>
              </g>
              <g transform="translate(550, 100)">
                <circle r="25" fill="#78350f" stroke="#f59e0b" strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#fff" fontSize="10">Carol</text>
              </g>
              <g transform="translate(350, 240)">
                <circle r="25" fill="#881337" stroke="#f43f5e" strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#fff" fontSize="10">Jane (Isolated)</text>
              </g>
            </svg>
          </div>
        </Card>
      )}

      {/* TAB 8: AI INSIGHTS */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          <Card variant="ai" className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-500" /> Flagship Project Intelligence Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {insights.map((ins) => (
                <div key={ins.id} className="p-4 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block">{ins.title}</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{ins.content}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 9: COLLABORATION GAPS */}
      {activeTab === 'gaps' && (
        <div className="space-y-4">
          {gaps.map((gap) => (
            <Card key={gap.id} className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{gap.type}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{gap.description}</p>
                </div>
                <Badge variant={gap.impact === 'High' ? 'error' : 'warning'}>{gap.impact} Impact</Badge>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs flex justify-between items-center">
                <span>Recommendation: <strong className="text-slate-800 dark:text-slate-200">{gap.recommendation.actionText}</strong></span>
                <ProtectedAction permission="gap:resolve">
                  <Button size="sm" variant="primary" onClick={() => resolveGap(gap.id)}>
                    Resolve Gap Now
                  </Button>
                </ProtectedAction>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Member Profile Drawer */}
      {selectedMemberDrawer && (
        <Drawer
          isOpen={!!selectedMemberDrawer}
          onClose={() => setSelectedMemberDrawer(null)}
          title={`Student Profile: ${selectedMemberDrawer.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <img src={selectedMemberDrawer.avatar} alt={selectedMemberDrawer.name} className="w-14 h-14 rounded-full object-cover" />
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{selectedMemberDrawer.name}</h4>
                <p className="text-slate-500">{selectedMemberDrawer.department} • {selectedMemberDrawer.year}</p>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Verified Skills:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedMemberDrawer.skills?.map((s: string) => (
                  <Badge key={s} variant="purple">{s}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        title="Create New Sprint Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea
              rows={2}
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700"
            />
          </div>
          <Button type="submit" variant="primary" className="w-full">Create Task</Button>
        </form>
      </Modal>

      {/* AI Consistency Modal */}
      {isConsistencyModalOpen && (
        <Modal
          isOpen={!!isConsistencyModalOpen}
          onClose={() => setIsConsistencyModalOpen(null)}
          title="AI Document Consistency Report"
        >
          <div className="space-y-4 text-xs">
            <Badge variant="warning">Scope Warning Detected</Badge>
            <p className="text-slate-700 dark:text-slate-300">
              Payment Gateway microservice appears in submitted codebase artifacts but is not specified in PRD v1.0.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
