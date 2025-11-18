# LMS Frontend

This is the frontend for the micro skill learning platform.

## Environment configuration

The frontend resolves the backend API base URL with the following precedence:
1. REACT_APP_API_BASE
2. REACT_APP_BACKEND_URL
3. Localhost default (http://localhost:3001) when running on localhost
4. Same-origin fallback (empty base, relative fetch)

Optional variables:
- REACT_APP_HEALTHCHECK_PATH (default: /health)
- REACT_APP_LOG_LEVEL (default: warn)

Do not place secrets in the .env. The app does not log environment values; it only uses them to compute the API base URL.

## Services

src/services/api.js exposes:
- listLessons(): GET /lessons
- getLesson(id): GET /lessons/:id
- enrollLesson(id): POST /lessons/:id/enroll
- getProgress(userId?): GET /progress?userId=...
- updateProgress({ lessonId, moduleIndex, status, score?}): POST /progress
- getQuiz(lessonId): GET /lessons/:id/quiz
- submitQuiz(lessonId, answers): POST /lessons/:id/quiz
- generateLesson(seed): POST /generate/lesson
- generateMedia({ type, prompt }): POST /generate/media

All requests use a hardened JSON fetch wrapper with friendly errors and no sensitive logging.

## Pages and flows

- MicroLessonsList: lists lessons with loading and error states.
- MicroLessonDetail: shows lesson details and allows enrollment.
- LearningModulePage: supports prev/next navigation and marks progress.
- QuizPage: fetches quiz, submits answers, shows score, and updates progress.
- ProgressPageView: displays per-lesson progress.

## Diagnostics

DiagnosticsPanel runs:
- GET {API_BASE}{HEALTHCHECK_PATH}
- POST {API_BASE}/generate/lesson (dry-run)
- Static asset availability via /index.css

CORS/Network failures surface with status=0 and a helpful message. Ensure backend CORS allows the frontend origin when using cross-origin API_BASE.

## Error handling

- Errors are shown via Toasts (no secrets logged).
- Progress updates are best-effort; failures surface as warnings and do not block navigation.
