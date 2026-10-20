import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Download,
  Volume2,
  VolumeX,
  FileAudio,
  Share2,
  Check,
  AlertTriangle,
  Info,
  Square,
} from 'lucide-react';
import { GeneratedSpeechItem } from '../types.ts';
import { ShareAudioModal } from './ShareAudioModal.tsx';
import {
  speakWithBrowser,
  stopBrowserSpeech,
  pauseBrowserSpeech,
  resumeBrowserSpeech,
  estimateTextDuration,
} from '../utils/browserTTS.ts';

interface AudioPlayerWaveformProps {
  item: GeneratedSpeechItem;
  onDownloadWav: () => void;
  onDownloadMp3: () => void;
}

export const AudioPlayerWaveform: React.FC<AudioPlayerWaveformProps> = ({
  item,
  onDownloadWav,
  onDownloadMp3,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playerSpeed, setPlayerSpeed] = useState(item.speechRate || 1);
  const [shared, setShared] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const isDeviceSpeech = Boolean(item.isDeviceFallback || !item.wavUrl);

  // Setup audio source and events when dealing with real audio files
  useEffect(() => {
    if (isDeviceSpeech) {
      // In device speech mode, duration is estimated
      const est = item.duration || estimateTextDuration(item.text, playerSpeed);
      setDuration(est);
      setCurrentTime(0);
      setIsPlaying(true); // Started speaking when generated

      // Start speaking via browser SpeechSynthesis
      const pitchVal = item.pitch === 'deep' ? 0.8 : item.pitch === 'bright' ? 1.2 : 1.0;
      speakWithBrowser(
        item.text,
        item.language === 'auto' ? undefined : item.language,
        playerSpeed,
        pitchVal,
        {
          onStart: () => setIsPlaying(true),
          onEnd: () => {
            setIsPlaying(false);
            setCurrentTime(0);
          },
          onError: () => setIsPlaying(false),
        }
      );

      return () => {
        stopBrowserSpeech();
        setIsPlaying(false);
      };
    }

    const audio = audioRef.current;
    if (!audio) return;

    audio.src = item.wavUrl;
    audio.playbackRate = playerSpeed;
    setCurrentTime(0);
    setIsPlaying(false);

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [item.id, item.wavUrl, isDeviceSpeech]);

  // Connect Web Audio API Analyser for live visualizer (HTML audio mode)
  const initWebAudio = () => {
    if (isDeviceSpeech || audioCtxRef.current || !audioRef.current) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    } catch (err) {
      console.warn('Web Audio Analyser init note:', err);
    }
  };

  // Draw Waveform Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let timerId: any = null;
    if (isDeviceSpeech && isPlaying) {
      timerId = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.2;
        });
      }, 200);
    }

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      let dataArray: Uint8Array;
      if (!isDeviceSpeech && analyserRef.current && isPlaying) {
        dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        (analyserRef.current as any).getByteFrequencyData(dataArray);
      } else if (isPlaying) {
        // Dynamic pulsating bars for live device speech
        dataArray = new Uint8Array(32);
        const now = Date.now() / 150;
        for (let i = 0; i < 32; i++) {
          dataArray[i] = Math.floor(
            Math.sin(now + i * 0.5) * 45 + Math.cos(now * 1.5 + i * 0.3) * 35 + 90
          );
        }
      } else {
        // Idle subtle wave
        dataArray = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          dataArray[i] = Math.sin(i * 0.4) * 8 + 14;
        }
      }

      const barCount = 32;
      const barSpacing = 3;
      const totalSpacing = barSpacing * (barCount - 1);
      const barWidth = (width - totalSpacing) / barCount;

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i % dataArray.length] || 10;
        const normalized = val / 255;
        const barHeight = Math.max(4, normalized * height * 0.95);

        const x = i * (barWidth + barSpacing);
        const y = (height - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPlaying) {
          if (isDeviceSpeech) {
            grad.addColorStop(0, '#F59E0B');
            grad.addColorStop(1, '#D97706');
          } else {
            grad.addColorStop(0, '#3B82F6');
            grad.addColorStop(1, '#8B5CF6');
          }
        } else {
          grad.addColorStop(0, '#94A3B8');
          grad.addColorStop(1, '#CBD5E1');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }
    };

    render();

    return () => {
      if (timerId) clearInterval(timerId);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isDeviceSpeech, duration]);

  const togglePlay = async () => {
    if (isDeviceSpeech) {
      if (isPlaying) {
        pauseBrowserSpeech();
        setIsPlaying(false);
      } else {
        if (window.speechSynthesis.paused) {
          resumeBrowserSpeech();
          setIsPlaying(true);
        } else {
          const pitchVal = item.pitch === 'deep' ? 0.8 : item.pitch === 'bright' ? 1.2 : 1.0;
          speakWithBrowser(
            item.text,
            item.language === 'auto' ? undefined : item.language,
            playerSpeed,
            pitchVal,
            {
              onStart: () => setIsPlaying(true),
              onEnd: () => {
                setIsPlaying(false);
                setCurrentTime(0);
              },
              onError: () => setIsPlaying(false),
            }
          );
          setIsPlaying(true);
        }
      }
      return;
    }

    if (!audioRef.current) return;
    initWebAudio();

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('Play error:', err);
        });
    }
  };

  const handleStop = () => {
    if (isDeviceSpeech) {
      stopBrowserSpeech();
      setIsPlaying(false);
      setCurrentTime(0);
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDeviceSpeech) return; // SpeechSynthesis does not support seeking
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const skipSeconds = (sec: number) => {
    if (isDeviceSpeech) return;
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + sec)
    );
  };

  const handleSpeedChange = (speed: number) => {
    setPlayerSpeed(speed);
    if (!isDeviceSpeech && audioRef.current) {
      audioRef.current.playbackRate = speed;
    } else if (isDeviceSpeech && isPlaying) {
      // Re-read with new speed
      const pitchVal = item.pitch === 'deep' ? 0.8 : item.pitch === 'bright' ? 1.2 : 1.0;
      speakWithBrowser(
        item.text,
        item.language === 'auto' ? undefined : item.language,
        speed,
        pitchVal,
        {
          onStart: () => setIsPlaying(true),
          onEnd: () => {
            setIsPlaying(false);
            setCurrentTime(0);
          },
          onError: () => setIsPlaying(false),
        }
      );
    }
  };

  const toggleMute = () => {
    if (isDeviceSpeech) {
      if (isPlaying) {
        stopBrowserSpeech();
        setIsPlaying(false);
      }
      return;
    }
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.muted = nextMuted;
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(item.text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec)) return '00:00';
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} كيلوبايت`;
    return `${(kb / 1024).toFixed(1)} ميجابايت`;
  };

  return (
    <div
      className={`rounded-3xl p-5 sm:p-6 border shadow-md transition-all space-y-5 ${
        isDeviceSpeech
          ? 'bg-gradient-to-b from-amber-50/70 to-white dark:from-amber-950/20 dark:to-slate-900 border-amber-300 dark:border-amber-900/60'
          : 'bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900/90 dark:to-slate-900 border-blue-200/60 dark:border-slate-800'
      }`}
    >
      {!isDeviceSpeech && <audio ref={audioRef} preload="auto" />}

      {/* Explicit notice if fallback device speech */}
      {isDeviceSpeech && (
        <div className="p-4 rounded-2xl bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              تنبيه: قراءة احتياطية مباشرة بصوت الجهاز
            </p>
            <p className="leading-relaxed">
              انتهى الحد المجاني اليومي للصوت عالي الجودة (10 طلبات يوميًا) وسيتجدد خلال ساعات.
              يتم قراءة النص الآن عبر محرك الصوت الداخلي لجهازك بجودة قياسية، <strong>ولا يمكن تحميل الصوت كملف MP3 أو WAV</strong> لأن الصوت يخرج مباشرة من مكبرات الجهاز.
            </p>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm ${
              isDeviceSpeech
                ? 'bg-amber-600 text-white shadow-amber-500/30'
                : 'bg-blue-600 text-white shadow-blue-500/30'
            }`}
          >
            <FileAudio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isDeviceSpeech ? 'قراءة صوت الجهاز (احتياطي)' : 'الصوت البشري المولد (Gemini TTS)'}</span>
              {isDeviceSpeech && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                  جودة قياسية
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isDeviceSpeech ? (
                <>المحرك: <span className="font-semibold text-amber-600 dark:text-amber-400">SpeechSynthesis (صوت الجهاز)</span></>
              ) : (
                <>الصوت: <span className="font-semibold text-blue-600 dark:text-blue-400">{item.voice}</span></>
              )}
              {item.detectedLang && (
                <> · اللغة: <span className="font-semibold text-teal-600 dark:text-teal-400">{item.detectedLang}</span></>
              )}
              {' '}· السرعة: <span className="font-semibold">{playerSpeed}x</span>
            </p>
          </div>
        </div>

        {/* Share / Copy Text */}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-ripple border border-slate-200 dark:border-slate-700 cursor-pointer"
          title="نسخ النص المنطوق"
        >
          {shared ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>تم النسخ!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>نسخ النص</span>
            </>
          )}
        </button>
      </div>

      {/* Waveform Visualizer Canvas */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={64}
          className="w-full h-16 cursor-pointer"
          onClick={togglePlay}
          title="انقر للتشغيل أو الإيقاف"
        />
        <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 px-1">
          <span>{formatTime(currentTime)}</span>
          <span className={`text-[10px] ${isDeviceSpeech ? 'text-amber-400' : 'text-blue-400'}`}>
            {isPlaying
              ? isDeviceSpeech
                ? 'جاري القراءة بصوت الجهاز...'
                : 'جاري تشغيل الصوت عالي الجودة...'
              : isDeviceSpeech
              ? 'متوقف مؤقتاً (صوت الجهاز)'
              : 'جاهز للاستماع والتنزيل'}
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Progress Timeline Scrubber */}
      <div className="relative">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.01"
          value={currentTime}
          disabled={isDeviceSpeech}
          onChange={handleSeek}
          className={`w-full h-2 rounded-lg appearance-none ${
            isDeviceSpeech
              ? 'bg-amber-200 dark:bg-amber-950/40 cursor-not-allowed opacity-50'
              : 'bg-slate-200 dark:bg-slate-700 cursor-pointer accent-blue-600'
          }`}
        />
      </div>

      {/* Playback Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Main Controls: Rewind, Play/Pause, Fast-forward / Stop */}
        <div className="flex items-center gap-2">
          {!isDeviceSpeech && (
            <button
              type="button"
              onClick={() => skipSeconds(-5)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-ripple cursor-pointer"
              title="ترجيع 5 ثوانٍ"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={togglePlay}
            className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-md transition-transform touch-ripple active:scale-95 cursor-pointer ${
              isDeviceSpeech
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
            }`}
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الصوت'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current translate-x-[-1px]" />
            )}
          </button>

          {isDeviceSpeech ? (
            <button
              type="button"
              onClick={handleStop}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-ripple cursor-pointer"
              title="إيقاف كلي"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => skipSeconds(5)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-ripple cursor-pointer"
              title="تقديم 5 ثوانٍ"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Speed Multipliers on player */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => handleSpeedChange(spd)}
              className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                playerSpeed === spd
                  ? isDeviceSpeech
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Mute Button */}
        {!isDeviceSpeech && (
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-500" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Multi-Format Export & Sharing Buttons */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            خيارات التحميل والمشاركة:
          </label>
          {isDeviceSpeech && (
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
              (التحميل غير مدعوم في القراءة الاحتياطية)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Download WAV Button */}
          <button
            type="button"
            disabled={isDeviceSpeech}
            onClick={isDeviceSpeech ? undefined : onDownloadWav}
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
              isDeviceSpeech
                ? 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                : 'bg-white dark:bg-slate-800/90 border-blue-300 dark:border-blue-900/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 touch-ripple group shadow-xs cursor-pointer'
            }`}
            title={isDeviceSpeech ? 'لا يمكن تحميل الصوت كملف في القراءة الاحتياطية' : 'تحميل بصيغة WAV'}
          >
            <div className="flex items-center gap-2.5 text-right">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isDeviceSpeech
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 group-hover:scale-105 transition-transform'
                }`}
              >
                <Download className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  تحميل WAV
                </div>
                <div className="text-[10px] text-slate-400">
                  {isDeviceSpeech
                    ? 'غير متاح بالصوت الاحتياطي'
                    : `استوديو خام (24kHz) ${item.wavSize ? `· ${formatFileSize(item.wavSize)}` : ''}`}
                </div>
              </div>
            </div>
            <span
              className={`text-[11px] font-semibold ${
                isDeviceSpeech ? 'text-slate-400' : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              .WAV
            </span>
          </button>

          {/* Download MP3 Button */}
          <button
            type="button"
            disabled={isDeviceSpeech}
            onClick={isDeviceSpeech ? undefined : onDownloadMp3}
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
              isDeviceSpeech
                ? 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                : 'bg-white dark:bg-slate-800/90 border-emerald-300 dark:border-emerald-900/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 touch-ripple group shadow-xs cursor-pointer'
            }`}
            title={isDeviceSpeech ? 'لا يمكن تحميل الصوت كملف في القراءة الاحتياطية' : 'تحميل بصيغة MP3'}
          >
            <div className="flex items-center gap-2.5 text-right">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isDeviceSpeech
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 group-hover:scale-105 transition-transform'
                }`}
              >
                <Download className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  تحميل MP3
                </div>
                <div className="text-[10px] text-slate-400">
                  {isDeviceSpeech
                    ? 'غير متاح بالصوت الاحتياطي'
                    : `مضغوط للمشاركة ${item.mp3Size ? `· ${formatFileSize(item.mp3Size)}` : ''}`}
                </div>
              </div>
            </div>
            <span
              className={`text-[11px] font-semibold ${
                isDeviceSpeech ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              .MP3
            </span>
          </button>

          {/* Share Audio Button */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-indigo-300 dark:border-indigo-900/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all touch-ripple group shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-right">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  مشاركة النص
                </div>
                <div className="text-[10px] text-slate-400">
                  نسخ النص وروابط التواصل
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              مشاركة
            </span>
          </button>
        </div>
      </div>

      {/* Share Modal */}
      <ShareAudioModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        item={item}
      />
    </div>
  );
};
