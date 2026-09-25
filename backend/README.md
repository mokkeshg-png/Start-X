# Start-X Backend

Backend API server for the **AI-Powered Student Project Collaboration & Monitoring Platform**.

## Requirements

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Supabase** project (PostgreSQL)

## Installation

```bash
cd backend
npm install
```

## Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `5000`) |
| `FRONTEND_URL` | Frontend origin for CORS (default: `http://localhost:5173`) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (**server-side only**) |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |

> ⚠️ **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.**

## Development

```bash
npm run dev
```

Starts the server with hot-reload on port `5000` (default).

## Production Build

```bash
npm run build
```

Compiles TypeScript to `dist/`.

## Production Start

```bash
npm start
```

Runs the compiled JavaScript from `dist/server.js`.

## API Endpoints

### Health Check

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Basic health check |
| `/api/v1/health` | GET | Versioned health check |
| `/api/v1/database/health` | GET | Supabase connection test |

### Module Routes (501 — Not Yet Implemented)

| Prefix | Module |
|---|---|
| `/api/v1/auth` | Authentication |
| `/api/v1/users` | Users |
| `/api/v1/students` | Students |
| `/api/v1/staff` | Staff |
| `/api/v1/teams` | Teams |
| `/api/v1/discussions` | Discussions |
| `/api/v1/contributions` | Contributions |
| `/api/v1/knowledge` | Knowledge |
| `/api/v1/documents` | Documents |
| `/api/v1/tasks` | Tasks |
| `/api/v1/insights` | AI Insights |
| `/api/v1/gaps` | Collaboration Gaps |
| `/api/v1/collaboration` | Collaboration |
| `/api/v1/notifications` | Notifications |

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts              # Environment validation (Zod)
│   │   └── supabase.ts         # Supabase client configuration
│   ├── controllers/            # Route handler functions
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT auth & role authorization
│   │   ├── error.middleware.ts  # Centralized error handling
│   │   └── notFound.middleware.ts
│   ├── routes/
│   │   ├── index.ts            # v1 route aggregator
│   │   ├── health.routes.ts    # Health & DB health endpoints
│   │   ├── auth.routes.ts      # Auth (stub)
│   │   ├── users.routes.ts     # Users (stub)
│   │   ├── students.routes.ts  # Students (stub)
│   │   ├── staff.routes.ts     # Staff (stub)
│   │   ├── teams.routes.ts     # Teams (stub)
│   │   ├── discussions.routes.ts
│   │   ├── contributions.routes.ts
│   │   ├── knowledge.routes.ts
│   │   ├── documents.routes.ts
│   │   ├── tasks.routes.ts
│   │   ├── insights.routes.ts
│   │   ├── gaps.routes.ts
│   │   ├── collaboration.routes.ts
│   │   └── notifications.routes.ts
│   ├── services/               # Business logic layer
│   ├── types/
│   │   ├── api.types.ts        # API response types
│   │   ├── auth.types.ts       # Auth & role types
│   │   └── express.d.ts        # Express augmentation
│   ├── utils/
│   │   ├── AppError.ts         # Custom error class
│   │   ├── response.ts         # Response helpers
│   │   └── validate.ts         # Zod validation middleware
│   └── server.ts               # Application entry point
├── .env                        # Environment variables
├── .env.example                # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Security

- **Helmet** — HTTP security headers
- **CORS** — Locked to `FRONTEND_URL` origin
- **Zod** — Request validation
- **JWT** — Bearer token authentication
- **bcrypt** — Password hashing (ready for auth module)

## Role System

| Role | Description |
|---|---|
| `SUPER_ADMIN` | Full platform access |
| `STAFF` | Faculty / staff access |
| `STUDENT` | Student access |
| `TEAM_LEADER` | Team leadership privileges |
| `TEAM_MEMBER` | Team member access |
