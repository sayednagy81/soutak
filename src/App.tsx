import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Wand2,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Navbar } from './components/Navbar.tsx';
import { TextInputArea } from './components/TextInputArea.tsx';
import { LanguageSelector } from './components/LanguageSelector.tsx';
import { VoiceCustomizer } from './components/VoiceCustomizer.tsx';
import { AudioPlayerWaveform } from './components/AudioPlayerWaveform.tsx';
import { HistoryDrawer } from './components/HistoryDrawer.tsx';
import { AndroidInstallModal } from './components/AndroidInstallModal.tsx';
import { GeneratedSpeechItem, LanguageId, PitchType, ToneId, VoiceId } from './types.ts';
import { detectLanguageFromText } from './utils/langDetector.ts';
import { usePWAInstall } from './hooks/usePWAInstall.ts';
import { speakWithBrowser, estimateTextDuration } from './utils/browserTTS.ts';

// Clean error message formatter to prevent any raw API JSON from displaying to users
const QUOTA_EXCEEDED_ALERT =
  'انتهى الحد المجاني اليومي للصوت عالي الجودة (10 طلبات يوميًا) وسيتجدد خلال ساعات.';

function formatArabicErrorMessage(msg: string | null): string {
  if (!msg) return '';
  const str = typeof msg === 'string' ? msg : JSON.stringify(msg);
  if (
    str.includes('429') ||
    str.includes('RESOURCE_EXHAUSTED') ||
    str.includes('Quota exceeded') ||
    str.includes('quota') ||
    str.includes('limit: 10') ||
    str.includes('QUOTA_EXCEEDED')
  ) {
    return QUOTA_EXCEEDED_ALERT;
  }
  if (str.trim().startsWith('{') || str.includes('"error"')) {
    try {
      const parsed = JSON.parse(str);
      if (
        parsed.error?.code === 429 ||
        parsed.error?.status === 'RESOURCE_EXHAUSTED' ||
        parsed.error?.message?.includes('quota') ||
        parsed.error?.message?.includes('429')
      ) {
        return QUOTA_EXCEEDED_ALERT;
      }
    } catch {}
    return 'حدث خطأ مؤقت في الاتصال بخدمة التوليد الصوتي. يرجى المحاولة لاحقاً.';
  }
  return str;
}

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('sawtak_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Main studio state
  const [text, setText] = useState<string>(
    'يا مساء الفل والجمال على كل المستمعين الكرام! بنرحب بيكم في استوديو صوتك، حيث يتحول النص المكتوب إلى نبرات صوتية طبيعية نابضة بالحياة.'
  );
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageId>('auto');
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>('Kore');
  const [selectedTone, setSelectedTone] = useState<ToneId>('egyptian_friendly');
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<PitchType>('normal');

  // Automatic language detection from text
  const detectedLanguage = useMemo(() => {
    return detectLanguageFromText(text);
  }, [text]);

  // Synthesis status & notifications
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [fallbackActive, setFallbackActive] = useState<boolean>(false);
  const [currentAudio, setCurrentAudio] = useState<GeneratedSpeechItem | null>(null);

  // History state
  const [history, setHistory] = useState<GeneratedSpeechItem[]>(() => {
    try {
      const saved = localStorage.getItem('sawtak_history_meta');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);

  // Android & PWA installation hook
  const { canPromptDirectly, isAndroid, install } = usePWAInstall();

  // Apply dark mode class to html document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sawtak_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sawtak_theme', 'light');
    }
  }, [darkMode]);

  // Helper to convert base64 to Blob URL
  const base64ToBlobUrl = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  };

  // Main TTS Generation handler with robust fallback
  const handleGenerate = async () => {
    if (!text.trim()) {
      setErrorMessage('يرجى كتابة أو لصق نص أولاً للبدء في التحويل الصوتي.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setNoticeMessage(null);

    const effectiveLanguage =
      selectedLanguage === 'auto' ? detectedLanguage.lang : selectedLanguage;

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voiceName: selectedVoice,
          tone: selectedTone,
          language: effectiveLanguage,
          speechRate,
          pitch,
        }),
      });

      const data = await response.json();

      // If Gemini quota is exceeded or cloud generation encounters error
      if (!response.ok || !data.success || data.quotaExceeded) {
        console.warn('Gemini cloud quota reached or failed, activating device SpeechSynthesis fallback...');
        const pitchVal = pitch === 'deep' ? 0.8 : pitch === 'bright' ? 1.2 : 1.0;
        speakWithBrowser(
          text.trim(),
          effectiveLanguage,
          speechRate,
          pitchVal
        );

        const newItem: GeneratedSpeechItem = {
          id: 'speech_' + Date.now(),
          text: text.trim(),
          voice: selectedVoice,
          tone: selectedTone,
          language: selectedLanguage,
          detectedLang: `${detectedLanguage.nameAr} ${detectedLanguage.flag} (صوت الجهاز)`,
          speechRate,
          pitch,
          wavUrl: '',
          mp3Url: '',
          createdAt: Date.now(),
          duration: estimateTextDuration(text.trim(), speechRate),
          isDeviceFallback: true,
        };

        setCurrentAudio(newItem);
        setFallbackActive(true);
        setNoticeMessage(
          'انتهى الحد المجاني اليومي للصوت عالي الجودة (10 طلبات يوميًا) وسيتجدد خلال ساعات. يتم الآن قراءة النص عبر صوت الجهاز المدمج (جودة قياسية ولا يمكن تحميله كملف).'
        );

        // Save metadata in history
        const updatedHistory = [newItem, ...history.slice(0, 19)];
        setHistory(updatedHistory);
        localStorage.setItem(
          'sawtak_history_meta',
          JSON.stringify(
            updatedHistory.map((item) => ({
              ...item,
              wavUrl: '',
              mp3Url: '',
            }))
          )
        );

        setTimeout(() => {
          const playerElement = document.getElementById('audio-player-section');
          if (playerElement) {
            playerElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 100);

        return;
      }

      // Gemini Cloud Success
      const wavUrl = base64ToBlobUrl(data.wavBase64, 'audio/wav');
      const mp3Url = data.mp3Base64
        ? base64ToBlobUrl(data.mp3Base64, 'audio/mp3')
        : undefined;

      const newItem: GeneratedSpeechItem = {
        id: 'speech_' + Date.now(),
        text: text.trim(),
        voice: selectedVoice,
        tone: selectedTone,
        language: selectedLanguage,
        detectedLang: detectedLanguage.nameAr + ' ' + detectedLanguage.flag,
        speechRate,
        pitch,
        wavUrl,
        mp3Url,
        wavSize: data.sizeWav,
        mp3Size: data.sizeMp3,
        createdAt: Date.now(),
      };

      setCurrentAudio(newItem);
      setFallbackActive(false);

      // Save metadata in history
      const updatedHistory = [newItem, ...history.slice(0, 19)];
      setHistory(updatedHistory);
      localStorage.setItem(
        'sawtak_history_meta',
        JSON.stringify(
          updatedHistory.map((item) => ({
            ...item,
            wavUrl: '',
            mp3Url: '',
          }))
        )
      );

      // Smooth scroll to audio player
      setTimeout(() => {
        const playerElement = document.getElementById('audio-player-section');
        if (playerElement) {
          playerElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    } catch (err: any) {
      console.warn('Network or server error, attempting in-browser TTS fallback...', err);
      try {
        const pitchVal = pitch === 'deep' ? 0.8 : pitch === 'bright' ? 1.2 : 1.0;
        speakWithBrowser(
          text.trim(),
          effectiveLanguage,
          speechRate,
          pitchVal
        );

        const newItem: GeneratedSpeechItem = {
          id: 'speech_' + Date.now(),
          text: text.trim(),
          voice: selectedVoice,
          tone: selectedTone,
          language: selectedLanguage,
          detectedLang: `${detectedLanguage.nameAr} ${detectedLanguage.flag} (صوت الجهاز)`,
          speechRate,
          pitch,
          wavUrl: '',
          mp3Url: '',
          createdAt: Date.now(),
          duration: estimateTextDuration(text.trim(), speechRate),
          isDeviceFallback: true,
        };

        setCurrentAudio(newItem);
        setFallbackActive(true);
        setNoticeMessage(
          'انتهى الحد المجاني اليومي للصوت عالي الجودة (10 طلبات يوميًا) وسيتجدد خلال ساعات. يتم الآن قراءة النص عبر صوت الجهاز المدمج (جودة قياسية ولا يمكن تحميله كملف).'
        );
      } catch (fallbackErr) {
        setErrorMessage(
          'تعذر الاتصال بخدمة التوليد الصوتي السحابية. يرجى التحقق من النص والمحاولة مجدداً.'
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Download Trigger Helpers
  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadWav = (item?: GeneratedSpeechItem) => {
    const target = item || currentAudio;
    if (!target || !target.wavUrl) return;
    triggerDownload(target.wavUrl, `sawtak_${target.voice}_${Date.now()}.wav`);
  };

  const handleDownloadMp3 = (item?: GeneratedSpeechItem) => {
    const target = item || currentAudio;
    if (!target) return;
    if (target.mp3Url) {
      triggerDownload(target.mp3Url, `sawtak_${target.voice}_${Date.now()}.mp3`);
    } else if (target.wavUrl) {
      triggerDownload(target.wavUrl, `sawtak_${target.voice}_${Date.now()}.wav`);
    }
  };

  // Keyboard shortcut: Ctrl + Enter / Cmd + Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleGenerate();
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors"
      onKeyDown={handleKeyDown}
    >
      {/* Top Navbar */}
      <Navbar
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        historyCount={history.length}
        openHistory={() => setIsHistoryOpen(true)}
        openAndroidModal={() => setIsAndroidModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Hero Title Section */}
        <section className="text-right space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>صوت عالي الجودة مع قراءة احتياطية بصوت الجهاز</span>
            </div>

            {fallbackActive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                <Info className="w-3.5 h-3.5" />
                <span>المحرك الاحتياطي نشط</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            تحويل النص إلى صوت بشري طبيعي متعدد اللغات
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            الصق النص بالعربية أو الإنجليزية أو الفرنسية؛ يكتشف النظام اللغة تلقائياً مع تحكم كامل بالنبرات وسرعة القراءة وتصدير MP3 و WAV.
          </p>
        </section>

        {/* Quota / Fallback Notice Banner */}
        {noticeMessage && (
          <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
            <Info className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-bold">تنبيه استهلاك الحصة المجانية</p>
              <p className="leading-relaxed">{noticeMessage}</p>
            </div>
            <button
              onClick={() => setNoticeMessage(null)}
              className="text-amber-600 dark:text-amber-400 hover:underline text-xs font-bold shrink-0"
            >
              إخفاء
            </button>
          </div>
        )}

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">تنبيه أثناء المعالجة</p>
              <p className="mt-0.5 leading-relaxed">{formatArabicErrorMessage(errorMessage)}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 text-xs font-bold"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* 1. Language Selector (Auto & Manual) */}
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
          detected={detectedLanguage}
        />

        {/* 2. Text Input Section */}
        <TextInputArea
          text={text}
          setText={setText}
          onApplyPreset={(sample) => {
            setText(sample.text);
            setSelectedVoice(sample.voice);
            setSelectedTone(sample.tone);
            setSpeechRate(sample.rate);
            setPitch(sample.pitch);
            if (sample.lang) {
              setSelectedLanguage(sample.lang);
            }
          }}
          onSelectToneSuggestion={(suggestion) => {
            if (suggestion.recommendedVoice) setSelectedVoice(suggestion.recommendedVoice);
            if (suggestion.recommendedTone) setSelectedTone(suggestion.recommendedTone);
            if (suggestion.recommendedRate) setSpeechRate(suggestion.recommendedRate);
            if (suggestion.recommendedPitch) setPitch(suggestion.recommendedPitch);
          }}
        />

        {/* 3. Voice & Tone Customizer */}
        <VoiceCustomizer
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          selectedTone={selectedTone}
          setSelectedTone={setSelectedTone}
          speechRate={speechRate}
          setSpeechRate={setSpeechRate}
          pitch={pitch}
          setPitch={setPitch}
        />

        {/* 4. Primary Synthesis Action Bar (Flutter M3 Style) */}
        <div className="sticky bottom-4 z-20">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                اللغة: {selectedLanguage === 'auto' ? `تلقائية (${detectedLanguage.nameAr} ${detectedLanguage.flag})` : selectedLanguage} · الصوت: {selectedVoice}
              </span>
              <p className="text-[11px] text-slate-400">
                اضغط Ctrl + Enter أو انقر على الزر للتحويل الفوري
              </p>
            </div>

            <button
              type="button"
              disabled={isGenerating || !text.trim()}
              onClick={handleGenerate}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 transition-all touch-ripple active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري توليد الصوت البشري...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  <span>تحويل النص إلى صوت بشري الآن</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 5. Active Audio Player Section */}
        {currentAudio && (
          <div id="audio-player-section" className="pt-2 animate-in fade-in duration-300">
            <AudioPlayerWaveform
              item={currentAudio}
              onDownloadWav={() => handleDownloadWav()}
              onDownloadMp3={() => handleDownloadMp3()}
            />
          </div>
        )}
      </main>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectSpeech={(item) => {
          setText(item.text);
          setSelectedVoice(item.voice);
          setSelectedTone(item.tone);
          setSpeechRate(item.speechRate);
          setPitch(item.pitch);
          if (item.language) setSelectedLanguage(item.language);
          if (item.wavUrl) {
            setCurrentAudio(item);
          }
        }}
        onClearHistory={() => {
          setHistory([]);
          localStorage.removeItem('sawtak_history_meta');
        }}
        onDeleteItem={(id) => {
          const filtered = history.filter((h) => h.id !== id);
          setHistory(filtered);
          localStorage.setItem('sawtak_history_meta', JSON.stringify(filtered));
        }}
        onDownloadWav={(item) => handleDownloadWav(item)}
        onDownloadMp3={(item) => handleDownloadMp3(item)}
      />

      {/* Android & Google Play Store Modal */}
      <AndroidInstallModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        canPromptDirectly={canPromptDirectly}
        onDirectInstall={install}
        isAndroid={isAndroid}
      />

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>صوتك © 2026 · استوديو تحويل النصوص المتعدد اللغات بنظام Gemini TTS</span>
          <span>تصميم مستوحى من فلاتر ماتيريال 3 (Flutter Material 3)</span>
        </div>
      </footer>
    </div>
  );
}
