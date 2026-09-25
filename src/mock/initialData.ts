import {
  User,
  Team,
  Task,
  Discussion,
  DocumentItem,
  KnowledgeNode,
  KnowledgeEdge,
  CollaborationGap,
  AIInsight,
  StudentProfile,
  MemberContribution,
  CollaborationRequest,
  NotificationItem,
  ActivityLog,
  CollegeBrandingConfig
} from '../types';

export const INITIAL_BRANDING: CollegeBrandingConfig = {
  collegeName: "Apex Institute of Technology",
  collegeShortName: "APEX",
  platformName: "APEX Project Intelligence",
  tagline: "AI-Powered Student Project Collaboration & Monitoring Platform",
  logoText: "APEX AI",
  primaryColor: "#0f172a",
  accentColor: "#6366f1"
};

export const INITIAL_USERS: User[] = [
  {
    id: "user-coord",
    name: "Dr. Evelyn Vance",
    email: "evelyn.vance@apex.edu",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    role: "STAFF_COORDINATOR",
    department: "Computer Science & Engineering",
  },
  {
    id: "user-dept-head",
    name: "Prof. Arthur Pendelton",
    email: "arthur.p@apex.edu",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    role: "DEPARTMENT_HEAD",
    department: "School of Computing",
  },
  {
    id: "user-alice",
    name: "Alice Johnson",
    email: "alice.j@student.apex.edu",
    studentId: "STU-2026-041",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    role: "TEAM_LEADER",
    department: "Computer Science",
    year: "4th Year",
    bio: "Full-stack enthusiast focused on modern React applications & clean architecture.",
    skills: ["React.js", "TypeScript", "Tailwind CSS", "Redux", "UI/UX"],
    github: "github.com/alicej-apex",
    linkedin: "linkedin.com/in/alice-johnson-apex"
  },
  {
    id: "user-bob",
    name: "Bob Smith",
    email: "bob.s@student.apex.edu",
    studentId: "STU-2026-089",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    role: "TEAM_MEMBER",
    department: "Computer Science",
    year: "4th Year",
    bio: "Backend developer specialized in Node.js, microservices, and API security.",
    skills: ["Node.js", "Express", "REST APIs", "PostgreSQL", "Docker"],
    github: "github.com/bobsmith-apex",
    linkedin: "linkedin.com/in/bobsmith-dev"
  },
  {
    id: "user-carol",
    name: "Carol Davis",
    email: "carol.d@student.apex.edu",
    studentId: "STU-2026-112",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    role: "TEAM_MEMBER",
    department: "Information Technology",
    year: "3rd Year",
    bio: "Database architect and cloud systems specialist.",
    skills: ["PostgreSQL", "MongoDB", "Redis", "Database Optimization", "Python"],
    github: "github.com/caroldavis-db",
    linkedin: "linkedin.com/in/carol-davis-it"
  },
  {
    id: "user-john",
    name: "John Doe",
    email: "john.d@student.apex.edu",
    studentId: "STU-2026-145",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    role: "TEAM_MEMBER",
    department: "Computer Science",
    year: "3rd Year",
    bio: "Frontend engineer passionate about state management and component libraries.",
    skills: ["React.js", "JavaScript", "HTML/CSS", "Figma"],
    github: "github.com/johndoe-ui",
    linkedin: "linkedin.com/in/john-doe-frontend"
  },
  {
    id: "user-jane",
    name: "Jane Smith",
    email: "jane.s@student.apex.edu",
    studentId: "STU-2026-198",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    role: "TEAM_MEMBER",
    department: "Software Engineering",
    year: "4th Year",
    bio: "QA engineer with focus on automated testing, CI/CD, and documentation.",
    skills: ["Jest", "Cypress", "Documentation", "Git", "Selenium"],
    github: "github.com/janesmith-qa",
    linkedin: "linkedin.com/in/janesmith-test"
  },
  {
    id: "user-david",
    name: "David Lee",
    email: "david.l@student.apex.edu",
    studentId: "STU-2026-204",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    role: "TEAM_MEMBER",
    department: "Artificial Intelligence",
    year: "4th Year",
    bio: "AI Researcher working on NLP, transformer models, and PyTorch backend integration.",
    skills: ["Python", "PyTorch", "FastAPI", "NLP", "Scikit-Learn"],
    github: "github.com/davidlee-ai",
    linkedin: "linkedin.com/in/david-lee-ml"
  }
];

