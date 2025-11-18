# Media Diagnostics Capture (HEAD/GET + Playback Probe)

Use this quick guide to collect the exact results required.

Prereqs:
- Frontend running on http://localhost:3000
- Backend running on http://localhost:3001 (or your configured REACT_APP_API_BASE)
- Frontend .env has REACT_APP_API_BASE pointing to backend

Steps:
1) Open the app in your browser.
2) Ensure the Diagnostics panel is visible at the top (it appears via Layout on most pages).
3) The panel automatically runs:
   - HEAD and GET:
     - {API_BASE}/assets/video/mp4/quick-inbox-zero.mp4
     - {API_BASE}/assets/captions/quick-inbox-zero.vtt
   - Playback probe using an off-DOM <video> to detect `canplay` vs `error`/timeout.
4) Copy the following details from the panel:
   - HEAD video: status, content-type
   - GET video: status, content-type
   - HEAD captions: status, content-type
   - GET captions: status, content-type
   - Playback probe line: "canplay" or "fail" and any error message
5) Confirm expectations:
   - Video: status 200, content-type starts with "video/mp4"
   - Captions: status 200, content-type starts with "text/vtt; charset=utf-8" (some servers may send "text/vtt" and charset separately)
6) If any assertions fail, the panel shows a "Failure details (copy/paste)" section with per-method status, content-type, and error, which you can include in reports.

Tip:
- If assets 404, click "Test media generation" (on Creator pages) to create sample media. This writes files under backend public/assets served at /assets.
- If CORS issues appear, ensure backend FRONTEND_ORIGIN matches the frontend origin exactly.
