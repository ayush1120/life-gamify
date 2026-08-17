# Life Gamify: Core Game Engine Architecture

## 1. Overview
The Life Gamify game engine relies strictly on a chronological append-only ledger system. Rather than storing mutable state for coin balances or XP levels, all character progression is deterministically recomputed from the source-of-truth `RewardLog` history.

## 2. Activity Ledger (Source of Truth)
The core atomic unit of the application is a completed habit log, stored as a `RewardLog`.

- **`RewardLog`**: Represents a single instance of a completed habit. It contains a `timestamp` and a `rewardEarned` (coin value). 
- **Retractions**: If a user undoes a logged habit, the log is marked as `isRetracted: true` and the coins are deducted (with potential Karma Fees).

## 3. Deterministic Ledger Service (`ledger.ts`)
The `computeLedgerStats` service function ingests the full history of `RewardLog`s and `RewardRedemption`s, sorting them chronologically to compute:
- **`totalCoinsEarned`**: The sum of all non-retracted `rewardEarned` values.
- **`totalCoinsSpent`**: The sum of all redemption costs.
- **`coinBalance`**: The current wallet balance.
- **`phantomDebt`**: Accumulated negative balance (Karma Surcharge).
- **Streaks**: Calculated by iterating chronologically backward over unique log dates.

## 4. Deterministic XP & Progression (AI Architecture)
Instead of the AI calculating or assigning XP points, the XP economy is deeply tied to the existing coin economy:

### The Mathematical XP Formula
- **Base XP**: `XP = Coins * 5` (XP Multiplier)
- **Total XP**: Derived directly from `totalCoinsEarned`.
- **Level Scaling**: The level curve is calculated mathematically based on the Total XP pool. `Required XP = 100 * Level^1.5`

Because the `totalCoinsEarned` represents the immutable historical truth of a user's productivity, translating it into XP natively ensures that the game engine is entirely deterministic. No LLM hallucinations can ever alter a user's authoritative XP pool or progression level.

## 5. Firebase Persistence
Currently, persistence is handled by serializing local context state through the `/services/firebase.ts` adapters. 
- The user's device stores state in `localStorage`.
- The `AppContext` automatically synchronizes `rewardLogs` up to a user-specific Firestore document.
- The AI Engine will integrate gracefully by storing proposals (Quests, Bosses) in Firestore, while leaning on `computeLedgerStats` to mathematically prove progress against those AI-generated goals.
