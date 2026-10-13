# Life Gamify — Goals Feature
## Product Requirements, UX Specification, Domain Model, Persistence, and Implementation Plan

**Status:** Implemented (Released)  
**Scope:** Shared Life Gamify application (`React + TypeScript + Vite`)  
**Feature:** Goals — a first-class entity separate from Habits, Quests, and Bosses  
**Primary persistence requirement:** Goals and their related data must be durably persisted to Firebase Firestore using the same authenticated, user-scoped persistence and synchronization patterns as existing entities such as Habits.

---

## 1. Executive summary

Introduce **Goals** as a first-class feature in Life Gamify. A Goal represents an outcome the user wants to achieve. Unlike a Habit, which represents a recurring activity, a Goal focuses on an intended result and may be pursued through any combination of activities.

Examples:

- Learn biology fundamentals.
- Read 20 books.
- Run a 10K.
- Complete a research project.
- Save ₹50,000.
- Learn to play 10 piano songs.
- Build a personal website.
- Explore a new field without setting a deadline.

Goals must be flexible. A user should be able to create a Goal using only a title. A deadline, milestones, and progress tracking are all optional. When progress tracking is enabled, users can choose a supported metric type and customize its label and unit.

Goals will have a dedicated destination in the primary bottom navigation. To make room, **Habits** and **Adventure** will move into **More Options**.

The feature must follow Life Gamify's existing architecture: shared TypeScript domain logic, the current persistence abstraction, Firebase Firestore synchronization, and the existing user-scoped security model. Goals must not be implemented as a client-only feature or saved only in transient React state/local storage. Local/offline behavior may follow the app's established strategy, but Firebase persistence and subsequent synchronization are required.

## 2. Repository and architecture context

The specification is based on the repository notes available during planning:

- Main repository: `https://github.com/ayush1120/life-gamify`
- Main app: React, TypeScript, Vite, and Tailwind CSS.
- The shared application owns UI, domain logic, gamification rules, and persistence/synchronization.
- Firebase Authentication and Firestore are documented for cloud persistence, with user data isolated under `users/{userId}/...`.
- The project also has thin native iOS and Android layers. Keep business logic in the shared application unless a native integration explicitly requires changes.
- Existing entities include Habits/activities, activity/reward logs, reward redemptions, settings, and RPG entities such as quests, achievements, and bosses.
- Existing engineering notes favor deterministic domain services, typed contracts, and regression testing.

**Important implementation caveat:** Some repository documents describe earlier storage layouts. Before changing code, inspect the current implementations of Habit persistence, Firebase initialization, repositories/adapters, user identity, offline/local storage, synchronization, and deletion. Reuse the current code paths and conventions instead of copying an older document's schema verbatim.

## 3. Product goals

### 3.1 Goals of the feature

1. Let users define outcomes they want to achieve.
2. Support goals with or without deadlines.
3. Support goals with zero or more user-defined milestones.
4. Support goals with or without a measurable progress metric.
5. Start with three metric types: **count**, **duration**, and **frequency**.
6. Allow custom metric labels and supported units without requiring arbitrary user-defined schemas.
7. Make progress easy to update and understand.
8. Persist Goals and their changes to Firebase reliably, scoped to the authenticated user.
9. Preserve existing Habit, Adventure, Quest, Boss, XP, coin, streak, and reward behavior.
10. Keep data entry lightweight and the interface mobile-first.

### 3.2 Non-goals for the MVP

- AI-generated goals or milestones.
- Automatically converting a Goal into a Habit, Quest, or Boss.
- Arbitrary user-programmed metric types or formulas.
- Goal dependencies or nested goals.
- Shared/collaborative goals.
- Complex forecasting or analytics.
- Automatic coin/XP awards for every Goal or milestone.
- Native platform-specific implementations unless needed by existing navigation or bridge contracts.

## 4. Core product principles

1. **A title is enough.** The minimum viable Goal requires only a title.
2. **Everything else is optional.** Deadline, description, milestones, icon, color, and progress tracking are optional.
3. **Goals are independent entities.** They are not aliases for Habits, Quests, or Bosses.
4. **Progress has explicit semantics.** The metric type defines how values are interpreted.
5. **Persistence is a product requirement.** A successful UI interaction is not sufficient unless the change is saved through the persistence layer and synced to Firebase according to the app's established behavior.
6. **The app owns business rules.** React components and AI agents must not bypass domain validation or write around repository/service abstractions.
7. **Historical information should be preserved where appropriate.** Archiving should not erase a Goal; deleting should follow established app deletion and synchronization behavior.
8. **Backward compatibility matters.** Existing users' data and existing features must continue to work.

---

## 5. User stories

### Goal creation and editing

- As a user, I can create a Goal by entering only its title.
- As a user, I can add a description to explain what success means.
- As a user, I can choose a deadline or leave it unset.
- As a user, I can configure milestones or leave them out.
- As a user, I can enable progress tracking or leave it out.
- As a user, I can edit a Goal without losing its progress or milestone history.
- As a user, I can archive a Goal I no longer want in my active list.
- As a user, I can delete a Goal and have the deletion persist across reloads and devices.

