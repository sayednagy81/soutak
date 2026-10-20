import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  ExternalLink,
  Store,
  Layers,
  Sparkles,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  canPromptDirectly: boolean;
  onDirectInstall: () => void;
  isAndroid: boolean;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  canPromptDirectly,
  onDirectInstall,
  isAndroid,
}) => {
  const [activeTab, setActiveTab] = useState<'install' | 'playstore'>('install');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const bubblewrapCode = `npm install -g @bubblewrap/cli
bubblewrap init --manifest="${window.location.origin}/manifest.webmanifest"
bubblewrap build`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(bubblewrapCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  تطبيق أندرويد ومتجر التطبيقات
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Android & Play Store
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تثبيت فوري على هاتفك أو حزمه لنشره وتنزيله من متجر Google Play
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

        {/* Tab Controls */}
        <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('install')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'install'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>تثبيت فوري على أندرويد (PWA)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('playstore')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'playstore'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>نشر وتنزيل متجر Google Play (TWA)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {activeTab === 'install' ? (
            <div className="space-y-4">
              {/* Direct 1-Click Install Button if supported */}
              {canPromptDirectly ? (
                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-right space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span>جاهز للتثبيت بنقرة واحدة كـتطبيق هاتف مستقل!</span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                    سيتم تثبيت تطبيق «صوتك» مباشرة كأيقونة على شاشة هاتفك مع شاشة بدء (Splash Screen) ووضع ملء الشاشة بدون شريط المتصفح.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onDirectInstall();
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all touch-ripple"
                  >
                    <Download className="w-4 h-4" />
                    <span>تثبيت التطبيق على جهازي الآن</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-right space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 font-bold text-xs">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>خطوات التثبيت السريعة على أجهزة أندرويد (Chrome):</span>
                  </div>
                  <ol className="text-xs text-blue-900 dark:text-blue-300 space-y-1.5 list-decimal list-inside pr-1 leading-relaxed">
                    <li>افتح المتصفح (Google Chrome) على هاتفك الأندرويد.</li>
                    <li>اضغط على زر الخيارات أو النقاط الثلاث <strong>(⋮)</strong> أعلى الشاشة.</li>
                    <li>اختر <strong>«تثبيت التطبيق» (Install app)</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.</li>
                    <li>سيظهر التطبيق فوراً في درج تطبيقات هاتفك كأي تطبيق رسمي!</li>
                  </ol>
                </div>
              )}

              {/* Benefits list */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  مميزات نسخة تطبيق الهاتف:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>تشغيل بملء الشاشة بدون أشرطة</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>سرعة تحميل فائقة وتخزين مؤقت</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>أيقونة تطبيق مخصصة للأندرويد</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>دعم التنزيل المباشر لـ MP3 و WAV</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-right space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-xs">
                  <Store className="w-4 h-4 text-amber-600" />
                  <span>طريقة نشر التطبيق وتنزيله من Google Play Store:</span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                  تطبيقات PWA المعتمدة مدعومة رسمياً من Google ليتم حزمها كـ <strong>Trusted Web Activity (TWA)</strong>، وتحويلها إلى ملف <code>.aab</code> أو <code>.apk</code> جاهز للرفع على لوحة تحكم مطوري Google Play.
                </p>
              </div>

              {/* PWABuilder / Bubblewrap steps */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  الخيار 1: باستخدام أداة Google الرسمية (Bubblewrap CLI):
                </span>
                <div className="relative bg-slate-900 text-slate-100 rounded-xl p-3 text-xs font-mono text-left dir-ltr overflow-x-auto">
                  <pre>{bubblewrapCode}</pre>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="نسخ الأوامر"
                  >
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  الخيار 2: عبر موقع PWABuilder بنقرة واحدة (بدون كود):
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  توجه إلى موقع <strong>PWABuilder.com</strong> وأدخل رابط التطبيق، وسيقوم بإنشاء ملف حزمة الأندرويد (Android App Bundle - AAB) جاهز للتنزيل ورفعه إلى Google Play Console.
                </p>
                <a
                  href="https://www.pwabuilder.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح منصة PWABuilder للأندرويد</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            معيار PWA & TWA المعتمد من Google
          </span>
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
