 // PUBLIC_INTERFACE
 export async function probeBackend(baseUrlBuilder) {
   /** 
    * Probe backend root to determine if it is reachable.
    * Returns { ok: boolean, message?: string }
    */
   try {
     const url = baseUrlBuilder ? baseUrlBuilder('/') : '/';
     const res = await fetch(url, { method: 'GET' });
     if (!res.ok) {
       return { ok: false, message: `Backend responded with ${res.status}` };
     }
     return { ok: true };
   } catch (e) {
     return { ok: false, message: `Network error: ${e?.message || e}` };
   }
 }
 
 // PUBLIC_INTERFACE
 export async function probeApiEndpoints(baseUrlBuilder) {
   /**
    * Check key endpoints for 200/JSON: /api/generate-lesson (OPTIONS allowed) and /api/generate-media (OPTIONS allowed).
    * Returns a dictionary of endpoint -> { ok, status, message }.
    */
   const endpoints = ['/api/generate-lesson', '/api/generate-media'];
   const results = {};
   for (const ep of endpoints) {
     const url = baseUrlBuilder ? baseUrlBuilder(ep) : ep;
     try {
       // Try OPTIONS first to detect CORS allowance, then a safe HEAD/GET
       const opt = await fetch(url, { method: 'OPTIONS' }).catch(() => null);
       if (opt && (opt.ok || opt.status === 204)) {
         results[ep] = { ok: true, status: opt.status, message: 'CORS preflight OK' };
         continue;
       }
       const head = await fetch(url, { method: 'HEAD' }).catch(() => null);
       if (head && head.ok) {
         results[ep] = { ok: true, status: head.status, message: 'HEAD OK' };
         continue;
       }
       const getRes = await fetch(url, { method: 'GET' }).catch(() => null);
       if (getRes && getRes.ok) {
         results[ep] = { ok: true, status: getRes.status, message: 'GET OK' };
       } else {
         results[ep] = { ok: false, status: getRes?.status || 0, message: 'Not reachable' };
       }
     } catch (e) {
       results[ep] = { ok: false, status: 0, message: `Network error: ${e?.message || e}` };
     }
   }
   return results;
 }
 
 // PUBLIC_INTERFACE
 export function getBackendBase() {
   /** Returns the derived backend base URL used by the API client. */
   const envBase =
     process.env.REACT_APP_API_BASE ||
     process.env.REACT_APP_BACKEND_URL ||
     '';
   if (envBase) return envBase;
   try {
     const isLocalhost =
       typeof window !== 'undefined' &&
       window.location &&
       (window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1');
     if (isLocalhost) {
       return 'http://localhost:3001';
     }
   } catch {}
   return '';
 }
 
 // PUBLIC_INTERFACE
 export function buildBackendUrl(path) {
   /** Helper to construct a URL to the backend for diagnostics or custom calls. */
   const base = getBackendBase();
   const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
   return `${trimmed}${path}`;
 }
