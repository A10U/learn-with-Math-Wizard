/** Optional Thai device voice; all learning content remains visible as text. */
export function createAudio(environment = globalThis) {
  let enabled = true;
  const synth = environment.speechSynthesis;
  const Utterance = environment.SpeechSynthesisUtterance;
  const voice = () => {
    if (!synth || typeof synth.getVoices !== 'function') return null;
    try {
      const voices = synth.getVoices().filter(item => /^th(?:-|_)?/i.test(item.lang || ''));
      return voices.find(item => item.localService === true) || voices[0] || null;
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
      const thaiVoice = voice();
      if (!thaiVoice) return false;
      try {
        stop();
        const utterance = new Utterance(text);
        utterance.lang = 'th-TH';
        utterance.voice = thaiVoice;
        utterance.rate = 0.85;
        synth.speak(utterance);
        return true;
      } catch { return false; }
    },
  };
}
