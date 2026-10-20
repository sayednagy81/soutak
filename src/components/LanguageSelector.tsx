import React from 'react';
import { Globe, Sparkles } from 'lucide-react';
import { LANGUAGES } from '../constants/presets.ts';
import { LanguageId } from '../types.ts';
import { DetectionResult } from '../utils/langDetector.ts';

interface LanguageSelectorProps {
  selectedLanguage: LanguageId;
  onSelectLanguage: (lang: LanguageId) => void;
  detected: DetectionResult;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  detected,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs transition-all space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              لغة النطق والقراءة (Language Selection)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              اختر اللغة يدوياً أو دع النظام يكتشفها تلقائياً للنطق المتقن
            </p>
          </div>
        </div>

        {/* Live Detection Badge if in Auto mode */}
        {selectedLanguage === 'auto' && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/60 text-[11px] font-bold text-teal-700 dark:text-teal-300">
            <Sparkles className="w-3 h-3 text-teal-500 animate-pulse" />
            <span>اللغة المكتشفة تلقائياً: {detected.nameAr} {detected.flag}</span>
          </div>
        )}
      </div>

      {/* Language Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage === lang.id;
          return (
            <button
              key={lang.id}
              type="button"
              onClick={() => onSelectLanguage(lang.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-semibold whitespace-nowrap transition-all touch-ripple shrink-0 ${
                isSelected
                  ? 'border-teal-500 bg-teal-50/80 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 shadow-xs ring-2 ring-teal-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="text-sm">{lang.flag}</span>
              <span>{lang.nameAr}</span>
              {lang.id !== 'auto' && (
                <span className="text-[10px] opacity-60 font-normal">
                  ({lang.nativeName})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
