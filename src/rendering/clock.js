/** A loop exists only while playback is active; no permanent idle RAF callbacks. */
export function createAnimationLoop(draw, {
  request = callback => requestAnimationFrame(callback),
  cancel = id => cancelAnimationFrame(id),
} = {}) {
  let active = false, pending = null;
  function frame(time) {
    pending = null;
    if (!active) return;
    const continuePlaying = draw(time) !== false;
    if (active && continuePlaying) pending = request(frame);
    else active = false;
  }
  return {
    start() { if (!active) { active = true; pending = request(frame); } },
    stop() { active = false; if (pending !== null) cancel(pending); pending = null; },
    get active() { return active; },
  };
}
