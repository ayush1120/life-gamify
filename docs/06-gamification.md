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

For more technical details on the underlying state derivation, see [game-engine-architecture.md](game-engine-architecture.md).
