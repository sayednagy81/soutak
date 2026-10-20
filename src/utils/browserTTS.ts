/**
 * Native SpeechSynthesis Voice Picker
 */
export function getBestBrowserVoice(lang = 'ar'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Language prefix
  const targetPrefix = lang.toLowerCase();

  // Try exact match or language prefix
  const match = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith(targetPrefix) ||
      (targetPrefix === 'ar' && (v.lang.includes('ar') || v.lang.includes('Arabic')))
  );

  return match || voices[0] || null;
}

/**
 * Fallback: reads the text aloud with the device's own voice.
 * The Web Speech API cannot be recorded, so no downloadable file is produced.
 * Returns false when the device has no speech engine.
 */
export function speakLive(text: string, lang = 'ar', rate = 1.0, pitch = 1.0): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = Math.max(0.5, Math.min(2.0, rate));
  utterance.pitch = Math.max(0.5, Math.min(1.5, pitch));

  const voice = getBestBrowserVoice(lang);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US';
  }

  window.speechSynthesis.speak(utterance);
  return true;
}
