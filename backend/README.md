# MicroSkill Backend (Express)

Minimal REST API to support the React frontend.

Endpoints (prefix /api):
- GET /api/skills -> list skills with optional ?search=&level=&tag=
- GET /api/skills/:id -> skill details
- POST /api/skills/:id/enroll -> enrolls mock user
- GET /api/progress/:skillId -> get progress for skill for mock user (from header X-User-Id or 'anon')
- POST /api/progress/:skillId -> update progress { lessonId, completed, watched, score }
- Health: GET / -> returns { ok: true, environment }

Security and compliance
- Helmet security headers
- Basic rate limiter (100 req per 15 mins per IP)
- CORS: FRONTEND_ORIGIN permits browser origin; also honors REACT_APP_FRONTEND_URL. For local dev defaults to http://localhost:3000
- Input validation via express-validator
- No secrets in code; configuration via .env

Run:
- npm install
- npm start (defaults to PORT=3001)

Environment (.env example):
PORT=3001
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:3000
TRUST_PROXY=false
LOG_LEVEL=info