export const INITIAL_TEAMS: Team[] = [
  {
    id: "team-alpha",
    name: "Team Alpha",
    projectTitle: "E-commerce Platform",
    problemStatement: "Build an institutional e-commerce platform with verified student login, product catalog, shopping cart, and secure checkout.",
    description: "Enterprise-grade online shopping solution featuring role-based catalog management and RESTful order processing.",
    category: "Full Stack Web Application",
    expectedDuration: "12 Weeks",
    leaderId: "user-alice",
    memberIds: ["user-alice", "user-bob", "user-carol", "user-john", "user-jane"],
    memberRoles: {
      "user-alice": "Team Leader & Lead Frontend",
      "user-bob": "Backend Engineer",
      "user-carol": "Database Specialist",
      "user-john": "Frontend Developer",
      "user-jane": "QA & Documentation"
    },
    progress: 65,
    healthScore: 78,
    status: "Development",
    createdAt: "2026-08-15",
    healthBreakdown: {
      contribution: 82,
      progress: 65,
      collaboration: 74,
      communication: 80,
      documentation: 60,
      dependencies: 70
    },
    activeTasksCount: 8,
    openGapsCount: 2,
    lastActivity: "10 mins ago"
  },
  {
    id: "team-beta",
    name: "Team Beta",
    projectTitle: "AI Mental Health Assistant",
    problemStatement: "Develop an AI-powered conversational agent for student wellness monitoring and sentiment analysis with faculty referral escalation.",
    description: "Empathetic AI counseling companion trained on domain-specific wellness taxonomies.",
    category: "AI / Machine Learning",
    expectedDuration: "14 Weeks",
    leaderId: "user-david",
    memberIds: ["user-david", "user-alice", "user-jane"],
    memberRoles: {
      "user-david": "Team Leader & AI/ML Lead",
      "user-alice": "UI/UX & Mobile Interface",
      "user-jane": "Validation & Ethics Review"
    },
    progress: 82,
    healthScore: 91,
    status: "Development",
    createdAt: "2026-08-10",
    healthBreakdown: {
      contribution: 95,
      progress: 82,
      collaboration: 90,
      communication: 92,
      documentation: 88,
      dependencies: 89
    },
    activeTasksCount: 4,
    openGapsCount: 0,
    lastActivity: "2 hours ago"
  },
  {
    id: "team-gamma",
    name: "Team Gamma",
    projectTitle: "Smart Campus Energy Grid",
    problemStatement: "Create an IoT dashboard to monitor campus building energy consumption in real time and optimize peak load usage.",
    description: "Real-time telemetry aggregation for sustainability monitoring.",
    category: "IoT & Analytics",
    expectedDuration: "10 Weeks",
    leaderId: "user-bob",
    memberIds: ["user-bob", "user-john"],
    memberRoles: {
      "user-bob": "Team Leader & IoT Systems",
      "user-john": "Dashboard UI"
    },
    progress: 45,
    healthScore: 58,
    status: "Planning",
    createdAt: "2026-08-20",
    healthBreakdown: {
      contribution: 50,
      progress: 45,
      collaboration: 55,
      communication: 60,
      documentation: 40,
      dependencies: 48
    },
    activeTasksCount: 6,
    openGapsCount: 3,
    lastActivity: "1 day ago"
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    teamId: "team-alpha",
    title: "Implement JWT User Authentication & Session Guards",
    description: "Create login/signup endpoints with hashed passwords and standard JWT access tokens.",
    assignedToId: "user-bob",
    status: "Completed",
    priority: "Critical",
    category: "Backend",
    dueDate: "2026-09-18",
    createdAt: "2026-09-01"
  },
  {
    id: "task-2",
    teamId: "team-alpha",
    title: "Build Responsive Product Catalog & Grid Layout",
    description: "Render product cards with filter sidebar, pagination, and search query params.",
    assignedToId: "user-alice",
    status: "Completed",
    priority: "High",
    category: "Frontend",
    dueDate: "2026-09-22",
    createdAt: "2026-09-05"
  },
  {
    id: "task-3",
    teamId: "team-alpha",
    title: "Shopping Cart State & Redux Store Persistence",
    description: "Manage cart items count, dynamic price computation, and persistent local storage.",
    assignedToId: "user-john",
    status: "Ongoing",
    priority: "High",
    category: "Frontend",
    dueDate: "2026-09-28",
    createdAt: "2026-09-12"
  },
  {
    id: "task-4",
    teamId: "team-alpha",
    title: "PostgreSQL Database Migration & Order Schema",
    description: "Define order items relational foreign keys and transaction tables.",
    assignedToId: "user-carol",
    status: "Completed",
    priority: "Critical",
    category: "Database",
    dueDate: "2026-09-20",
    createdAt: "2026-09-02"
  },
  {
    id: "task-5",
    teamId: "team-alpha",
    title: "Payment Gateway REST API Integration",
    description: "Connect payment provider webhook handlers and verify transaction signatures.",
    assignedToId: "user-bob",
    status: "Blocked",
    priority: "Critical",
    category: "Backend",
    dueDate: "2026-10-02",
    createdAt: "2026-09-15"
  },
  {
    id: "task-6",
    teamId: "team-alpha",
    title: "Automated Cypress E2E Checkout Flow Test Suite",
    description: "Write end-to-end automated tests covering user registration through payment confirmation.",
    assignedToId: "user-jane",
    status: "Pending",
    priority: "Medium",
    category: "QA",
    dueDate: "2026-10-05",
    createdAt: "2026-09-18"
  },
  {
    id: "task-7",
    teamId: "team-beta",
    title: "Train Sentiment Analysis Classifier on Health Corpus",
    description: "Fine-tune DistilBERT on anonymized student emotional state telemetry dataset.",
    assignedToId: "user-david",
    status: "Completed",
    priority: "High",
    category: "AI/ML",
    dueDate: "2026-09-20",
    createdAt: "2026-08-25"
  },
  {
    id: "task-8",
    teamId: "team-beta",
    title: "Conversational Mobile Chat UI & Speech Synth",
    description: "Build clean dark-mode chat interface with audio waveform feedback.",
    assignedToId: "user-alice",
    status: "Ongoing",
    priority: "High",
    category: "UI/UX",
    dueDate: "2026-09-30",
    createdAt: "2026-09-01"
  }
];