### Progress tracking

- As a user, I can choose count, duration, or frequency.
- As a user, I can give the metric a meaningful custom label.
- As a user, I can select or enter an appropriate unit where supported.
- As a user, I can update the current progress value.
- As a user, I can see the current value and target when a target exists.
- As a user, I can track progress without a target when I only want to record a value.
- As a user, I can correct a mistaken progress update.

### Milestones and lifecycle

- As a user, I can add, edit, reorder, complete, reopen, and delete milestones.
- As a user, I can manually mark a Goal complete.
- As a user, I can distinguish active, completed, and archived Goals.
- As a user, I can reopen a completed Goal if the product's lifecycle rules permit it.

### Navigation and persistence

- As a user, I can open Goals directly from the bottom navigation.
- As a user, I can still access Habits and Adventure through More Options.
- As a user, I expect Goal changes to remain after refreshing or reopening the app.
- As a user, I expect Goal data to sync to my authenticated Firebase account and be isolated from other users' data.

---

## 6. Functional specification

### 6.1 Goal properties

Every Goal must have:

| Property | Required? | Description |
|---|---:|---|
| `id` | Yes | Stable unique identifier |
| `title` | Yes | Goal name; non-empty after trimming |
| `status` | Yes | `active`, `completed`, or `archived` |
| `createdAt` | Yes | Creation timestamp |
| `updatedAt` | Yes | Last modification timestamp |

Optional properties:

| Property | Required? | Description |
|---|---:|---|
| `description` | No | Additional context or definition of success |
| `startDate` | No | Intended start date |
| `deadline` | No | Target completion date |
| `icon` | No | Emoji or supported icon identifier |
| `color` | No | Visual accent |
| `milestones` | No | Zero or more milestone records |
| `progressConfig` | No | Metric configuration |
| `currentProgress` | No | Current value for configured metric |
| `targetProgress` | No | Optional target value |
| `completedAt` | No | Completion timestamp |
| `archivedAt` | No | Archive timestamp, if consistent with existing conventions |

These are conceptual names. Align the final TypeScript model with existing repository naming, timestamp, ID, and serialization conventions.

### 6.2 Title and description

- The title is the only required user-entered field.
- Trim leading/trailing whitespace.
- Reject an empty title.
- Apply a reasonable length limit consistent with existing forms.
- Description is optional and may be multiline.
- Editing title or description must not reset progress, milestones, deadline, or status.

### 6.3 Deadline behavior

A Goal can be:

- **Undated:** no deadline.
- **Dated:** has a target completion date.

When dated, the UI may show the date, time remaining, or overdue status.

Rules:

- Undated Goals must never be displayed as overdue.
- Removing a deadline must not affect progress or milestone completion.
- Changing a deadline must not reset progress.
- Date-only deadlines should be interpreted consistently in the user's local calendar and serialized using established app conventions.
- Completed Goals should not continue to display as overdue.
- The app should avoid timezone-related date shifts when storing date-only values.

A start date is optional and should only be implemented if it has a meaningful UI or domain use. Do not require it simply because a deadline exists.

### 6.4 Milestones

A Goal may have no milestones, one milestone, or many milestones.

Conceptual milestone model:

- `id`: stable unique ID.
- `title`: required non-empty title.
- `description`: optional.
- `isCompleted`: boolean.
- `order`: ordering value or position.
- `createdAt`: creation timestamp.
- `updatedAt`: modification timestamp.
- `completedAt`: optional timestamp.

Supported operations:

- Add milestone.
- Edit title and description.
- Reorder milestones.
- Mark complete.
- Reopen/uncomplete.
- Delete milestone.

Rules:

- Milestones belong to one Goal.
- Deleting a milestone must not delete its parent Goal.
- Reordering should persist.
- Toggling completion should update the relevant timestamps according to repository conventions.
- All milestone operations must be persisted through the Goal data layer.
- A Goal may have milestones without any progress metric.
- A Goal may have a progress metric without milestones.
- Having both is valid.
- Completing every milestone does **not** automatically complete the Goal in the MVP. A future explicit setting could add this behavior.

For the MVP, milestones are manually managed. Do not automatically infer milestone completion from metric thresholds.

### 6.5 Optional progress tracking

Progress tracking is disabled by default and can be enabled during creation or later in the Goal editor.

When enabled, configure:

- Metric type.
- Metric label/name.
- Optional unit.
- Current value.
- Optional target value.
- Period configuration when required by the metric type.

A Goal with no metric should not display a fake progress bar, `0%`, or a made-up target. The interface should instead emphasize its title, description, deadline (if any), and milestones (if any).

#### Metric type A: Count

Used for quantities that accumulate.

Examples:

- Read 20 books: `7 / 20 books`.
- Learn 10 songs: `3 / 10 songs`.
- Complete 50 lessons: `18 / 50 lessons`.
- Review research papers: `12 papers`, with no target if desired.

Configuration:

