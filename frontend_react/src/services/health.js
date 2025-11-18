import { runtime } from '../utils/settings';
import { __buildApiUrl as buildApiUrl } from './api';

/**
 * Run a series of health checks and return a status map.
 * - api: GET health path (default /health)
 * - generator: POST /generate/lesson (dry-run with seed='healthcheck')
 * - assets: attempt to load a known app asset (index.css)
 */
// PUBLIC_INTERFACE
export async function checkHealth() {
  const results = {
    api: { ok: false, status: 0, message: '' },
    generator: { ok: false, status: 0, message: '' },
    assets: { ok: false, status: 0, message: '' },
    baseUrl: runtime.apiBase,
  };

  // API
  try {
    const res = await fetch(buildApiUrl(runtime.healthPath), { method: 'GET', cache: 'no-store' });
    results.api.ok = res.ok;
    results.api.status = res.status;
    results.api.message = res.ok ? 'OK' : `HTTP ${res.status}`;
  } catch (e) {
    results.api.ok = false;
    results.api.status = 0;
    results.api.message = 'Network/CORS error';
  }

  // Generator (best-effort; don't fail app on CORS)
  try {
    const res = await fetch(buildApiUrl('/generate/lesson'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed: 'healthcheck' }),
    });
    results.generator.ok = res.ok;
    results.generator.status = res.status;
    results.generator.message = res.ok ? 'OK' : `HTTP ${res.status}`;
  } catch (e) {
    results.generator.ok = false;
    results.generator.status = 0;
    results.generator.message = 'Network/CORS error';
  }

  // Assets (check app stylesheet as proxy for static availability)
  try {
    const res = await fetch('/index.css', { method: 'GET', cache: 'no-store' });
    results.assets.ok = res.ok;
    results.assets.status = res.status;
    results.assets.message = res.ok ? 'OK' : `HTTP ${res.status}`;
  } catch (e) {
    results.assets.ok = false;
    results.assets.status = 0;
    results.assets.message = 'Asset load error';
  }

  return results;
}
