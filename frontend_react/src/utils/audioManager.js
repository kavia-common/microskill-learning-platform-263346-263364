 // PUBLIC_INTERFACE
 /**
  * GlobalAudioManager ensures only one <audio> element plays at a time.
  * Components should register/unregister their audio elements.
  */

class GlobalAudioManager {
  constructor() {
    this.current = null;
    this.listeners = new Set();
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