- Label, e.g. `Books read`.
- Optional unit, e.g. `books`.
- Current numeric value.
- Optional target numeric value.

Rules:

- Values must be numeric and non-negative.
- Use integer values by default for discrete quantities. If the app intentionally supports fractional counts, define that consistently.
- If a target exists and is greater than zero, display percentage and remaining amount.
- A current value greater than the target is valid; cap only the displayed percentage at 100%.
- If no target exists, show the current value without a completion percentage.

#### Metric type B: Duration

Used to track accumulated time.

Examples:

- Study biology for 100 hours: `24 / 100 hours`.
- Practice piano for 30 hours: `12.5 / 30 hours`.
- Record research time without a target.

Configuration:

- Label, e.g. `Biology study`.
- Display unit, e.g. minutes or hours.
- Current accumulated duration.
- Optional target duration.

Implementation rules:

- Store duration in a canonical integer unit (preferably seconds or milliseconds) to avoid floating-point accumulation errors.
- Convert values for display and input.
- Validate that duration cannot be negative.
- Define the precision allowed when users enter decimal hours or minutes.
- Do not require a timer in the MVP; manual duration updates are sufficient unless an existing timer mechanism can be reused cleanly.
- If no target exists, show the accumulated duration without a percentage.

#### Metric type C: Frequency

Used to count occurrences within a defined period.

Examples:

- Research three times per week.
- Practice piano five times per week.
- Attend four sessions per month.

Configuration:

- Label, e.g. `Research sessions`.
- Optional unit, e.g. `sessions`.
- Target occurrence count for the period.
- Period: daily, weekly, or monthly.
- Current occurrence count for the active period.

Important semantic decision:

Frequency measures occurrences within a period; it is not a Habit schedule and does not create a Habit automatically.

MVP behavior:

- Allow a user to record an occurrence.
- Display the count for the current period against the target.
- Define period boundaries using the user's configured/local calendar conventions and use the same logic throughout the application.
- Ensure a period rollover does not accidentally erase historical data if history is retained.
- Do not apply Habit streaks, Habit reward limits, or Habit XP/coin logic.
- If historical period tracking is too large for the initial scope, explicitly document that only the current period is displayed and keep the data model extensible for future history. Do not silently claim to support historical charts without storing the necessary data.

#### Custom labels and units

Users should be able to name a metric in their own terms, for example:

- Papers reviewed.
- Experiments completed.
- Kilometers covered.
- Money saved.
- Lessons completed.

The underlying type still comes from the supported types. Custom labels and units do not imply arbitrary formulas, code, or data schemas.

For count and duration, units should be free-form or selected from sensible presets according to the current design system. For frequency, the period is a structured value (`daily`, `weekly`, or `monthly`) and must not be confused with the display unit.

### 6.6 Progress update operations

The Goal detail screen should support:

- **Set value:** replace the current value.
- **Increment:** add a quantity or record another occurrence.
- **Decrement/correct:** reduce or correct a value when valid for the metric type.

The UI should keep the common action low-friction. For example, frequency metrics should have a clear “Log occurrence” action; count metrics may expose `+1` and an editable value; duration may offer a numeric input.

Validation:

- Reject NaN, infinity, malformed values, and negative values.
- Apply integer constraints where required.
- Validate the metric configuration and target.
- A target of zero must not cause division-by-zero or invalid percentage calculations. Prefer requiring positive targets when a target is enabled.
- Preserve a current value that exceeds its target; do not silently clamp persisted data.
- Update `updatedAt` after successful mutation.

A progress update is only successful when the app's persistence service accepts it. Do not show a permanent success state before a failed write is handled. Follow the app's existing optimistic-update and rollback/error conventions.

### 6.7 Completion, reopening, archiving, and deletion

Goal lifecycle:

- `active`: the Goal is being pursued.
- `completed`: the user considers the outcome achieved.
- `archived`: the Goal is no longer active but should remain available for reference.

Recommended MVP rules:

- The user can manually mark a Goal complete.
- If a numeric target is reached, the UI may prompt the user to mark it complete.
- Do not automatically complete all Goals solely because their metric reaches a target.
- Marking complete sets `completedAt`.
- Reopening clears or updates completion metadata according to existing lifecycle conventions.
- Archiving preserves Goal data and its milestones.
- Deleting removes the Goal according to existing app deletion conventions and ensures related data is not left orphaned.
- Confirm destructive actions where consistent with the existing UI.
- Status transitions must persist and synchronize.

Whether completed Goals can be reopened should follow a consistent product rule; recommended behavior is to allow reopening from the Goal detail page.

---

## 7. UX and interface specification

### 7.1 Navigation change

Add **Goals** as a permanent bottom-navigation destination.

Move the existing **Habits** and **Adventure** destinations into **More Options**.

Requirements:

- Goals is directly accessible from the primary navigation.
- Habits remains easy to discover in More Options.
- Adventure remains easy to discover in More Options.
- More Options clearly labels both destinations.
- Update active navigation states, icons, accessibility labels, and responsive/mobile behavior.
- Preserve route handling and any deep links or internal links that point to Habits or Adventure.
- Avoid duplicate navigation entries.
- Confirm the bottom bar fits the narrowest supported mobile viewport and safe areas.
- Check PWA and native WebView behavior.

