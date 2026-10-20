/**
 * Browser Native SpeechSynthesis TTS Utility
 * Used exclusively as a live device playback fallback when Gemini Cloud TTS quota is exhausted.
 * Note: Browser SpeechSynthesis speaks live audio directly through device audio output and does NOT produce downloadable audio files.
 */

export function isBrowserSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Native SpeechSynthesis Voice Picker
 */
export function getBestBrowserVoice(lang = 'ar'): SpeechSynthesisVoice | null {
  if (!isBrowserSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

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
 * Estimate spoken duration in seconds
 */
export function estimateTextDuration(text: string, rate = 1.0): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(2, Math.min(120, Math.round((words / 2.5) / (rate || 1.0))));
}

/**
 * Stops any ongoing browser speech synthesis
 */
export function stopBrowserSpeech(): void {
  if (isBrowserSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Pauses ongoing browser speech
 */
export function pauseBrowserSpeech(): void {
  if (isBrowserSpeechSupported()) {
    window.speechSynthesis.pause();
  }
}

/**
 * Resumes paused browser speech
 */
export function resumeBrowserSpeech(): void {
  if (isBrowserSpeechSupported()) {
    window.speechSynthesis.resume();
  }
}

/**
 * Speak text live using the browser's built-in SpeechSynthesis API
 */
export function speakWithBrowser(
  text: string,
  lang = 'ar',
  rate = 1.0,
  pitch = 1.0,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): SpeechSynthesisUtterance | null {
  if (!isBrowserSpeechSupported()) {
    callbacks?.onError?.(new Error('متصفحك لا يدعم ميزة قراءة النصوص المدمجة (SpeechSynthesis).'));
    return null;
  }

  // Cancel any prior utterance
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

  if (callbacks?.onStart) utterance.onstart = callbacks.onStart;
  if (callbacks?.onEnd) utterance.onend = callbacks.onEnd;
  if (callbacks?.onError) utterance.onerror = callbacks.onError;

  window.speechSynthesis.speak(utterance);
  return utterance;
}
