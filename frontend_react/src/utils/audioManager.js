 // PUBLIC_INTERFACE
 /**
  * GlobalAudioManager ensures only one <audio> element plays at a time.
  * It also provides lazy resolution of audio/captions assets via audioMapping.mapLessonToAudio.
  * Components should register/unregister their audio elements.
  */

 import { mapLessonToAudio } from './audioMapping';

 const LOG_LEVEL = (process.env.REACT_APP_LOG_LEVEL || 'info').toLowerCase();
 const LOG_LEVEL_ORDER = { debug: 10, info: 20, warn: 30, error: 40 };
 function log(level, msg, meta) {
   const cur = LOG_LEVEL_ORDER[LOG_LEVEL] ?? 20;
   const lvl = LOG_LEVEL_ORDER[level] ?? 20;
   if (lvl >= cur) {
     const payload = meta ? [msg, meta] : [msg];
     // eslint-disable-next-line no-console
     (console[level] || console.log)(...payload);
   }
 }

 class GlobalAudioManager {
   constructor() {
     this.current = null;
     this.listeners = new Set();
     this.cache = new Map(); // lessonId -> { audioUrl, captionsUrl, ssmlUrl, textUrl, slug }
     this.inflight = new Map(); // lessonId -> Promise
   }

   /**
    * Register an audio element; if playNow is true it will pause others and play this.
    */
   register(audioEl, playNow = false) {
     if (!audioEl) return;
     this.listeners.add(audioEl);
     audioEl.addEventListener('play', this._onPlay);
     audioEl.addEventListener('ended', this._onEnd);
     if (playNow) {
       this.pauseAllExcept(audioEl);
       audioEl.play().catch(() => {});
       this.current = audioEl;
     }
   }

   unregister(audioEl) {
     if (!audioEl) return;
     audioEl.removeEventListener('play', this._onPlay);
     audioEl.removeEventListener('ended', this._onEnd);
     this.listeners.delete(audioEl);
     if (this.current === audioEl) this.current = null;
   }

   pauseAll() {
     this.listeners.forEach((el) => {
       try {
         el.pause();
       } catch {}
     });
     this.current = null;
   }

   pauseAllExcept(audioEl) {
     this.listeners.forEach((el) => {
       if (el !== audioEl) {
         try {
           el.pause();
         } catch {}
       }
     });
     this.current = audioEl;
   }

   _onPlay = (e) => {
     const el = e.target;
     this.pauseAllExcept(el);
   };

   _onEnd = (e) => {
     const el = e.target;
     if (this.current === el) this.current = null;
   };

   /**
    * PUBLIC_INTERFACE
    * resolveForLesson
    * Resolve audio/captions for a lesson using title-based mapping; caches results by lesson.id.
    */
   async resolveForLesson(lesson) {
     if (!lesson || !lesson.id) {
       return { audioUrl: null, captionsUrl: null, ssmlUrl: null, textUrl: null, slug: '' };
     }
     const key = lesson.id;
     if (this.cache.has(key)) {
       return this.cache.get(key);
     }
     if (this.inflight.has(key)) {
       return this.inflight.get(key);
     }
     const p = (async () => {
       try {
         const resolved = await mapLessonToAudio(lesson);
         const payload = {
           audioUrl: resolved.audioUrl || null,
           captionsUrl: resolved.captionsUrl || null,
           ssmlUrl: resolved.ssmlUrl || null,
           textUrl: resolved.textUrl || null,
           slug: resolved.slug || '',
         };
         this.cache.set(key, payload);
         log('debug', '[audioManager] Resolved assets and cached', { lessonId: key, ...payload });
         return payload;
       } catch (e) {
         log('warn', '[audioManager] Failed to resolve assets', { lessonId: key, error: String(e) });
         const payload = { audioUrl: null, captionsUrl: null, ssmlUrl: null, textUrl: null, slug: '' };
         this.cache.set(key, payload);
         return payload;
       } finally {
         this.inflight.delete(key);
       }
     })();
     this.inflight.set(key, p);
     return p;
   }
 }

 export const globalAudioManager = new GlobalAudioManager();

 // PUBLIC_INTERFACE
 export function enforceSinglePlayback(audioEl, shouldPlay) {
   /** Convenience to request play/pause with single-audio policy. */
   if (!audioEl) return;
   if (shouldPlay) {
     globalAudioManager.register(audioEl, true);
   } else {
     try {
       audioEl.pause();
     } catch {}
   }
 }
