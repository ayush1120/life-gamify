# 15. Native Layers, Bridge & Build System

## 1. Overview

Life Gamify uses a thin-shell native architecture. The shared TypeScript/React application owns all UI, business logic, game mechanics, and Firebase synchronization, while thin native shells (`life-gamify-ios` and `life-gamify-android`) provide direct access to device-specific capabilities:

1. **Home Screen Widgets** (iOS WidgetKit, Android AppWidgets)
2. **Local & Push Notifications** (`UNUserNotificationCenter`, Android `NotificationManager`)
3. **Voice & Assistant Shortcuts** (Siri `AppIntents`, Android App Actions / Dynamic Shortcuts)
4. **Background Execution** (iOS `BGTaskScheduler`, Android `WorkManager`)
5. **On-Device AI Fallbacks** (Apple Neural/NLP heuristic fallback, Android local ML)
6. **Haptics & Device Telemetry** (`UIImpactFeedbackGenerator`, Android `Vibrator`)

---

## 2. Multi-Repository Layout

```text
LifeGamify Workspace/
├── life-gamify/           # Shared application & build orchestrator
├── life-gamify-ios/       # iOS Swift / SwiftUI native layer
└── life-gamify-android/   # Android Kotlin native layer
```

---

## 3. Communication Bridge Specification

The communication bridge uses asynchronous JSON message envelopes:

### Shared → Native Request
```typescript
interface NativeRequest<T = any> {
  id: string;              // UUID for correlating responses
  service: 'notifications' | 'widgets' | 'backgroundTasks' | 'assistant' | 'onDeviceAI' | 'device';
  action: string;          // e.g. 'schedule', 'updateData', 'registerShortcuts'
  payload: T;
}
```

### Native → Shared Response
```typescript
interface NativeResponse<T = any> {
  id: string;              // Correlates with request.id
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    unsupported?: boolean;
  };
}
```

### Native → Shared Event (Unsolicited)
```typescript
interface NativeEvent<T = any> {
  type: 'widget_tap' | 'notification_action' | 'shortcut_invoked' | 'background_sync_triggered';
  payload: T;
}
```

### Platform Dispatchers
- **iOS**: Dispatched to `window.webkit.messageHandlers.lifeGamifyBridge.postMessage(json)`.
- **Android**: Dispatched to `window.AndroidLifeGamifyBridge.postMessage(json)`.
- **Web / PWA**: Automatically falls back to Web Notification, LocalStorage, and `navigator.vibrate` without errors.

---

## 4. Widget Data Synchronization

Whenever stats, streaks, or habits update in `AppContext.tsx`, `nativeWidgetService.updateData(...)` pushes the following payload:

```typescript
export interface WidgetDataPayload {
  streak: number;
  availableFreezes: number;
  coinBalance: number;
  level: number;
  xpProgress: number; // 0.0 - 1.0
  activeBoss?: {
    name: string;
    icon: string;
    hp: number;
    maxHp: number;
  };
  quickHabits: HabitWidgetSummary[];
  updatedAt: string; // ISO-8601
}
```

- **iOS**: Stored in `UserDefaults(suiteName: "group.com.lifegamify.app")` and triggers `WidgetCenter.shared.reloadAllTimelines()`.
- **Android**: Stored in `SharedPreferences` and triggers `AppWidgetManager` broadcast updates.

---

## 5. Unified CLI Reference

Located in the root workspace `life-gamify`:

- `./setup`: Validates dependencies and toolchains.
- `./build [ios|android|apk|web|all]`: Runs incremental builds.
- `./run [ios|android|web]`: Launches live dev server and native container.
- `./clean`: Cleans build artifacts and caches.