Do not arbitrarily redesign unrelated bottom-bar destinations; follow the current navigation structure and visual conventions.

### 7.2 Goals overview page

The overview should support these conceptual sections:

1. **Header:** `Goals`, plus a concise subtitle if appropriate.
2. **Primary action:** `Create Goal`.
3. **Active Goals:** default section/list.
4. **Completed Goals:** accessible via a tab, filter, or collapsible section.
5. **Archived Goals:** accessible without cluttering the default active view.
6. **Empty state:** explains the feature and offers a create action.

A Goal summary card may show:

- Title.
- Optional icon/accent.
- Deadline or time remaining, if set.
- Progress bar and current/target values, if configured.
- Milestone completion summary, if milestones exist.
- Status.
- A clear path to Goal details.

Do not display empty placeholders for optional properties. A title-only Goal should still look intentional and complete.

Avoid excessive card density. Prioritize readable text, visible progress when relevant, and easy access to the main action.

### 7.3 Create/edit flow

Required field:

- Title.

Optional sections:

- Description.
- Deadline.
- Milestones.
- Progress tracking.

Recommended flow:

1. Enter the title.
2. Optionally add a description.
3. Optionally set a deadline.
4. Optionally add milestones.
5. Optionally enable progress tracking and choose a metric type.
6. Save.

The UI may use collapsible or progressive sections so the basic form remains short. Avoid forcing users through multiple screens if a compact form is sufficient.

Editing an existing Goal must prepopulate all configured fields. Saving changes to one section must not unintentionally clear other optional sections.

### 7.4 Metric configuration UI

When progress tracking is enabled:

1. Choose `Count`, `Duration`, or `Frequency`.
2. Enter a custom label.
3. Choose/enter the supported unit when applicable.
4. Set an optional target.
5. Configure the period for frequency.
6. Set the initial current value if useful.

Switching metric types requires care. If the user changes the type after recording progress, do not silently reinterpret an old value under the new type. Warn the user or require an explicit reset/reconfiguration. The final behavior should be documented and tested.

### 7.5 Goal detail page

Display only relevant sections:

- Goal title and description.
- Status and lifecycle actions.
- Deadline and time remaining, if configured.
- Progress and target, if configured.
- Milestones, if configured.
- Progress update controls, if tracking is enabled.
- Edit, complete/reopen, archive, and delete actions.

For a Goal without a metric, do not show a zero-value chart or progress bar. For a Goal without milestones, do not show an empty milestone panel unless it provides a useful “Add milestone” affordance.

### 7.6 Accessibility and interaction quality

- Use clear labels and accessible button names.
- Do not rely on color alone to communicate completion or overdue state.
- Ensure keyboard focus and touch targets are usable.
- Provide clear validation messages.
- Handle loading, saving, offline, and error states.
- Prevent accidental duplicate submissions.
- Respect the existing theme system and light/dark modes.
- Test the mobile viewport and bottom safe-area behavior.

---

## 8. Domain model and TypeScript contracts

The exact shape must follow current repository conventions, but a conceptual type design is:

```ts
type GoalStatus = 'active' | 'completed' | 'archived';

type GoalMetricType = 'count' | 'duration' | 'frequency';

type GoalFrequencyPeriod = 'daily' | 'weekly' | 'monthly';

interface GoalProgressConfig {
  type: GoalMetricType;
  label: string;
  unit?: string;
  targetValue?: number;
  period?: GoalFrequencyPeriod; // Required for frequency
}

interface GoalMilestone {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  status: GoalStatus;
  startDate?: string;
  deadline?: string;
  icon?: string;
  color?: string;
  progressConfig?: GoalProgressConfig;
  currentProgress?: number;
  milestones?: GoalMilestone[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  archivedAt?: string;
}
```

### Model notes

- `progressConfig` absent means progress tracking is disabled.
- `currentProgress` should only be meaningful when `progressConfig` exists.
- The target belongs in one canonical location; avoid duplicating `targetProgress` if `progressConfig.targetValue` is the canonical source.
- Duration values should use a canonical integer unit. The example type above is conceptual; consider a clearly named internal field such as `currentDurationSeconds` or use a normalized metric-value abstraction.
- Frequency tracking may require period-specific records rather than a single `currentProgress` value. If so, use a separate progress-entry/period model. Do not use a single counter that resets without preserving history if historical behavior is required.
- Use the project's actual timestamp convention. Do not mix Firestore `Timestamp`, ISO strings, and JavaScript `Date` objects without a deliberate serialization boundary.
- Prefer stable IDs for Goals and milestones.
- Keep validation functions centralized and unit-tested.
- Consider schema/version metadata only if it matches current repository migration practices.

### Recommended refinement for frequency

A single `currentProgress` field cannot represent durable history for multiple weeks/months. If the MVP needs correct period rollover and history, use a period-scoped record, conceptually:

