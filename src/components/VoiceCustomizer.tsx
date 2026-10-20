import React, { useState } from 'react';
import {
  Mic,
  Sliders,
  Gauge,
  Flame,
  Radio,
  Clapperboard,
  BookOpen,
  Zap,
  GraduationCap,
  MessageCircleHeart,
  Sparkles,
  RotateCcw,
  AudioWaveform,
} from 'lucide-react';
import { TONE_PRESETS, VOICES } from '../constants/presets.ts';
import { PitchType, ToneId, VoiceId } from '../types.ts';

interface VoiceCustomizerProps {
  selectedVoice: VoiceId;
  setSelectedVoice: (id: VoiceId) => void;
  selectedTone: ToneId;
  setSelectedTone: (id: ToneId) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  pitch: PitchType;
  setPitch: (pitch: PitchType) => void;
}

export const VoiceCustomizer: React.FC<VoiceCustomizerProps> = ({
  selectedVoice,
  setSelectedVoice,
  selectedTone,
  setSelectedTone,
  speechRate,
  setSpeechRate,
  pitch,
  setPitch,
}) => {
  const [toneTab, setToneTab] = useState<'all' | 'egyptian' | 'classical' | 'multilingual'>('all');

  // Helper to render icon for tone
  const getToneIcon = (iconName: string) => {
    switch (iconName) {
      case 'MessageCircleHeart':
        return <MessageCircleHeart className="w-4 h-4 text-emerald-500" />;
      case 'Flame':
        return <Flame className="w-4 h-4 text-amber-500" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-pink-500" />;
      case 'Radio':
        return <Radio className="w-4 h-4 text-blue-500" />;
      case 'Clapperboard':
        return <Clapperboard className="w-4 h-4 text-purple-500" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-teal-500" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-orange-500" />;
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4 text-cyan-500" />;
      default:
        return <AudioWaveform className="w-4 h-4 text-blue-500" />;
    }
  };

  const filteredTones =
    toneTab === 'all'
      ? TONE_PRESETS
      : TONE_PRESETS.filter((t) => t.category === toneTab);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm transition-all space-y-6">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              تخصيص الصوت والنبرة (Voice Tuning)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              اختر الشخصية الصوتية، حدد النبرة، واضبط السرعة وطبقة الصوت بدقة
            </p>
          </div>
        </div>
      </div>

      {/* 2. Voice Selection */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
          شخصية الصوت المؤدي:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {VOICES.map((voice) => {
            const isSelected = selectedVoice === voice.id;
            return (
              <button
                key={voice.id}
                type="button"
                onClick={() => setSelectedVoice(voice.id)}
                className={`p-3 rounded-2xl border text-right transition-all touch-ripple flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {voice.id}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        voice.gender === 'female'
                          ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300'
                          : 'bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300'
                      }`}
                    >
                      {voice.gender === 'female' ? 'أنثى' : 'ذكر'}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {voice.nameAr}
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {voice.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tone Variations */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            تنوعات النبرة والأسلوب:
          </label>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setToneTab('all')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                toneTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setToneTab('egyptian')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                toneTab === 'egyptian'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              عامية مصرية 🇪🇬
            </button>
            <button
              type="button"
              onClick={() => setToneTab('classical')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                toneTab === 'classical'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              فصحى مشكولة 📜
            </button>
            <button
              type="button"
              onClick={() => setToneTab('multilingual')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                toneTab === 'multilingual'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              لغات عالمية 🌐
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {filteredTones.map((preset) => {
            const isSelected = selectedTone === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedTone(preset.id)}
                className={`p-3 rounded-2xl border text-right transition-all touch-ripple ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-950/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs">
                    {getToneIcon(preset.iconName)}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {preset.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Sliders: Speech Rate & Pitch */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        {/* Speech Rate */}
        <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                سرعة النطق (Speech Rate):
              </label>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tabular-nums text-blue-600 dark:text-blue-400">
                {speechRate.toFixed(2)}x
              </span>
              {speechRate !== 1.0 && (
                <button
                  type="button"
                  onClick={() => setSpeechRate(1.0)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="إعادة التعيين للسرعة الافتراضية"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
            <span>0.5x (بطيء وواضح)</span>
            <span>1.0x (طبيعي)</span>
            <span>2.0x (سريع جداً)</span>
          </div>

          {/* Quick Rate Shortcuts */}
          <div className="flex items-center gap-1.5 mt-2.5">
            {[0.8, 1.0, 1.2, 1.5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setSpeechRate(val)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${
                  speechRate === val
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {val.toFixed(1)}x
              </button>
            ))}
          </div>
        </div>

        {/* Pitch Tuning */}
        <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                طبقة وخامة الصوت (Pitch):
              </label>
            </div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {pitch === 'deep' ? 'جهوري/عميق' : pitch === 'bright' ? 'مشرق/رنان' : 'طبيعي معتدل'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2">
            <button
              type="button"
              onClick={() => setPitch('deep')}
              className={`p-2 rounded-xl text-center border transition-all touch-ripple ${
                pitch === 'deep'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold ring-1 ring-indigo-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="text-xs">عميق / جهوري</div>
              <div className="text-[10px] text-slate-400 mt-0.5">صوت فخم ووقور</div>
            </button>

            <button
              type="button"
              onClick={() => setPitch('normal')}
              className={`p-2 rounded-xl text-center border transition-all touch-ripple ${
                pitch === 'normal'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold ring-1 ring-indigo-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="text-xs">طبيعي معتدل</div>
              <div className="text-[10px] text-slate-400 mt-0.5">نبرة متوازنة</div>
            </button>

            <button
              type="button"
              onClick={() => setPitch('bright')}
              className={`p-2 rounded-xl text-center border transition-all touch-ripple ${
                pitch === 'bright'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold ring-1 ring-indigo-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="text-xs">مشرق / رنان</div>
              <div className="text-[10px] text-slate-400 mt-0.5">طاقة ووضوح عالٍ</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
