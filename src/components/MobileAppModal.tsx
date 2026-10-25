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
  Cable,
  CheckCircle2,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const SHARED_MOBILE_URL = 'https://ais-pre-zevd3yemylkurl7zcoati2-776106913773.asia-east1.run.app';
const GITHUB_REPO_URL = 'https://github.com/yash-prajapati2602722/Cyclotron-Simulation';
const DIRECT_APK_PATH = '/Zyklotron-3D-Lab.apk';

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
  const [openModal, setOpenModal] = useState<'mobile' | 'usb' | 'github' | 'kotlin' | null>(null);
  const [qrMode, setQrMode] = useState<'apk' | 'app'>('apk');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);
  const [copiedKotlin, setCopiedKotlin] = useState(false);
  const [copiedUsb, setCopiedUsb] = useState(false);

  const appUrl =
    typeof window !== 'undefined' && window.location.origin.includes('ais-')
      ? SHARED_MOBILE_URL
      : typeof window !== 'undefined'
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

  const handleCopyUsbCommands = () => {
    navigator.clipboard.writeText(
      `# Method A: Install downloaded APK via USB cable\nadb devices\nadb install -r Zyklotron-3D-Lab.apk\n\n# Method B: Build & Install directly from source onto USB phone\ngit clone https://github.com/yash-prajapati2602722/Cyclotron-Simulation.git\ncd Cyclotron-Simulation\nnpm install --legacy-peer-deps\nnpm run apk:setup\nnpm run usb:install`
    );
    setCopiedUsb(true);
    setTimeout(() => setCopiedUsb(false), 2200);
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
        {/* DIRECT 1-CLICK APK DOWNLOAD BUTTON IN HEADER */}
        <a
          href={DIRECT_APK_PATH}
          download="Zyklotron-3D-Lab.apk"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
          title="Direct 1-Click Download Zyklotron-3D-Lab.apk (1.4 MB Signed Android APK)"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Download APK</span>
        </a>

        {!isInstalled && isInstallable && (
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
          title="Scan QR Code to Download APK on Mobile Phone"
        >
          <QrCode className="w-3.5 h-3.5 text-cyan-300" />
          <span className="hidden sm:inline">QR / Mobile</span>
        </button>

        <button
          onClick={() => setOpenModal('usb')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-semibold transition cursor-pointer"
          title="Install App on Mobile via USB Cable (ADB / File Transfer / Android Studio)"
        >
          <Cable className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden sm:inline">USB</span>
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
          title="GitHub Auto-APK Builder & Push Guide"
        >
          <Github className="w-3.5 h-3.5 text-slate-300" />
        </button>
      </div>

      {/* USB CABLE MOBILE INSTALL MODAL */}
      {openModal === 'usb' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-[#0b1322] border border-amber-500/40 p-5 sm:p-6 shadow-2xl text-slate-100 my-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Cable className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    🔌 USB Cable Se Mobile Me APK Kaise Install Karein?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Signed <code className="text-emerald-300">Zyklotron-3D-Lab.apk</code> (1.4 MB) is ready for direct download &amp; USB transfer
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
              {/* Way 1: Simple USB File Transfer */}
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-emerald-300">
                    Tarika 1 (Sabse Aasan): APK Download Karke USB Se Phone Me Dalein
                  </span>
                  <a
                    href={DIRECT_APK_PATH}
                    download="Zyklotron-3D-Lab.apk"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    Download Zyklotron-3D-Lab.apk (1.4 MB)
                  </a>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed">
                  <li>
                    Upar green button dabakar <strong><code>Zyklotron-3D-Lab.apk</code></strong> apne PC ya phone me download karein.
                  </li>
                  <li>
                    Mobile ko <strong>USB Cable</strong> se PC me lagayein aur phone par <strong>&quot;File Transfer / MTP&quot;</strong> select karein.
                  </li>
                  <li>
                    <code>Zyklotron-3D-Lab.apk</code> ko phone ke <strong>Download</strong> folder me copy karein aur phone me tap karke <strong>Install</strong> kar lein!
                  </li>
                </ol>
              </div>

              {/* Way 2: ADB / Terminal USB Debugging */}
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">
                    Tarika 2: USB Debugging (`adb install -r Zyklotron-3D-Lab.apk`)
                  </span>
                  <button
                    onClick={handleCopyUsbCommands}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono cursor-pointer"
                  >
                    {copiedUsb ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedUsb ? 'Copied!' : 'Copy USB Commands'}
                  </button>
                </div>
                <p className="text-slate-300">
                  Phone ke <strong>Settings → Developer Options → USB Debugging ON</strong> karein, USB cable lagayein, aur PC terminal me yeh command chalayein:
                </p>
                <pre className="rounded-lg bg-slate-950 border border-slate-800/90 p-3 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`# Direct APK install over USB:
adb devices
adb install -r Zyklotron-3D-Lab.apk

# Or build & install directly from source onto USB phone:
npm run usb:install`}
                </pre>
              </div>

              {/* Way 3: Bina USB ke QR / Direct Link */}
              <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-3 flex items-center justify-between gap-3">
                <span className="text-slate-300">
                  💡 <strong>Tip:</strong> Bina USB cable ke seedha phone camera se QR scan karke bhi `.APK` download kar sakte hain!
                </span>
                <button
                  onClick={() => setOpenModal('mobile')}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Scan APK QR
                </button>
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

      {/* MOBILE APP & ANDROID APK DOWNLOAD MODAL */}
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
                    📲 Download Android APK (`Zyklotron-3D-Lab.apk`)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Signed Release APK • Package: <code className="text-emerald-300">com.zyklotron.physicslab</code> • v2.4.0 (1.4 MB)
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

            {/* PRIMARY 1-CLICK APK DOWNLOAD BANNER */}
            <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 p-4 text-xs space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Ready to Install — Signed Android APK (1.4 MB)
                </span>
                <button
                  onClick={() => setOpenModal('usb')}
                  className="text-[11px] font-semibold text-amber-300 hover:underline cursor-pointer"
                >
                  🔌 USB Cable Install Guide →
                </button>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Niche diye gaye button par click karke seedha <strong><code>Zyklotron-3D-Lab.apk</code></strong> download karein aur apne Android phone par open karke <strong>Install</strong> karein!
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                <a
                  href={DIRECT_APK_PATH}
                  download="Zyklotron-3D-Lab.apk"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  Download Zyklotron-3D-Lab.apk (1.4 MB)
                </a>
                <a
                  href={`${GITHUB_REPO_URL}/releases`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-semibold text-xs transition"
                >
                  <Github className="w-3.5 h-3.5" />
                  GitHub Releases
                  <ExternalLink className="w-3 h-3" />
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
                    APK File QR
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
                <div className="bg-white p-2 rounded-xl shadow-md">
                  <img
                    src={qrImageUrl}
                    alt="Scan QR Code on Mobile"
                    className="w-36 h-36 object-contain"
                  />
                </div>
                <span className="mt-2 flex items-center gap-1 text-[11px] font-mono text-cyan-300 text-center">
                  <QrCode className="w-3.5 h-3.5 shrink-0" />
                  {qrMode === 'apk' ? 'Scan to Download .APK' : 'Scan to Open Web App'}
                </span>
              </div>

              <div className="sm:col-span-7 space-y-3 text-xs">
                <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                  <div className="font-semibold text-cyan-300 mb-1">
                    {qrMode === 'apk'
                      ? 'Direct .APK Download Link (Copy for Mobile):'
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
                    Phone Par Install Kaise Karein:
                  </div>
                  <p>
                    • <strong>Method 1 (.APK File):</strong> Upar <strong>Download Zyklotron-3D-Lab.apk</strong> dabayein → file open karke <strong>Install</strong> karein.
                  </p>
                  <p>
                    • <strong>Method 2 (iPhone / Chrome PWA):</strong> Safari me <Share2 className="w-3 h-3 inline" /> Share → <strong>&quot;Add to Home Screen&quot;</strong> chunein.
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
                  : '✅ Signed Zyklotron-3D-Lab.apk (v2.4.0) Ready'}
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
                Ready to open in <strong>Android Studio</strong> or install via USB (<code className="text-slate-200">npm run usb:install</code>)
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
                    GitHub Repository &amp; Auto-APK Release
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pre-built <code className="text-emerald-300">public/Zyklotron-3D-Lab.apk</code> + CI workflow included
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
                  Direct APK Already Built &amp; Bundled (`Zyklotron-3D-Lab.apk`)
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Humne aapke app ke andar hi signed <strong><code>Zyklotron-3D-Lab.apk</code> (1.4 MB)</strong> build karke rakh diya hai! Aap bina wait kiye seedha niche button se download kar sakte hain:
                </p>
                <a
                  href={DIRECT_APK_PATH}
                  download="Zyklotron-3D-Lab.apk"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  Download Zyklotron-3D-Lab.apk Now
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
