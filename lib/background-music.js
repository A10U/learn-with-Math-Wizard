/** Original, quiet fantasy accompaniment. Generated locally; no audio downloads. */
export const MUSIC_ENABLED_KEY = 'mathwizard.music.enabled.v1';

const BPM = 72;
const STEP_SECONDS = 60 / BPM / 2;
const LOOKAHEAD_SECONDS = .45;
const MAX_TONES = 24;
// Sixteen original bars, with space between bell notes so the game stays calm.
// MIDI numbers describe the composition, rather than a recording or borrowed tune.
const SCORE = Object.freeze([
  [[48, 55, 60], [72, null, 76, null, 79, null, 76, null]],
  [[45, 52, 57], [74, null, null, 72, 69, null, null, null]],
  [[41, 48, 57], [69, null, 72, null, 77, null, 76, null]],
  [[43, 50, 59], [74, null, null, 71, 67, null, null, null]],
  [[48, 55, 64], [72, null, 76, null, 74, null, 79, null]],
  [[45, 52, 60], [76, null, null, 72, 69, null, 72, null]],
  [[41, 48, 57], [77, null, 76, null, 72, null, 69, null]],
  [[43, 50, 59], [71, null, null, 74, 67, null, null, null]],
  [[48, 55, 60], [76, null, 79, null, 74, null, 72, null]],
  [[45, 52, 57], [72, null, null, 69, 76, null, null, null]],
  [[41, 48, 57], [72, null, 77, null, 76, null, 72, null]],
  [[43, 50, 59], [74, null, 71, null, 67, null, null, null]],
  [[45, 52, 60], [69, null, 72, null, 76, null, 74, null]],
  [[41, 48, 57], [72, null, null, 69, 77, null, 76, null]],
  [[43, 50, 59], [74, null, 71, null, 67, null, 71, null]],
  [[48, 55, 60], [72, null, null, null, 67, null, null, null]],
]);
const frequency = midi => 440 * 2 ** ((midi - 69) / 12);

