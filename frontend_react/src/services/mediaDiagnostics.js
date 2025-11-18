import { runtime } from '../utils/settings';

function normalizeBase(base) {
  if (!base) return '';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

async function fetchHead(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return {
      ok: res.ok,
      status: res.status,
      contentType: res.headers.get('content-type') || '',
      error: null,
    };
  } catch (e) {
    return { ok: false, status: 0, contentType: '', error: String(e) };
  }
}

async function fetchGet(url) {
  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    return {
      ok: res.ok,
      status: res.status,
      contentType: res.headers.get('content-type') || '',
      error: null,
    };
  } catch (e) {
    return { ok: false, status: 0, contentType: '', error: String(e) };
  }
}

/**
 * PUBLIC_INTERFACE
 * Run media endpoint diagnostics for a given slug.
 * Validates:
 *  - HEAD video returns 200 and content-type video/mp4
 *  - GET captions returns 200 and content-type text/vtt; charset=utf-8
 * Also performs GET on video and HEAD on captions for completeness.
 */
export async function runMediaEndpointDiagnostics(slug = 'quick-inbox-zero') {
  const base = normalizeBase(runtime.apiBase || '');
  const videoUrl = `${base}/assets/video/mp4/${slug}.mp4`;
  const vttUrl = `${base}/assets/captions/${slug}.vtt`;

  const [headVideo, getVideo, headVtt, getVtt] = await Promise.all([
    fetchHead(videoUrl),
    fetchGet(videoUrl),
    fetchHead(vttUrl),
    fetchGet(vttUrl),
  ]);

  const videoOk =
    headVideo.ok &&
    headVideo.status === 200 &&
    (headVideo.contentType || '').toLowerCase().startsWith('video/mp4');
  const vttOk =
    getVtt.ok &&
    getVtt.status === 200 &&
    (getVtt.contentType || '').toLowerCase().startsWith('text/vtt');

  return {
    slug,
    base,
    urls: { videoUrl, vttUrl },
    results: {
      headVideo,
      getVideo,
      headVtt,
      getVtt,
    },
    assertions: {
      videoOk,
      vttOk,
    },
  };
}

/**
 * PUBLIC_INTERFACE
 * Programmatically probe video playback by creating an off-DOM HTMLVideoElement.
 * Confirms onCanPlay fires and no error event occurs within a timeout.
 */
export async function probeVideoPlayback(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      let canPlay = false;
      let errorEvt = null;
      const cleanup = () => {
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('error', onError);
        // revoke URL if blob/object used in future
      };
      const onCanPlay = () => {
        canPlay = true;
        cleanup();
        resolve({ ok: true, canPlay: true, error: null });
      };
      const onError = (e) => {
        errorEvt = e?.error || e;
        cleanup();
        resolve({
          ok: false,
          canPlay: false,
          error: errorEvt ? String(errorEvt) : 'Video error event fired',
        });
      };
      video.addEventListener('canplay', onCanPlay);
      video.addEventListener('error', onError);
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.src = url;
      // kick off a play attempt (browsers may block but we only need canplay)
      video.play?.().catch(() => {
        // ignore autoplay promise rejection; canplay may still fire
      });
      setTimeout(() => {
        if (!canPlay && !errorEvt) {
          cleanup();
          resolve({ ok: false, canPlay: false, error: 'Timeout waiting for canplay' });
        }
      }, Math.max(1000, timeoutMs));
    } catch (e) {
      resolve({ ok: false, canPlay: false, error: String(e) });
    }
  });
}
