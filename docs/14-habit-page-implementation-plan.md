# Habit Page — Implementation Plan & Safety Contract

## Purpose

Add an individual Habit Detail page that helps a user understand and act on one habit without changing the existing Coin Economy, Reward Store, Karma Ledger, frequency model, or persistence schema.

The page is a **derived view** over existing `Habit`, `RewardLog`, `StoreReward`, and ledger data. It is not a second source of truth and must not implement independent coin, frequency, refund, or debt rules.

---

## V1 Scope

### Included

- Direct habit URL/navigation from the existing Dashboard, Habit Manager, and Log Activity pages.
- A responsive habit detail view containing:
  - Habit identity, description, icon, colour, tags, current schedule, and current coin reward.
  - Current daily/weekly/monthly period progress.
  - Explicit one-tap completion action using the existing central logging action.
  - Habit-specific completion count, current/best streak, lifetime coins, recent timeline, and optional calendar/rhythm display.
  - A display-only Reward Compass based on the existing global balance and active Store Rewards.
- Safe states for paused, complete-for-period, empty-history, missing/deleted, and malformed data.
- Desktop and mobile layouts using existing theme tokens.

### Explicitly excluded

- New completion types, quantity/duration tracking, completion notes, minimum wins, reminders, weekday schedules, coin multipliers, or restricted habit-owned coins.
- New LocalStorage keys, Firestore collections, or changes to export/import schema.
- Changes to redemption, refunds, mistake fees, Karma surcharges, Phantom Debt, balance calculations, or Reward Store eligibility.

---

## Non-Negotiable Product Invariants

### Coin and ledger invariants

1. The Karma Ledger remains the only source of truth for balance, spent coins, Phantom Debt, and fees.
2. The Habit Page never creates, deletes, retracts, edits, refunds, or recalculates ledger transactions.
3. The existing central `logHabit` action is the only V1 path that may create a `RewardLog`.
4. Reward Compass is informational only. It never reserves, assigns, locks, or spends coins.
5. Currency symbols and names are display-only; all calculations use numerical fields.

### Historical-data invariants

1. `RewardLog.rewardEarned` is the immutable historical coin value.
2. `RewardLog.habitName` and `RewardLog.icon` are the historical presentation snapshots.
3. Editing a habit's reward, name, icon, or frequency must not rewrite old logs or alter past coin earnings.
4. Deleting a habit definition must not delete its historical logs.
5. Retracted logs are read-only historical records and must be excluded from all newly derived habit metrics.

### Frequency invariants

1. V1 keeps the existing schedule vocabulary: `daily`, `weekly`, and `monthly`.
2. V1 keeps `maxPerPeriod` semantics, including `0` for unlimited.
3. Frequency limits must be evaluated by one shared utility, not duplicated in components.
4. Current-period calculations must have both a start and exclusive end boundary.
5. V1 must explicitly document one time convention. The current implementation uses the user's local device time with ISO weeks beginning Monday; preserve that behavior unless a separately approved migration changes it.
6. Changing frequency or `maxPerPeriod` applies to the current configuration only; it must not retrospectively re-evaluate past logs.

### Interaction invariants

1. Existing one-tap logging remains fast and available on the Log Activity page.
2. Opening a habit must not log it, toggle its favourite status, edit it, or alter filters.
3. Logging controls, favourite controls, edit controls, delete controls, and reorder controls must be separate controls with correct event propagation.
4. The Habit Page must not expose a direct mutation path for retracted records.

---

## Required Core Hardening Before New UI

The Habit Page adds another way to reach logging, so the central logging path must be hardened first.

1. Reject inactive habits in the central logging action.
2. Enforce the documented 300 ms duplicate-log debounce/lock centrally, rather than in individual buttons.
3. Capture one timestamp per log attempt and use it for validation, log creation, and UI feedback.
4. Generate collision-resistant log IDs using the current timestamp plus random entropy.
5. Preserve period-limit enforcement for all log entry points and test rapid taps.
6. Ensure a Firebase snapshot or a second open tab cannot silently permit a duplicate period-limited completion.

---

## Route Contract

The application currently uses hash navigation. V1 adds a detail route without adding a router dependency.

```text
#dashboard
#log-activity
#store
#habits
#habits/<encoded-habit-id>
#history
#analytics
#settings
```

### Requirements

- Parse routes defensively; malformed URI encoding must not crash the app.
- `#habits` opens Habit Manager.
- `#habits/<id>` opens the detail page if the current habit definition exists.
- An unknown or deleted habit shows a recovery state with a route back to `#habits`.
- Browser refresh, back, forward, and direct links must work.
- Opening a route has no data side effects.

---

## Data and Metric Contract

### Valid log definition

A log is valid for a Habit Page metric only when all conditions hold:

```text
log.activityId === habit.id
log.isRetracted !== true
log.timestamp is a valid timestamp
```

Valid logs are used for:

- Current-period progress.
- Completion count.
- Streak and rhythm/calendar data.
- Habit-specific lifetime coins earned.
- Recent activity timeline.

### Period boundaries

```text
Daily:   [local midnight today, local midnight tomorrow)
Weekly:  [local Monday 00:00, next local Monday 00:00)
Monthly: [local first day 00:00, local first day of next month 00:00)
```

All new utilities must exclude malformed timestamps, copy before sorting, and avoid mutation of Context state arrays.

### New utility module

Create `src/utils/habitAnalytics.ts` for pure derived calculations, for example:

