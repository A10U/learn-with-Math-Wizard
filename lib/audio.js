/** Optional device voice in the selected language; visible text is always available. */
import { getLanguage } from './i18n.js';
export function createAudio(environment = globalThis) {
  let enabled = true;
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
  const stop = () => { try { synth?.cancel(); } catch { /* Text mode still works. */ } };
  return {
    isAvailable: () => Boolean(synth && typeof Utterance === 'function' && voice()),
    isEnabled: () => enabled,
    setEnabled(value) { enabled = Boolean(value); if (!enabled) stop(); },
    stop,
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
