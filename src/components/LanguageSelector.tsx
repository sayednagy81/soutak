import React from 'react';
import { Globe, Sparkles, ChevronDown } from 'lucide-react';
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
            <label htmlFor="language-dropdown" className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white cursor-pointer block">
              لغة النطق والقراءة (Language Selection)
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              اختر اللغة من القائمة المنسدلة أو اتركها على الاكتشاف التلقائي
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

      {/* Language Dropdown Select */}
      <div className="relative">
        <select
          id="language-dropdown"
          value={selectedLanguage}
          onChange={(e) => onSelectLanguage(e.target.value as LanguageId)}
          className="w-full appearance-none p-3.5 pr-11 pl-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition-colors"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id} className="py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              {lang.flag} {lang.nameAr} {lang.id !== 'auto' ? `(${lang.nativeName})` : ''}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400 dark:text-slate-500">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