export const INITIAL_DISCUSSIONS: Discussion[] = [
  {
    id: "disc-1",
    teamId: "team-alpha",
    title: "Backend REST API Endpoints vs GraphQL Design",
    topic: "API Architecture",
    lastActivity: "2 hours ago",
    messageCount: 5,
    resolved: false,
    messages: [
      {
        id: "msg-101",
        discussionId: "disc-1",
        senderId: "user-alice",
        senderName: "Alice Johnson",
        senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        senderRole: "Team Leader & Lead Frontend",
        text: "Hi @Bob! We need the `/api/v1/products` filter parameters finalized for the product page. Are we using query params or a POST search body?",
        timestamp: "Today, 09:15 AM"
      },
      {
        id: "msg-102",
        discussionId: "disc-1",
        senderId: "user-bob",
        senderName: "Bob Smith",
        senderAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        senderRole: "Backend Engineer",
        text: "Standard GET query params: `GET /api/v1/products?category=electronics&page=1&limit=12`. I've updated the Swagger OpenAPI spec document.",
        timestamp: "Today, 09:42 AM"
      },
      {
        id: "msg-103",
        discussionId: "disc-1",
        senderId: "user-carol",
        senderName: "Carol Davis",
        senderAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
        senderRole: "Database Specialist",
        text: "I added compound indexes on `(category, price)` in PostgreSQL so filtering will respond under 15ms.",
        timestamp: "Today, 10:05 AM"
      },
      {
        id: "msg-104",
        discussionId: "disc-1",
        senderId: "user-john",
        senderName: "John Doe",
        senderAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
        senderRole: "Frontend Developer",
        text: "Great! Connecting the frontend store now. Do we have rate-limiting on authentication requests?",
        timestamp: "Today, 10:20 AM"
      }
    ],
    aiAnalysis: {
      decisions: [
        "REST API architecture selected over GraphQL for simplicity.",
        "Standard GET query params chosen for `/api/v1/products`.",
        "PostgreSQL compound index added on `(category, price)`."
      ],
      problems: [
        "API rate-limiting policy not explicitly defined yet.",
        "Payment integration status dependency is blocking checkout."
      ],
      unresolved: [
        "Payment integration webhook rate-limiting and authorization scope."
      ],
      actionItems: [
        "Finalize payment gateway API rate limit headers.",
        "Review API documentation with QA engineer (Jane)."
      ]
    }
  },
  {
    id: "disc-2",
    teamId: "team-alpha",
    title: "Payment Gateway Integration & Security Review",
    topic: "Payment & Security",
    lastActivity: "1 day ago",
    messageCount: 3,
    resolved: false,
    messages: [
      {
        id: "msg-201",
        discussionId: "disc-2",
        senderId: "user-bob",
        senderName: "Bob Smith",
        senderAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        senderRole: "Backend Engineer",
        text: "I added Stripe Sandbox webhook verification, but we need test credit card credentials configured in `.env`.",
        timestamp: "Yesterday, 04:30 PM"
      }
    ],
    aiAnalysis: {
      decisions: ["Stripe Sandbox chosen for mock payments."],
      problems: ["Missing environment configuration secret key in production build."],
      unresolved: ["Webhook listener signature verification."],
      actionItems: ["Supply test credentials to test team."]
    }
  }
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: "doc-1",
    teamId: "team-alpha",
    name: "E-Commerce System Architecture PRD.pdf",
    type: "PDF",
    size: "2.4 MB",
    uploadedBy: "Alice Johnson",
    uploadedAt: "2026-08-16",
    version: "v1.2",
    url: "#",
    aiStatus: "MATCH",
    aiAnalysisNote: "Document structure perfectly aligns with initial problem scope requirements.",
    consistencyDetails: [
      { scopeItem: "User Authentication", docItem: "JWT Auth Specs", submittedWorkItem: "Auth Router in Node", status: "MATCH" },
      { scopeItem: "Product Catalog", docItem: "Catalog OpenAPI Schema", submittedWorkItem: "React Grid & Controller", status: "MATCH" },
      { scopeItem: "Shopping Cart", docItem: "Cart State Diagram", submittedWorkItem: "Redux Cart Store", status: "MATCH" },
      { scopeItem: "Payment Gateway", docItem: "Stripe Webhook Doc", submittedWorkItem: "Payment Microservice", status: "WARNING", issue: "Payment integration is present in code but missing from original scope document v1.0." }
    ]
  },
  {
    id: "doc-2",
    teamId: "team-alpha",
    name: "REST API OpenAPI Specification.json",
    type: "Code",
    size: "145 KB",
    uploadedBy: "Bob Smith",
    uploadedAt: "2026-09-10",
    version: "v2.0",
    url: "#",
    aiStatus: "MATCH",
    aiAnalysisNote: "Swagger 3.0 contract validated with 18 endpoints."
  },
  {
    id: "doc-3",
    teamId: "team-alpha",
    name: "Database Entity Relationship Diagram.pdf",
    type: "PDF",
    size: "1.8 MB",
    uploadedBy: "Carol Davis",
    uploadedAt: "2026-09-02",
    version: "v1.0",
    url: "#",
    aiStatus: "MATCH",
    aiAnalysisNote: "3NF Normalized Schema verified."
  }
];

