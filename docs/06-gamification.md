# Gamification Economy

## Coin Economy Structure
1. **Earn Coins**: Completing habits awards coins (`🪙`) based on difficulty/value.
   - Run 5km -> +5 coins
   - Gym Workout -> +4 coins
   - 16-Hour Fast -> +6 coins
   - Read 20 Pages -> +3 coins

2. **Spend Coins in Reward Store**:
   - Bourbon Packet -> 12 coins
   - Doomscrolling (15 min) -> 5 coins
   - Chai / Coffee Break -> 8 coins
   - 1 Hour Video Games -> 20 coins
   - Watch Movie / Episode -> 25 coins

3. **Reward Flexibility**:
   Users can add their own custom reward items with custom prices and uploaded cover photos.

4. **Celebrations & Audio**:
   Selectable celebration styles (Coin Shower, Fireworks, Confetti) and synthesized Web Audio sound FX.

## RPG Character Progression (AI Engine Foundation)
*Introduced in the AI RPG Engine update.*

1. **Deterministic XP (`calculateXp`)**:
   - Every coin earned statically generates 5 XP (`XP_MULTIPLIER = 5`).
   - The XP pool is calculated retroactively from the immutable historical activity ledger.
2. **Level Progression**:
   - Levels scale deterministically using a bounded inverse curve formula (`Level = floor((XP / 100)^(2/3))`).
3. **Stat Framework (In-Progress)**:
   - Habits can be mapped to deterministic RPG stats (Health, Fitness, Knowledge, Career, Creativity, Discipline, Social).
   - This mapping forms the bedrock of the AI Game Master features.

## Streaks & Streak Freezes
To build consistency without punishing honest mistakes, Life Gamify implements a **Dual-Level Streak & Freeze** system:
1. **Global Timeline Streaks**: Tracks consecutive calendar days where at least one habit was completed.
2. **Per-Habit Freezes (Auto-Earned)**:
   - Habits earn 1 `Freeze` automatically when the user maintains a 3x frequency period streak (e.g., 3 consecutive days for daily habits, 3 weeks for weekly habits).
   - If a user misses a day/week, they have a **2-period retroactive repair window** where they can permanently spend a freeze to bridge the gap and save their streak.

For more technical details on the underlying state derivation and AI integrations, see [game-engine-architecture.md](game-engine-architecture.md).
