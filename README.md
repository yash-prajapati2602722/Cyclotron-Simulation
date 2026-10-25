# ⚛️ Zyklotron Lab — Interactive 3D/2D Cyclotron & Magnetic Field Simulator (Android APK + Web PWA)

[![Live Mobile & Web App](https://img.shields.io/badge/Live_App-Open_in_Browser_or_Mobile-06b6d4?style=for-the-badge)](https://ais-pre-zevd3yemylkurl7zcoati2-776106913773.asia-east1.run.app)
[![Android APK Workflow](https://img.shields.io/badge/Android_APK-Auto_Build_via_GitHub_Actions-10b981?style=for-the-badge)](#-download--build-android-apk-zyklotron-3d-labapk)
[![Physics Reference](https://img.shields.io/badge/Physics-Virtuelle_Experimente-f59e0b?style=for-the-badge)](https://virtuelle-experimente.de/en/b-feld/anwendung/sim-zyklotron.php)

An interactive **3D WebGL & 2D Canvas Physics Simulation + Gamified Resonance Arena** of a Lawrence Cyclotron, Relativistic Synchro-Cyclotron, Bainbridge Mass Spectrometer, and Wien Velocity Filter. Built for physics students and educators based on **[Virtuelle Experimente (`sim-zyklotron.php`)](https://virtuelle-experimente.de/en/b-feld/anwendung/sim-zyklotron.php)** and **Applied Physics Lab Experiment 2.4**.

---

## 📦 Download & Build Android APK (`Zyklotron-3D-Lab.apk`)

This repository includes a pre-configured **Capacitor Android project (`capacitor.config.json`)** and an automated **GitHub Actions APK Builder (`.github/workflows/build-android-apk.yml`)**.

### Method 1: Automatic `.apk` Build on GitHub (Recommended — Zero Local Setup)
1. Click the **GitHub icon ("Save to GitHub")** in the top-right corner of Google AI Studio to push this project to your GitHub account.
2. Open your new repository on GitHub and click the **Actions** tab (or **Releases** on the right sidebar).
3. The workflow **`Build Android APK (Zyklotron 3D Lab)`** automatically compiles the app and publishes **`Zyklotron-3D-Lab.apk`** in:
   - **GitHub Releases** (right sidebar of your repo → download `Zyklotron-3D-Lab.apk` directly on your phone)
   - **GitHub Actions Artifacts** (`Zyklotron-3D-Lab-APK.zip`)

### Method 2: Instant 1-Click APK Package via PWABuilder
1. Open **[PWABuilder APK Generator](https://www.pwabuilder.com/reportcard?site=https://ais-pre-zevd3yemylkurl7zcoati2-776106913773.asia-east1.run.app)**.
2. Click **"Package for Stores" → "Android" → "Download Package"** to get a signed `.apk` in 30 seconds.

### Method 3: Build `.apk` Locally via Android Studio / Gradle
```bash
npm install
npm run apk:setup
npm run apk:build
# Output APK: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📱 Use on Mobile Immediately (Android & iPhone PWA)

1. **Open the Live Link on your phone**:
   👉 **[https://ais-pre-zevd3yemylkurl7zcoati2-776106913773.asia-east1.run.app](https://ais-pre-zevd3yemylkurl7zcoati2-776106913773.asia-east1.run.app)**
   *(Or click the **"📱 Mobile / APK"** button in the top bar of the app to scan the QR code with your phone camera!)*
2. **Install on Home Screen**:
   - **Android (Chrome / Edge)**: Tap **"Install App"** in the top navigation bar (or browser menu `⋮` → **Add to Home screen / Install app**).
   - **iPhone / iPad (Safari)**: Tap the **Share** button (`↑`) in Safari and select **"Add to Home Screen"**.

---

## ✨ Core Features

### 1. 🌀 3D & 2D Cyclotron / Synchro-Cyclotron Simulator (`sim-zyklotron.php`)
- **Interactive 3D WebGL Chamber**: Inspect the hollow copper **Dee electrodes ($D_1, D_2$)**, North/South electromagnet pole yokes, 3D magnetic flux vectors ($\vec{B}$), glowing AC electric field lines ($\vec{E}$ across the accelerating gap), electrostatic deflector channel, and **Target Detector Box (`🎯 TARGET`)**.
- **Direct `V` and `B = T` Control Bar**: Adjust Acceleration Voltage $V$ (`500 V – 250,000 V`) and Magnetic Flux Density $B$ (`0.05 T – 2.50 T`) directly below the simulation canvas with sliders, numeric inputs, `-`/`+` buttons, and 1-click presets.
- **Target Extraction (`Fire to Target`)**: Watch the accelerated ion spiral outward to $R_{\text{max}}$, enter the deflector channel, and strike the Target Detector with a visual shockwave and telemetry readout.
- **Classical vs. Relativistic Synchro-Cyclotron Modes**:
  - Toggle relativistic mass dilation $\gamma = \frac{1}{\sqrt{1 - (v/c)^2}}$ to observe phase lag in a fixed-frequency classical cyclotron.
  - Enable **Synchro-Cyclotron ($f_{RF}/\gamma$)** mode to automatically modulate the oscillator frequency in lockstep with the relativistic Larmor frequency.

### 2. 🎮 Resonance Game Arena (2D & 3D Interactive Physics Game)
- **3 Progressive Physics Missions**:
  - **Level 1**: *Proton Isotope Calibration* (Classic Resonance Lock)
  - **Level 2**: *High-Field Alpha Injection* (Manual polarity flips + RF phase tuning)
  - **Level 3**: *Relativistic Synchro-Challenge* (Live frequency tracking under Lorentz $\gamma$ dilation)
- **Instant Target Extraction**: Build beam energy or press **🎯 FIRE BEAM AT TARGET NOW** to deflect the ion beam into the target detector and score mission combos.

### 3. 🧲 Companion B-Feld Lab (`virtuelle-experimente.de`)
- **Bainbridge Mass Spectrometer (`sim-massenspektrometer.php`)**: Compare semi-circular separation radii $r = \frac{mv_0}{qB_2}$ and detector spacing $\Delta d = 2\Delta r$ for $^{1}\text{H}^+$, $^{2}\text{H}^+$, $^{4}\text{He}^{2+}$, $^{12}\text{C}^+$, $^{14}\text{C}^+$, $^{16}\text{O}^+$, and $^{20}\text{Ne}^+$.
- **Wien Velocity Filter**: Balance electric force $F_E = qE$ and magnetic Lorentz force $F_B = qvB$ to isolate ions at pass velocity $v_{\text{pass}} = E/B$.

### 4. 📘 Experiment 2.4 Lab Manual Workbook & Embedded PDF
- Includes the complete 12-page **Cyclotron Simulation Lab Manual PDF** with inline viewer, downloadable PDF, pre-filled observation tables (**Tables 2.4.1(a,b,c)** and **Tables 2.4.2.1 & 2.4.2.2**), interactive trajectory visualizers at $V = 4000\text{ V}, B = 0.1\text{ T}$, and all **13 Sample Viva-Voce Questions & Answers**.

---

## 📐 Fundamental Physics Equations

| Quantity | Formula | Description |
| :--- | :--- | :--- |
| **Cyclotron (Larmor) Frequency** | $$f_c = \frac{qB}{2\pi \gamma m_0}$$ | Independent of radius $r$ in the non-relativistic regime ($\gamma \approx 1$) |
| **Trajectory Radius** | $$R = \frac{\gamma m_0 v}{qB}$$ | Semi-circular orbit radius inside each magnetic Dee |
| **Kinetic Energy per Gap Crossing** | $$\Delta E_k = q V_0 \cos(\phi)$$ | Energy gained each time the ion crosses the gap between $D_1$ and $D_2$ |
| **Maximum Extraction Energy** | $$E_{\text{max}} = \frac{q^2 B^2 R_{\text{max}}^2}{2m_0}$$ | Final kinetic energy at extraction radius $R_{\text{max}}$ |
| **Number of Revolutions** | $$N = \frac{E_{\text{max}}}{2 q V_0} = \frac{q B^2 R_{\text{max}}^2}{4 m_0 V_0}$$ | Total full turns before entering the deflector channel |