export const INITIAL_KNOWLEDGE_NODES: KnowledgeNode[] = [
  { id: "kn-alice", label: "Alice (Lead Frontend)", type: "Student", role: "Frontend", studentId: "user-alice", exchangeCount: 27 },
  { id: "kn-bob", label: "Bob (Backend Lead)", type: "Student", role: "Backend", studentId: "user-bob", exchangeCount: 25 },
  { id: "kn-carol", label: "Carol (Database)", type: "Student", role: "Database", studentId: "user-carol", exchangeCount: 18 },
  { id: "kn-john", label: "John (UI Developer)", type: "Student", role: "Frontend", studentId: "user-john", exchangeCount: 14 },
  { id: "kn-jane", label: "Jane (QA Lead)", type: "Student", role: "Documentation", studentId: "user-jane", exchangeCount: 4, isIsolated: true },
  { id: "kn-topic-api", label: "API Contracts", type: "Topic", exchangeCount: 30 },
  { id: "kn-topic-db", label: "Schema & Queries", type: "Topic", exchangeCount: 20 },
  { id: "kn-topic-auth", label: "Authentication Flow", type: "Topic", exchangeCount: 15 }
];

export const INITIAL_KNOWLEDGE_EDGES: KnowledgeEdge[] = [
  { id: "ke-1", source: "kn-alice", target: "kn-bob", topic: "API Requirements", count: 15 },
  { id: "ke-2", source: "kn-bob", target: "kn-alice", topic: "API Documentation", count: 12 },
  { id: "ke-3", source: "kn-bob", target: "kn-carol", topic: "Database Schema", count: 10 },
  { id: "ke-4", source: "kn-carol", target: "kn-bob", topic: "Query Optimization", count: 8 },
  { id: "ke-5", source: "kn-john", target: "kn-alice", topic: "UI Components", count: 9 },
  { id: "ke-6", source: "kn-jane", target: "kn-alice", topic: "Test Plan Review", count: 3 }
];

