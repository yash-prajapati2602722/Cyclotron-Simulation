import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  QrCode,
  Copy,
  Check,
  Github,
  ExternalLink,
  X,
  WifiOff,
  Share2,
  Package,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const SHARED_MOBILE_URL = 'https://ais-pre-zevd3yemylkurl7zcoati2-776106913773.asia-east1.run.app';

export const PWAHeaderActions: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isOnline, install } = usePWAInstall();
  const [openModal, setOpenModal] = useState<'mobile' | 'github' | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);

  const appUrl =
    typeof window !== 'undefined' && window.location.origin.includes('ais-')
      ? SHARED_MOBILE_URL
      : typeof window !== 'undefined'
      ? window.location.origin
      : SHARED_MOBILE_URL;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&color=060b14&bgcolor=ffffff&data=${encodeURIComponent(
    appUrl
  )}`;

  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(
    SHARED_MOBILE_URL
  )}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2200);
  };

  const handleCopyGitCommands = () => {
    navigator.clipboard.writeText(
      `git remote add origin https://github.com/YOUR_USERNAME/zyklotron-lab.git\ngit branch -M main\ngit push -u origin main`
    );
    setCopiedGit(true);
    setTimeout(() => setCopiedGit(false), 2200);
  };

  return (
    <>
      {!isOnline && (
        <div className="fixed bottom-16 lg:bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-500/95 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-lg">
          <WifiOff className="w-3.5 h-3.5" />
          Offline Mode — Running from Mobile PWA Cache
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {/* Direct Native Install Button if browser supports beforeinstallprompt */}
        {!isInstalled && isInstallable && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-xs font-semibold transition cursor-pointer"
            title="Install Zyklotron App directly on your device"
          >
            <Download className="w-3.5 h-3.5 text-emerald-300" />
            <span>Install App</span>
          </button>
        )}

        {/* Mobile App / APK Button */}
        <button
          onClick={() => setOpenModal('mobile')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-xs font-semibold transition cursor-pointer"
          title="Download Android APK or Install on Mobile Phone"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-300" />
          <span className="hidden sm:inline">Mobile / APK</span>
          <span className="sm:hidden">APK</span>
        </button>

        {/* GitHub APK & README Modal Button */}
        <button
          onClick={() => setOpenModal('github')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          title="GitHub Auto-APK Builder & Push Guide"
        >
          <Github className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden md:inline">GitHub APK</span>
        </button>
      </div>

      {/* MOBILE APP & ANDROID APK MODAL */}
      {openModal === 'mobile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-[#0b1322] border border-cyan-500/30 p-5 sm:p-6 shadow-2xl text-slate-100 my-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    📱 Android APK &amp; Mobile App Installer
                  </h3>
                  <p className="text-xs text-slate-400">
                    Get the installable <code className="text-emerald-300">Zyklotron-3D-Lab.apk</code> or install directly via Mobile PWA
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpenModal(null)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Android APK Options Banner */}
            <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Package className="w-4 h-4" />
                  Download Android .APK File (2 Fast Ways):
                </span>
                <button
                  onClick={() => setOpenModal('github')}
                  className="text-[11px] font-semibold text-cyan-300 hover:underline cursor-pointer"
                >
                  View GitHub Auto-APK Guide →
                </button>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong>Way 1 (GitHub Actions Auto-APK):</strong> Push this project using the top-right <strong>GitHub icon</strong> in AI Studio. GitHub Actions (<code className="text-emerald-300">.github/workflows/build-android-apk.yml</code>) automatically compiles and attaches <strong><code>Zyklotron-3D-Lab.apk</code></strong> to your GitHub Releases!
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Way 2: Generate Instant .APK via PWABuilder
                  <ExternalLink className="w-3 h-3" />
                </a>
                {isInstallable && !isInstalled && (
                  <button
                    onClick={install}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs cursor-pointer transition"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Direct 1-Click Install on Phone
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* QR Code Box */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                <div className="bg-white p-2 rounded-xl shadow-md">
                  <img
                    src={qrImageUrl}
                    alt="Scan QR Code to open on Mobile"
                    className="w-36 h-36 object-contain"
                  />
                </div>
                <span className="mt-2 flex items-center gap-1 text-[11px] font-mono text-cyan-300">
                  <QrCode className="w-3.5 h-3.5" /> Phone Camera se Scan karein
                </span>
              </div>

              {/* Steps */}
              <div className="sm:col-span-7 space-y-3 text-xs">
                <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                  <div className="font-semibold text-cyan-300 mb-1">
                    Direct Mobile App Link (Copy &amp; Open on Phone):
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <input
                      type="text"
                      readOnly
                      value={appUrl}
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-[11px] font-mono text-slate-300"
                    />
                    <button
                      onClick={handleCopyUrl}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs cursor-pointer"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedUrl ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3 space-y-1.5 text-slate-300">
                  <div className="font-semibold text-amber-300">
                    Bina APK ke Home Screen par App jaise Install karein:
                  </div>
                  <p>
                    • <strong>Android (Chrome):</strong> Link kholkar upar <strong>&quot;Install App&quot;</strong> dabayein ya Chrome menu (<code>⋮</code>) → <strong>Install app</strong> chunein.
                  </p>
                  <p>
                    • <strong>iPhone / iPad (Safari):</strong> Niche <strong>Share</strong> (<Share2 className="w-3 h-3 inline" />) dabayein → <strong>&quot;Add to Home Screen&quot;</strong> chunein.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {isInstalled
                  ? '✅ App is installed in standalone mode'
                  : isIOS
                  ? '🍎 iOS detected — Use Safari Share → Add to Home Screen'
                  : '⚡ Capacitor Android + PWA Offline Cache Ready'}
              </span>
              <button
                onClick={() => setOpenModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GITHUB AUTO-APK & README.MD MODAL */}
      {openModal === 'github' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-[#0b1322] border border-slate-700 p-5 sm:p-6 shadow-2xl text-slate-100 my-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    GitHub Auto-APK Builder &amp; Push Guide
                  </h3>
                  <p className="text-xs text-slate-400">
                    Includes <code className="text-emerald-300">.github/workflows/build-android-apk.yml</code>, <code className="text-cyan-300">capacitor.config.json</code> &amp; <code className="text-cyan-300">README.md</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpenModal(null)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-emerald-200 space-y-1.5">
                <div className="font-bold text-emerald-300">
                  Step 1: Push to GitHub (1-Click from AI Studio Toolbar)
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Click the <strong>GitHub icon (&quot;Save to GitHub&quot;)</strong> in the top-right corner of Google AI Studio. It will create your GitHub repository and push all files including the automated Android APK workflow!
                </p>
              </div>

              <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-3.5 text-cyan-200 space-y-1.5">
                <div className="font-bold text-cyan-300">
                  Step 2: Download Your Compiled `Zyklotron-3D-Lab.apk` on GitHub
                </div>
                <p className="text-slate-300 leading-relaxed">
                  As soon as you push to GitHub, <strong>GitHub Actions</strong> automatically runs Gradle + Capacitor Android and publishes <strong><code>Zyklotron-3D-Lab.apk</code></strong> inside your repo&apos;s <strong>Releases</strong> section and <strong>Actions → Artifacts</strong> tab!
                </p>
              </div>

              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-200">
                    Alternative: Push via Git CLI Commands
                  </span>
                  <button
                    onClick={handleCopyGitCommands}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono cursor-pointer"
                  >
                    {copiedGit ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedGit ? 'Copied!' : 'Copy Commands'}
                  </button>
                </div>
                <pre className="rounded-lg bg-slate-950 border border-slate-800/90 p-3 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`git remote add origin https://github.com/<your-username>/zyklotron-lab.git
git branch -M main
git push -u origin main`}
                </pre>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setOpenModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
