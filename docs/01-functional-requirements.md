# Functional Requirements

## Authentication & Single-User Lock
- Supports Google Login via Firebase Auth (optional) or immediate Local Guest Owner Mode.
- Restricted to single authorized owner email when Firebase is configured.

---

## Habit Management & Frequency Scheduling
User can:
- Create, edit, delete, disable, and reorder habits.
- Set Habit Name, Icon/Emoji, Description, Reward Coins value (`🪙`), Color accent, and Active status.
- **Configurable Frequency**: `Daily`, `Weekly`, or `Monthly` schedule for every habit.
- **Quick Habits (Favorites ⭐️)**: Pin/unpin habits as favorites for 1-tap fast access.
- **Tags & Categories**: Categorize habits by `Work`, `Health`, `Career`, `Music`, `Fitness`, `Learning`, `Personal`, or custom tags.

Example Habits:
- **Daily**: Run 5km (+5 coins), 16-Hour Fast (+6 coins)
- **Weekly**: Gym Workout 3x (+4 coins/session), Reach Home Early 5x (+2 coins)
- **Monthly**: Read 2 Books (+20 coins/book)

---

## 1-Tap Habit Logging & Dedicated Log Activity Page (`#log-activity`)
- Dedicated **Log Activity** tab/page (`#log-activity`) optimized for fast 1-tap logging with zero friction.
- Prominent **Quick Habits (Favorites ⭐️)** grid at the top of Log Activity for single-tap execution.
- Real-time search bar and tag filter chips (`Work`, `Health`, `Career`, `Music`, etc.).
- Micro-animations (flying coin towards Treasury Jar).
- Increases user's total Coin Balance in real time and enforces frequency period limits.

---

## Reward Store & Item Management (CRUD)
User can:
- View available rewards in the **Reward Store**.
- Search and filter rewards by search input and category chips (`Snacks`, `Break`, `Entertainment`, `Custom`).
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
- Switch between Theme modes.
- Choose celebration animation style: Confetti, Golden Coin Shower, Fireworks, Starburst.
- Toggle Web Audio API sound effects.
- Export & Import JSON data backup.