- `getValidHabitLogs`
- `getHabitLifetimeStats`
- `getHabitCurrentStreak`
- `getHabitLongestStreak`
- `getHabitPeriodRate`
- `getHabitTimeline`
- `getHabitCalendarDays`

The existing `frequencyUtils.ts` should own shared period-bound and due-limit behavior so detail display and log validation cannot diverge.

---

## UI Implementation

### New page

Create `src/pages/HabitDetailPage.tsx`.

1. **Habit hero** — back action, icon, name, description, category/tags, current schedule, current reward.
2. **Action and progress** — one explicit `Log Habit +N Coins` button and existing period progress.
3. **Derived momentum** — current/best streak, completion count, lifetime coins, and optional rhythm/calendar display.
4. **Quest trail** — recent valid log snapshots; a read-only retracted indication is acceptable if history context needs it.
5. **Reward Compass** — nearest affordable active reward, otherwise lowest remaining coin gap, otherwise hidden.

### Required states

- Active and loggable.
- Period limit reached.
- Paused/inactive.
- No history yet.
- No active rewards.
- Habit not found/deleted.
- Empty or invalid data.

### Mobile requirements

- The primary Log button must remain accessible above the fixed bottom navigation.
- Resolve the existing mobile FAB overlap: hide, replace, or position the FAB so it cannot cover the Log button.
- Preserve touch-target size and avoid duplicate log animations.
- Use `var(--glass-bg)`, `var(--pill-badge-bg)`, and other existing tokens to preserve dark/light contrast.

---

## Entry-Point Changes

| Surface | Open detail | Log completion |
| --- | --- | --- |
| Dashboard | Card body/title or an explicit View affordance | Dedicated Log button only |
| Habit Manager | New View action or non-control card area | No direct logging required |
| Log Activity | Habit name/icon can open detail | Existing direct Log button remains unchanged |
| Quick Habits | Optional detail affordance | Existing one-tap logging remains unchanged |

All nested controls must stop propagation where necessary so a user action cannot both log and navigate, or edit/delete and navigate.

---

## Documentation-Invariant Test Matrix

The release must preserve all **35** items in `docs/12-karma-ledger-edge-cases.md` (the document calls itself a 30-point audit but contains 35 numbered requirements).

### Habit and log protections

- Fixed log snapshots after reward/name/icon/frequency edits.
- Habit deletion preserves historical logs.
- 300 ms duplicate-log protection.
- Retracted-log exclusion from streaks, calendar, counts, coins, heatmaps, and leaderboards.
- Multi-log day remains active when only one log is retracted.
- Retracted log is read-only and cannot be deleted/retracted again.
- Correct grace-period/clock-shift behavior remains delegated to ledger utilities.

### Store and debt protections

- Existing price snapshots, minimum price, grace boundaries, fees, refunds, debt payoff, non-negative balance, and transaction IDs remain unchanged.
- The new page must not offer store purchase, refund, or debt-changing controls.

### Persistence, sync, and UX protections

- Existing LocalStorage keys remain unchanged.
- Existing export/import retains `isRetracted`, `retractedAt`, and `karmaFeeApplied`.
- Existing Firestore paths and write behavior remain unchanged.
- Guest mode, Firebase mode, offline/reconnect, and two-tab behavior are tested.
- Theme contrast, tag/favourite/filter behavior, empty states, and mobile touch behavior are tested.

### Additional scenario tests

- Daily/weekly/monthly/unlimited habits.
- ISO Sunday-to-Monday and month-end boundaries.
- Local midnight boundary.
- Invalid timestamp and malformed imported record.
- Existing logs after a habit is deleted.
- Deep link, invalid encoded link, unknown route, browser back/forward, and refresh.
- Light and dark themes, desktop and mobile viewport.

---

## Baseline Issues to Track Separately

The following are existing documentation/implementation discrepancies. They are not silently included in Habit Page V1, but they must not be hidden or regressed by it.

1. The security documentation refers to UTC/ISO period enforcement while current frequency utilities use local-device time. Choose and document a single authoritative convention before sharing or changing those utilities.
2. The current period helper has a start boundary but no exclusive end boundary, so it should be hardened before reuse for generic analytics.
3. The documented 300 ms duplicate-log debounce is not currently enforced centrally.
4. Late log deletion and late reward refund UI calculate/display fees, while the current mutation path should be audited to confirm that those fees/refunds are represented consistently in the ledger.
5. The documented audit says 30 points but contains 35 numbered checks; the test matrix must cover all 35.

---

## Implementation Order

1. Write/extend invariant tests and record baseline failures.
2. Harden central logging and shared frequency-bound utilities.
3. Add defensive hash-route parsing and detail-page routing.
4. Add pure habit analytics utilities and tests.
5. Build the read-only detail page and all required states.
6. Add the explicit detail-page log control and mobile-safe layout.
7. Add entry points from Dashboard, Habit Manager, and Log Activity.
8. Add the display-only Reward Compass.
9. Run the full documentation-invariant and visual regression matrix.

---

## Future Features Require Separate RFCs

The following need explicit business rules, data-schema versioning, import/export changes, and Firebase compatibility planning before implementation:

- Completion notes.
- Persisted/customizable relics and milestones.
- Minimum-win completions.
- Weekday schedules.
- Quantity, distance, and duration tracking.
- Reminders/notifications.
- Habit-specific coin pools or restricted rewards.
- Account timezone support.
