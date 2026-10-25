# ⚛️ Zyklotron Lab — Interactive 3D/2D Cyclotron & Magnetic Field Simulator (Kotlin Android APK + Web PWA)

[![Live Mobile & Web App](https://img.shields.io/badge/Live_App-Open_in_Browser_or_Mobile-06b6d4?style=for-the-badge)](https://ais-pre-zevd3yemylkurl7zcoati2-776106913773.asia-east1.run.app)
[![Download Android APK](https://img.shields.io/badge/Android_APK-Download_from_GitHub_Releases-10b981?style=for-the-badge)](https://github.com/yash-prajapati2602722/Cyclotron-Simulation/releases)
[![GitHub Actions Status](https://img.shields.io/github/actions/workflow/status/yash-prajapati2602722/Cyclotron-Simulation/build-android-apk.yml?style=for-the-badge&label=Kotlin_APK_Build)](https://github.com/yash-prajapati2602722/Cyclotron-Simulation/actions)
[![Physics Reference](https://img.shields.io/badge/Physics-Virtuelle_Experimente-f59e0b?style=for-the-badge)](https://virtuelle-experimente.de/en/b-feld/anwendung/sim-zyklotron.php)

An interactive **3D WebGL & 2D Canvas Physics Simulation + Gamified Resonance Arena** of a Lawrence Cyclotron, Relativistic Synchro-Cyclotron, Bainbridge Mass Spectrometer, and Wien Velocity Filter. Built for physics students and educators based on **[Virtuelle Experimente (`sim-zyklotron.php`)](https://virtuelle-experimente.de/en/b-feld/anwendung/sim-zyklotron.php)** and **Applied Physics Lab Experiment 2.4**.

---

## 🔌 Install on Your Mobile via USB Cable (3 Easy Methods)

### Method A: USB File Transfer (No Developer Tools Needed)
1. Download **`Zyklotron-3D-Lab.apk`** from **[GitHub Releases](https://github.com/yash-prajapati2602722/Cyclotron-Simulation/releases)** (or generate instantly via **[PWABuilder](https://www.pwabuilder.com/reportcard?site=https://ais-pre-zevd3yemylkurl7zcoati2-776106913773.asia-east1.run.app)**).
2. Connect your Android phone to your computer with a **USB cable** and select **"File Transfer / MTP"** on your phone screen.
3. Copy `Zyklotron-3D-Lab.apk` into your phone's **Download** folder, open the **Files** app on your phone, and tap `Zyklotron-3D-Lab.apk` to install!

### Method B: Direct USB Debugging Install (`adb install` / `npm run usb:install`)
1. On your Android phone, enable **Settings → Developer Options → USB Debugging** and connect via USB.
2. Run either command on your computer:
   ```bash
   # If you downloaded Zyklotron-3D-Lab.apk:
   adb install -r Zyklotron-3D-Lab.apk

   # Or build & install directly from source onto your USB-connected phone:
   npm install --legacy-peer-deps
   npm run apk:setup
   npm run usb:install
   ```

### Method C: Open in Android Studio & Click "Run on Device" (`▶`)
1. Clone this repository and run `npm install --legacy-peer-deps && npm run apk:setup`.
2. Open the `./android` folder in **Android Studio** (`MainActivity.kt` with Kotlin 1.9.22 & Android SDK 34).
3. Plug in your phone via USB and click the green **Run (`▶`)** button in Android Studio.

---

## 📱 Use on Mobile Without USB (QR Code / PWA)

1. **Open the Live Link on your phone**:
   👉 **[https://ais-pre-zevd3yemylkurl7zcoati2-776106913773.asia-east1.run.app](https://ais-pre-zevd3yemylkurl7zcoati2-776106913773.asia-east1.run.app)**
2. **Install on Home Screen**:
   - **Android (Chrome / Edge)**: Tap **"Install App"** in the top navigation bar (or browser menu `⋮` → **Add to Home screen / Install app**).
   - **iPhone / iPad (Safari)**: Tap the **Share** button (`↑`) in Safari and select **"Add to Home Screen"**.

---

## ✨ Core Features

- **3D & 2D Cyclotron / Synchro-Cyclotron Simulator (`sim-zyklotron.php`)**: Hollow copper Dees ($D_1, D_2$), 3D magnetic flux vectors ($\vec{B}$), glowing AC electric field lines ($\vec{E}$), inline **`Voltage V`** and **`Magnetic Field B = T`** controls, and **Target Detector (`🎯 TARGET`)** extraction.
- **Native Kotlin + Android SDK (`MainActivity.kt`)**: Hardware-accelerated OpenGL ES 2.0 WebGL rendering, dark system bar theming (`#060B14`), keep-screen-on support, and native Android haptic feedback (`AndroidZyklotronBridge`) on target impact.
- **Resonance Game Arena**: 3 playable physics missions with live RF phase tuning and instant target beam firing.
- **Companion B-Feld Lab**: Bainbridge Mass Spectrometer & Wien Velocity Filter simulations.
- **Experiment 2.4 Lab Manual Workbook**: Embedded 12-page Cyclotron Simulation PDF, pre-filled observation tables, interactive trajectory visualizers, and 13 Viva-Voce Q&As.
