# 📱 Lesa.io - Mobile & Android Architecture Plan

> A comprehensive architectural blueprint for porting **Lesa.io** to Android and mobile devices, covering cross-platform engineering, horizontal screen locking, virtual twin-stick controls, and packaging into a native Google Play Store application.

---

## 🏆 1. Single Codebase vs Separate Versions: How Top Studios Do It

### The Industry Standard: **Single Adaptive Codebase**
Top cross-platform studios (such as the teams behind *Vampire Survivors*, *Brotato*, *Survivor.io*, and *Brawl Stars*) **do NOT maintain separate mobile and PC codebases**.

### Why Separate Versions are a Trap:
- **Double Maintenance Burden**: Every bug fix, new hero, new boss, or weapon balance change must be written, tested, and synchronized twice.
- **Save State Incompatibility**: When your game uses Firebase Cloud Save, having two diverging game loops creates desynchronization bugs between PC and mobile saves.
- **Asset Duplication**: Art assets, audio tracks, and animations would bloat repository storage.

### The Professional Solution: **The Adaptive Input & Viewport Layer**
The game engine core (`Game.js`, `WaveManager.js`, `CollisionSystem.js`, `EnemyBase.js`, `Kleanthis.js`) remains **100% identical and shared**. Only the **Input & HUD adapter** changes dynamically based on the device:

```
                  ┌─────────────────────────────────────────┐
                  │          CORE GAME SIMULATION           │
                  │  (WaveManager, Collision, Bosses, HP)   │
                  └────────────────────┬────────────────────┘
                                       │
                  ┌────────────────────┴────────────────────┐
                  │           CANONICAL INPUT BUS           │
                  │   dx, dy, isFiring, isDashing, skills   │
                  └─────────▲─────────────────────▲─────────┘
                            │                     │
          ┌─────────────────┴───────┐   ┌─────────┴───────────────┐
          │     PC INPUT MODULE     │   │   MOBILE TOUCH MODULE   │
          │  WASD + Mouse + Hotkeys │   │ Floating Joystick + Arc │
          └─────────────────────────┘   └─────────────────────────┘
```

When the game boots:
- If `('ontouchstart' in window || navigator.maxTouchPoints > 0)`: Activates the **Mobile Touch Layer** and scales HUD touch targets.
- Otherwise: Keeps standard **Desktop Keyboard & Mouse** listeners active.

---

## 🎮 2. Mobile Controls UX: "How Will They Play?"

Because Lesa.io is an action-packed arena shooter, the control layout must be fluid, responsive, and ergonomic for two thumbs in landscape mode.

### Layout: Ergonomic Twin-Stick & Action Arc
```
┌────────────────────────────────────────────────────────────────────────┐
│ [PAUSE]  HP: 100/100 ═══════                         Wave 3  🪙 1,500  │
│                                                                        │
│                                                                        │
│                                                     (E) ACTIVE SKILL   │
│       ┌────────┐                                       ┌──────────┐    │
│       │   🕹️   │                                       │ ⚡ / 💦  │    │
│       │  MOVE  │                                       │ (Equipped)│   │
│       └────────┘                                       └──────────┘    │
│   (Floating Joystick)                                  ┌──────────┐    │
│   Appears wherever left                                │   DASH   │    │
│   thumb touches screen                                 │  🚀💨    │    │
│                                                        └──────────┘    │
│                                                       (Thumb Resting)  │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Left Thumb: Floating Dynamic Movement Joystick
- **Why Floating?** Fixed joysticks cause thumb fatigue and missed inputs. A **Floating Dynamic Joystick** appears at the exact pixel where the left thumb touches the left half of the screen, tracking relative drag angle and magnitude.
- **Visuals**: Semi-transparent dark circular boundary with a glowing golden inner thumb-knob.
- **Deadzone & Sticky Drag**: 10% inner deadzone to prevent accidental jitter; clamps to outer radius if thumb drags far.

### 2. Right Thumb: Auto-Aim with Optional Drag & Action Buttons
Arena shooters on mobile succeed through smart aim assistance (*Brotato / Survivor.io style*):
- **Auto-Aim Nearest Enemy**: By default, the hero automatically aims and fires at the nearest visible enemy within weapon range.
- **DASH Button (Primary Action)**: Large, prominent circular button positioned right where the right thumb naturally rests, featuring a radial cooldown sweep animation.
- **Equipped SKILL Button (`E`)**: Positioned naturally above the Dash button, showing the icon and cooldown badge of your currently equipped active skill (Blade Rush or Nerobalonaki).
- **Optional Aim Joystick (Settings Toggle)**: Players who prefer manual dual-stick aiming can enable an aiming joystick on the right side.

### 3. Pointer Events (Multi-Touch Safety)
- Implemented strictly using modern **Pointer Events** (`pointerdown`, `pointermove`, `pointerup`) with unique `pointerId` tracking.
- Prevents multi-touch interference so moving, dashing, and casting skills simultaneously never drops an input.
- CSS `touch-action: none` applied to canvas to prevent accidental browser gestures (pinch-zoom, pull-to-refresh).

---

## 🔄 3. Horizontal Screen Locking (Landscape Mode)

Mobile arena shooters are unplayable in portrait because human eyes and thumb reach are optimized for widescreen landscape.

### Layer 1: In the Native Android App (Permanent Lock)
In the native `AndroidManifest.xml` file, the screen orientation is locked at the operating system level:
```xml
<activity
    android:name=".MainActivity"
    android:screenOrientation="sensorLandscape"
    android:configChanges="orientation|keyboardHidden|screenSize">
