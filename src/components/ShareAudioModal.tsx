import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  Twitter,
  Facebook,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { GeneratedSpeechItem } from '../types.ts';

interface ShareAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: GeneratedSpeechItem;
}

export const ShareAudioModal: React.FC<ShareAudioModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const appUrl = window.location.href;
  const snippet = item.text.length > 80 ? item.text.substring(0, 80) + '...' : item.text;
  const shareText = `🎙️ استمع إلى هذا المقطع الصوتي المولد بتقنية Gemini TTS:
"${snippet}"
الصوت: ${item.voice} · النبرة: ${item.tone}
جربه الآن عبر تطبيق «صوتك»: ${appUrl}`;

  // Copy share message & link
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard copy error:', err);
    }
  };

  // Copy plain text only
  const handleCopyTextOnly = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(item.text);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard copy error:', err);
    }
  };

  // Native Web Share API if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'صوتك - محول النص لصوت Gemini TTS',
          text: `استمع إلى هذا المقطع الصوتي: "${snippet}" (الصوت: ${item.voice})`,
          url: appUrl,
        });
      } catch (err) {
        // User aborted share or not supported
        console.log('Share dismissed:', err);
      }
    }
  };

  // Social Links
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(`🎙️ مقطع صوتي مولد بـ Gemini TTS:\n"${snippet}"`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                مشاركة المقطع الصوتي
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                شارك الصوت والنص مع أصدقائك أو عبر منصات التواصل الاجتماعي
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Audio Item Preview Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                {item.voice} · {item.tone}
              </span>
              <span>السرعة: {item.speechRate}x</span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-3 leading-relaxed font-sans">
              "{item.text}"
            </p>
          </div>

          {/* Quick Copy Link & Text Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              رابط وتفاصيل المشاركة السريعة:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors touch-ripple shadow-xs"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Media Share Buttons */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              المشاركة المباشرة عبر المنصات:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all touch-ripple group"
              >
                <MessageCircle className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[11px] font-bold">واتساب</span>
              </a>

              {/* Telegram */}
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-all touch-ripple group"
              >
                <Send className="w-5 h-5 text-sky-600 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[11px] font-bold">تيليجرام</span>
              </a>

              {/* X / Twitter */}
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all touch-ripple group"
              >
                <Twitter className="w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[11px] font-bold">منصة X</span>
              </a>

              {/* Facebook */}
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all touch-ripple group"
              >
                <Facebook className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[11px] font-bold">فيسبوك</span>
              </a>
            </div>
          </div>

          {/* Native Device Share (Mobile / Tablet) if supported */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all touch-ripple"
              >
                <ExternalLink className="w-4 h-4" />
                <span>المشاركة عبر قائمة تطبيقات الهاتف</span>
              </button>
            </div>
          )}

          {/* Copy Plain Text Only Option */}
          <div className="pt-1 flex justify-center">
            <button
              type="button"
              onClick={handleCopyTextOnly}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline font-medium"
            >
              {copiedText ? 'تم نسخ النص فقط!' : 'نسخ النص المنطوق فقط'}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>مدعوم بواسطة صوتك و Gemini TTS</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
