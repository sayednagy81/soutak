import React from 'react';
import {
  Mic,
  Sliders,
  Gauge,
  RotateCcw,
  User,
  AudioWaveform,
  ChevronDown,
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
  // Current active selections for metadata preview
  const currentVoice = VOICES.find((v) => v.id === selectedVoice) || VOICES[0];
  const currentTone = TONE_PRESETS.find((t) => t.id === selectedTone) || TONE_PRESETS[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm transition-all space-y-5">
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
              اختر الشخصية الصوتية والنبرة وطبقة الصوت من القوائم المنسدلة
            </p>
          </div>
        </div>
      </div>

      {/* 2. Dropdown Grid: Voice & Tone Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Voice Dropdown */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="voice-dropdown"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-blue-500" />
              <span>شخصية الصوت المؤدي:</span>
            </label>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                currentVoice.gender === 'female'
                  ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300'
                  : 'bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300'
              }`}
            >
              {currentVoice.gender === 'female' ? 'أنثى' : 'ذكر'}
            </span>
          </div>

          <div className="relative">
            <select
              id="voice-dropdown"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value as VoiceId)}
              className="w-full appearance-none p-3.5 pr-11 pl-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition-colors"
            >
              {VOICES.map((voice) => (
                <option key={voice.id} value={voice.id} className="py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {voice.nameAr} — ({voice.gender === 'female' ? 'صوت أنثوي' : 'صوت رجالي'})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400 dark:text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 pr-1 leading-relaxed">
            {currentVoice.description}
          </p>
        </div>

        {/* Tone Variations Dropdown */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="tone-dropdown"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <AudioWaveform className="w-3.5 h-3.5 text-purple-500" />
              <span>تنوعات النبرة والأسلوب:</span>
            </label>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300">
              {currentTone.category === 'egyptian' ? 'عامية مصرية 🇪🇬' : currentTone.category === 'classical' ? 'فصحى مشكولة 📜' : 'لغات عالمية 🌐'}
            </span>
          </div>

          <div className="relative">
            <select
              id="tone-dropdown"
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value as ToneId)}
              className="w-full appearance-none p-3.5 pr-11 pl-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition-colors"
            >
              <optgroup label="🇪🇬 العامية المصرية (Egyptian Dialect)" className="font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800">
                {TONE_PRESETS.filter((t) => t.category === 'egyptian').map((preset) => (
                  <option key={preset.id} value={preset.id} className="py-2 font-normal bg-white dark:bg-slate-900">
                    {preset.title} — ({preset.description})
                  </option>
                ))}
              </optgroup>

              <optgroup label="📜 اللغة العربية الفصحى المشكولة (Classical Arabic)" className="font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800">
                {TONE_PRESETS.filter((t) => t.category === 'classical').map((preset) => (
                  <option key={preset.id} value={preset.id} className="py-2 font-normal bg-white dark:bg-slate-900">
                    {preset.title} — ({preset.description})
                  </option>
                ))}
              </optgroup>

              <optgroup label="🌐 لغات عالمية (Multilingual)" className="font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800">
                {TONE_PRESETS.filter((t) => t.category === 'multilingual').map((preset) => (
                  <option key={preset.id} value={preset.id} className="py-2 font-normal bg-white dark:bg-slate-900">
                    {preset.title} — ({preset.description})
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400 dark:text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 pr-1 leading-relaxed">
            {currentTone.description}
          </p>
        </div>
      </div>

      {/* 3. Sliders & Pitch Dropdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        {/* Pitch Dropdown */}
        <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="pitch-dropdown"
              className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <Mic className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>طبقة وخامة الصوت (Pitch):</span>
            </label>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {pitch === 'deep' ? 'جهوري/عميق' : pitch === 'bright' ? 'مشرق/رنان' : 'طبيعي معتدل'}
            </span>
          </div>

          <div className="relative">
            <select
              id="pitch-dropdown"
              value={pitch}
              onChange={(e) => setPitch(e.target.value as PitchType)}
              className="w-full appearance-none p-3 pr-11 pl-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 cursor-pointer transition-colors"
            >
              <option value="normal" className="py-2 bg-white dark:bg-slate-900">
                طبيعي معتدل (Normal) — نبرة متوازنة ومريحة
              </option>
              <option value="deep" className="py-2 bg-white dark:bg-slate-900">
                عميق / جهوري (Deep) — صوت فخم ووقور برنين جهوري
              </option>
              <option value="bright" className="py-2 bg-white dark:bg-slate-900">
                مشرق / رنان (Bright) — طاقة ووضوح عالٍ بنبرة مضيئة
              </option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400 dark:text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            يتحكم في تردد الصوت وخامة الحنجرة لملائمة نوع المحتوى (أخبار، قصص، إعلانات).
          </p>
        </div>

        {/* Speech Rate Slider */}
        <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <label htmlFor="speech-rate-slider" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
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
            id="speech-rate-slider"
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>0.5x (بطيء)</span>
            <span>1.0x (افتراضي)</span>
            <span>2.0x (سريع)</span>
          </div>

          {/* Quick Rate Shortcuts */}
          <div className="flex items-center gap-1.5 pt-1">
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
      </div>
    </div>
  );
};
