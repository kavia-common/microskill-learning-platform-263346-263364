 // PUBLIC_INTERFACE
 /**
  * audioGuard checks that at most one HTMLAudioElement is in 'playing' state.
  * Returns true if rule holds, false otherwise.
  */
export function audioGuard() {
  const audios = Array.from(document.querySelectorAll('audio'));
  let playingCount = 0;
  audios.forEach((a) => {
    const isPlaying = !!(a.currentTime > 0 && !a.paused && !a.ended && a.readyState > 2);
    if (isPlaying) playingCount += 1;
  });
  return playingCount <= 1;
}
