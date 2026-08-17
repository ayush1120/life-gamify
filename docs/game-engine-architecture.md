# Life Gamify: Core Game Engine Architecture

## 1. Overview
The Life Gamify game engine relies strictly on a chronological append-only ledger system. Rather than storing mutable state for coin balances, character levels, or stat XP, all progression is deterministically recomputed from the authoritative `RewardLog` history.

```text
User Actions (Logs) ──► Append-Only Ledger ──► Deterministic Math Engine ──► Authoritative State
                                                       │
                                          ┌────────────┴────────────┐
                                          ▼                         ▼
                                   Coins & Level             7 RPG Life Stats
                                                                    │
                                                          ┌─────────┴─────────┐
                                                          ▼                   ▼
                                                    Active Quests       World Bosses
```

---

## 2. Activity Ledger (Source of Truth)
The core atomic unit of the application is a completed habit log, stored as a `RewardLog`.

- **`RewardLog`**: Represents a single instance of a completed habit. Contains `activityId`, `habitName`, `timestamp`, and `rewardEarned` (coin value).
- **Retractions**: If a user undoes a logged habit, the log is marked as `isRetracted: true` and the coins are deducted (with potential Karma Fees). Retracted logs are excluded from XP and stats computations, preventing phantom state.

---

## 3. Deterministic Ledger & XP Engine (`ledger.ts`, `progressionUtils.ts`)
The `computeLedgerStats` function ingests the full history of `RewardLog`s and `RewardRedemption`s, sorting them chronologically to compute:
- **`totalCoinsEarned`**: Sum of all non-retracted `rewardEarned` values.
- **`totalCoinsSpent`**: Sum of all redemption costs.
- **`coinBalance`**: Current wallet balance.
- **`phantomDebt`**: Accumulated negative balance (Karma Surcharge).
- **`totalXp`**: Computed as `totalCoinsEarned * 5`.
- **Level Scaling**: Level threshold curve `XP = 100 * level^1.5`.

---

## 4. Multi-Stat Progression Engine
Life Gamify tracks 7 core life stats:
1. **Health** (`❤️`): Physical well-being, nutrition, sleep, recovery.
2. **Fitness** (`⚡`): Exercise, endurance, strength, physical performance.
3. **Knowledge** (`🧠`): Learning, reading, research, intellectual mastery.
4. **Career** (`💼`): Professional projects, coding, deep work, craft.
5. **Creativity** (`🎨`): Art, writing, music, innovation, design.
6. **Discipline** (`🎯`): Consistency, focus, meditation, habit maintenance.
7. **Social** (`🤝`): Relationships, community, family, leadership.

### Activity Mappings (`ActivityMapping`)
Each habit maps to 1–3 stats with normalized weights summing to `1.0`.
- When an activity generates `XP = rewardValue * 5`, the XP is distributed across stats according to the habit's mapping.
- Example: *Piano Practice* (5 coins = 25 XP) → Creativity (70% = 17.5 XP), Knowledge (30% = 7.5 XP).

---

## 5. AI Game Master Architecture & Permission Boundaries
The AI Game Master acts purely as an imaginative storyteller and challenge designer. It **never** mutates authoritative state directly.

### Strict AI Permissions Boundary
| Permitted for AI | Prohibited for AI (Strict Engine Boundary) |
|---|---|
| Propose Quests (max 3) | Granting / modifying Coins or XP directly |
| Propose World Bosses (max 1) | Modifying player Level or Streaks |
| Propose Achievements (max 3) | Altering past transaction history |
| Propose Stat Mappings | Inventing arbitrary or non-existent Habit IDs |
| Propose Game Notifications | Creating unsupported Stat categories |

### AI Pipeline
```text
User Activity Context
       │
       ▼
Game Master Prompt (game-master-v1)
       │
       ▼
LLM Provider (Gemini / OpenAI / Anthropic)
       │
       ▼
Runtime Schema & Business Rule Validator (aiValidator.ts)
       │
       ▼
Deterministic Mathematical Conversion (convertProposalToQuest / Boss)
       │
       ▼
Local & Firestore Persistence (users/{uid}/...)
```

---

## 6. Adventure Mechanics (`adventureUtils.ts`)

### Quests Engine
- **Daily Quests**: Evaluates activity logs timestamped today (`YYYY-MM-DD`).
- **Weekly Quests**: Evaluates activity logs recorded since Monday of the current week.
- **Milestone Quests**: Evaluates lifetime activity logs since quest creation.
- **Reward Math**: `xpReward = sum(baseXP) * diffMult`, `coinReward = sum(baseCoins) * coinBonus`.

### Boss Arena Engine
- **Boss HP**: Scaled deterministically: `baseHp * (duration / 30) * (level * 0.5 + 1)`.
- **Boss Damage**: Accumulated XP earned in the boss's `relevantStats` during the active battle duration.
- **Victory**: When `damage >= maxHp`, current HP reaches 0 and the victory bounty can be claimed.

---

## 7. Multi-Provider LLM Integration (`llmService.ts`)
- **Google Gemini**: Uses `gemini-1.5-flash` / `gemini-2.0-flash` with structured JSON output.
- **OpenAI**: Uses `gpt-4o-mini` / `gpt-4o` with `response_format: { type: "json_object" }`.
- **Anthropic**: Uses `claude-3-5-haiku` / `claude-3-5-sonnet`.
- **User-Owned Keys**: API keys are stored locally / in the user's private account.
- **Diagnostic Connection Runner**: Verifies latency, key validity, and schema output without mutating game state.
- **Cost Controls**: Enforces a 24-hour analysis cooldown unless at least 3 new activities have been logged or a manual refresh is requested.
