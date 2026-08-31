# Life Gamify — Native Layers, Communication & Build System

## 1. Goal

The goal of this project phase is to build and integrate **thin native iOS and Android layers** around the existing shared Life Gamify application.

The primary focus of this work is:

1. Building the native iOS layer
2. Building the native Android layer
3. Establishing clean communication between the shared application and native layers
4. Implementing the required platform-specific capabilities
5. Creating a unified local build/orchestration system
6. Creating scripts that make development and iOS/Android builds fast and low-friction

The native layers should remain **thin**, with business logic kept in the shared application whenever possible.

---

# 2. Repository Architecture

Maintain separate Git repositories for the shared application and native platform layers.

The local workspace already contains:

```text
LifeGamify/
├── <shared/main application repo>
├── life-gamify-ios/
└── life-gamify-android/
```

Existing native repositories:

- `life-gamify-ios`
- `life-gamify-android`

These are already added to the local workspace.

Each repository should remain independently version-controlled.

The parent `LifeGamify` workspace does not need to be a Git repository.

### Important Principle

> **Separate repositories internally, unified development experience locally.**

The separate repositories should not create unnecessary manual work when developing, running, or building the application.

---

# 3. High-Level Architecture

```text
                         ┌─────────────────────────┐
                         │   Shared Application    │
                         │                         │
                         │ • UI                    │
                         │ • Business Logic        │
                         │ • Gamification          │
                         │ • AI                    │
                         │ • Data / State          │
                         │ • Firebase              │
                         └────────────┬────────────┘
                                      │
                              Native Interface
                                  / Bridge
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
        ┌─────────────────────┐             ┌─────────────────────┐
        │   life-gamify-ios   │             │ life-gamify-android │
        │                     │             │                     │
        │ Swift / SwiftUI     │             │ Kotlin              │
        │ iOS APIs            │             │ Android APIs        │
        │ Widgets             │             │ Widgets             │
        │ Notifications       │             │ Notifications       │
        │ Siri                │             │ Assistant            │
        │ Background Tasks    │             │ Background Tasks    │
        │ On-device AI        │             │ On-device AI        │
        └─────────────────────┘             └─────────────────────┘
```

The shared application should communicate with native functionality through clearly defined interfaces rather than directly depending on platform-specific implementation details.

---

# 4. Responsibilities of the Shared Application

The shared application should remain the primary owner of application and product logic.

It should be responsible for:

- Application UI
- User interactions
- Habit/activity logging
- Gamification logic
- XP
- Levels
- Progression
- Quests
- Achievements
- Bosses
- Streaks
- AI orchestration
- User state
- Application state
- Shared business rules
- Firebase persistence
- Firebase synchronization
- AI-generated game entities
- User management of game entities

The shared layer should remain as platform-independent as practical.

---

# 5. Responsibilities of Native Layers

The native layers should remain **thin**.

They should primarily exist to provide functionality that requires direct access to platform APIs.

## iOS Native Layer

Repository:

```text
life-gamify-ios
```

Responsible for capabilities such as:

- iOS Widgets
- iOS Notifications
- Siri / Siri-related integrations
- iOS background tasks
- iOS on-device AI capabilities
- Other iOS-specific APIs when genuinely required

Use Swift / SwiftUI and appropriate Apple frameworks.

## Android Native Layer

Repository:

```text
life-gamify-android
```

Responsible for capabilities such as:

- Android Widgets
- Android Notifications
- Android background tasks
- Android on-device AI capabilities
- Android assistant/platform integrations where appropriate
- Other Android-specific APIs when genuinely required

Use Kotlin and appropriate Android/Jetpack APIs.

---

# 6. Native Capabilities in Current Scope

## Required

| Capability | iOS | Android |
|---|---:|---:|
| Widgets | Yes | Yes |
| Notifications | Yes | Yes |
| Siri / Assistant integration | Yes | Platform equivalent where appropriate |
| On-device AI | Yes | Yes |
| Background tasks | Yes | Yes |

## Explicitly Out of Scope for Now

Do not add these unless requirements change:

- HealthKit
- Google Health Connect
- Health integrations
- General sensor support
- Fitness sensor integrations
- Other unnecessary device sensors
- Other platform-specific features that are not currently required

The goal is to keep the native layer small.

---

# 7. Communication Between Shared and Native Layers

One of the most important goals is establishing **clean communication between the shared application and native layers**.

The shared application should not need to know how iOS or Android implements a capability.