```ts
interface GoalProgressPeriod {
  id: string;
  goalId: string;
  period: 'daily' | 'weekly' | 'monthly';
  periodStart: string; // canonical date/key for the period
  value: number;
  updatedAt: string;
}
```

This could be stored as a subcollection or represented by an existing repository's preferred data pattern. Confirm whether historical period records are in MVP scope before selecting the final schema.

---

## 9. Critical persistence and Firebase requirements

**This section is mandatory for implementation. Goals must be persisted to Firebase in the same first-class way as existing entities such as Habits.**

A Goal feature that appears to work in React but loses data after refresh, sign-in, or use on another device is not complete.

### 9.1 Follow the existing persistence architecture

Before coding, inspect the current implementations for:

- Habit/Activity model and CRUD services.
- Local/offline storage adapter.
- Firebase initialization and configuration.
- Authentication/session resolution.
- Firestore collection paths.
- Data serialization and deserialization.
- Sync and conflict behavior.
- Error handling and optimistic updates.
- Delete/soft-delete behavior.
- Any existing repository interfaces or data-access abstractions.

Implement Goal persistence through the same established application service/repository path. Do not introduce a parallel Firebase client, hardcode user IDs, or write directly from presentation components if existing entities use a service abstraction.

### 9.2 Firebase Firestore storage

The current repository documentation describes user-scoped data under:

```text
users/{userId}/
```

Goals must be stored under the authenticated user's scope, following the existing collection conventions. A possible collection is:

```text
users/{userId}/goals/{goalId}
```

This is a proposed path, not permission to ignore a different canonical path already used by the live implementation.

If milestones are embedded in the Goal document, save them as part of the Goal data and validate Firestore document-size considerations. If milestones or progress history are stored separately, use user/goal-scoped subcollections or the established relational pattern. Select one canonical model and document it.

Potential layout:

```text
users/{userId}/
  goals/{goalId}
    id
    title
    description?
    status
    startDate?
    deadline?
    progressConfig?
    currentProgress?
    createdAt
    updatedAt
    completedAt?
    archivedAt?

    milestones/{milestoneId}       # only if normalized separately
    progressPeriods/{periodId}    # if period-specific history is supported
```

Do not create redundant copies of the same entity in multiple collections unless required by an existing sync/indexing design.

### 9.3 Authentication and user isolation

- Resolve the user identity from the existing Firebase Authentication/session mechanism.
- Never trust a client-supplied `userId` as authorization.
- All Goal reads and writes must be scoped to the current authenticated user.
- Follow the current Firestore Security Rules pattern, documented as `request.auth != null && request.auth.uid == userId` for user-owned documents.
- If nested subcollections are used, verify that the current rules cover them.
- Test that one user cannot read, modify, or delete another user's Goals.
- Guest/local mode must follow the app's existing semantics. Do not claim a local guest Goal has been cloud-persisted before a signed-in identity and successful sync exist.

### 9.4 CRUD operations must be durable

Implement and test:

- Create Goal → persist document.
- Read/list Goals → retrieve the current user's records.
- Update Goal → persist modified fields.
- Add/edit/reorder/complete/delete milestone → persist the change.
- Update progress → persist the new value and any required history record.
- Complete/reopen Goal → persist status and completion metadata.
- Archive Goal → persist status and archive metadata.
- Delete Goal → delete/mark deleted according to existing conventions and synchronize the deletion.

A mutation should use the existing persistence service and surface errors according to the app's established patterns. Avoid swallowing Firestore errors.

### 9.5 Local/offline behavior and synchronization

The project documents local/offline behavior alongside Firebase cloud sync. Preserve the current architecture:

- Reuse the existing local storage and cloud sync adapters.
- Ensure Goals are included in any generic sync registration, export/import, backup, restore, or migration mechanisms that apply to other entities.
- If writes can occur offline, follow the current queue/retry or reconciliation mechanism.
- Ensure a successful local write is eventually synchronized when connectivity returns.
- Define conflict behavior using the existing policy; do not invent a separate Goal-only conflict algorithm without need.
- Avoid duplicate Goals when retrying a create operation. Use stable IDs and idempotent writes where compatible with current services.
- Ensure deletions propagate to Firebase and other devices; otherwise deleted Goals may reappear on the next sync.
- Make saving/sync status clear where the existing app exposes such feedback.

**Do not assume that adding a Goal to local state or local storage automatically makes it a Firebase entity.** Explicitly register the model and CRUD operations in the actual persistence and synchronization paths.

### 9.6 Timestamp and serialization rules

- Follow the app's canonical timestamp type.
- Ensure values can round-trip from Firestore to TypeScript and back.
- Keep date-only deadlines from shifting dates because of timezone conversion.
- Use server timestamps or the project's existing timestamp strategy for authoritative creation/update times where appropriate.
- Do not overwrite `createdAt` on every edit.
- Update `updatedAt` on each successful mutation.
- Handle absent optional fields without turning them into invalid `undefined` Firestore values.
- Keep serialization/deserialization centralized.

