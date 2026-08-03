# Functional Requirements

## Authentication & Single-User Lock
- Supports Google Login via Firebase Auth (optional) or immediate Local Guest Owner Mode.
- Restricted to single authorized owner email when Firebase is configured.

---

## Habit Management
User can:
- Create, edit, delete, disable, and reorder habits.
- Set Habit Name, Icon/Emoji, Description, Reward Coins value (`🪙`), Color accent, and Active status.

Example Habits:
- Run 5km: +5 coins
- Gym Workout: +4 coins
- 16-Hour Fast: +6 coins
- Read 20 Pages: +3 coins
- Reach home before 4:30 PM: +2 coins

---

## 1-Tap Habit Logging & Coin Treasury
- Clicking a habit card instantly logs the activity.
- Plays micro-animations (flying coin towards Treasury Jar).
- Increases user's total Coin Balance in real time.

---

## Reward Store & Item Management (CRUD)
User can:
- View available rewards in the **Reward Store**.
- Purchase / Redeem rewards using accumulated coins.
- **Add, Edit, Delete, and Toggle Active status** for Store Rewards.
- Set Reward Name, Coin Cost, Icon/Emoji, Description, and **Upload Custom Cover Image** or select from high-quality presets.

Default Store Items:
- **Bourbon Packet**: 12 coins
- **Doomscrolling (15 min)**: 5 coins
- **Chai / Coffee Break**: 8 coins
- **1 Hour Video Games**: 20 coins
- **Watch Movie / Episode**: 25 coins

---

## Activity & Redemption History
- Log table recording every habit completed (Date, Time, Habit, Coins Earned).
- Redemption log recording every store purchase (Date, Time, Item Name, Coins Spent).
- Ability to search, filter, and delete/undo log entries.

---

## Analytics & Statistics
- Total Coins Earned, Total Coins Spent, Current Vault Balance.
- GitHub-style 90-day activity contribution heatmap grid.
- Daily habit completion streaks (Current vs. Longest).
- Top habits leaderboard.

---

## Themes & Celebration Customizer
- Switch between 6 visual themes: Golden Arcade, Cyber Neon, Cozy Chocolate, Emerald Growth, Sunset Glow, Midnight Royal.
- Choose celebration animation style: Confetti, Golden Coin Shower, Fireworks, Starburst.
- Toggle Web Audio API sound effects.
- Export & Import JSON data backup.
