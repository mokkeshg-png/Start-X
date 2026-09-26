import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserSearch,
  Sparkles,
  Send,
  CheckCircle2,
  ShieldCheck,
  Brain,
  Search,
  Users,
  GraduationCap
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { apiService } from '../services/apiService';
import { User } from '../types';

export const FindTeammatesPage: React.FC = () => {
  const { currentUser, sendCollaborationRequest, showToast } = useApp();

  if (!currentUser) {
    return null;
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Invite modal state
  const [selectedStudentForInvite, setSelectedStudentForInvite] = useState<User | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [suggestedRole, setSuggestedRole] = useState('Frontend Developer');
  const [inviteMessage, setInviteMessage] = useState('');

  const availableSkillChips = [
    'React',
    'TypeScript',
    'Node.js',
    'Python',
    'PostgreSQL',
    'Docker',
    'UI/UX',
    'AI/ML',
    'Tailwind CSS'
  ];

  const loadStudents = async () => {
    setIsSearching(true);
    try {
      // Use real Supabase search — filters by name, email, studentId, skills, department
      const results = await apiService.searchStudents({
        query: searchQuery || undefined,
        department: selectedDept !== 'All Departments' ? selectedDept : undefined,
        skills: selectedSkills.length > 0 ? selectedSkills : undefined,
      });
      // Exclude current user
      setRegisteredStudents(results.filter((s) => s.id !== currentUser.id));
    } catch (err) {
      console.warn('searchStudents error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [searchQuery, selectedDept, selectedSkills]);

  const handleSendInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForInvite) return;

    try {
      await sendCollaborationRequest({
        receiverId: selectedStudentForInvite.id,
        projectTitle: projectTitle.trim() || 'Academic Project Collaboration',
        suggestedRole,
        message: inviteMessage.trim() || `Hi ${selectedStudentForInvite.name}, I would like to collaborate with you.`
      });

      setSelectedStudentForInvite(null);
      setProjectTitle('');
      setInviteMessage('');
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to send invite', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-white">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <UserSearch className="w-5 h-5 text-indigo-400" /> Student Collaborator Discovery
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Discover registered students across departments to explore future academic and capstone collaboration.
        </p>
      </div>

      {/* Query Filters Card */}
      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Search by Name, Student ID, or Keyword
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registered students..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Filter by Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All Departments">All Departments</option>
              <option value="Computer Science & Engineering">Computer Science</option>
              <option value="Information Technology">Information Tech</option>
              <option value="Electronics & Communication">Electronics & Comm</option>
              <option value="Data Science & AI">Data Science & AI</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-2">
            Skill Filter
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
                  className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Results Grid */}
      {registeredStudents.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={<Users className="w-12 h-12 text-slate-500" />}
            title="No Matching Students Found"
            description="Try changing your search keywords or skill filters. Only verified registered student accounts are shown."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {registeredStudents.map((student) => (
            <Card
              key={student.id}
              className="p-5 flex flex-col justify-between hover:border-indigo-500/50 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-12 h-12 rounded-full bg-slate-800 flex-shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-white text-sm">{student.name}</h3>
                    <span className="text-[10px] font-mono text-indigo-400 block">
                      {student.studentId || 'ID Pending'}
                    </span>
                    <span className="text-xs text-slate-400">{student.department}</span>
                  </div>
                </div>

                {student.bio && (
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {student.bio}
                  </p>
                )}

                <div className="flex flex-wrap gap-1 pt-1">
                  {(student.skills || []).slice(0, 4).map((sk) => (
                    <span key={sk} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">{student.year || '3rd Year'}</span>
                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => setSelectedStudentForInvite(student)}
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Invite
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {selectedStudentForInvite && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStudentForInvite(null)}
          title={`Invite ${selectedStudentForInvite.name} to Collaborate`}
        >
          <form onSubmit={handleSendInviteSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Project Name / Working Title *
              </label>
              <input
                type="text"
                required
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Smart Campus Energy Monitoring System"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Suggested Role
              </label>
              <input
                type="text"
                value={suggestedRole}
                onChange={(e) => setSuggestedRole(e.target.value)}
                placeholder="e.g. Frontend Developer"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Personalized Message
              </label>
              <textarea
                rows={3}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Hi, would you like to collaborate on our upcoming capstone project?"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedStudentForInvite(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Send Invitation
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