### 9.7 Concurrency and data integrity

For the MVP:

- Use stable IDs.
- Validate updates in domain services.
- Ensure rapid repeated taps do not create duplicate milestones or duplicate progress entries.
- Follow the existing Firestore write strategy for concurrent updates.
- Use transactions or batched writes only where needed for invariants, such as updating a Goal and its related period record together.
- If milestones are separate documents, define how parent deletion handles child records.
- If progress history is separate, define how corrections and deletions affect historical entries.

### 9.8 Data export/import and migration

If Life Gamify has a backup/export/import flow, include Goals in it.

- Export all user-owned Goals and their related milestones/progress records.
- Restore Goals without generating duplicate records on repeated imports, where feasible.
- Validate imported data before persistence.
- Keep backward compatibility with backups created before Goals existed.
- Missing Goal data in an older backup should mean “no Goals to import,” not a failed restore.
- Do not make existing users run a destructive migration just to add the new collection.
- Document any required Firestore index or rules changes.

### 9.9 Persistence acceptance tests

At minimum, verify:

1. Creating a Goal results in a Firestore document under the current user's scope.
2. Reloading the application retrieves the saved Goal.
3. Editing the Goal persists changes.
4. Milestone changes persist and survive reload.
5. Progress updates persist and survive reload.
6. Deadline, metric configuration, and lifecycle status survive serialization round trips.
7. Goals are isolated between users.
8. Deletions remain deleted after a subsequent sync.
9. Offline changes follow the app's established retry/sync behavior, if offline writes are supported.
10. Backup/export/import includes Goal data, if the existing backup system applies.
11. Existing Habit persistence and other entity behavior remain unchanged.
12. A Firestore failure is visible/handled rather than silently presented as a successful durable save.

---

## 10. Application architecture and boundaries

### 10.1 Suggested layers

Use the repository's existing structure, but preserve these responsibilities:

**Domain/contracts**
- Goal, GoalMilestone, metric configuration, status types.
- Pure validation and progress calculation functions.

**Application services**
- Create/update/delete Goal.
- Manage milestone operations.
- Update progress.
- Complete/reopen/archive Goal.
- Enforce lifecycle and validation rules.

**Persistence/data layer**
- Goal repository/adapter.
- Firestore serialization.
- Local/offline storage integration.
- Sync, import/export, and error handling.

**UI**
- Goals overview.
- Create/edit form.
- Goal detail.
- Milestone editor.
- Metric configuration and progress controls.

React components should not contain duplicated domain rules. For example, percentage calculations, metric validation, and status transition rules should be implemented once in domain/application code and tested independently.

### 10.2 AI boundary

AI may eventually suggest Goals or milestones, but it is outside the MVP. If integrated later:

- AI output is a proposal, not authoritative state.
- Validate AI-generated data through the same Goal domain services.
- Preserve any human approval requirements already used for AI-initiated mutations.
- Never let AI bypass Firebase user authorization or persistence abstractions.

### 10.3 Native layers

The shared application owns Goal behavior. Native iOS/Android changes are not required unless an existing widget, shortcut, or bridge feature explicitly needs Goal data. Do not add Goal-specific native complexity prematurely.

---

## 11. Gamification boundaries

Goals are part of Life Gamify but must not silently change the current economy.

MVP rules:

- Creating a Goal does not award coins or XP.
- Updating progress does not award coins or XP by default.
- Completing a milestone does not affect Habit streaks.
- Completing a Goal does not automatically create a Quest or Boss.
- Goals do not inherit Habit frequency limits.
- Goals do not change reward redemption, coin balance, level calculations, or streak-freeze behavior.

Future integrations can be designed separately, with explicit product decisions and deterministic rules.

---

## 12. Error, loading, and empty states

The implementation must handle:

- Initial loading.
- Empty active Goals list.
- No completed Goals.
- No archived Goals.
- Saving in progress.
- Save failure.
- Firebase unavailable or permission denied.
- Offline state, if supported.
- Invalid metric configuration.
- Invalid progress value.
- Goal not found or deleted elsewhere.
- Conflicting updates from another device.
- Failed deletion.
- Failed milestone update.

Use existing toast, inline-error, retry, and optimistic-update conventions. Do not introduce a new notification framework solely for Goals.

---

## 13. Acceptance criteria

### Creation and editing
- [ ] User can create a Goal with only a title.
- [ ] Empty titles are rejected.
- [ ] Description is optional.
- [ ] Deadline is optional.
- [ ] Milestones are optional.
- [ ] Progress tracking is optional.
- [ ] Editing one property preserves unrelated properties.

### Deadlines
- [ ] Undated Goals never show as overdue.
- [ ] Dated Goals display the correct deadline.
- [ ] Deadline edits do not reset progress.
- [ ] Date-only values survive timezone and serialization round trips.

### Milestones
- [ ] User can add, edit, reorder, complete, reopen, and delete milestones.
- [ ] Milestones persist to Firebase through the established data layer.
- [ ] Milestone completion does not implicitly complete the Goal in the MVP.
- [ ] Deleting a milestone does not delete the Goal.