export const INITIAL_GAPS: CollaborationGap[] = [
  {
    id: "gap-1",
    teamId: "team-alpha",
    type: "Frontend/Backend Dependency Block",
    description: "Frontend checkout flow is blocked waiting for Backend Payment Gateway API endpoints.",
    affectedRole: "Backend Engineer",
    affectedMemberId: "user-bob",
    affectedMemberName: "Bob Smith",
    impact: "High",
    detectedDate: "2026-09-24",
    status: "Open",
    recommendation: {
      actionText: "Assign Payment Integration Task",
      reason: "Bob Smith has open capacity; prioritizing task #5 will unblock Alice & John.",
      priority: "High",
      actionType: "assign_task"
    }
  },
  {
    id: "gap-2",
    teamId: "team-alpha",
    type: "Low Testing Activity / QA Isolation",
    description: "QA engineer (Jane Smith) has low knowledge exchange and zero submitted test artifacts for recent sprint.",
    affectedRole: "QA & Documentation",
    affectedMemberId: "user-jane",
    affectedMemberName: "Jane Smith",
    impact: "Medium",
    detectedDate: "2026-09-23",
    status: "Open",
    recommendation: {
      actionText: "Notify QA Lead & Schedule Sync",
      reason: "Connecting Jane with Alice will align end-to-end testing with recent frontend components.",
      priority: "Medium",
      actionType: "notify_member"
    }
  },
  {
    id: "gap-3",
    teamId: "team-gamma",
    type: "Missing Core Database Skill",
    description: "Team Gamma lacks a dedicated Database Architect for IoT time-series data aggregation.",
    affectedRole: "Database Specialist",
    affectedMemberId: "user-bob",
    affectedMemberName: "Bob Smith",
    impact: "High",
    detectedDate: "2026-09-21",
    status: "Open",
    recommendation: {
      actionText: "Add Database Specialist to Team",
      reason: "Consider matching with Carol Davis or another student skilled in TimeSeries/PostgreSQL.",
      priority: "High",
      actionType: "notify_member"
    }
  }
];