</activity>
```
*`sensorLandscape` automatically allows the player to flip the phone 180° (to accommodate headphones or charger cables) while strictly forbidding vertical portrait mode.*

### Layer 2: In Mobile Web Browsers (Orientation API + Fullscreen)
When opened in mobile Safari or Chrome:
1. When the player taps **"PLAY"**, trigger:
   ```javascript
   if (document.documentElement.requestFullscreen) {
       await document.documentElement.requestFullscreen();
       if (screen.orientation && screen.orientation.lock) {
           await screen.orientation.lock('landscape').catch(() => {});
       }
   }
   ```
2. **CSS Aesthetic Rotate Fallback**:
   If the user holds the phone vertically, a full-screen comic overlay appears:
   ```
   ┌────────────────────────────────┐
   │                                │
   │             📱 ➔ 📲            │
   │      PLEASE ROTATE YOUR        │
   │      DEVICE TO PLAY! 🔄        │
   │                                │
   │   Lesa.io is built for         │
   │   widescreen landscape action! │
   └────────────────────────────────┘
   ```
   This uses standard CSS `@media (orientation: portrait)` and disappears automatically the moment the phone is turned horizontal.

---

## 📦 4. Turning the Game into a Native Android App (.APK / Google Play)

### The Three Methods Compared:

| Metric | **Capacitor (Recommended)** | **Trusted Web Activity (TWA)** | **Apache Cordova (Legacy)** |
|---|---|---|---|
| **Industry Standing** | Modern Gold Standard (Ionic) | Google PWA wrapper | Deprecated / Outdated |
| **Asset Location** | Bundled inside the APK (100% offline) | Streamed from live web URL | Bundled inside APK |
| **Google Play Billing** | Official `@capacitor-community/in-app-purchases` | Complex Digital Asset Links | Old unmaintained plugins |
| **Performance** | Native Chrome WebLayer (Full 60-120 FPS) | Full Chrome speed | Webview overhead |
| **Offline Play** | ✅ Works 100% without internet | ❌ Requires hosting server | ✅ Offline |
| **Future iOS Port** | ✅ Same project generates Xcode iOS app | ❌ Android only | ✅ Cross-platform |

### Why Capacitor is the Winner:
1. **Zero Rewrite**: It takes your existing `index.html`, `src/`, `styles/`, and `assets/` folders directly.
2. **Offline Local Bundling**: Players can download the `.apk` from Google Play and play instantly on an airplane or without mobile data.
3. **Google Play In-App Purchases**: Easy bridge for Starter Pack (`€0.99`) and Gem packs.
4. **AdMob Integration**: Native interstitial or rewarded video ads ("Watch ad for +50 Gems").

### The 4-Step Packaging Workflow:
```bash
# 1. Initialize Capacitor in the project
npx @capacitor/cli create

# 2. Add Android native platform
npm install @capacitor/android
npx cap add android

# 3. Copy web game assets into Android project
npx cap copy

# 4. Open in Android Studio & Build APK / AAB
npx cap open android
# Inside Android Studio: Build -> Generate Signed Bundle / APK
```

---

## 📐 5. Mobile UI & Safe-Area Scaling

1. **Notch & Dynamic Island Insets**:
   Phones have camera cutouts and curved corners. We apply CSS environment variables:
   ```css
   body {
       padding-left: env(safe-area-inset-left, 0px);
       padding-right: env(safe-area-inset-right, 0px);
   }
   ```
2. **Touch-Friendly UI Scale**:
   - Menu buttons, close `✕` buttons, and tabs scaled up by **1.25x–1.35x** on mobile screens for thumb accessibility.
   - Modals centered with 92% maximum viewport width.

---

## 🗓️ 6. Phased Implementation Roadmap

When you are ready to begin implementation, we can proceed systematically:

- [ ] **Phase 1: Responsive Landscape Engine & CSS Rotate Guard**
  - Add `@media (orientation: portrait)` rotate prompt screen.
  - Add full-screen viewport scaling and safe-area notch insets.
- [ ] **Phase 2: Mobile Touch Subsystem (`src/engine/TouchInput.js`)**
  - Create floating movement joystick for left thumb.
  - Create prominent Dash and Skill (`Q`/`E`) action buttons for right thumb.
  - Add nearest-enemy auto-targeting for fluid mobile shooting.
- [ ] **Phase 3: Capacitor Android Wrapper & Local APK Build**
  - Setup Capacitor configuration file (`capacitor.config.json`).
  - Lock orientation to `sensorLandscape` in `AndroidManifest.xml`.
  - Build test `.apk` file for Android installation.