```text
Shared Application
        │
        ▼
Shared Native Interface / Bridge
        │
   ┌────┴────┐
   ▼         ▼
 iOS       Android
Native      Native
Implementation
```

## Communication Requirements

The communication layer should:

- Define explicit interfaces/contracts
- Provide consistent APIs to the shared layer
- Hide platform-specific implementation details
- Support requests from shared → native
- Support results/events from native → shared
- Support asynchronous operations
- Handle errors cleanly
- Handle unsupported capabilities gracefully
- Be extensible
- Avoid unnecessary coupling
- Avoid duplicating business logic

Where practical, the shared interface should expose the same conceptual functionality on both platforms even though the implementation underneath may differ.

---

# 8. Example Communication Model

The shared application should conceptually be able to request functionality such as:

```text
NotificationService.schedule(...)
WidgetService.update(...)
BackgroundTaskService.schedule(...)
AssistantService.register(...)
OnDeviceAIService.generate(...)
```

The exact API and naming should be determined based on the actual shared framework and technology stack.

The important architectural rule is:

> The shared layer should depend on an abstraction/interface, not on Swift/Kotlin implementation details.

For example:

```text
Shared Code
    │
    ▼
Notification Interface
    │
    ├── iOS implementation
    │
    └── Android implementation
```

---

# 9. Data Flow

The architecture should support both directions of communication.

## Shared → Native

Examples:

```text
Shared application
      │
      ├── Schedule notification
      ├── Update widget
      ├── Schedule background task
      ├── Request native AI capability
      └── Configure assistant integration
```

## Native → Shared

Examples:

```text
Native platform
      │
      ├── User interacted with widget
      ├── Notification action occurred
      ├── Background task completed
      ├── Assistant invocation occurred
      └── Native operation returned a result
             │
             ▼
       Shared application
```

Native events should be converted into a shared representation before reaching shared business logic.

---

# 10. Keep Business Logic Out of Native Layers

Avoid duplicating application logic in Swift/Kotlin.

Do not create:

```text
iOS:
    Quest logic
    XP logic
    Achievement logic

Android:
    Quest logic
    XP logic
    Achievement logic

Shared:
    Quest logic
    XP logic
    Achievement logic
```

Prefer:

```text
                  Shared
                    │
             Business Logic
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
        iOS                 Android
     Platform APIs       Platform APIs
```

The native layer should provide platform capabilities, not become another copy of the application.

---

# 11. Unified Local Workspace

Although the repositories remain separate, the local development environment should treat them as one coordinated system.

The workspace should make it easy to:

- Start development
- Run iOS
- Run Android
- Build iOS
- Build Android
- Generate Android APK
- Clean builds
- Perform required synchronization/setup
- Build everything when necessary

The developer should not have to manually coordinate repository-specific commands for normal workflows.

---

# 12. Build & Orchestration Scripts

Create local scripts that coordinate the repositories and build process.

The exact implementation is open, but the desired experience should be approximately:

```bash
./build ios
./build android
./build apk
./build all
```

Useful development commands may also include:

```bash
./run ios
./run android
./clean
./setup
```

The scripts should hide unnecessary implementation details.

For example:

```text
./build android
        │
        ├── Ensure shared code is ready
        ├── Perform required synchronization
        ├── Prepare Android project
        ├── Run incremental Android build
        └── Produce requested output
```

The exact steps should only be performed when necessary.

---

# 13. Build Performance

Build speed is an important architectural requirement.

Because the native layers are thin, most day-to-day development should occur in the shared application.

The desired workflow is:

```text
Shared code change
       │
       ▼
Fast development / hot reload
       │
       ▼
Continue development
```

Native rebuilds should primarily occur when:

- Native code changes
- Native dependencies change
- Native configuration changes
- A native capability is being developed
- A platform build is explicitly requested

Avoid unnecessary:

- Clean builds
- Dependency reinstalls
- Repository synchronization
- Asset copying
- Full native recompilation
- Rebuilding unchanged components

Incremental builds should be preserved wherever possible.

---

# 14. iOS Build Workflow

The local build system should provide a simple way to build/run iOS.

For example:

```bash
./run ios
./build ios
```

The workflow should handle any required coordination between:

```text
Shared Application
        ↓
life-gamify-ios
        ↓
iOS Build
```

The goal is to avoid manually opening multiple repositories and executing several commands just to test an iOS change.

---

# 15. Android Build Workflow

The local build system should provide a simple Android workflow.

For example:

```bash
./run android
./build android
```

APK generation should be straightforward:

```bash
./build apk
```

The workflow should handle:

