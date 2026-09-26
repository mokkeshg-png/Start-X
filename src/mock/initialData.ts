import { CollegeBrandingConfig } from '../types';

// ============================================================
// System configuration constants ONLY.
// NO mock users, NO fake projects, NO hardcoded business data.
// ============================================================
export const INITIAL_BRANDING: CollegeBrandingConfig = {
  collegeName: "AGNI COLLEGE OF TECHNOLOGY",
  collegeShortName: "ACT",
  platformName: "INTELLIGENT PROJECT COLLABORATION PLATFORM",
  tagline: "INTELLIGENT PROJECT COLLABORATION PLATFORM",
  logoText: "ACT",
  primaryColor: "#0f172a",
  accentColor: "#6366f1"
};

// Pre-defined role options for team member assignment
export const PREDEFINED_PROJECT_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Database Developer',
  'UI/UX Designer',
  'AI/ML Engineer',
  'Testing / QA',
  'DevOps Engineer',
  'Research',
  'Documentation',
  'Project Manager'
];

// Pre-defined project categories
export const PREDEFINED_CATEGORIES = [
  'Full Stack Web Application',
  'Mobile Application',
  'AI / Machine Learning',
  'IoT & Embedded Systems',
  'Data Science & Analytics',
  'Cybersecurity',
  'Cloud Computing',
  'Blockchain',
  'Game Development',
  'Research Project'
];

// Pre-defined project types
export const PREDEFINED_PROJECT_TYPES = [
  'Academic Project',
  'Capstone Project',
  'Research Project',
  'Industry Collaboration',
  'Hackathon Project',
  'Open Source Contribution',
  'Internship Project'
];

// Pre-defined duration options
export const PREDEFINED_DURATIONS = [
  '4 Weeks',
  '6 Weeks',
  '8 Weeks',
  '10 Weeks',
  '12 Weeks',
  '14 Weeks',
  '16 Weeks',
  '1 Semester',
  '2 Semesters'
];