export const INITIAL_AI_INSIGHTS: AIInsight[] = [
  {
    id: "ins-1",
    teamId: "team-alpha",
    title: "Development Sprint Phase Assessment",
    category: "completed",
    content: "Team Alpha is currently in the Development phase at 65% overall project completion with strong core frontend and auth backend foundations.",
    severity: "info",
    timestamp: "2 hours ago",
    attribution: "AI Synthesis based on 14 Git commits, 4 discussions, and 5 closed tasks."
  },
  {
    id: "ins-2",
    teamId: "team-alpha",
    title: "Dependency Bottleneck Detected",
    category: "dependency",
    content: "Frontend cart progress is dependent on the availability of the Backend Payment API. Payment task #5 is currently marked Blocked.",
    severity: "warning",
    timestamp: "3 hours ago",
    attribution: "AI Dependency Analysis engine."
  },
  {
    id: "ins-3",
    teamId: "team-alpha",
    title: "Scope Modification Alert",
    category: "risk",
    content: "Payment integration appears in submitted code artifacts but was not documented in the original v1.0 PRD. Scope review recommended by coordinator.",
    severity: "critical",
    timestamp: "Yesterday",
    attribution: "AI Document Consistency Engine."
  },
  {
    id: "ins-4",
    teamId: "team-alpha",
    title: "Team Knowledge Dynamics",
    category: "discussed",
    content: "Alice Johnson and Bob Smith maintain 82% of all project communications. Jane Smith demonstrates lower activity (<5% exchange rate).",
    severity: "info",
    timestamp: "Yesterday",
    attribution: "AI Collaboration Graph Analyzer."
  }
];

export const INITIAL_STUDENT_PROFILES: Record<string, StudentProfile> = {
  "user-alice": {
    id: "prof-alice",
    userId: "user-alice",
    department: "Computer Science",
    year: "4th Year",
    bio: "Passionate Lead Frontend Engineer specializing in scalable React design systems, TypeScript, and interactive web tools.",
    skills: [
      { name: "React.js", proficiency: 92, verificationState: "Verified", evidenceCount: 14 },
      { name: "TypeScript", proficiency: 88, verificationState: "Verified", evidenceCount: 11 },
      { name: "Tailwind CSS", proficiency: 95, verificationState: "Verified", evidenceCount: 18 },
      { name: "Redux / State", proficiency: 80, verificationState: "Verified", evidenceCount: 7 },
      { name: "UI/UX Design", proficiency: 85, verificationState: "Partially Verified", evidenceCount: 4 }
    ],
    evidenceMap: [
      { skillName: "React.js", projectName: "E-commerce Platform", submittedWork: "ProductGrid.tsx & CartContext.tsx", evidenceType: "Code Artifact", evidenceStrength: 94 },
      { skillName: "TypeScript", projectName: "E-commerce Platform", submittedWork: "Strict interface definitions in /types", evidenceType: "GitHub Commit", evidenceStrength: 90 },
      { skillName: "Tailwind CSS", projectName: "AI Mental Health Assistant", submittedWork: "Responsive Chat Layout & CSS Tokens", evidenceType: "Code Artifact", evidenceStrength: 96 }
    ],
    projects: [
      {
        id: "sp-1",
        name: "E-commerce Platform",
        description: "Full-stack institutional e-commerce platform with authenticated shopping cart.",
        technologies: ["React.js", "TypeScript", "Tailwind CSS", "Redux"],
        repoUrl: "https://github.com/apex-edu/ecommerce-alpha",
        verifiedSkills: ["React.js", "TypeScript", "Tailwind CSS"],
        date: "2026-09"
      },
      {
        id: "sp-2",
        name: "AI Mental Health Assistant",
        description: "Mobile-first emotional support chat app with custom design system.",
        technologies: ["React Native", "Tailwind CSS", "FastAPI"],
        repoUrl: "https://github.com/apex-edu/mental-health-beta",
        verifiedSkills: ["UI/UX Design", "React.js"],
        date: "2026-08"
      }
    ]
  },
  "user-bob": {
    id: "prof-bob",
    userId: "user-bob",
    department: "Computer Science",
    year: "4th Year",
    bio: "Backend specialist creating high-throughput Node.js microservices, JWT security middleware, and database integrations.",
    skills: [
      { name: "Node.js", proficiency: 90, verificationState: "Verified", evidenceCount: 16 },
      { name: "REST APIs", proficiency: 94, verificationState: "Verified", evidenceCount: 22 },
      { name: "PostgreSQL", proficiency: 82, verificationState: "Verified", evidenceCount: 9 },
      { name: "Docker", proficiency: 75, verificationState: "Partially Verified", evidenceCount: 3 }
    ],
    evidenceMap: [
      { skillName: "Node.js", projectName: "E-commerce Platform", submittedWork: "Express Router & Auth Middleware", evidenceType: "API Schema", evidenceStrength: 92 },
      { skillName: "REST APIs", projectName: "E-commerce Platform", submittedWork: "Swagger OpenAPI 3.0 Specs", evidenceType: "Code Artifact", evidenceStrength: 95 }
    ],
    projects: [
      {
        id: "sp-3",
        name: "E-commerce Platform",
        description: "Node.js REST backend with JWT authentication and PostgreSQL transactions.",
        technologies: ["Node.js", "Express", "PostgreSQL", "Swagger"],
        repoUrl: "https://github.com/apex-edu/ecommerce-backend",
        verifiedSkills: ["Node.js", "REST APIs", "PostgreSQL"],
        date: "2026-09"
      }
    ]
  }
};

