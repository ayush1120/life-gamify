# Life Gamify 🎮✨

Life Gamify is a gamified habit tracking, RPG progression, and AI-driven productivity platform. It turns your daily habits, streaks, and personal achievements into an engaging game world complete with XP levels, attribute mastery, world bosses, and reward stores.

---

## 🏛️ Repository Architecture

The project employs a clean multi-repository architecture where business logic remains in the shared application while thin native shells provide platform-specific capabilities.

```text
LifeGamify Workspace/
├── life-gamify/           # Shared Application (React, TypeScript, Vite, Tailwind, Firebase)
├── life-gamify-ios/       # Native iOS Layer (Swift, SwiftUI, WKWebView, WidgetKit, AppIntents)
└── life-gamify-android/   # Native Android Layer (Kotlin, WebView, AppWidgets, WorkManager)
```

```text
                         ┌─────────────────────────┐
                         │   Shared Application    │
                         │   (React / TypeScript)  │
                         │                         │
                         │ • UI & RPG Game Engine  │
                         │ • XP, Levels, Habits    │
                         │ • Bosses, Streaks, AI   │
                         │ • Firebase Sync         │
                         └────────────┬────────────┘
                                      │
                         Type-Safe Bidirectional Bridge
                         (window.LifeGamify Native SDK)
                                      │
                     ┌────────────────┴────────────────┐
                     ▼                                 ▼
         ┌─────────────────────┐           ┌─────────────────────┐
         │   life-gamify-ios   │           │ life-gamify-android │
         │                     │           │                     │
         │ • SwiftUI WebView   │           │ • Android WebView   │
         │ • WidgetKit Widgets │           │ • AppWidgets        │
         │ • Local Notifs      │           │ • Local Notifs      │
         │ • Siri Shortcuts    │           │ • App Shortcuts     │
         │ • BGTaskScheduler   │           │ • WorkManager Sync  │
         │ • On-Device AI      │           │ • On-Device AI      │
         └─────────────────────┘           └─────────────────────┘
```

---

## 🚀 Quick Start & Unified CLI

All development, builds, testing, and coordination across repositories are managed directly from this repository using simple executable scripts:

### 1. Workspace Diagnostics & Setup
```bash
./setup
```
Verifies Node.js, dependencies, Swift/Xcode CLI, Java, Android SDK, and Gradle wrappers across all three repositories.

### 2. Building
```bash
./build web       # Build production web bundle (dist/)
./build ios       # Synchronize assets and validate iOS native layer
./build android   # Synchronize assets and compile Android layer via Gradle
./build apk       # Compile and generate standalone Android APK at dist/apk/app-debug.apk
./build all       # Build Web, Android APK, and iOS assets in one command
```

### 3. Running & Local Development
```bash
./run web         # Start Vite dev server on http://localhost:5173
./run ios         # Start Vite dev server and open LifeGamify.xcodeproj in Xcode
./run android     # Install and launch debug APK on connected device / emulator
```

### 4. Cleaning
```bash
./clean           # Clean build caches across Web, Android Gradle, and iOS assets
```

---

## 🔌 Bidirectional Native Bridge

The shared application interacts with native platform layers via `src/services/native/bridge.ts` using typed JSON envelopes. In standard web browsers, it provides seamless, non-blocking fallbacks.

- **Widgets**: Synchronizes streak counts, freeze shields, levels, coins, and quick habits with iOS WidgetKit and Android AppWidgets.
- **Notifications**: Schedules local habit reminders, streak freeze alerts, and boss events.
- **Shortcuts & Assistant**: Siri Shortcuts (`AppIntents`) and Android Dynamic Shortcuts (`ShortcutManagerCompat`).
- **Background Tasks**: Periodic background synchronization via `BGTaskScheduler` (iOS) and `WorkManager` (Android).
- **On-Device AI**: Local NLP and prompt generation fallbacks.

---

## 🧪 Testing & Validation

```bash
npm run test       # Run Vitest test suite (106+ unit tests)
npm run build      # Validate TypeScript compilation & Vite bundle
```

---

## 📚 Documentation

- [00. Project Overview](docs/00-project-overview.md)
- [03. Architecture & Data Flow](docs/03-architecture.md)
- [06. Gamification Mechanics](docs/06-gamification.md)
- [12. Karma Ledger & Economy Edge Cases](docs/12-karma-ledger-edge-cases.md)
- [13. Firebase Authentication & Firestore Guide](docs/13-firebase-auth-firestore-guide.md)
- [15. Native Layers, Bridge & Build System](docs/15-native-layers-and-build-system.md)
