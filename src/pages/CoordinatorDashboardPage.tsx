import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  BarChart3,
  Sparkles,
  ArrowRight,
  Plus,
  Brain,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  FileText,
  Mail,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderGit2,
  GraduationCap,
  Layers,
  ArrowUpRight,
  Activity,
  Send,
  Search
} from 'lucide-react';
import { Card, StatCard } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { AIInsightsPanel } from '../components/AIInsightsPanel';
import { clientStorage } from '../storage/clientStorage';
import { supabase } from '../lib/supabase';

interface CoordinatorDashboardPageProps {
  defaultTab?: 'STUDENT' | 'TEACHER';
}

export const CoordinatorDashboardPage: React.FC<CoordinatorDashboardPageProps> = ({ defaultTab = 'TEACHER' }) => {
  const {
    currentUser,
    projects,
    authorizedEmails,
    notifications,
    activityLogs,
    addAuthorizedEmail,
    bulkAddAuthorizedEmails,
    removeAuthorizedEmail,
    showToast
  } = useApp();

  const navigate = useNavigate();

  if (!currentUser) {
    return null;
  }

  // Admin email management state
  const [activeAdminTab, setActiveAdminTab] = useState<'STUDENT' | 'TEACHER'>(defaultTab);
  const [singleEmail, setSingleEmail] = useState('');
  const [bulkEmailsText, setBulkEmailsText] = useState('');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resolve the students.student_id for AI skill analysis (students only)
  const [supabaseStudentId, setSupabaseStudentId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (currentUser?.role === 'STUDENT') {
      supabase
        .from('students')
        .select('student_id')
        .eq('user_id', currentUser.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.student_id) setSupabaseStudentId(data.student_id);
        });
    }
  }, [currentUser?.id]);

  // Compute registered users stats
  const registeredUsers = clientStorage.getUsers();
  const registeredTeachers = registeredUsers.filter((u) => u.role === 'TEACHER');
  const registeredStudents = registeredUsers.filter((u) => u.role === 'STUDENT');

  const filteredEmails = authorizedEmails.filter((e) => {
    const matchesRole = e.role === activeAdminTab;
    const matchesSearch = searchFilter
      ? e.email.toLowerCase().includes(searchFilter.toLowerCase())
      : true;
    return matchesRole && matchesSearch;
  });

  const handleAddSingleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleEmail) return;
    setIsSubmitting(true);
    try {
      await addAuthorizedEmail(singleEmail, activeAdminTab);
      setSingleEmail('');
      setIsSingleModalOpen(false);
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to add email', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const emails = bulkEmailsText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (emails.length === 0) return;
    setIsSubmitting(true);
    try {
      await bulkAddAuthorizedEmails(emails, activeAdminTab);
      setBulkEmailsText('');
      setIsBulkModalOpen(false);
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to bulk add emails', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ========================================================================== */
  /* 1. ADMIN DASHBOARD                                                         */
  /* ========================================================================== */
  if (currentUser.role === 'ADMIN') {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded border border-slate-200 shadow-2xs text-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-academic text-xl sm:text-2xl font-bold text-[#0B1E36] tracking-tight">
                Institutional Administration Portal
              </h1>
              <Badge variant="purple">Admin Authority</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage authorized faculty and student emails. Users can only register if pre-approved here.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsBulkModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Bulk Add Emails
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsSingleModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Authorize New Email
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Authorized Emails"
            value={authorizedEmails.length}
            icon={<Mail className="w-5 h-5" />}
            trend={`${authorizedEmails.filter((e) => e.status === 'ACTIVE').length} active`}
            trendPositive={true}
          />
          <StatCard
            title="Registered Teachers"
            value={registeredTeachers.length}
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            title="Registered Students"
            value={registeredStudents.length}
            icon={<GraduationCap className="w-5 h-5" />}
          />
          <StatCard
            title="Active Projects"
            value={projects.length}
            icon={<FolderGit2 className="w-5 h-5" />}
          />
        </div>

        {/* Main Email Authority Table */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            {/* Tabs for Teacher vs Student */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 border border-slate-200 rounded w-fit">
              <button
                onClick={() => setActiveAdminTab('TEACHER')}
                className={`px-4 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeAdminTab === 'TEACHER'
                    ? 'bg-[#0B1E36] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Teacher Emails ({authorizedEmails.filter((e) => e.role === 'TEACHER').length})
              </button>
              <button
                onClick={() => setActiveAdminTab('STUDENT')}
                className={`px-4 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeAdminTab === 'STUDENT'
                    ? 'bg-[#0B1E36] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Student Emails ({authorizedEmails.filter((e) => e.role === 'STUDENT').length})
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search authorized emails..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B1E36]"
              />
            </div>
          </div>

          {filteredEmails.length === 0 ? (
            <div className="py-12 text-center">
              <EmptyState
                icon={<Mail className="w-12 h-12 text-slate-400" />}
                title={`No authorized ${activeAdminTab.toLowerCase()} emails`}
                description={`Click 'Authorize New Email' or 'Bulk Add Emails' to allow ${activeAdminTab.toLowerCase()} registrations.`}
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsSingleModalOpen(true)}
                  >
                    Add {activeAdminTab === 'TEACHER' ? 'Faculty' : 'Student'} Email
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto mt-4 border border-slate-200 rounded">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[11px] font-bold text-[#0B1E36] uppercase tracking-wider">
                    <th className="py-3 px-4">Authorized Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Added Date</th>
                    <th className="py-3 px-4">Registration Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredEmails.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {item.email}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={item.role === 'TEACHER' ? 'purple' : 'info'}>
                          {item.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(item.addedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {item.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Registered & Active
                          </span>
                        ) : item.status === 'REGISTERED' ? (
                          <span className="inline-flex items-center gap-1.5 text-blue-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                            <Clock className="w-3.5 h-3.5" /> Awaiting Registration
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => removeAuthorizedEmail(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Revoke Authorization"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Single Email Modal */}
        <Modal
          isOpen={isSingleModalOpen}
          onClose={() => setIsSingleModalOpen(false)}
          title={`Authorize New ${activeAdminTab === 'TEACHER' ? 'Faculty' : 'Student'} Email`}
        >
          <form onSubmit={handleAddSingleEmail} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Official College Email Address
              </label>
              <input
                type="email"
                required
                value={singleEmail}
                onChange={(e) => setSingleEmail(e.target.value)}
                placeholder={activeAdminTab === 'TEACHER' ? 'prof.name@apex.edu' : 'student.name@apex.edu'}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                This user will be authorized to create an account with role {activeAdminTab}.
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsSingleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Authorize Email
              </Button>
            </div>
          </form>
        </Modal>

        {/* Bulk Add Modal */}
        <Modal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          title={`Bulk Authorize ${activeAdminTab === 'TEACHER' ? 'Faculty' : 'Student'} Emails`}
        >
          <form onSubmit={handleBulkAdd} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Paste Email Addresses (One per line or comma-separated)
              </label>
              <textarea
                rows={6}
                required
                value={bulkEmailsText}
                onChange={(e) => setBulkEmailsText(e.target.value)}
                placeholder={`alice@apex.edu\nbob@apex.edu\ncarol@apex.edu`}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                All valid emails will be authorized with role {activeAdminTab}. Duplicates will be skipped.
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsBulkModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Process Bulk List
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  /* ========================================================================== */
  /* 2. TEACHER DASHBOARD                                                       */
  /* ========================================================================== */
  if (currentUser.role === 'TEACHER') {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Teacher Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded border border-slate-200 shadow-2xs text-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-academic text-xl sm:text-2xl font-bold text-[#0B1E36] tracking-tight">
                Welcome, {currentUser.name}
              </h1>
              <Badge variant="purple">Faculty Coordinator</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Create and manage academic projects, upload PRD requirements, search students, and run AI team compatibility.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/teams/new')}
              icon={<Plus className="w-4 h-4" />}
            >
              CREATE PROJECT
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="My Projects"
            value={projects.length}
            icon={<FolderGit2 className="w-5 h-5" />}
          />
          <StatCard
            title="Active Teams"
            value={projects.filter((p) => p.status === 'ACTIVE').length}
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            title="Registered Students Available"
            value={registeredStudents.length}
            icon={<GraduationCap className="w-5 h-5" />}
          />
        </div>

        {/* Projects List Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="font-serif-academic text-base font-bold text-[#0B1E36]">Managed Projects</h2>
              <p className="text-xs text-slate-500">All student project teams under your supervision</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/teams/new')}
              icon={<Plus className="w-4 h-4" />}
            >
              Create Project
            </Button>
          </div>

          {projects.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<FolderGit2 className="w-12 h-12 text-slate-400" />}
                title="No projects created yet"
                description="Click 'CREATE PROJECT' to define requirements, upload PRDs, search students, and form your first team."
                action={
                  <Button
                    variant="primary"
                    onClick={() => navigate('/teams/new')}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Create Your First Project
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {projects.map((proj) => {
                const totalMembers = (proj.teamLeaderId ? 1 : 0) + proj.memberIds.length;
                return (
                  <div
                    key={proj.id}
                    className="p-5 rounded bg-white border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="font-mono text-[10px] text-blue-700 font-bold block mb-0.5">
                            {proj.id}
                          </span>
                          <h3 className="font-serif-academic text-sm font-bold text-[#0B1E36] leading-snug">{proj.name}</h3>
                        </div>
                        <Badge variant={proj.status === 'ACTIVE' ? 'success' : 'warning'}>
                          {proj.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                        {proj.description || proj.problemStatement}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 border border-slate-200">
                          {proj.category}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 border border-slate-200">
                          {proj.duration}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-medium">
                          {totalMembers} Members Assigned
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                      <span className="text-[11px] text-slate-400">
                        Updated {new Date(proj.updatedAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => navigate(`/teams/${proj.id}`)}
                        >
                          Workspace
                        </Button>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => navigate(`/teams/new?edit=${proj.id}`)}
                        >
                          Edit Project
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* AI INSIGHTS — only shown when a project exists and teamId is available */}
        {projects.length > 0 && (
          <AIInsightsPanel
            title="AI Project Intelligence"
            analysisType="collective_insight"
            teamId={projects[0]?.id}
            manualOnly={true}
          />
        )}
      </div>
    );
  }

  /* ========================================================================== */
  /* 3. STUDENT DASHBOARD                                                       */
  /* ========================================================================== */
  const myAssignedProject = projects.find(
    (p) => p.teamLeaderId === currentUser.id || p.memberIds.includes(currentUser.id)
  );

  const isLeader = myAssignedProject?.teamLeaderId === currentUser.id;
  const myAssignedRole = myAssignedProject
    ? myAssignedProject.memberRoles[currentUser.id] || (isLeader ? 'Team Leader' : 'Team Member')
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Student Welcome Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded border border-slate-200 shadow-2xs text-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif-academic text-xl sm:text-2xl font-bold text-[#0B1E36] tracking-tight">
              Hello, {currentUser.name}
            </h1>
            <Badge variant="success">Verified Student</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentUser.department} • {currentUser.year || '3rd Year'} • Student ID:{' '}
            <span className="font-mono text-[#0B1E36] font-bold">{currentUser.studentId || 'STU-UNASSIGNED'}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/profile')}
            icon={<UserCheck className="w-4 h-4" />}
          >
            My Profile
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/find-teammates')}
            icon={<Search className="w-4 h-4" />}
          >
            Find Collaborators
          </Button>
        </div>
      </div>

      {/* Assigned Project Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="font-serif-academic text-base font-bold text-[#0B1E36]">My Assigned Project</h2>
            <p className="text-xs text-slate-500">Official academic project assigned by your faculty coordinator</p>
          </div>
        </div>

        {!myAssignedProject ? (
          <div className="py-12">
            <EmptyState
              icon={<FolderGit2 className="w-12 h-12 text-slate-400" />}
              title="No Project Assigned Yet"
              description="Your faculty coordinator will assign you to an official project team once teams are formed. Keep your skills and profile up to date."
              action={
                <Button
                  variant="primary"
                  onClick={() => navigate('/profile')}
                >
                  Complete / Update Profile
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-6 p-6 rounded bg-white border border-slate-200 flex flex-col md:flex-row justify-between gap-6 shadow-2xs">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {myAssignedProject.id}
                </span>
                <Badge variant={myAssignedProject.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {myAssignedProject.status}
                </Badge>
              </div>

              <h3 className="font-serif-academic text-lg font-bold text-[#0B1E36]">{myAssignedProject.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {myAssignedProject.description || myAssignedProject.problemStatement}
              </p>

              <div className="pt-2 flex flex-wrap gap-2">
                <div className="px-3 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-slate-500">My Assigned Role: </span>
                  <span className="text-emerald-800 font-bold">{myAssignedRole}</span>
                </div>
                <div className="px-3 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-slate-500">Category: </span>
                  <span className="text-slate-800">{myAssignedProject.category}</span>
                </div>
                <div className="px-3 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-slate-500">Duration: </span>
                  <span className="text-slate-800">{myAssignedProject.duration}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between items-start md:items-end border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
              <div className="text-xs text-slate-500">
                <span>Team Members: </span>
                <span className="text-slate-900 font-bold">
                  {(myAssignedProject.teamLeaderId ? 1 : 0) + myAssignedProject.memberIds.length} Students
                </span>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => navigate(`/teams/${myAssignedProject.id}`)}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
                className="mt-4 md:mt-0"
              >
                Enter Project Workspace
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Notifications preview for student */}
      <Card className="p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <h2 className="font-serif-academic text-sm font-bold text-[#0B1E36]">Project Notifications</h2>
          <Link to="/notifications" className="text-xs text-blue-700 hover:underline font-semibold">
            View All ({notifications.length})
          </Link>
        </div>

        {notifications.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No notifications at this time.</p>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 3).map((n) => (
              <div
                key={n.id}
                className="p-3 rounded bg-white border border-slate-200 flex items-start justify-between gap-3 text-xs shadow-2xs"
              >
                <div>
                  <h4 className="font-semibold text-slate-900">{n.title}</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">{n.description}</p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* AI INSIGHTS — students only, manual trigger */}
      {currentUser.role === 'STUDENT' && supabaseStudentId && (
        <AIInsightsPanel
          title="My Personalized AI Insights"
          analysisType="skill_analysis"
          studentId={supabaseStudentId}
          manualOnly={true}
        />
      )}
    </div>
  );
};