export const INITIAL_CONTRIBUTIONS: Record<string, MemberContribution[]> = {
  "team-alpha": [
    {
      studentId: "user-alice",
      studentName: "Alice Johnson",
      role: "Lead Frontend",
      overallScore: 92,
      roleAlignment: 96,
      qualityScore: 90,
      activityTrend: "Increasing",
      aiNotes: "Consistently high code output and active architectural guidance across all discussions.",
      weeklyHistory: [
        { week: "W1", code: 20, docs: 15, tasks: 3, discussions: 8, reviews: 4 },
        { week: "W2", code: 35, docs: 10, tasks: 5, discussions: 12, reviews: 6 },
        { week: "W3", code: 45, docs: 20, tasks: 8, discussions: 15, reviews: 9 },
        { week: "W4", code: 50, docs: 18, tasks: 7, discussions: 14, reviews: 8 }
      ]
    },
    {
      studentId: "user-bob",
      studentName: "Bob Smith",
      role: "Backend Engineer",
      overallScore: 86,
      roleAlignment: 92,
      qualityScore: 88,
      activityTrend: "Stable",
      aiNotes: "Strong API implementation; minor delay on payment integration task.",
      weeklyHistory: [
        { week: "W1", code: 30, docs: 5, tasks: 4, discussions: 6, reviews: 2 },
        { week: "W2", code: 40, docs: 12, tasks: 6, discussions: 8, reviews: 5 },
        { week: "W3", code: 38, docs: 15, tasks: 5, discussions: 10, reviews: 4 },
        { week: "W4", code: 42, docs: 10, tasks: 6, discussions: 9, reviews: 6 }
      ]
    },
    {
      studentId: "user-carol",
      studentName: "Carol Davis",
      role: "Database Specialist",
      overallScore: 78,
      roleAlignment: 95,
      qualityScore: 90,
      activityTrend: "Stable",
      aiNotes: "Excellent schema design and index optimizations.",
      weeklyHistory: [
        { week: "W1", code: 15, docs: 25, tasks: 2, discussions: 4, reviews: 3 },
        { week: "W2", code: 25, docs: 18, tasks: 4, discussions: 5, reviews: 4 },
        { week: "W3", code: 30, docs: 12, tasks: 5, discussions: 6, reviews: 5 },
        { week: "W4", code: 22, docs: 14, tasks: 4, discussions: 7, reviews: 4 }
      ]
    },
    {
      studentId: "user-jane",
      studentName: "Jane Smith",
      role: "QA & Documentation",
      overallScore: 48,
      roleAlignment: 60,
      qualityScore: 70,
      activityTrend: "Decreasing",
      aiNotes: "Activity declined in weeks 3 & 4. Needs alignment with team sprint goals.",
      weeklyHistory: [
        { week: "W1", code: 5, docs: 20, tasks: 2, discussions: 3, reviews: 2 },
        { week: "W2", code: 8, docs: 15, tasks: 3, discussions: 4, reviews: 3 },
        { week: "W3", code: 2, docs: 5, tasks: 1, discussions: 1, reviews: 0 },
        { week: "W4", code: 0, docs: 2, tasks: 0, discussions: 1, reviews: 0 }
      ]
    }
  ]
};