```text
Shared Application
        ↓
life-gamify-android
        ↓
Android Build
        ↓
APK
```

The exact Gradle/Android tooling should remain an implementation detail behind the build scripts where practical.

---

# 16. Full Build

There should be a way to build all required components:

```bash
./build all
```

Conceptually:

```text
Shared Application
       │
       ├───────────────┐
       ▼               ▼
     iOS             Android
       │               │
       ▼               ▼
   iOS Build       Android Build
                       │
                       ▼
                      APK
```

The full build should not be required for normal development.

It exists primarily for integration testing, release preparation, or validating that all repositories remain compatible.

---

# 17. Developer Experience

The overall system should optimize for:

- Fast feedback
- Minimal commands
- Minimal manual coordination
- Predictable builds
- Clear errors
- Easy onboarding
- Easy debugging
- Easy platform-specific development

The developer should be able to work primarily from the root workspace rather than constantly switching between repositories.

Desired experience:

```text
Open LifeGamify workspace
        ↓
Make changes
        ↓
Run one simple command
        ↓
Test on desired platform
```

---

# 18. Extensibility

The native architecture should make it easy to add additional native capabilities later.

Adding a new capability should ideally involve:

```text
1. Define/update shared interface
        ↓
2. Implement iOS version
        ↓
3. Implement Android version
        ↓
4. Connect implementations
        ↓
5. Test through unified workflow
```

It should not require restructuring the entire application.

---

# 19. Error Handling

Native communication should account for:

- Unsupported platform functionality
- Permission denial
- Native API failures
- Background execution restrictions
- Invalid parameters
- Communication failures
- Version mismatches
- Native dependency problems

Errors should be converted into a representation that the shared layer can understand.

Platform-specific errors should not leak unnecessarily into shared business logic.

---

# 20. Version & Compatibility Management

Because the project uses separate repositories, compatibility between repositories must be considered.

The build system should make it clear which versions/commits of the repositories are being used together.

Avoid a workflow where:

```text
Shared repo updated
        ↓
Native repo unexpectedly breaks
        ↓
Developer manually investigates versions
```

Where practical, workspace/build tooling should make repository compatibility explicit and reproducible.

---

# 21. Security & Secrets

Do not place secrets directly into:

- Source code
- Build scripts
- Git repositories
- Shared/native communication payloads

Platform-specific signing credentials, API keys, and other secrets should use appropriate local/environment/CI mechanisms.

Build scripts should reference configuration rather than embedding secrets.

---

# 22. What Should NOT Happen

Do not:

- Duplicate the entire application in Swift/Kotlin
- Move shared business logic into native code unnecessarily
- Create complicated repository synchronization mechanisms without need
- Require manual file copying during normal development
- Require multiple complicated commands for common builds
- Rebuild everything for every small shared-code change
- Add health/sensor integrations prematurely
- Over-engineer the native communication layer
- Make platform-specific implementation details part of shared business logic

---

# 23. Success Criteria

This phase is successful when:

### Native Layers

- `life-gamify-ios` contains a functional thin iOS native layer.
- `life-gamify-android` contains a functional thin Android native layer.
- Native responsibilities are clearly separated from shared responsibilities.

### Communication

- Shared → iOS communication works.
- Shared → Android communication works.
- Native → shared events/results can be handled.
- Interfaces are explicit and extensible.
- Platform-specific implementation details remain isolated.
- Error handling is defined.

### Native Capabilities

The architecture supports:

- Widgets
- Notifications
- Siri / assistant integration
- On-device AI
- Background tasks

without unnecessarily expanding the native layer.

### Build System

- A unified local workspace exists.
- Build scripts coordinate the repositories.
- iOS can be built through a simple command.
- Android can be built through a simple command.
- Android APK generation is straightforward.
- A full build can be triggered when required.
- Incremental builds are preserved.
- Normal development does not require excessive manual coordination.

### Maintainability

- Shared business logic remains shared.
- Native layers remain thin.
- New native capabilities can be added without major architectural changes.
- The multi-repository structure remains manageable as the project grows.

---

# 24. Final Architectural Principle

> **Keep the application shared, keep the native layers thin, communicate through clean platform-agnostic interfaces, isolate platform-specific APIs inside their respective repositories, and provide a unified scripted workspace that makes the entire multi-repository system feel like one fast application to develop and build.**

The architecture should optimize for:

- Simplicity
- Speed
- Clean separation of responsibilities
- Easy local development
- Fast iOS and Android builds
- Low long-term maintenance overhead
- Extensibility
