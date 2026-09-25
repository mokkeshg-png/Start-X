import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BarChart3,
  AlertTriangle,
  Sparkles,
  CheckSquare,
  ArrowUpRight,
  TrendingUp,
  Download,
  Plus,
  Brain,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  FileText,
  Building2
} from 'lucide-react';
import { Card, StatCard } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { Modal } from '../components/common/Modal';
import { ProtectedAction } from '../auth/accessControl';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export const CoordinatorDashboardPage: React.FC = () => {
  const {
    currentUser,
    teams,
    tasks,
    gaps,
    insights,
    documents,
    runAIAnalysis,
    showToast
  } = useApp();

  const [selectedTerm, setSelectedTerm] = useState('Fall 2026 Term');
  const [analyzingTeamId, setAnalyzingTeamId] = useState<string | null>(null);
  const [selectedInsightModal, setSelectedInsightModal] = useState<any | null>(null);
  const navigate = useNavigate();

  // Metrics calculation
  const totalTeams = teams.length;
  const activeStudents = teams.reduce((acc, t) => acc + t.memberIds.length, 0);
  const avgProgress = Math.round(
    teams.reduce((acc, t) => acc + t.progress, 0) / (teams.length || 1)
  );
  const openGapsCount = gaps.filter((g) => g.status === 'Open').length;
  const pendingReviewsCount = 4;
  const aiInsightsCount = insights.length;

  const teamHealthData = teams.map((t) => ({
    name: t.name,
    health: t.healthScore,
    progress: t.progress
  }));

  const taskStatusData = [
    { name: 'Completed', value: tasks.filter((t) => t.status === 'Completed').length, color: '#10b981' },
    { name: 'Ongoing', value: tasks.filter((t) => t.status === 'Ongoing').length, color: '#6366f1' },
    { name: 'Pending', value: tasks.filter((t) => t.status === 'Pending').length, color: '#f59e0b' },
    { name: 'Blocked', value: tasks.filter((t) => t.status === 'Blocked').length, color: '#f43f5e' }
  ];

  const handleAnalyzeTeam = async (teamId: string) => {
    setAnalyzingTeamId(teamId);
    await runAIAnalysis(teamId);
    setAnalyzingTeamId(null);
  };

  /* -------------------------------------------------------------------------- */
  /* ROLE 1: STAFF COORDINATOR DASHBOARD                                       */
  /* -------------------------------------------------------------------------- */
  if (currentUser.role === 'STAFF_COORDINATOR') {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Good morning, {currentUser.name}
              </h1>
              <Badge variant="ai">Coordinator Scope</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Here is the real-time project telemetry and collaboration health of your assigned engineering teams.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 font-medium focus:outline-none"
            >
              <option>Fall 2026 Term</option>
              <option>Spring 2026 Term</option>
            </select>

            <ProtectedAction permission="team:export">
              <Button
                size="sm"
                variant="outline"
                onClick={() => showToast("Exporting Ecosystem Summary", "Downloaded PDF report.", "info")}
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Export Ecosystem Report
              </Button>
            </ProtectedAction>

            <ProtectedAction permission="team:create">
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate('/teams/new')}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Create Project Team
              </Button>
            </ProtectedAction>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Assigned Teams" value={totalTeams} label="Active Projects" trend="+1 sprint" trendPositive={true} icon={<Users className="w-4 h-4 text-indigo-500" />} onClick={() => navigate('/teams')} />
          <StatCard title="Active Students" value={activeStudents} label="Enrolled Contributors" trend="100% active" trendPositive={true} icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />} />
          <StatCard title="Avg Progress" value={`${avgProgress}%`} label="Sprint Milestone" trend="+8% W/W" trendPositive={true} icon={<TrendingUp className="w-4 h-4 text-cyan-500" />} />
          <StatCard title="Open Gaps" value={openGapsCount} label="AI Detected Issues" trend="Action Needed" trendPositive={false} icon={<AlertTriangle className="w-4 h-4 text-amber-500" />} onClick={() => navigate('/gaps')} />
          <StatCard title="Pending Reviews" value={pendingReviewsCount} label="Submissions" trend="Action Needed" trendPositive={true} icon={<CheckSquare className="w-4 h-4 text-purple-500" />} onClick={() => navigate('/documents')} />
          <StatCard title="AI Insights" value={aiInsightsCount} label="Telemetry Syntheses" variant="ai" trend="Live" trendPositive={true} icon={<Sparkles className="w-4 h-4 text-cyan-400" />} onClick={() => navigate('/insights')} />
        </div>

        {/* Overview + Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" /> Assigned Teams Overview
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/teams')} icon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                  View All Teams
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                      <th className="py-3 px-3">Team & Project</th>
                      <th className="py-3 px-3">Progress</th>
                      <th className="py-3 px-3">Health</th>
                      <th className="py-3 px-3">Gaps</th>
                      <th className="py-3 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {teams.map((team) => (
                      <tr key={team.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-3">
                          <div onClick={() => navigate(`/teams/${team.id}`)} className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 cursor-pointer">
                            {team.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{team.projectTitle}</div>
                        </td>
                        <td className="py-3.5 px-3 w-36"><ProgressBar value={team.progress} size="sm" /></td>
                        <td className="py-3.5 px-3 font-semibold">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] ${team.healthScore >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {team.healthScore}/100
                          </span>
                        </td>
                        <td className="py-3.5 px-3">{team.openGapsCount > 0 ? <span className="text-amber-600 font-bold">{team.openGapsCount} Open</span> : <span className="text-emerald-600 font-semibold">Healthy</span>}</td>
                        <td className="py-3.5 px-3 flex gap-1">
                          <Button size="sm" variant="secondary" onClick={() => navigate(`/teams/${team.id}`)}>View</Button>
                          <ProtectedAction permission="ai:run-team-analysis">
                            <Button size="sm" variant="ai" isLoading={analyzingTeamId === team.id} onClick={() => handleAnalyzeTeam(team.id)}>Analyze</Button>
                          </ProtectedAction>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card variant="ai" className="p-6">
              <div className="flex items-center gap-2 mb-3 font-bold text-sm text-slate-900 dark:text-white">
                <Brain className="w-5 h-5 text-indigo-500" /> AI Critical Telemetry Alerts
              </div>
              <div className="space-y-2">
                {insights.slice(0, 3).map((item) => (
                  <div key={item.id} onClick={() => setSelectedInsightModal(item)} className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer text-xs space-y-1">
                    <span className="font-bold text-slate-900 dark:text-white block">{item.title}</span>
                    <p className="text-slate-600 dark:text-slate-300">{item.content}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 uppercase">Team Health Distribution</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamHealthData}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', fontSize: '11px' }} />
                    <Bar dataKey="health" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 uppercase">Sprint Task Status</h3>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={taskStatusData} innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
                      {taskStatusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>

        {selectedInsightModal && (
          <Modal isOpen={!!selectedInsightModal} onClose={() => setSelectedInsightModal(null)} title={selectedInsightModal.title}>
            <p className="text-xs text-slate-700 dark:text-slate-300">{selectedInsightModal.content}</p>
          </Modal>
        )}
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* ROLE 2: TEAM LEADER DASHBOARD                                             */
  /* -------------------------------------------------------------------------- */
  if (currentUser.role === 'TEAM_LEADER') {
    const myTeam = teams.find((t) => t.leaderId === currentUser.id || t.memberIds.includes(currentUser.id)) || teams[0];
    const myTasks = myTeam ? tasks.filter((t) => t.teamId === myTeam.id) : [];

    if (!myTeam) {
      return (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="p-8 text-center space-y-4 max-w-lg mx-auto">
            <Users className="w-12 h-12 text-slate-400 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">No Team Assigned Yet</h2>
            <p className="text-xs text-slate-500">You are logged in as a Team Leader, but no project team has been created or assigned to you yet.</p>
            <Button size="sm" variant="primary" onClick={() => navigate('/teams/new')} icon={<Plus className="w-4 h-4" />}>
              Create Project Team
            </Button>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Welcome, {currentUser.name}</h1>
              <Badge variant="purple">Team Leader Persona</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">Lead Developer & Admin for {myTeam.name} ({myTeam.projectTitle})</p>
          </div>

          <Button size="sm" variant="primary" onClick={() => navigate(`/teams/${myTeam.id}`)} icon={<Users className="w-3.5 h-3.5" />}>
            Manage My Team
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Team Progress" value={`${myTeam.progress}%`} label="Sprint Goal" icon={<TrendingUp className="w-4 h-4 text-indigo-500" />} />
          <StatCard title="Active Tasks" value={myTasks.length} label="Sprint Backlog" icon={<CheckSquare className="w-4 h-4 text-emerald-500" />} onClick={() => navigate('/tasks')} />
          <StatCard title="Team Health" value={`${myTeam.healthScore}/100`} label="Synergy Score" icon={<ShieldCheck className="w-4 h-4 text-cyan-500" />} />
          <StatCard title="Open Gaps" value={myTeam.openGapsCount} label="Needs Action" icon={<AlertTriangle className="w-4 h-4 text-amber-500" />} onClick={() => navigate('/gaps')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Team Tasks & Assignment Control</h3>
            <div className="space-y-2 text-xs">
              {myTasks.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">No active sprint tasks recorded.</div>
              ) : (
                myTasks.slice(0, 4).map((t) => (
                  <div key={t.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{t.title}</span>
                      <span className="text-[10px] text-slate-400 block">{t.category} • Priority: {t.priority}</span>
                    </div>
                    <Badge variant={t.status === 'Completed' ? 'success' : 'warning'}>{t.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card variant="ai" className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Team AI Summary & Insights
            </h3>
            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl text-xs space-y-1">
              <span className="font-bold text-indigo-600 block">Sprint Status:</span>
              <p className="text-slate-700 dark:text-slate-300">
                {myTeam.name} is at {myTeam.progress}% progress. Health rating stands at {myTeam.healthScore}/100 based on runtime activity.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* ROLE 3: TEAM MEMBER / STUDENT DASHBOARD                                    */
  /* -------------------------------------------------------------------------- */
  if (currentUser.role === 'TEAM_MEMBER') {
    const myAssignedTasks = tasks.filter((t) => t.assignedToId === currentUser.id);
    const myTeam = teams.find((t) => t.memberIds.includes(currentUser.id));

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Welcome, {currentUser.name}</h1>
              <Badge variant="success">Student Contributor</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentUser.department} • {myTeam ? myTeam.name : 'Unassigned Contributor'}
            </p>
          </div>

          <Button size="sm" variant="outline" onClick={() => navigate('/profile')} icon={<UserCheck className="w-3.5 h-3.5" />}>
            My Academic Profile
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Assigned Tasks" value={myAssignedTasks.length} label="My Backlog" icon={<CheckSquare className="w-4 h-4 text-emerald-500" />} onClick={() => navigate('/tasks')} />
          <StatCard title="Contribution Count" value={myAssignedTasks.filter(t => t.status === 'Completed').length} label="Verified Completed" icon={<BarChart3 className="w-4 h-4 text-indigo-500" />} onClick={() => navigate('/contributions')} />
          <StatCard title="Verified Skills" value={currentUser.skills?.length || 0} label="Profile Evidence" icon={<ShieldCheck className="w-4 h-4 text-cyan-500" />} onClick={() => navigate('/profile')} />
          <StatCard title="Team Progress" value={myTeam ? `${myTeam.progress}%` : '0%'} label={myTeam ? myTeam.name : 'N/A'} icon={<TrendingUp className="w-4 h-4 text-purple-500" />} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Current Tasks</h3>
            <div className="space-y-2 text-xs">
              {myAssignedTasks.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">No active tasks assigned to you yet.</div>
              ) : (
                myAssignedTasks.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{t.title}</span>
                      <span className="text-[10px] text-slate-400 block">Due: {t.dueDate}</span>
                    </div>
                    <Badge variant={t.status === 'Completed' ? 'success' : 'warning'}>{t.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick Student Actions</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Button variant="secondary" onClick={() => navigate('/find-teammates')}>Find Teammates</Button>
              <Button variant="secondary" onClick={() => navigate('/discussions')}>Team Discussions</Button>
              <Button variant="secondary" onClick={() => navigate('/documents')}>Shared Documents</Button>
              <Button variant="secondary" onClick={() => navigate('/chat')}>Private Chat</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* ROLE 4: DEPARTMENT HEAD DASHBOARD                                          */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Department Oversight: {currentUser.name}</h1>
            <Badge variant="purple">Head of Department</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">Institutional aggregate health, project metrics, and department progress summaries.</p>
        </div>

        <Badge variant="ai">Department Scope</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Department Projects" value={teams.length} label="School of Computing" icon={<Building2 className="w-4 h-4 text-indigo-500" />} />
        <StatCard title="Active Students" value={activeStudents} label="Registered Enrollees" icon={<Users className="w-4 h-4 text-emerald-500" />} />
        <StatCard title="Department Health" value={teams.length ? `${Math.round(teams.reduce((acc, t) => acc + t.healthScore, 0) / teams.length)}/100` : '0/100'} label="Aggregate Score" icon={<ShieldCheck className="w-4 h-4 text-cyan-500" />} />
        <StatCard title="Completion Rate" value={`${avgProgress}%`} label="On-Track Sprint" icon={<TrendingUp className="w-4 h-4 text-purple-500" />} />
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Institutional Department Project Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                <th className="py-2.5 px-3">Project Title</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Progress</th>
                <th className="py-2.5 px-3">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No department project teams recorded yet.
                  </td>
                </tr>
              ) : (
                teams.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{t.projectTitle}</td>
                    <td className="py-3 px-3 text-slate-500">{t.category}</td>
                    <td className="py-3 px-3 w-32"><ProgressBar value={t.progress} size="sm" /></td>
                    <td className="py-3 px-3"><Badge variant={t.healthScore >= 80 ? 'success' : 'warning'}>{t.healthScore}/100</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
