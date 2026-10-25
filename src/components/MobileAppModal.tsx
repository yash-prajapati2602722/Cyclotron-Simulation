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
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const SHARED_MOBILE_URL = 'https://ais-pre-zevd3yemylkurl7zcoati2-776106913773.asia-east1.run.app';
const GITHUB_REPO_URL = 'https://github.com/yash-prajapati2602722/Cyclotron-Simulation';
const DIRECT_APK_PATH = '/app.apk';
const ALT_APK_PATH = '/Zyklotron-3D-Lab.apk';

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
  const [qrMode, setQrMode] = useState<'apk' | 'app'>('apk');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);
  const [copiedKotlin, setCopiedKotlin] = useState(false);

  const isNativeKotlinApp =
    typeof window !== 'undefined' && 'AndroidZyklotronBridge' in window;

  const appUrl =
    typeof window !== 'undefined' && window.location.origin.includes('ais-')
      ? SHARED_MOBILE_URL
      : typeof window !== 'undefined' && window.location.origin.startsWith('http') && !window.location.origin.includes('localhost')
      ? window.location.origin
      : SHARED_MOBILE_URL;

  const fullApkDownloadUrl = `${appUrl}${DIRECT_APK_PATH}`;

  const qrTargetUrl = qrMode === 'apk' ? fullApkDownloadUrl : appUrl;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&color=060b14&bgcolor=ffffff&data=${encodeURIComponent(
    qrTargetUrl
  )}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(qrTargetUrl);
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
        <div className="fixed bottom-16 lg:bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-emerald-500/95 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-lg">
          <WifiOff className="w-3.5 h-3.5" />
          100% Offline Mode Active — Running Locally
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {isNativeKotlinApp ? (
          <button
            onClick={() => setOpenModal('kotlin')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold cursor-pointer"
            title="Running inside 100% Offline Native Kotlin Android App"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-300" />
            <span>Offline Kotlin APK Active</span>
          </button>
        ) : (
          <a
            href={DIRECT_APK_PATH}
            download="app.apk"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
            title="Download 100% Offline Native Kotlin Android app.apk"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Download Offline app.apk</span>
          </a>
        )}

        {!isInstalled && isInstallable && !isNativeKotlinApp && (
          <button
            onClick={install}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-xs font-semibold transition cursor-pointer"
            title="Install Zyklotron App directly on your device"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
            <span>Install</span>
          </button>
        )}

        <button
          onClick={() => setOpenModal('mobile')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-xs font-semibold transition cursor-pointer"
          title="Download Offline Kotlin app.apk or Scan QR Code"
        >
          <QrCode className="w-3.5 h-3.5 text-cyan-300" />
          <span className="hidden sm:inline">APK / QR</span>
        </button>

        <button
          onClick={() => setOpenModal('kotlin')}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 border border-violet-400/40 text-violet-200 text-xs font-semibold transition cursor-pointer"
          title="View Native Kotlin + Android SDK Project (MainActivity.kt)"
        >
          <Code2 className="w-3.5 h-3.5 text-violet-300" />
          <span className="hidden xl:inline">Kotlin</span>
        </button>

        <button
          onClick={() => setOpenModal('github')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          title="GitHub Repository & APK Release"
        >
          <Github className="w-3.5 h-3.5 text-slate-300" />
        </button>
      </div>

      {/* MOBILE APP & OFFLINE KOTLIN APK DOWNLOAD MODAL */}
      {openModal === 'mobile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-[#0b1322] border border-cyan-500/30 p-5 sm:p-6 shadow-2xl text-slate-100 my-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    📲 100% Offline Native Kotlin Android APK (`app.apk`)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Compiled with Kotlin 1.9.22 + Android SDK 34 • Runs 100% Offline without Internet
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

            {/* PRIMARY 1-CLICK OFFLINE APK DOWNLOAD BANNER */}
            <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 p-4 text-xs space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  100% Offline Standalone Kotlin APK (`app.apk`)
                </span>
                <span className="px-2 py-0.5 rounded bg-violet-500/20 border border-violet-400/40 text-violet-200 font-mono text-[10px]">
                  MainActivity.kt + Bundled 3D Assets
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Is <strong><code>app.apk</code></strong> ke andar poora 3D WebGL engine, Cyclotron simulation, PDF Lab Manual, aur Kotlin native bridge (<code>MainActivity.kt</code>) pre-bundled hai — <strong>bina internet (100% Offline)</strong> chalta hai!
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                <a
                  href={DIRECT_APK_PATH}
                  download="app.apk"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  Download Offline app.apk
                </a>
                <a
                  href={ALT_APK_PATH}
                  download="Zyklotron-3D-Lab.apk"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-semibold text-xs transition"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-300" />
                  Zyklotron-3D-Lab.apk
                </a>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-5 flex flex-col items-center justify-center bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center gap-1 mb-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
                  <button
                    onClick={() => setQrMode('apk')}
                    className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                      qrMode === 'apk'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    app.apk QR
                  </button>
                  <button
                    onClick={() => setQrMode('app')}
                    className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                      qrMode === 'app'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Web App QR
                  </button>
                </div>
                {isOnline ? (
                  <div className="bg-white p-2 rounded-xl shadow-md">
                    <img
                      src={qrImageUrl}
                      alt="Scan QR Code on Mobile"
                      className="w-36 h-36 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-center p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-emerald-300">
                    ✅ Running 100% Offline Inside Local Bundle
                  </div>
                )}
                <span className="mt-2 flex items-center gap-1 text-[11px] font-mono text-cyan-300 text-center">
                  <QrCode className="w-3.5 h-3.5 shrink-0" />
                  {qrMode === 'apk' ? 'Scan to Download app.apk' : 'Scan to Open Web App'}
                </span>
              </div>

              <div className="sm:col-span-7 space-y-3 text-xs">
                <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                  <div className="font-semibold text-cyan-300 mb-1">
                    {qrMode === 'apk'
                      ? 'Direct Offline app.apk Link:'
                      : 'Direct Mobile Web App Link:'}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <input
                      type="text"
                      readOnly
                      value={qrTargetUrl}
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
                    Offline Kotlin APK Features:
                  </div>
                  <p>
                    • <strong>Zero Internet Required:</strong> Sabhi 3D/2D simulations, Bainbridge Mass Spectrometer, Wien Filter, aur PDF Lab Manual APK ke <code>assets/public/</code> folder me embedded hain.
                  </p>
                  <p>
                    • <strong>Native Kotlin Bridge:</strong> Hardware-accelerated OpenGL ES 2.0 + target hit par native vibration haptics.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {isNativeKotlinApp
                  ? '✅ Running inside Native Offline Kotlin Android APK'
                  : isIOS
                  ? '🍎 iOS detected — Use Safari Share → Add to Home Screen'
                  : '✅ 100% Offline Signed Kotlin app.apk Ready'}
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
                  <div className="text-[10px] font-mono uppercase text-emerald-300">Offline Bundle</div>
                  <div className="font-bold text-white mt-0.5">assets/public (100% Local)</div>
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
                Compiled into standalone offline <code className="text-emerald-300">app.apk</code>
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
                    GitHub Repository &amp; Offline Kotlin `app.apk`
                  </h3>
                  <p className="text-xs text-slate-400">
                    100% Offline <code className="text-emerald-300">public/app.apk</code> + CI workflow included
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
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-emerald-200 space-y-2">
                <div className="font-bold text-emerald-300">
                  100% Offline Native Kotlin `app.apk` Built &amp; Bundled
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Humne Gradle + Kotlin 1.9.22 + Android SDK 34 se poora offline <strong><code>app.apk</code></strong> compile karke bundle kar diya hai:
                </p>
                <a
                  href={DIRECT_APK_PATH}
                  download="app.apk"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  Download Offline app.apk Now
                </a>
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
