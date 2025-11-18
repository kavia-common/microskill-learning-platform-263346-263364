# microskill-learning-platform-263346-263364

This repo includes:
- frontend_react: React UI for micro-skill LMS with feed, detail, quiz, skills listing, enrollment and progress.
- backend: Express API for skills and progress with security headers, rate limiting, validation.

## Quick Start (Local)

1) Start the backend (default port 3001)
- cd microskill-learning-platform-263346-263365/backend
- cp .env.example .env   # ensure FRONTEND_ORIGIN=http://localhost:3000
- npm install
- npm start
API will run at http://localhost:3001

2) Start the frontend (default port 3000)
- cd microskill-learning-platform-263346-263364/frontend_react
- cp .env.example .env   # ensure REACT_APP_API_BASE=http://localhost:3001
- npm install
- npm start
App will run at http://localhost:3000

3) Verify Diagnostics
- Open http://localhost:3000
- Use the Diagnostics panel (top of pages via Layout) to run:
  - API health (GET /)
  - Generate endpoints OPTIONS/POST (/api/generate-lesson, /api/generate-media)
  - Asset checks (HEAD/GET /assets/video/mp4/... and /assets/captions/...)

## Environment Alignment

- Frontend
  - REACT_APP_API_BASE must point to the backend URL (e.g., http://localhost:3001)
  - Optional: REACT_APP_BACKEND_URL as legacy fallback
- Backend
  - FRONTEND_ORIGIN must be the frontend origin for CORS (e.g., http://localhost:3000)
  - Static assets are served from /assets (files under public/assets)

## End-to-End Flow Validation

From the UI:
- Browse skills/lessons (list view)
- Open detail page
- Enroll in a lesson
- Start a module and mark completed
- Take a quiz and submit answers
- View progress page for the selected skill

Diagnostics Panel:
- API health root: GET {API_BASE}/
- Generator endpoints:
  - OPTIONS/POST {API_BASE}/api/generate-lesson
  - OPTIONS/POST {API_BASE}/api/generate-media
- Assets:
  - HEAD/GET {API_BASE}/assets/video/mp4/{slug}.mp4
  - HEAD/GET {API_BASE}/assets/captions/{slug}.vtt

## Troubleshooting

- CORS errors in browser console
  - Ensure backend .env FRONTEND_ORIGIN matches the frontend origin exactly
  - Restart backend after .env changes

- Frontend cannot reach API
  - Ensure frontend .env REACT_APP_API_BASE is set to the backend URL
  - CRA reads .env at build/start time; stop and re-run `npm start` after changes

- Assets 404 (video/captions)
  - Ensure backend is running and serving static assets at /assets
  - Use Diagnostics "Test media generation" to create sample assets

- Port conflicts
  - If port 3000 or 3001 is in use, stop the other service or change the port
  - When changing backend PORT, update frontend REACT_APP_API_BASE accordingly

## Scripts (Summary)

Frontend:
- npm start
- npm test
- npm run build

Backend:
- npm start
- npm run dev

Use REACT_APP_API_BASE to point the frontend to the backend URL (e.g., http://localhost:3001).