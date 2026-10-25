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
  Code2,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const SHARED_MOBILE_URL = 'https://ais-pre-zevd3yemylkurl7zcoati2-776106913773.asia-east1.run.app';
const GITHUB_REPO_URL = 'https://github.com/yash-prajapati2602722/Cyclotron-Simulation';

const KOTLIN_MAIN_ACTIVITY_CODE = `package com.zyklotron.physicslab

import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.HapticFeedbackConstants
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import androidx.core.view.WindowCompat
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        val labDarkColor = Color.parseColor("#060B14")
        window.statusBarColor = labDarkColor
        window.navigationBarColor = labDarkColor
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }

        bridge?.webView?.let { webView ->
            webView.settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                mediaPlaybackRequiresUserGesture = false
                cacheMode = WebSettings.LOAD_DEFAULT
                allowFileAccess = true
            }
            webView.addJavascriptInterface(NativePhysicsBridge(), "AndroidZyklotronBridge")
        }
    }

    inner class NativePhysicsBridge {
        @JavascriptInterface
        fun triggerTargetHitHaptic() {
            runOnUiThread {
                bridge?.webView?.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
                val vibrator = getSystemService(VIBRATOR_SERVICE) as? Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator?.vibrate(VibrationEffect.createOneShot(45, VibrationEffect.DEFAULT_AMPLITUDE))
                }
            }
        }
    }
}`;

export const PWAHeaderActions: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isOnline, install } = usePWAInstall();
  const [openModal, setOpenModal] = useState<'mobile' | 'github' | 'kotlin' | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);
  const [copiedKotlin, setCopiedKotlin] = useState(false);

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
      `git remote set-url origin https://github.com/yash-prajapati2602722/Cyclotron-Simulation.git\ngit branch -M main\ngit push -u origin main --force`
    );
    setCopiedGit(true);
    setTimeout(() => setCopiedGit(false), 2200);
  };

  const handleCopyKotlin = () => {
    navigator.clipboard.writeText(KOTLIN_MAIN_ACTIVITY_CODE);
    setCopiedKotlin(true);
    setTimeout(() => setCopiedKotlin(false), 2200);
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

        <button
          onClick={() => setOpenModal('mobile')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-xs font-semibold transition cursor-pointer"
          title="Download Android APK or Install on Mobile Phone"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-300" />
          <span className="hidden sm:inline">Android APK</span>
          <span className="sm:hidden">APK</span>
        </button>

        <button
          onClick={() => setOpenModal('kotlin')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 border border-violet-400/40 text-violet-200 text-xs font-semibold transition cursor-pointer"
          title="View Native Kotlin + Android SDK Project (android/app/src/main/java/com/zyklotron/physicslab/MainActivity.kt)"
        >
          <Code2 className="w-3.5 h-3.5 text-violet-300" />
          <span className="hidden lg:inline">Kotlin SDK</span>
        </button>

        <button
          onClick={() => setOpenModal('github')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          title="GitHub Auto-APK Builder & Push Guide"
        >
          <Github className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden md:inline">GitHub Push</span>
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
                    📱 Native Kotlin Android APK &amp; Mobile Installer
                  </h3>
                  <p className="text-xs text-slate-400">
                    Built with Kotlin 1.9.22 (<code className="text-violet-300">MainActivity.kt</code>) &amp; Android SDK 34
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

            <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Package className="w-4 h-4" />
                  Download Android .APK (`Zyklotron-3D-Lab.apk`):
                </span>
                <button
                  onClick={() => setOpenModal('kotlin')}
                  className="text-[11px] font-semibold text-violet-300 hover:underline cursor-pointer"
                >
                  Inspect Kotlin Source →
                </button>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Click the top-right <strong>GitHub icon (&quot;Save to GitHub&quot;)</strong> in AI Studio to push the complete <strong><code>android/</code> Kotlin + Android SDK project</strong> to <code className="text-emerald-300">yash-prajapati2602722/Cyclotron-Simulation</code>. GitHub Actions compiles and attaches <strong><code>Zyklotron-3D-Lab.apk</code></strong> to Releases!
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <a
                  href={`${GITHUB_REPO_URL}/releases`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  <Github className="w-3.5 h-3.5" />
                  Open GitHub Releases (.APK)
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-semibold text-xs transition"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-300" />
                  Instant APK via PWABuilder
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
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
                    Home Screen par App jaise Install karein:
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
                  : '⚡ Native Kotlin + Android SDK 34 Ready'}
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

      {/* NATIVE KOTLIN + ANDROID SDK SOURCE MODAL */}
      {openModal === 'kotlin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0b1322] border border-violet-500/40 p-5 sm:p-6 shadow-2xl text-slate-100 my-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-400/40 flex items-center justify-center text-violet-300">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Native Kotlin + Android SDK Project (`android/`)
                  </h3>
                  <p className="text-xs text-slate-400">
                    File: <code className="text-violet-300">android/app/src/main/java/com/zyklotron/physicslab/MainActivity.kt</code>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3">
                  <div className="text-[10px] font-mono uppercase text-violet-300">Language &amp; JVM</div>
                  <div className="font-bold text-white mt-0.5">Kotlin 1.9.22 (JDK 17)</div>
                </div>
                <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3">
                  <div className="text-[10px] font-mono uppercase text-cyan-300">Android SDK</div>
                  <div className="font-bold text-white mt-0.5">compileSdk 34 / minSdk 22</div>
                </div>
                <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3">
                  <div className="text-[10px] font-mono uppercase text-emerald-300">Native Bridge</div>
                  <div className="font-bold text-white mt-0.5">Haptics + OpenGL ES 2.0</div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] text-violet-300">
                    MainActivity.kt — Hardware-Accelerated WebGL &amp; Native Haptics Bridge
                  </span>
                  <button
                    onClick={handleCopyKotlin}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono cursor-pointer"
                  >
                    {copiedKotlin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKotlin ? 'Copied!' : 'Copy Kotlin'}
                  </button>
                </div>
                <pre className="rounded-lg bg-slate-950 border border-slate-800/90 p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-64 leading-relaxed">
                  {KOTLIN_MAIN_ACTIVITY_CODE}
                </pre>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">
                Ready to open directly in <strong>Android Studio</strong> (<code className="text-slate-200">./android</code> folder)
              </span>
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
                    Fixed: yash-prajapati2602722/Cyclotron-Simulation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Native Kotlin <code className="text-violet-300">android/</code> project + GitHub Actions APK Builder ready
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
                  Step 1: Push to `yash-prajapati2602722/Cyclotron-Simulation`
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Click the <strong>GitHub icon (&quot;Save to GitHub&quot;)</strong> in the top-right corner of Google AI Studio to push the complete <strong>Kotlin + Android SDK (`android/`)</strong> folder and fixed workflow to your repository!
                </p>
              </div>

              <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-3.5 text-cyan-200 space-y-2">
                <div className="font-bold text-cyan-300">
                  Step 2: Download `Zyklotron-3D-Lab.apk`
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Once pushed, GitHub Actions builds the Kotlin Android project and publishes <strong><code>Zyklotron-3D-Lab.apk</code></strong> in your repo&apos;s Releases and Actions tab:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={`${GITHUB_REPO_URL}/actions`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                  >
                    View GitHub Actions Build <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`${GITHUB_REPO_URL}/releases`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold text-xs"
                  >
                    Open GitHub Releases <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-200">
                    Git CLI Commands for `Cyclotron-Simulation.git`
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
{`git remote set-url origin https://github.com/yash-prajapati2602722/Cyclotron-Simulation.git
git branch -M main
git push -u origin main --force`}
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
