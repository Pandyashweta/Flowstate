import React, { useState } from 'react';
import {
  Apple,
  Check,
  Chrome,
  Download,
  ExternalLink,
  Laptop,
  Monitor,
  Share2,
  Smartphone,
  X,
} from 'lucide-react';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onInstalled?: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled,
}) => {
  const [platformTab, setPlatformTab] = useState<'desktop' | 'android' | 'ios'>('desktop');
  const [installing, setInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstallSuccess(true);
          onInstalled?.();
        }
      } catch (err) {
        console.error('PWA install error:', err);
      } finally {
        setInstalling(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/icons/favicon_io/android-chrome-192x192.png"
              alt="FLOWSTATE"
              className="w-11 h-11 rounded-xl object-cover"
            />
            <div>
              <h3 className="font-display text-base font-bold text-[#111111] dark:text-white">
                Install FLOWSTATE
              </h3>
              <p className="text-xs text-[#737373]">
                Verified browser app • No .exe download, safe &amp; virus-free
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#EFEFEF] dark:hover:bg-[#262626] text-[#737373] hover:text-[#111111] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {installSuccess ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-display text-base font-bold text-[#111111] dark:text-white">
                FLOWSTATE Installed Successfully!
              </h4>
              <p className="text-xs text-[#737373] dark:text-[#737373]">
                You can now launch FLOWSTATE directly from your home screen or application launcher.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-semibold"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Native Prompt Banner if browser supports beforeinstallprompt */}
              {deferredPrompt ? (
                <div className="p-4 rounded-xl bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[#111111] dark:text-white">
                      Ready to Install
                    </div>
                    <div className="text-[11px] text-[#525252] dark:text-[#A3A3A3]">
                      Install directly via your browser with one click. No executable files needed.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    disabled={installing}
                    className="px-4 py-2 rounded-lg bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                  >
                    {installing ? 'Installing...' : 'Install'}
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] text-[11px] text-[#525252] dark:text-[#A3A3A3]">
                  FLOWSTATE installs safely through your browser&apos;s built-in web app installer—no external installer or `.exe` file required.
                </div>
              )}

              {/* Platform Switcher Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#F2F2F2] dark:bg-[#161616] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPlatformTab('desktop')}
                  className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    platformTab === 'desktop'
                      ? 'bg-white dark:bg-[#202020] text-[#111111] dark:text-white shadow-xs'
                      : 'text-[#737373]'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatformTab('android')}
                  className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    platformTab === 'android'
                      ? 'bg-white dark:bg-[#202020] text-[#111111] dark:text-white shadow-xs'
                      : 'text-[#737373]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Android</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatformTab('ios')}
                  className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    platformTab === 'ios'
                      ? 'bg-white dark:bg-[#202020] text-[#111111] dark:text-white shadow-xs'
                      : 'text-[#737373]'
                  }`}
                >
                  <Apple className="w-3.5 h-3.5" />
                  <span>iOS / Safari</span>
                </button>
              </div>

              {/* Instructions per device */}
              <div className="text-xs text-[#525252] dark:text-[#737373] space-y-3">
                {platformTab === 'desktop' && (
                  <div className="space-y-2.5">
                    <div className="font-semibold text-[#111111] dark:text-white">
                      Chrome, Edge, Brave (Windows & macOS):
                    </div>
                    <ol className="list-decimal pl-5 space-y-1.5 text-[11px] leading-relaxed">
                      <li>Look for the <span className="font-semibold text-[#111111] dark:text-white">Install icon (computer with down arrow)</span> on the right side of your browser URL bar.</li>
                      <li>Select <span className="font-semibold">Install FLOWSTATE</span> in the browser prompt.</li>
                      <li>FLOWSTATE launches in its own high-speed standalone window with dedicated taskbar pin.</li>
                    </ol>
                  </div>
                )}

                {platformTab === 'android' && (
                  <div className="space-y-2.5">
                    <div className="font-semibold text-[#111111] dark:text-white">
                      Chrome / Firefox on Android:
                    </div>
                    <ol className="list-decimal pl-5 space-y-1.5 text-[11px] leading-relaxed">
                      <li>Tap the three dots (⋮) menu in your browser&apos;s top right corner.</li>
                      <li>Tap <span className="font-semibold text-[#111111] dark:text-white">Install app</span> or <span className="font-semibold">Add to Home screen</span>.</li>
                      <li>Confirm installation. The FLOWSTATE app icon will appear on your home screen and app drawer.</li>
                    </ol>
                  </div>
                )}

                {platformTab === 'ios' && (
                  <div className="space-y-2.5">
                    <div className="font-semibold text-[#111111] dark:text-white">
                      Safari on iPhone and iPad:
                    </div>
                    <ol className="list-decimal pl-5 space-y-1.5 text-[11px] leading-relaxed">
                      <li>Tap the <span className="font-semibold text-[#111111] dark:text-white">Share button</span> (square with upward arrow) at the bottom of Safari.</li>
                      <li>Scroll down the share sheet and tap <span className="font-semibold">Add to Home Screen</span>.</li>
                      <li>Tap <span className="font-semibold">Add</span> in the top right. FLOWSTATE opens full-screen without Safari browser address bars.</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Bottom footer button */}
              <div className="pt-3 border-t border-[#E5E5E5] dark:border-[#262626] flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
