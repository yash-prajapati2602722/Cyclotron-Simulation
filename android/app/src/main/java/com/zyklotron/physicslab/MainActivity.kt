package com.zyklotron.physicslab

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

/**
 * Native Kotlin + Android SDK Activity for Zyklotron 3D Lab.
 * Configures hardware-accelerated WebGL for the 3D Synchro-Cyclotron,
 * dark laboratory system bars (#060B14), keep-screen-on during active runs,
 * and exposes `window.AndroidZyklotronBridge` for native Android haptics.
 */
class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Enable hardware acceleration and keep screen awake during cyclotron experiments
        window.addFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Configure dark laboratory status bar and navigation bar (#060B14)
        val labDarkColor = Color.parseColor("#060B14")
        window.statusBarColor = labDarkColor
        window.navigationBarColor = labDarkColor
        WindowCompat.getInsetsController(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }

        // Enhance WebView for high-FPS 3D Three.js WebGL & offline Lab Manual PDF
        bridge?.webView?.let { webView ->
            webView.settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                mediaPlaybackRequiresUserGesture = false
                cacheMode = WebSettings.LOAD_DEFAULT
                allowFileAccess = true
                allowContentAccess = true
            }
            webView.addJavascriptInterface(NativePhysicsBridge(), "AndroidZyklotronBridge")
        }
    }

    inner class NativePhysicsBridge {
        @JavascriptInterface
        fun triggerTargetHitHaptic() {
            runOnUiThread {
                bridge?.webView?.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
                try {
                    val vibrator = getSystemService(VIBRATOR_SERVICE) as? Vibrator
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vibrator?.vibrate(
                            VibrationEffect.createOneShot(45, VibrationEffect.DEFAULT_AMPLITUDE)
                        )
                    } else {
                        @Suppress("DEPRECATION")
                        vibrator?.vibrate(45)
                    }
                } catch (_: Exception) {
                    // Ignore if device lacks vibrator hardware
                }
            }
        }

        @JavascriptInterface
        fun getPlatformInfo(): String {
            return "Android ${Build.VERSION.RELEASE} (SDK ${Build.VERSION.SDK_INT}) - ${Build.MANUFACTURER} ${Build.MODEL}"
        }
    }
}
