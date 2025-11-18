# Diagnostics Runbook: Media Endpoints and Playback

Prereqs:
- Backend running at http://localhost:3001 with FRONTEND_ORIGIN=http://localhost:3000
- Frontend running at http://localhost:3000 with REACT_APP_API_BASE=http://localhost:3001

In-app checks:
1) Open the app and view the Diagnostics panel at the top.
2) Confirm:
   - Health endpoint OK
   - Generator reachable (OK or appropriate status)
   - Assets OK
3) Media checks (quick-inbox-zero):
   - HEAD /assets/video/mp4/quick-inbox-zero.mp4
     - Status: 200
     - Content-Type: video/mp4
   - GET /assets/captions/quick-inbox-zero.vtt
     - Status: 200
     - Content-Type: text/vtt; charset=utf-8
   - Playback probe: canplay must be true, and no error

Report failures with:
- Endpoint URL
- HTTP method (HEAD/GET)
- Status code
- Content-Type header observed
- Playback errors (if any), including the error message shown
