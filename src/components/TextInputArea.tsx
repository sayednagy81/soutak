import React, { useState } from 'react';
import {
  Clipboard,
  Trash2,
  Wand2,
  Sparkles,
  MessageSquareQuote,
  Lightbulb,
  Check,
  Loader2,
  ChevronDown,
  BookOpen,
} from 'lucide-react';
import { SAMPLE_TEXTS } from '../constants/presets.ts';
import { PitchType, ToneId, VoiceId } from '../types.ts';

interface TextInputAreaProps {
  text: string;
  setText: (val: string) => void;
  onApplyPreset: (sample: {
    text: string;
    voice: VoiceId;
    tone: ToneId;
    rate: number;
    pitch: PitchType;
    lang?: any;
  }) => void;
  onSelectToneSuggestion: (suggestion: {
    recommendedVoice: VoiceId;
    recommendedTone: ToneId;
    recommendedRate?: number;
    recommendedPitch?: PitchType;
    reason?: string;
  }) => void;
}

export const TextInputArea: React.FC<TextInputAreaProps> = ({
  text,
  setText,
  onApplyPreset,
  onSelectToneSuggestion,
}) => {
  const [copied, setCopied] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [suggestionMessage, setSuggestionMessage] = useState<string | null>(null);

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setText(clipboardText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard read error, fallback to prompt:', err);
      const manual = prompt('الصق النص العربي هنا:');
      if (manual) setText(manual);
    }
  };

  // Clear
  const handleClear = () => {
    setText('');
    setSuggestionMessage(null);
  };

  // Text Assistant (Tashkeel or Egyptian Rephrasing)
  const handleAssist = async (action: 'tashkeel' | 'to_egyptian' | 'suggest_tone') => {
    if (!text.trim()) return;
    setLoadingAction(action);
    setSuggestionMessage(null);

    try {
      const response = await fetch('/api/text/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, text }),
      });
      const data = await response.json();

      if (data.success) {
        if (action === 'tashkeel' && data.result) {
          setText(data.result);
          if (data.notice) setSuggestionMessage(data.notice);
        } else if (action === 'to_egyptian' && data.result) {
          setText(data.result);
          if (data.fallback) {
            setSuggestionMessage('تمت الصياغة بالعامية المصرية بنجاح.');
          }
        } else if (action === 'suggest_tone' && data.suggestion) {
          onSelectToneSuggestion(data.suggestion);
          setSuggestionMessage(data.suggestion.reason || 'تم تطبيق أفضل نبرة وصوت للنص بنجاح!');
        }
      } else {
        setSuggestionMessage(data.error || 'تعذر إتمام المساعدة اللغوية حالياً.');
      }
    } catch (err) {
      console.error('Text assistance failed:', err);
      setSuggestionMessage('تعذر إتمام المساعدة اللغوية في الوقت الحالي.');
    } finally {
      setLoadingAction(null);
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm transition-all">
      {/* Header of Text Box */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <MessageSquareQuote className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            النص المراد تحويله (عربي، عامي، أو لغات أخرى)
          </h2>
        </div>

        {/* Action Buttons: Paste & Clear */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePaste}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors touch-ripple"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>تم اللصق!</span>
              </>
            ) : (
              <>
                <Clipboard className="w-3.5 h-3.5" />
                <span>لصق من الحافظة</span>
              </>
            )}
          </button>

          {text && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors touch-ripple"
              title="مسح النص"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="انسخ أو اكتب النص هنا بأي لغة... (العربية الفصحى، العامية المصرية، English, Français، أو غيرها)..."
          dir="auto"
          className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base leading-relaxed resize-y transition-colors font-sans"
        />

        {/* Word and Character Count */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-2 mt-1">
          <span>
            {wordCount} كلمة · {charCount} حرف
          </span>
          <span className="text-[10px]">
            {wordCount > 150 ? 'نص طويل - سيتم توليده بجودة عالية' : 'يدعم كافة التشكيلات واللهجات'}
          </span>
        </div>
      </div>

      {/* AI Assistance Toolbar */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tashkeel Button */}
          <button
            type="button"
            disabled={!text.trim() || loadingAction !== null}
            onClick={() => handleAssist('tashkeel')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed touch-ripple"
            title="إضافة التشكيل الإعرابي الكامل للنص تلقائياً"
          >
            {loadingAction === 'tashkeel' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Wand2 className="w-3.5 h-3.5 text-blue-500" />
            )}
            <span>تشكيل ذكي تلقائي</span>
          </button>

          {/* Egyptian Dialect Adapter */}
          <button
            type="button"
            disabled={!text.trim() || loadingAction !== null}
            onClick={() => handleAssist('to_egyptian')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed touch-ripple"
            title="تحويل النص إلى عامية مصرية دارجة وأصيلة"
          >
            {loadingAction === 'to_egyptian' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span>صياغة مصرية عامية</span>
          </button>

          {/* Suggest Tone */}
          <button
            type="button"
            disabled={!text.trim() || loadingAction !== null}
            onClick={() => handleAssist('suggest_tone')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed touch-ripple"
            title="اقتراح أفضل نبرة وصوت لهذا النص بالذكاء الاصطناعي"
          >
            {loadingAction === 'suggest_tone' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            ) : (
              <Lightbulb className="w-3.5 h-3.5 text-indigo-500" />
            )}
            <span>اقتراح النبرة المناسبة</span>
          </button>
        </div>

        {/* Suggestion Feedback Banner if available */}
        {suggestionMessage && (
          <div className="w-full text-xs font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/30 p-2 rounded-xl flex items-center gap-2">
            <Lightbulb className="w-4 h-4 shrink-0 text-indigo-500" />
            <span>{suggestionMessage}</span>
          </div>
        )}
      </div>

      {/* Preset Samples Dropdown */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
        <label htmlFor="sample-presets-dropdown" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
          <span>نماذج نصية جاهزة للتجربة الفورية:</span>
        </label>
        <div className="relative">
          <select
            id="sample-presets-dropdown"
            defaultValue=""
            onChange={(e) => {
              const idx = parseInt(e.target.value);
              if (!isNaN(idx) && SAMPLE_TEXTS[idx]) {
                onApplyPreset(SAMPLE_TEXTS[idx]);
              }
            }}
            className="w-full appearance-none p-3 pr-11 pl-4 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
          >
            <option value="" disabled className="bg-white dark:bg-slate-900 text-slate-400">
              -- اضغط لاختيار نموذج تجريبي جاهز (مصري، فصحى، إنجليزي، فرنسي) --
            </option>
            {SAMPLE_TEXTS.map((sample, idx) => (
              <option key={idx} value={idx} className="py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                {sample.label} — "{sample.text.length > 55 ? sample.text.substring(0, 55) + '...' : sample.text}"
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400 dark:text-slate-500">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
