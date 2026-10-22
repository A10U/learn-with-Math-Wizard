/** Optional device voice and quiet, original game sounds; text is always available. */
import { getLanguage } from './i18n.js';
export const AUDIO_ENABLED_KEY = 'mathwizard.audio.enabled.v1';

// [frequency, offset, duration, end frequency]. Notes stay below one second.
const effects = Object.freeze({
  start: [[392, 0, .13], [523.25, .1, .18]],
  tap: [[620, 0, .065]],
  marble: [[880, 0, .1, 660]],
  pour: [[330, 0, .19, 440], [440, .12, .16, 523.25]],
  split: [[660, 0, .1], [880, .08, .12]],
  spell: [[392, 0, .13, 523.25], [659.25, .1, .15], [783.99, .21, .22]],
  success: [[523.25, 0, .14], [659.25, .1, .14], [783.99, .2, .22]],
  retry: [[392, 0, .13], [349.23, .12, .16]],
  complete: [[523.25, 0, .15], [659.25, .12, .15], [783.99, .24, .16], [1046.5, .38, .24]],
});
const MAX_TONES = 12;
const MAX_PENDING = 4;

export function createAudio(environment = globalThis) {
  let enabled = true, storage, context = null, resumePending = false, generation = 0, contextVersion = 0;
  const tones = new Set(), pending = [];
  try {
    storage = environment.localStorage;
    const saved = storage?.getItem?.(AUDIO_ENABLED_KEY);
    if (saved === 'false') enabled = false;
  } catch { /* Audio still works for this visit when storage is blocked. */ }
  const synth = environment.speechSynthesis;
  const Utterance = environment.SpeechSynthesisUtterance;
  const voice = () => {
    if (!synth || typeof synth.getVoices !== 'function') return null;
    try {
      const language = getLanguage(), locale = language === 'en' ? 'en-US' : 'th-TH';
      const voices = synth.getVoices().filter(item => new RegExp(`^${language}(?:[-_]|$)`, 'i').test(item.lang || ''));
      return voices.find(item => item.localService === true && item.lang.replace('_', '-').toLowerCase() === locale.toLowerCase()) || voices.find(item => item.localService === true) || voices[0] || null;
    } catch { return null; }
  };
  function removeTone(tone, immediately = false) {
    if (!tones.delete(tone)) return;
    if (immediately) {
      try { tone.gain.gain.cancelScheduledValues(0); tone.gain.gain.setValueAtTime(0, context?.currentTime || 0); } catch { /* Disconnection also silences the node. */ }
      try { tone.oscillator.stop(context?.currentTime || 0); } catch { /* A finished oscillator is already silent. */ }
    }
    try { tone.oscillator.disconnect(); } catch { /* A partial implementation may already be disconnected. */ }
    try { tone.gain.disconnect(); } catch { /* A partial implementation may already be disconnected. */ }
    tone.oscillator.onended = null;
  }
  function stop() {
    generation++;
    pending.length = 0;
    try { synth?.cancel(); } catch { /* Text mode still works. */ }
    for (const tone of [...tones]) removeTone(tone, true);
  }
  const canActivate = () => {
    try { return !environment.navigator?.userActivation || environment.navigator.userActivation.isActive === true; }
    catch { return false; }
  };
  function playNotes(name, requestedGeneration) {
    if (!enabled || requestedGeneration !== generation || context?.state !== 'running') return false;
    const notes = effects[name];
    while (tones.size + notes.length > MAX_TONES) removeTone(tones.values().next().value, true);
    const created = [];
    try {
      const now = context.currentTime;
      for (const [frequency, offset, duration, endFrequency] of notes) {
        const oscillator = context.createOscillator();
        let gain;
        try { gain = context.createGain(); }
        catch (error) { try { oscillator.disconnect(); } catch {} throw error; }
        const tone = { oscillator, gain }; tones.add(tone); created.push(tone);
        const start = now + offset, end = start + duration;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        if (endFrequency) oscillator.frequency.linearRampToValueAtTime(endFrequency, end);
        gain.gain.setValueAtTime(.0001, start);
        gain.gain.linearRampToValueAtTime(.028, start + .008);
        gain.gain.exponentialRampToValueAtTime(.0001, end);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.onended = () => removeTone(tone);
        oscillator.start(start); oscillator.stop(end + .015);
      }
      return true;
    } catch {
      for (const tone of created) removeTone(tone, true);
      return false;
    }
  }
  function playEffect(name) {
    if (!enabled || typeof name !== 'string' || !Object.hasOwn(effects, name)) return false;
    try {
      if (!context || context.state === 'closed') {
        if (!canActivate()) return false;
        const AudioContext = environment.AudioContext || environment.webkitAudioContext;
        if (typeof AudioContext !== 'function') return false;
        context = new AudioContext();
        contextVersion++;
        resumePending = false;
        pending.length = 0;
      }
      if (context.state === 'running') return playNotes(name, generation);
      // Creation and resume happen only within a user gesture when supported.
      if (!canActivate() || typeof context.resume !== 'function') return false;
      if (pending.length === MAX_PENDING) pending.shift();
      pending.push({ name, generation });
      if (resumePending) return true;
      resumePending = true;
      const requestedContext = context, requestedVersion = contextVersion;
      let resumed;
      try { resumed = context.resume(); }
      catch { resumePending = false; pending.length = 0; return false; }
      Promise.resolve(resumed).then(() => {
        if (context !== requestedContext || contextVersion !== requestedVersion) return;
        resumePending = false;
        const requests = pending.splice(0);
        for (const request of requests) playNotes(request.name, request.generation);
      }, () => {
        if (context !== requestedContext || contextVersion !== requestedVersion) return;
        resumePending = false; pending.length = 0;
      });
      return true;
    } catch { return false; }
  }
  return {
    isAvailable: () => Boolean(synth && typeof Utterance === 'function' && voice()),
    isEnabled: () => enabled,
    setEnabled(value) {
      enabled = Boolean(value);
      try { storage?.setItem?.(AUDIO_ENABLED_KEY, String(enabled)); } catch { /* Keep the current visit usable. */ }
      if (!enabled) stop();
    },
    stop,
    playEffect,
    speak(text) {
      if (!enabled || typeof text !== 'string' || text.length === 0 || text.length > 3000 || typeof Utterance !== 'function') return false;
      const selectedVoice = voice();
      if (!selectedVoice) return false;
      try {
        stop();
        const utterance = new Utterance(text);
        utterance.lang = getLanguage() === 'en' ? 'en-US' : 'th-TH';
        utterance.voice = selectedVoice;
        utterance.rate = 0.85;
        synth.speak(utterance);
        return true;
      } catch { return false; }
    },
  };
}
