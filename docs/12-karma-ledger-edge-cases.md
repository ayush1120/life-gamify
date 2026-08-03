# 12 - Karma Ledger System & Edge Case Security Guide

This document establishes the official product rules, mathematical formulas, and 30-point security audit specification for the **Karma Ledger System** in Life-Gamify.

---

## 1. System Overview & Core Philosophy

The **Karma Ledger System** governs habit log deletions, store reward redemptions, and refund logic. Its primary goal is to maintain the psychological value of virtual Coins (🪙) while providing psychological safety for honest mistakes.

```
                   ┌───────────────────────────────────┐
                   │       Habit Log Deletion          │
                   └───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴────────────────────────┐
           ▼                                                  ▼
 🟢 Balance Covers Log                               🔴 Spent Coins (Deficit)
 ─────────────────────                               ─────────────────────────
 • Removes log's earned coins                         • Marks entry as `isRetracted: true`
 • Deducts 1% Mistake Fee                             • Applies 2% Karma Surcharge
 • Log cleanly deleted                                • Creates `Phantom Debt`
```

---

## 2. Mathematical Formulas & Rules

### A. Mistake Fee (Normal Log Delete)
Applied when deleting a habit log whose coins are unspent:
$$\text{Mistake Fee} = \begin{cases} \max\left(1, \lceil \text{Vault Balance} \times 0.01 \rceil\right) & \text{if Vault Balance} > 0 \\ 0 & \text{if Vault Balance} = 0 \end{cases}$$

### B. Karma Surcharge (Spent Log Retraction)
Applied when retracting a spent habit log to create Phantom Debt:
$$\text{Karma Surcharge} = \begin{cases} \max\left(1, \lceil \text{Vault Balance} \times 0.02 \rceil\right) & \text{if Vault Balance} > 0 \\ 0 & \text{if Vault Balance} = 0 \end{cases}$$
$$\text{Phantom Debt} = \text{Actual Deficit} + \text{Karma Surcharge}$$

### C. Store Redemption Refunds
Applied when canceling a Store Reward Redemption:
$$\text{Net Refund} = \begin{cases} \text{coinsSpent} & \text{if Elapsed Time} \le 60\text{ mins (Grace Period)} \\ \text{coinsSpent} - \max\left(1, \lceil \text{coinsSpent} \times 0.15 \rceil\right) & \text{if Elapsed Time} > 60\text{ mins (Late Refund)} \end{cases}$$

> **Debt Payoff Rule:** Net Refund pays off active `Phantom Debt` first. Any remaining net refund is added to Vault Balance.

---

## 3. Comprehensive 30-Point Audit Checklist

### Habit & Log Hardening
1. **Fixed Log Snapshot:** `RewardLog` captures a fixed snapshot of `rewardEarned`. Habit reward edits do not alter historical log coin values.
2. **Habit Manager Definition Protection:** Deleting a habit definition does not delete past history logs.
3. **Double-Tap Debounce:** 300ms click debounce prevents rapid double-logging.
4. **Streak Calculation Integrity:** Streaks calculate strictly from non-retracted (`!isRetracted`) logs.
5. **Zero-Coin Habit Deletion:** Deleting 0-coin logs still enforces the 1% Mistake Fee if Vault Balance > 0.
6. **Multi-Log Day Streak Safety:** Retracting 1 log on a multi-log day keeps the day active if other valid logs remain.
7. **Retracted Log Immutability:** Retracted logs are read-only historical records and cannot be edited or retracted again.
8. **Multi-Retraction Stacking:** Each retraction event calculates its own 2% surcharge dynamically.
9. **Single-Action Retracted Buttons:** UI disables re-deleting already retracted logs.
10. **Timezone Clock-Shift Protection:** Elapsed time calculations clamp with `Math.max(0, currentTime - purchaseTime)`.

### Store & Refund Hardening
11. **Fixed Redemption Snapshot:** `RewardRedemption` records a fixed snapshot of `coinsSpent`. Store price edits do not alter historical refund values.
12. **Store Manager Definition Protection:** Deleting a store reward definition does not delete past redemption logs.
13. **Minimum Store Price:** Store rewards strictly enforce `cost >= 1`.
14. **Exact 60-Minute Grace Boundary:** Grace Period checks `elapsedMs <= 3,600,000` (<= 60 min).
15. **15% Late Restocking Fee:** Purchases refunded after 60 minutes deduct 15% restocking fee.
16. **Store Purchase Lock During Debt:** Vault Balance is 0 when in Phantom Debt; store cards disable purchase buttons (`cost >= 1`).
17. **Order of Operations for Debt Payoff:** Refunds pay off Phantom Debt before adding remaining coins to Vault Balance.
18. **Unique Transaction Hash Keys:** Redemption & Log IDs append random entropy (`Date.now() + Math.random()`) to prevent collisions.
19. **No Duplicate Refunds:** Deleted redemptions are removed from state, preventing double-refunding.
20. **Debt-Payoff Liquidity Transfer:** Legitimate unspent refund capital returned to vault is valid for honest log deletions.

### System, Math & UX Hardening
21. **Integer Ceiling Enforcement:** Percentage fees use `Math.ceil()` and `Math.max(1, ...)`, preventing zero-fee exploits when balance > 0.
22. **JSON Export/Import Persistence:** Exported JSON includes `isRetracted`, `retractedAt`, and `karmaFeeApplied` fields.
23. **Backup Schema Validation:** `importAllData` validates array schema before applying imported state.
24. **Currency Symbol Mutation Safety:** Ledger calculations operate strictly on numerical amounts; symbol changes do not affect balance math.
25. **Empty State Graceful Reset:** Empty log/redemption arrays default all stats to `0` cleanly without `NaN` errors.
26. **Analytics & Heatmap Exclusion:** Heatmaps and leaderboards filter `rewardLogs.filter(l => !l.isRetracted)`.
27. **Firebase Cloud Synchronization:** Retracted logs and redemption deletions sync identical state to Firestore documents.
28. **Theme Contrast Compliance:** Modals and badges use design tokens (`var(--glass-bg)`, `var(--pill-badge-bg)`) ensuring high contrast in Dark/Light themes.
29. **Non-Negative Vault Clamping:** Vault Balance is clamped at `>= 0`.
30. **Quest System Prompting:** Phantom Debt displays an active quest banner encouraging habit completion to restore honor.
31. **Frequency Period Bound Clamping:** Frequency period resets (`daily`, `weekly`, `monthly`) compute from deterministic ISO time bounds (Monday 00:00:00 for ISO weeks, 1st of month 00:00:00 for monthly), preventing timezone clock-shift limit bypasses.
32. **Frequency Mutation Safety:** Changing a habit's frequency (e.g. from Daily to Weekly) does not alter or re-evaluate past completion logs.
33. **Tag Sanitization & Injection Defense:** Habit and Store tag inputs strip special characters, trim whitespace, and enforce a 25-character max limit per tag.
34. **Quick Habit Favorite Persistence:** Quick habit flags (`isQuickHabit`) persist across local storage and cloud sync without altering habit completion counts.
35. **Multi-Tag Filter Concurrency:** Search queries and tag filter selections execute concurrently without modifying underlying habit arrays.

---

## 4. Automated Testing Requirements

All 30 security cases must be verified by automated unit tests in `src/services/__tests__/ledger.test.ts`.

Test suites must cover:
1. `calculateMistakeFee` & `calculateKarmaSurcharge` edge values.
2. `calculateRestockingFee` & 1-hour grace window logic.
3. Ledger state transitions for normal delete, deficit delete, and store refunds.
4. Karma Debt payoff math & non-negative balance clamping.
