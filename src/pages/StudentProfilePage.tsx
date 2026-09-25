import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Globe,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Sparkles,
  FolderGit2,
  Lock,
  Edit2,
  Save,
  X,
  FileCode,
  Mail,
  Building
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { AIInsightsPanel } from '../components/AIInsightsPanel';
import { apiService } from '../services/apiService';
import { StudentProfile } from '../types';
import { supabase } from '../lib/supabase';

export const StudentProfilePage: React.FC = () => {
  const { currentUser, updateUserProfile, showToast } = useApp();

  if (!currentUser) {
    return null;
  }

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name || '');
  const [department, setDepartment] = useState(currentUser.department || '');
  const [year, setYear] = useState(currentUser.year || '3rd Year');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [github, setGithub] = useState(currentUser.github || '');
  const [linkedin, setLinkedin] = useState(currentUser.linkedin || '');
  const [skills, setSkills] = useState<string[]>(currentUser.skills || []);
  const [newSkill, setNewSkill] = useState('');

  // Extended student profile
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [supabaseStudentId, setSupabaseStudentId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setName(currentUser.name);
    setDepartment(currentUser.department);
    setYear(currentUser.year || '3rd Year');
    setBio(currentUser.bio || '');
    setGithub(currentUser.github || '');
    setLinkedin(currentUser.linkedin || '');
    setSkills(currentUser.skills || []);

    if (currentUser.role === 'STUDENT') {
      apiService.getStudentProfile(currentUser.id).then((p) => {
        if (p) setStudentProfile(p);
      });

      // Resolve the students.student_id (UUID) for AI analysis
      supabase
        .from('students')
        .select('student_id')
        .eq('user_id', currentUser.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.student_id) setSupabaseStudentId(data.student_id);
        });
    }
  }, [currentUser]);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const s = newSkill.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile({
        name,
        department,
        year,
        bio,
        github,
        linkedin,
        skills
      });
      setIsEditing(false);
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update profile', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      {/* Top Profile Card */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-md bg-slate-800"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{currentUser.name}</h1>
                <Badge variant="success" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                  {currentUser.role === 'STUDENT' ? 'Verified Student' : currentUser.role}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                <span>{currentUser.department}</span>
                {currentUser.year && (
                  <>
                    <span>•</span>
                    <span>{currentUser.year}</span>
                  </>
                )}
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-indigo-400 font-bold">
                  <Lock className="w-3 h-3 text-slate-500" />
                  {currentUser.studentId || 'ID Pending'}
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-2 max-w-xl">
                {currentUser.bio || 'Registered academic member on APEX Project Intelligence Platform.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                icon={<Edit2 className="w-4 h-4" />}
              >
                Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveProfile}
                  icon={<Save className="w-4 h-4" />}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Editing Form */}
      {isEditing && (
        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Edit Student Profile Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Full Legal Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Permanent Student ID (Locked)
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 font-mono">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentUser.studentId || 'Generated on Registration'}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Official Institutional Email (Locked)
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 font-mono">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentUser.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Data Science & AI">Data Science & AI</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Academic Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">GitHub Profile URL</label>
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1">LinkedIn Profile URL</label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1">Bio / Profile Summary</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your technical focus, past capstones, and interests..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Skills Matrix */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Technical Skills & Competencies
          </h2>
          <span className="text-xs text-slate-400">{skills.length} Registered Skills</span>
        </div>

        {/* Add skill input */}
        <form onSubmit={handleAddSkill} className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add new skill (e.g. Docker, GraphQL, Kubernetes)..."
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Button type="submit" variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />}>
            Add Skill
          </Button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {skills.length === 0 ? (
            <p className="text-xs text-slate-500">No skills added yet. Add your core technical skills.</p>
          ) : (
            skills.map((sk) => (
              <span
                key={sk}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium"
              >
                {sk}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(sk)}
                  className="text-slate-500 hover:text-red-400 ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))
          )}
        </div>
      </Card>

      {/* AI INSIGHTS */}
      {currentUser.role === 'STUDENT' && (
        <AIInsightsPanel
          title="Student Profile & Skill Analysis"
          analysisType="skill_analysis"
          studentId={supabaseStudentId ?? currentUser.id}
          manualOnly={true}
        />
      )}
    </div>
  );
};