### Metrics and progress
- [ ] Count, duration, and frequency are supported.
- [ ] Metric labels and supported units can be customized.
- [ ] Targets are optional.
- [ ] Progress can be set and corrected.
- [ ] Invalid and negative values are rejected.
- [ ] Duration uses a canonical stored unit.
- [ ] Frequency uses defined daily/weekly/monthly boundaries.
- [ ] Progress without a target does not display a fabricated percentage.
- [ ] Over-target progress is preserved while the visual percentage is capped at 100%.

### Lifecycle
- [ ] Goals can be completed, reopened according to product rules, archived, and deleted.
- [ ] Completed and archived Goals are distinguishable from active Goals.
- [ ] Lifecycle changes persist to Firebase.

### Persistence and synchronization
- [ ] Goal CRUD uses the existing persistence architecture.
- [ ] Goal documents are stored under the authenticated user's scope.
- [ ] Reloading retrieves saved Goals.
- [ ] Goal and milestone changes survive reload.
- [ ] Progress changes survive reload.
- [ ] Deletions propagate and do not resurrect during sync.
- [ ] Existing authentication and Firestore security boundaries are preserved.
- [ ] Existing export/import functionality includes Goals, if applicable.
- [ ] Persistence failures are handled visibly.
- [ ] No client-only implementation is mistaken for cloud persistence.

### Navigation and regression
- [ ] Goals appears in the bottom bar.
- [ ] Habits is accessible from More Options.
- [ ] Adventure is accessible from More Options.
- [ ] Existing routes and links continue to work.
- [ ] Responsive layouts work on narrow mobile viewports and native WebViews.
- [ ] Existing Habit, Quest, Boss, XP, coin, streak, and reward tests continue to pass.

---

## 14. Testing strategy

### Unit tests
- Goal creation validation.
- Goal update behavior.
- Status transitions.
- Deadline and overdue calculations.
- Metric configuration validation.
- Count calculations and percentage display.
- Duration conversion and validation.
- Frequency period boundaries and rollover.
- Milestone ordering and completion.
- Serialization/deserialization round trips.
- Handling of missing optional properties.

### Persistence tests
- Create/read/update/delete through the Goal repository.
- Firestore document paths and user scoping.
- Timestamp serialization.
- Optional fields and absent values.
- Milestone and progress writes.
- Delete propagation.
- Retry/idempotency behavior where supported.
- Offline sync behavior where supported.
- Backup/export/import.

### UI tests
- Create title-only Goal.
- Create Goal with deadline and milestones.
- Enable and configure each metric type.
- Update progress.
- Complete and archive Goal.
- Handle validation and save failures.
- Navigate between Goals, Habits, and Adventure.
- Confirm optional sections remain optional.

### Regression checks
- Run the full existing test suite.
- Run TypeScript checks and the production build.
- Verify existing Habit logging and rewards.
- Verify existing navigation/deep links.
- Test the app in the narrow mobile viewport used for visual QA.
- Test the PWA and native WebView where practical.

---

## 15. Implementation plan

### Phase 0 — Repository inspection (Completed)
- [x] 1. Inspect the current navigation implementation and route definitions.
- [x] 2. Inspect Habit/Activity domain types and CRUD services.
- [x] 3. Inspect Firebase initialization, authentication, Firestore rules, repositories, and sync adapters.
- [x] 4. Inspect local/offline persistence and conflict handling.
- [x] 5. Inspect data backup/export/import.
- [x] 6. Inspect test conventions and current mobile navigation behavior.
- [x] 7. Record the canonical patterns to reuse before writing code.

**Exit criterion met:** Canonical patterns identified across `src/domain/contracts.ts`, `src/services/storage.ts`, `src/services/firebase.ts`, and navigation components.

### Phase 1 — Domain contracts and validation (Completed)
- [x] 1. Add Goal and milestone contracts (`src/domain/contracts.ts`, `src/types/index.ts`).
- [x] 2. Add metric configuration types (`count`, `duration`, `frequency`).
- [x] 3. Canonical representation for duration chosen as integer seconds.
- [x] 4. Frequency period history retention supported via ISO period keys (`YYYY-MM-DD`, `YYYY-Www`, `YYYY-MM`).
- [x] 5. Implement validation and pure progress calculations (`src/utils/goalUtils.ts`).
- [x] 6. Add unit tests (`src/utils/__tests__/goalUtils.test.ts` - 24 tests).

**Exit criterion met:** Goal domain behavior is deterministic, handles all edge cases (title-only, completed vs overdue, cap 100% display), and is thoroughly unit tested.

