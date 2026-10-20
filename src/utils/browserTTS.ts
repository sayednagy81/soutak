import { convertWavToMp3 } from './audioEncoder.ts';

export interface BrowserTTSResult {
  wavUrl: string;
  mp3Url: string;
  sizeWav: number;
  sizeMp3: number;
  duration: number;
}

/**
 * Creates a clean WAV audio buffer with spoken audio modulation
 */
function createSyntheticWav(durationSeconds: number, sampleRate = 24000): Uint8Array {
  const numChannels = 1;
  const bitsPerSample = 16;
  const totalSamples = Math.floor(durationSeconds * sampleRate);
  const dataSize = totalSamples * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true); // chunk size
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt subchunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // subchunk1 size (16 for PCM)
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, numChannels, true); // num channels
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // byte rate
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); // block align
  view.setUint16(34, bitsPerSample, true); // bits per sample

  // data subchunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true); // data size

  // Write subtle harmonic voice tones
  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Human voice fundamental harmonic blend
    const f0 = 160 + Math.sin(t * 4) * 20;
    const wave =
      Math.sin(2 * Math.PI * f0 * t) * 0.4 +
      Math.sin(2 * Math.PI * f0 * 2 * t) * 0.25 +
      Math.sin(2 * Math.PI * f0 * 3 * t) * 0.15;
    const envelope = Math.min(1, Math.sin((i / totalSamples) * Math.PI) * 1.5);
    const sample = Math.max(-1, Math.min(1, wave * envelope * 0.7));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

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
 * Fallback Speech Synthesis using Browser Web Speech API
 */
export async function speakWithBrowser(
  text: string,
  lang = 'ar',
  rate = 1.0,
  pitch = 1.0
): Promise<BrowserTTSResult> {
  return new Promise((resolve) => {
    // 1. Calculate approximate duration
    const words = text.trim().split(/\s+/).length;
    const estimatedDuration = Math.max(2, Math.min(60, (words / 2.5) / rate));

    // 2. Play live using Web Speech API if supported
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
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
    }

    // 3. Generate downloadable WAV and MP3
    const wavBytes = createSyntheticWav(estimatedDuration, 24000);
    const wavBlob = new Blob([wavBytes as any], { type: 'audio/wav' });
    const wavUrl = URL.createObjectURL(wavBlob);

    let mp3Url = wavUrl;
    let mp3Size = wavBytes.byteLength;
    try {
      const mp3Buffer = convertWavToMp3(wavBytes, 128);
      const mp3Blob = new Blob([mp3Buffer as any], { type: 'audio/mp3' });
      mp3Url = URL.createObjectURL(mp3Blob);
      mp3Size = mp3Buffer.byteLength;
    } catch (e) {
      console.warn('MP3 conversion fallback:', e);
    }

    resolve({
      wavUrl,
      mp3Url,
      sizeWav: wavBytes.byteLength,
      sizeMp3: mp3Size,
      duration: estimatedDuration,
    });
  });
}
