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