export function createBackgroundMusic(environment = globalThis) {
  let storage, enabled = false, context = null, disposed = false;
  let timer = null, generation = 0, resumePending = null, suspendPending = null, previouslyUnlocked = false;
  let nextStepTime = 0, nextStep = 0;
  const tones = new Set();
  try {
    storage = environment.localStorage;
    enabled = storage?.getItem?.(MUSIC_ENABLED_KEY) === 'true';
  } catch { /* A blocked preference store does not prevent playing for this visit. */ }

  function canActivate() {
    try { return !environment.navigator?.userActivation || environment.navigator.userActivation.isActive === true; }
    catch { return false; }
  }
  function removeTone(tone, immediately = false) {
    if (!tones.delete(tone)) return;
    if (immediately) {
      try { tone.gain.gain.cancelScheduledValues(0); tone.gain.gain.setValueAtTime(0, context?.currentTime || 0); } catch {}
      try { tone.oscillator.stop(context?.currentTime || 0); } catch {}
    }
    tone.oscillator.onended = null;
    try { tone.oscillator.disconnect(); } catch {}
    try { tone.gain.disconnect(); } catch {}
  }
  function silence() {
    if (timer !== null) {
      try { environment.clearInterval?.(timer); } catch {}
      timer = null;
    }
    for (const tone of [...tones]) removeTone(tone, true);
  }
  function suspendSafely(target = context) {
    if (!target || target.state === 'closed' || typeof target.suspend !== 'function') return Promise.resolve();
    if (suspendPending) return suspendPending;
    try {
      suspendPending = Promise.resolve(target.suspend()).catch(() => {}).finally(() => { suspendPending = null; });
      return suspendPending;
    } catch { return Promise.resolve(); }
  }
  function tone(midi, start, duration, volume, pad = false) {
    if (tones.size >= MAX_TONES) return;
    let oscillator, gain, created;
    try {
      oscillator = context.createOscillator();
      gain = context.createGain();
      created = { oscillator, gain };
      tones.add(created);
      oscillator.type = pad ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency(midi), start);
      const end = start + duration;
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.linearRampToValueAtTime(volume, start + (pad ? .48 : .018));
      if (pad) gain.gain.setValueAtTime(volume, Math.max(start + .48, end - .65));
      gain.gain.exponentialRampToValueAtTime(.0001, end);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => removeTone(created);
      oscillator.start(start);
      oscillator.stop(end + .02);
    } catch {
      if (created) removeTone(created, true);
      else {
        try { oscillator?.disconnect(); } catch {}
        try { gain?.disconnect(); } catch {}
      }
    }
  }
  function schedule(requestedGeneration) {
    if (disposed || !enabled || requestedGeneration !== generation || context?.state !== 'running') {
      silence();
      return;
    }
    const now = context.currentTime;
    // Throttled tabs skip missed notes instead of building an ever-growing queue.
    if (nextStepTime < now - STEP_SECONDS) {
      const skipped = Math.ceil((now + .035 - nextStepTime) / STEP_SECONDS);
      nextStep = (nextStep + skipped) % (SCORE.length * 8);
      nextStepTime += skipped * STEP_SECONDS;
    }
    let scheduled = 0;
    while (nextStepTime < now + LOOKAHEAD_SECONDS && scheduled++ < 4) {
      const [chord, melody] = SCORE[Math.floor(nextStep / 8)];
      const beat = nextStep % 8;
      if (beat === 0) for (const note of chord) tone(note, nextStepTime, STEP_SECONDS * 8 + .12, .005, true);
      if (melody[beat] !== null) {
        tone(melody[beat], nextStepTime, 1.12, .016);
        // A soft upper partial gives the sine a bell-like shimmer, without a sharp attack.
        tone(melody[beat] + 12, nextStepTime, .62, .0025);
      }
      nextStep = (nextStep + 1) % (SCORE.length * 8);
      nextStepTime += STEP_SECONDS;
    }
  }
  function start(requestedGeneration) {
    if (disposed || !enabled || requestedGeneration !== generation || context?.state !== 'running') return false;
    previouslyUnlocked = true;
    if (timer !== null) return true;
    if (typeof environment.setInterval !== 'function') return false;
    nextStep = 0;
    nextStepTime = context.currentTime + .035;
    try {
      timer = environment.setInterval(() => schedule(requestedGeneration), 100);
      schedule(requestedGeneration);
      return true;
    } catch { silence(); return false; }
  }
  function unlock() {
    if (disposed || !enabled) return Promise.resolve(false);
    const requestedGeneration = generation;
    // AudioContext.suspend() changes state asynchronously in some browsers. Wait
    // for it before a quick off/on toggle starts or resumes this same context.
    if (suspendPending) {
      return suspendPending.then(() => {
        if (disposed || !enabled || requestedGeneration !== generation) return false;
        return unlock();
      });
    }
    if (resumePending) {
      return resumePending.then(() => {
        if (disposed || !enabled || requestedGeneration !== generation) return false;
        return unlock();
      });
    }
    try {
      if (!context) {
        if (!canActivate()) return Promise.resolve(false);
        const AudioContext = environment.AudioContext || environment.webkitAudioContext;
        if (typeof AudioContext !== 'function') return Promise.resolve(false);
        context = new AudioContext();
      }
      if (context.state === 'running') return Promise.resolve(start(requestedGeneration));
      if (context.state === 'closed' || (!previouslyUnlocked && !canActivate()) || typeof context.resume !== 'function') return Promise.resolve(false);
      const target = context;
      let resumed;
      try { resumed = target.resume(); }
      catch { return Promise.resolve(false); }
      resumePending = Promise.resolve(resumed).then(async () => {
        if (disposed || !enabled || requestedGeneration !== generation) {
          await suspendSafely(target);
          // A resume may finish after an earlier suspension has already taken
          // effect. Re-suspend that late running context before yielding it.
          if (target.state === 'running') await suspendSafely(target);
          return false;
        }
        return start(requestedGeneration);
      }, () => false).catch(() => false).finally(() => { resumePending = null; });
      return resumePending;
    } catch { return Promise.resolve(false); }
  }
  function pause() {
    generation++;
    silence();
    void suspendSafely();
  }
  return {
    isEnabled: () => enabled,
    isPlaying: () => !disposed && enabled && timer !== null && context?.state === 'running',
    setEnabled(value) {
      if (disposed) return;
      enabled = Boolean(value);
      try { storage?.setItem?.(MUSIC_ENABLED_KEY, String(enabled)); } catch {}
      if (enabled) void unlock();
      else pause();
    },
    unlock,
    pause,
    dispose() {
      if (disposed) return;
      disposed = true;
      pause();
      try { Promise.resolve(context?.close?.()).catch(() => {}); } catch {}
    },
  };
}