### Phase 2 — Persistence and synchronization (Completed)
- [x] 1. Add Goal domain operations via `goalService.ts` (`src/services/domain/goalService.ts`).
- [x] 2. Add Firestore serialization/deserialization with ISO string dates.
- [x] 3. Register Goals in local/offline storage (`life_gamify_goals_v2`) and synchronization paths (`src/services/storage.ts`).
- [x] 4. User-scoped Firestore paths confirmed (`users/{userId}/goals/{goalId}`) (`src/services/firebase.ts`).
- [x] 5. Implement create, read, update, and delete in `firebase.ts` and `AppContext.tsx`.
- [x] 6. Persist milestones and progress with real-time Firestore listeners.
- [x] 7. Integrate backup/export/import with backward-compatibility for legacy backups.
- [x] 8. Add persistence and security-scope tests (`src/services/__tests__/storage.test.ts`, `src/services/__tests__/firebase.test.ts`).

**Exit criterion met:** Goals survive reload, import/export cleanly, and synchronize durably through Firestore under user-scoped paths.

### Phase 3 — Navigation (Completed)
- [x] 1. Add Goals to the primary bottom navigation (`src/components/BottomNav.tsx`).
- [x] 2. Move Habits and Adventure to More Options.
- [x] 3. Preserve routes, links, active states, and desktop top navigation (`src/components/Navbar.tsx`, `src/components/FAB.tsx`).
- [x] 4. Check mobile layout, safe areas, PWA, and WebView.
- [x] 5. Add navigation regression tests (`src/components/__tests__/navigation.test.ts`).

**Exit criterion met:** Goals is directly accessible in primary navigation, and Habits and Adventure are accessible in More Options.

### Phase 4 — Goal management UI (Completed)
- [x] 1. Implement Goals overview and empty state (`src/pages/GoalsPage.tsx`).
- [x] 2. Implement create/edit Goal modal (`src/components/GoalModal.tsx`).
- [x] 3. Implement Goal detail view (`src/pages/GoalDetailPage.tsx`).
- [x] 4. Implement status transitions: active, completed, archived, reopen, delete.
- [x] 5. Add loading, validation, search filtering, and confirmation modals.
- [x] 6. Connect all operations to `AppContext` and `goalService`.

**Exit criterion met:** Title-only goals can be created, edited, filtered, completed, archived, and deleted cleanly.

### Phase 5 — Milestones and progress (Completed)
- [x] 1. Implement milestone add/edit/reorder/complete/reopen/delete (`GoalDetailPage.tsx`).
- [x] 2. Implement count metric configuration and interactive quick-adjust buttons (+1, -1, custom set).
- [x] 3. Implement duration configuration, conversion (seconds to minutes/hours), and quick buttons (+15m, +30m, +1h).
- [x] 4. Implement frequency configuration, occurrence logging, and period semantics.
- [x] 5. Implement visual capped progress bars, raw value displays, and remaining metrics.
- [x] 6. Add tests for metric changes, milestones, and domain services (`src/services/domain/__tests__/goalService.test.ts`).

**Exit criterion met:** All three metric types and milestone operations function and persist accurately.

### Phase 6 — QA, documentation, and release readiness (Completed)
- [x] 1. Run all tests (163 tests passing across 19 suites).
- [x] 2. Run TypeScript checks and production build (`npm run build` succeeds).
- [x] 3. Verify Firestore persistence and user isolation contracts.
- [x] 4. Verify reload, synchronization, and deletion behavior.
- [x] 5. Verify import/export backward compatibility.
- [x] 6. Verify mobile viewport and navigation regression tests.
- [x] 7. Update functional requirements and roadmap documentation.
- [x] 8. Release to `master` and `release` branches.

**Exit criterion met:** All acceptance criteria met, all tests passing, build green, and release ready.

---

## 16. Recommended MVP decisions

1. **Title-only creation:** required.
2. **Deadline:** optional.
3. **Milestones:** optional and manually managed.
4. **Progress tracking:** optional.
5. **Metric types:** count, duration, frequency.
6. **Custom metrics:** custom label and supported unit, not arbitrary formulas.
7. **Completion:** user-confirmed; reaching a target can prompt but does not automatically complete.
8. **Gamification:** no automatic coin/XP rewards in the MVP.
9. **Frequency history:** explicitly decide before implementation. If historical period tracking is required, store period records rather than resetting one counter.
10. **Persistence:** Firebase Firestore is mandatory, using the existing authenticated user-scoped data layer, with local/offline behavior and sync following current repository conventions.
11. **Navigation:** Goals in the bottom bar; Habits and Adventure under More Options.
12. **Native changes:** none unless existing native functionality specifically requires them.

## 17. Definition of done

The feature is done only when:

- The Goals domain model and validation are implemented.
- Users can create and manage Goals, optional deadlines, milestones, and supported metrics.
- All Goal changes are saved through the established persistence layer and persisted to Firebase for the authenticated user.
- Reload, sync, and deletion behavior are tested.
- User isolation and Firestore rules are verified.
- Goals appears in the bottom navigation.
- Habits and Adventure remain accessible in More Options.
- The full existing test suite and production build pass.
- Existing gamification behavior is unchanged.
- Repository documentation reflects the actual implementation.

**Final principle:** Goals must be a real, durable Life Gamify entity—not merely a new screen or a local-only object. Firebase persistence, user isolation, synchronization, and regression safety are core acceptance requirements.