export const INITIAL_COLLABORATION_REQUESTS: CollaborationRequest[] = [
  {
    id: "req-1",
    senderId: "user-david",
    senderName: "David Lee",
    senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    receiverId: "user-alice",
    projectTitle: "AI Mental Health Assistant",
    suggestedRole: "UI/UX & Mobile Developer",
    message: "Hi Alice! We saw your verified React/Tailwind work on Team Alpha. We would love to collaborate on the AI Mental Health app UI!",
    status: "Accepted",
    sentAt: "2026-09-10"
  },
  {
    id: "req-2",
    senderId: "user-bob",
    senderName: "Bob Smith",
    senderAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    receiverId: "user-carol",
    projectTitle: "Smart Campus Energy Grid",
    suggestedRole: "Database Specialist",
    message: "Hey Carol, we urgently need a database specialist for IoT time-series schemas. Interested in joining Team Gamma?",
    status: "Pending",
    sentAt: "2026-09-24"
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "AI Risk Alert: Payment Dependency Blocked",
    description: "Team Alpha's checkout task #5 has been blocked for >48 hours.",
    category: "AI Alert",
    timestamp: "10 mins ago",
    read: false,
    actionUrl: "/teams/team-alpha/gaps"
  },
  {
    id: "notif-2",
    title: "New Discussion Reply from Bob Smith",
    description: "Bob replied to 'Backend REST API Endpoints vs GraphQL Design'.",
    category: "Discussion",
    timestamp: "2 hours ago",
    read: false,
    actionUrl: "/teams/team-alpha/discussions"
  },
  {
    id: "notif-3",
    title: "Collaboration Request Accepted",
    description: "Alice Johnson accepted your request to join AI Mental Health Assistant.",
    category: "Collaboration",
    timestamp: "1 day ago",
    read: true,
    actionUrl: "/collaboration-requests"
  },
  {
    id: "notif-4",
    title: "Task Completed: PostgreSQL Migration",
    description: "Carol Davis completed task 'PostgreSQL Database Migration'.",
    category: "Task",
    timestamp: "2 days ago",
    read: true,
    actionUrl: "/teams/team-alpha/tasks"
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: "log-1",
    actorName: "Dr. Evelyn Vance",
    actorRole: "Coordinator",
    action: "Run AI Analysis",
    object: "Team Alpha Project Health",
    timestamp: "Today, 11:30 AM",
    teamId: "team-alpha"
  },
  {
    id: "log-2",
    actorName: "Bob Smith",
    actorRole: "Backend Engineer",
    action: "Updated Task Status",
    object: "Task #1 (JWT Auth) -> Completed",
    timestamp: "Today, 10:15 AM",
    teamId: "team-alpha"
  },
  {
    id: "log-3",
    actorName: "Alice Johnson",
    actorRole: "Team Leader",
    action: "Uploaded Document",
    object: "E-Commerce System Architecture PRD.pdf",
    timestamp: "Yesterday, 03:20 PM",
    teamId: "team-alpha"
  },
  {
    id: "log-4",
    actorName: "AI System",
    actorRole: "AI Intelligence Engine",
    action: "Detected Collaboration Gap",
    object: "Low QA Activity for Jane Smith",
    timestamp: "2 days ago",
    teamId: "team-alpha"
  }
];
