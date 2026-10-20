import React from 'react';
import { X, Play, Download, Trash2, ArrowUpRight, History } from 'lucide-react';
import { GeneratedSpeechItem } from '../types.ts';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: GeneratedSpeechItem[];
  onSelectSpeech: (item: GeneratedSpeechItem) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
  onDownloadWav: (item: GeneratedSpeechItem) => void;
  onDownloadMp3: (item: GeneratedSpeechItem) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectSpeech,
  onClearHistory,
  onDeleteItem,
  onDownloadWav,
  onDownloadMp3,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              سجل التسجيلات الصوتية ({history.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">لا توجد تسجيلات سابقة بعد</p>
              <p className="text-xs text-slate-400 mt-1">
                أي نص تقوم بتحويله سيتم حفظه هنا للرجوع إليه وتنزيله في أي وقت.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 hover:border-blue-400 dark:hover:border-blue-800 transition-all text-right space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md bg-blue-100/60 dark:bg-blue-900/30">
                    {item.voice} · {item.detectedLang ? item.detectedLang : item.tone}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.createdAt).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed font-sans">
                  {item.text}
                </p>

                {/* Actions inside card */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSpeech(item);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>تشغيل في الاستوديو</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {!item.isDeviceFallback ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onDownloadWav(item)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px] font-bold cursor-pointer"
                          title="تحميل WAV"
                        >
                          WAV
                        </button>

                        <button
                          type="button"
                          onClick={() => onDownloadMp3(item)}
                          className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-[11px] font-bold cursor-pointer"
                          title="تحميل MP3"
                        >
                          MP3
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30">
                        صوت الجهاز (لا يحمل)
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="حذف من السجل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClearHistory}
              className="text-xs text-red-500 hover:underline font-semibold"
            >
              مسح جميع التسجيلات
            </button>
            <span className="text-xs text-slate-400">
              {history.length} تسجيل محفوظ
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
