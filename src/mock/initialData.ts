import { CollegeBrandingConfig } from '../types';

// Only system configuration constants — NO mock business data
export const INITIAL_BRANDING: CollegeBrandingConfig = {
  collegeName: "Apex Institute of Technology",
  collegeShortName: "APEX",
  platformName: "APEX Project Intelligence",
  tagline: "AI-Powered Student Project Collaboration & Monitoring Platform",
  logoText: "APEX AI",
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
