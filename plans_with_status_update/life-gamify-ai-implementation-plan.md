# Life Gamify --- AI-Powered RPG Evolution

## Updated Step-by-Step Implementation Plan

> **Core principle:** The user lives their life and logs what they do.
> Life Gamify turns those actions into a game without requiring the user
> to maintain an RPG database.

------------------------------------------------------------------------

# 1. Product Principles

## 1.1 Fast logging is sacred

The primary user interaction remains:

``` text
Open Log → Tap Activity → Done
```

No AI request should block activity logging.

## 1.2 Activity history is the source of truth

The activity ledger/history is authoritative.

XP, levels, stats, momentum, quest progress, boss damage, and similar
calculated state should be derived from authoritative activity/economic
data wherever practical.

## 1.3 AI proposes; the application decides

Never allow an LLM response to directly mutate authoritative game state.

``` text
AI
↓
Structured proposal
↓
Schema validation
↓
Business-rule validation
↓
Game engine
↓
Persist to Firebase
```

## 1.4 Deterministic mechanics

AI must never be responsible for:

-   XP earned
-   Level
-   Momentum
-   Streak
-   Quest progress
-   Boss HP/damage
-   Coin balance
-   Coin transactions
-   Historical activity
-   Reward redemption
-   Authoritative game-state calculations

## 1.5 User controls personal economics

Coins remain user-controlled.

The user decides:

``` text
Habit → Coin reward
Reward → Coin cost
```

AI may use those values when designing challenges, but should not
arbitrarily change them.

## 1.6 AI handles ambiguity and personalization

AI is responsible for:

-   Understanding what a habit represents
-   Mapping activities to supported life stats
-   Detecting meaningful patterns
-   Selecting combinations of existing activities
-   Creating personalized quest concepts
-   Creating boss concepts
-   Creating personalized achievement concepts
-   Creating titles/descriptions/narrative
-   Deciding whether a new challenge is worth presenting

## 1.7 AI is optional

Life Gamify must remain useful without an API key.

``` text
Without AI:
Activities → Coins → XP → Levels → Stats → Basic progression

With AI:
Activities + history → Personalized Game Master → Quests / Bosses / Achievements
```

------------------------------------------------------------------------

# 2. Target Architecture

``` text
                         USER
                          │
                          ▼
                    FAST LOGGING
                          │
                          ▼
                 ┌─────────────────┐
                 │ ACTIVITY LEDGER │
                 │  SOURCE TRUTH   │
                 └────────┬────────┘
                          │
             ┌────────────┴─────────────┐
             │                          │
             ▼                          ▼
   ┌────────────────────┐     ┌────────────────────┐
   │ DETERMINISTIC      │     │   AI GAME MASTER   │
   │ GAME ENGINE        │     │                    │
   │                    │     │ Life Model         │
   │ XP                 │     │ Activity Mapping   │
   │ Levels             │     │ Quest proposals    │
   │ Stats              │     │ Boss proposals     │
   │ Momentum           │     │ Achievement ideas  │
   │ Streaks            │     │ Narrative          │
   │ Quest progress     │     │                    │
   │ Boss damage        │     │                    │
   └─────────┬──────────┘     └─────────┬──────────┘
             │                          │
             │                   Structured output
             │                          │
             │                          ▼
             │                 ┌──────────────────┐
             │                 │ Schema Validator │
             │                 └────────┬─────────┘
             │                          │
             │                          ▼
             │                 ┌──────────────────┐
             │                 │ Business Rules   │
             │                 │ Validator        │
             │                 └────────┬─────────┘
             │                          │
             └────────────┬─────────────┘
                          ▼
                   ┌───────────────┐
                   │    FIREBASE   │
                   │  PERSISTENCE  │
                   └───────────────┘
```

------------------------------------------------------------------------

# 3. Entity Architecture

There are three important categories.

## 3.1 Reality entities

``` text
User
Habit
ActivityLog
Reward
CoinTransaction
```

These are authoritative.

## 3.2 Deterministic game entities/state

``` text
GameProgression
StatProgression
QuestProgress
BossProgress
AchievementProgress
Momentum
```

These are calculated by the game engine.

## 3.3 AI-generated entities

``` text
LifeModel
ActivityMapping
QuestDefinition
BossDefinition
AchievementDefinition
GameNotification
```

AI generates definitions/proposals, not authoritative progress.

------------------------------------------------------------------------

# 4. Critical Requirement --- AI-Generated Entities Are User-Owned

AI-generated user-facing entities must always support user control.

This applies especially to:

-   Quests
-   Bosses
-   Achievements

The user must be able to:

-   View
-   Dismiss
-   Archive
-   Remove where appropriate
-   Complete naturally

## Prefer archive over hard delete

For most game entities:

``` text
active
completed
archived
```

Example:

``` ts
type EntityStatus =
  | "active"
  | "completed"
  | "archived";
```

When a user rejects a quest:

``` text
status = "archived"
archivedBy = "user"
archivedAt = timestamp
```

The AI must not immediately recreate the same content.

Maintain enough history for the Game Master to understand that the user
rejected/suppressed it.

------------------------------------------------------------------------

# 5. Firebase Persistence Requirement

All persistent Life Gamify entities must support Firebase
persistence/synchronization.

Conceptually:

``` text
Local State
    ↕
Firebase
```

Possible structure:

``` text
users/
  {userId}/

    profile/
    habits/
      {habitId}
    activityLogs/
      {activityId}
    rewards/
      {rewardId}
    transactions/
      {transactionId}

    gameProgression/
      {progressionId}
    statProgression/
      {statId}

    quests/
      {questId}
    bosses/
      {bossId}
    achievements/
      {achievementId}

    lifeModel/
      {modelId}
    activityMappings/
      {mappingId}

    aiMetadata/
      {metadataId}
```

Use the existing Firebase architecture where possible rather than
creating a parallel persistence system.

------------------------------------------------------------------------

# 6. Entity Metadata

Persistent entities should have stable IDs and timestamps.

Common fields:

``` ts
type BaseEntity = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};
```

AI-generated entities should additionally support:

``` ts
type AIEntityMetadata = {
  source: "ai";
  aiModel?: string;
  promptVersion?: string;
  schemaVersion?: number;
  generatedAt?: string;
};
```

User-controlled lifecycle:

``` ts
archivedAt?: string;
archivedBy?: "user" | "system";
```

------------------------------------------------------------------------

# 7. Important Persistence Rule

Firebase should persist entity definitions and necessary state, but the
deterministic engine should remain authoritative for calculated values.

Avoid unnecessary duplicated calculations.

For example, do not make AI responsible for:

``` text
quest.progress = 73%
```

Instead:

``` text
Firebase:
QuestDefinition

Activity history:
3 matching activities

Deterministic engine:
3 / 4 = 75%
```

------------------------------------------------------------------------

# 8. Phase 0 --- Establish the Current Baseline

Before adding RPG mechanics:

-   Inspect current `Habit` type.
-   Inspect activity logging.
-   Inspect ledger implementation.
-   Inspect coin calculation.
-   Inspect reward redemption.
-   Inspect persistence.
-   Inspect Firebase synchronization.
-   Identify current source-of-truth data.
-   Identify where habit completion is processed.
-   Identify where coin balances are calculated.

Create:

``` text
docs/game-engine-architecture.md
```

Document:

-   Current data model
-   Logging flow
-   Coin flow
-   Persistence flow
-   Firebase flow
-   Relevant services/components
-   Extension points for XP

Do not refactor the entire application yet.

------------------------------------------------------------------------

# 9. Phase 1 --- Separate Activity From Game Effects

Introduce an activity event abstraction:

``` ts
type ActivityEvent = {
  id: string;
  habitId: string;
  timestamp: string;
};
```

The game engine processes:

``` text
ActivityEvent
    ↓
GameEffect
```

Conceptually:

``` ts
type GameEffect = {
  coins: number;
  xp: number;
  statXp: Record<StatId, number>;
};
```

------------------------------------------------------------------------

# 10. Phase 2 --- Define Fixed Life Stats

Start with a controlled vocabulary:

``` text
health
fitness
knowledge
career
creativity
discipline
social
```

Do not allow AI or users to create arbitrary stats initially.

------------------------------------------------------------------------

# 11. Phase 3 --- Build Deterministic XP

XP must be mathematical and independent from AI.

Initial formula:

``` text
baseXP = coinReward × XP_MULTIPLIER
```

Start with:

``` text
XP_MULTIPLIER = 5
```

Examples:

``` text
1 coin  → 5 XP
5 coins → 25 XP
10 coins → 50 XP
```

Keep the formula centralized so it can later be tuned.

------------------------------------------------------------------------

# 12. Phase 4 --- Build Deterministic Level Progression

Store:

``` text
totalXp
```

as the authoritative progression value.

Derive:

``` ts
getLevelFromXp(totalXp)
getLevelProgress(totalXp)
```

A starting curve could be:

``` text
required XP ≈ 100 × level^1.5
```

Requirements:

-   Deterministic
-   Monotonically increasing
-   Easy to test
-   Easy to rebalance

------------------------------------------------------------------------

# 13. Phase 5 --- Character Progression UI

Add:

``` text
LEVEL 12

1,240 / 1,600 XP

████████░░░░
```

Keep it lightweight.

------------------------------------------------------------------------

# 14. Phase 6 --- Deterministic Stats

Stats are derived from XP generated by activities.

Example:

``` text
Study
→ Knowledge 80%
→ Career 20%
```

If the activity generates 25 XP:

``` text
Knowledge = 20 XP
Career = 5 XP
```

AI chooses the semantic mapping.

The game engine performs the calculation.

------------------------------------------------------------------------

# 15. Phase 7 --- Activity Mapping Entity

Create:

``` ts
type ActivityMapping = {
  habitId: string;
  stats: Array<{
    stat: StatId;
    weight: number;
  }>;
  source: "default" | "ai";
  confidence?: number;
};
```

Validate:

``` text
habit exists
stat exists
weights are valid
user owns habit
```

Persist accepted mappings to Firebase.

------------------------------------------------------------------------

# 16. Phase 8 --- Define AI Contract

Start with schemas, not prompts.

Conceptually:

``` ts
type GameMasterResponse = {
  version: number;
  activityMappings: ActivityMappingProposal[];
  quests: QuestProposal[];
  boss?: BossProposal;
  achievements: AchievementProposal[];
  notifications: NotificationProposal[];
};
```

Use strict enums for:

-   Stat IDs
-   Quest types
-   Difficulty
-   Boss types
-   Notification types
-   Priority

------------------------------------------------------------------------

# 17. Phase 9 --- Runtime Validation

Use a runtime validator such as Zod.

Pipeline:

``` text
LLM response
    ↓
JSON parse
    ↓
Schema validation
    ↓
Business validation
    ↓
Accepted proposal
```

If invalid:

``` text
Reject entire proposal
```

Do not partially mutate game state.

------------------------------------------------------------------------

# 18. Phase 10 --- AI Permission Boundaries

## AI can

-   Map habits to supported stats
-   Suggest quests
-   Suggest bosses
-   Suggest achievements
-   Generate names/descriptions
-   Detect patterns
-   Suggest notifications
-   Decide whether a new challenge is worthwhile

## AI cannot

-   Change coins
-   Change XP
-   Change level
-   Delete activity
-   Modify historical transactions
-   Create arbitrary stats
-   Invent habit IDs
-   Redeem rewards
-   Modify reward prices
-   Directly write authoritative progression
-   Automatically archive/remove user-facing entities

------------------------------------------------------------------------

# 19. Phase 11 --- Build AI Context

Provide:

### User

-   Level
-   Total XP
-   Current stats

### Habits

-   ID
-   Name
-   Category
-   Tags
-   Frequency
-   Coin reward
-   Active/inactive

### Recent activity

-   Last 14--30 days
-   Habit ID
-   Timestamp

### Current game

-   Active quests
-   Current boss
-   Recent achievements
-   Archived/rejected AI content where useful

### Configuration

-   Supported stats
-   Quest limits
-   Reward limits
-   Game rules

------------------------------------------------------------------------

# 20. Phase 12 --- Fixed Game Master Prompt

Core rules:

``` text
You are the Game Master for Life Gamify.

Create personalized game content using the user's existing activities.

Never require the user to manually create RPG data.

Prefer existing habits.

Never invent habit IDs.

Only use supported stats.

Never calculate XP, coins, level, momentum, streaks, or balances.

Never modify historical activity.

Never directly modify authoritative game state.

Never recreate content the user has explicitly archived unless
there is strong evidence that the user now wants it again.

Return only the supplied structured schema.

Generate at most:
- 3 active quests
- 1 active boss
- 3 achievement proposals
- 3 notifications

Only generate content when it provides meaningful value.
Avoid repetitive challenges.
```

Version:

``` text
game-master-v1
```

------------------------------------------------------------------------

# 21. Phase 13 --- User-Owned API Keys

For the prototype, support user-provided provider credentials.

Potential providers:

-   OpenAI
-   Gemini
-   Anthropic

Use:

``` ts
interface LLMProvider {
  generateGamePlan(
    context: GameMasterContext
  ): Promise<GameMasterResponse>;
}
```

Implement provider-specific adapters behind this interface.

For a browser-only prototype, clearly explain API-key implications.

For production, consider a backend proxy if stronger key protection is
required.

------------------------------------------------------------------------

# 22. Phase 14 --- AI Connection Test Interface

Add a dedicated **AI Test / Connection Test** access point inside
Settings.

The purpose is **not** to turn Life Gamify into a chat application.

It is a development/user-facing diagnostic tool that verifies:

1.  The selected provider is configured.
2.  The entered API key works.
3.  The selected model can be reached.
4.  Structured AI responses work.
5.  The application's schema validation works.
6.  The complete provider → structured response → validator pipeline
    works.

## Recommended UX

Settings:

``` text
AI Game Master
────────────────────────

Provider
[ OpenAI ▼ ]

API Key
[ ••••••••••••••• ]

Model
[ Selected model ]

[ Test AI Connection ]
```

After successful configuration:

``` text
✓ AI connection working

Provider: OpenAI
Model: ...
Structured output: ✓
Schema validation: ✓
```

If it fails:

``` text
✕ AI connection failed

Reason:
Authentication failed

[ Retry ]
```

Do not expose the full API key in logs, analytics, error messages, or
UI.

------------------------------------------------------------------------

# 23. AI Test Interface --- Minimal Chat-Style Diagnostic

The settings test can optionally provide a small **chat-like diagnostic
panel** after connection setup.

Important: this is a **testing access point**, not a product chatbot.

Example:

``` text
AI Connection Test

You:
Say hello and confirm that you can access the
configured Life Gamify AI provider.

AI:
✓ Connected successfully.

Provider: OpenAI
Model: ...
Structured output: working
```

Then allow a few predefined tests:

``` text
[ Test Connection ]

[ Test Structured Output ]

[ Test Activity Mapping ]

[ Test Quest Generation ]
```

This is better than an unrestricted chatbot because it tests the exact
capabilities Life Gamify needs.

------------------------------------------------------------------------

# 24. AI Test Interface --- Structured Test Mode

The most useful test is a real Life Gamify pipeline test.

For example:

``` text
Synthetic Test User

Habits:
- Run
- Study System Design
- Piano

Recent activity:
- Run × 3
- Study × 4
- Piano × 2
```

Click:

``` text
[ Generate Test Game Plan ]
```

Show:

``` text
Activity mappings
✓ Valid

Quest
✓ Valid

Boss
✓ Valid

Achievements
✓ Valid

Schema
✓ Valid

Business rules
✓ Valid
```

This lets you verify that the API key is not merely able to produce
text; it can actually produce **valid Life Gamify data**.

------------------------------------------------------------------------

# 25. AI Test Interface --- Do Not Persist Test Results

By default, test-generated entities should **not** be persisted to the
user's actual game.

Use:

``` text
TEST MODE
```

and clearly distinguish it from production generation.

This prevents accidentally creating:

-   Fake quests
-   Fake bosses
-   Fake achievements
-   Fake activity mappings

during API testing.

------------------------------------------------------------------------

# 26. Phase 15 --- Background AI Execution

Do not call AI after every tap.

Initial approach:

``` text
AI refresh ≈ once per day
```

Potential triggers:

``` text
First AI activation
OR
New habit added
OR
Significant new activity
OR
Current quest completed
OR
Boss completed
OR
24+ hours since last analysis
```

For the current prototype, running the refresh when the app opens can be
sufficient.

------------------------------------------------------------------------

# 27. Phase 16 --- Quest Definition

AI creates a `QuestDefinition`.

Example:

``` json
{
  "name": "Knowledge Run",
  "description": "Strengthen your technical knowledge this week.",
  "type": "weekly",
  "requirements": [
    {
      "habitId": "h123",
      "targetCount": 4
    }
  ],
  "difficulty": "medium"
}
```

AI does not generate:

``` text
currentProgress
completed
xpReward
coinReward
```

Those are deterministic.

------------------------------------------------------------------------

# 28. Phase 17 --- Quest State

Quest state is calculated from activity history.

``` text
requiredCount = 4
completedCount = activityCount(h123, week)
progress = completedCount / requiredCount
```

Persist the quest definition and lifecycle metadata to Firebase.

The user can:

``` text
complete
archive
dismiss
```

An archived quest is no longer active.

------------------------------------------------------------------------

# 29. Phase 18 --- Quest Reward Mathematics

AI may propose difficulty:

``` text
easy
medium
hard
```

The engine determines the reward.

Example:

``` text
questXP =
    sum(baseXP of required activities)
    × difficultyMultiplier
```

and:

``` text
questCoins =
    sum(baseCoinReward of required activities)
    × questBonusMultiplier
```

------------------------------------------------------------------------

# 30. Phase 19 --- Boss Definition

AI creates a boss concept.

Example:

``` json
{
  "name": "The Knowledge Beast",
  "description": "A challenge around your technical growth.",
  "relevantStats": [
    "knowledge",
    "career"
  ],
  "durationDays": 30
}
```

AI proposes:

-   Name
-   Description
-   Relevant supported stats
-   Theme
-   Duration
-   Difficulty

The deterministic engine calculates:

-   HP
-   Damage
-   Progress
-   Completion
-   Rewards

------------------------------------------------------------------------

# 31. Phase 20 --- Boss State

Example:

``` text
Boss maximum HP = deterministic formula
Boss damage = relevant stat XP
Remaining HP = maximum HP - accumulated damage
```

The user can archive/dismiss a boss.

Archived bosses should not remain active.

Do not immediately regenerate an equivalent boss.

------------------------------------------------------------------------

# 32. Phase 21 --- Achievement Definition

AI can generate personalized achievements.

Example:

``` json
{
  "name": "The Multi-Instrumentalist",
  "description": "Develop your musical range.",
  "requirements": [
    {
      "habitId": "piano",
      "count": 10
    },
    {
      "habitId": "guitar",
      "count": 10
    }
  ]
}
```

The engine determines completion.

The user can archive/dismiss the achievement.

Persist it to Firebase.

------------------------------------------------------------------------

# 33. Phase 22 --- Achievement State

Keep definition separate from progress.

``` text
Achievement definition:
Complete Piano 10 times

Current state:
Piano 7/10
```

The progress is calculated from actual activity.

------------------------------------------------------------------------

# 34. Phase 23 --- Game Notifications

AI can propose deterministic-looking notifications.

Example:

``` json
{
  "type": "milestone",
  "title": "You're on a roll",
  "message": "You've completed more learning sessions this week than usual.",
  "priority": "medium"
}
```

The app decides whether and when to display it.

Avoid:

``` text
"AI thinks..."
```

The user should experience the notification as part of the game.

------------------------------------------------------------------------

# 35. Phase 24 --- User Control UX

Every user-facing AI entity should have an obvious action:

``` text
⋯
Archive
Dismiss
```

Example:

``` text
⚔️ KNOWLEDGE RUN

Complete Study 4 times.

3 / 4

[ Continue ]     [ ⋯ ]
```

Menu:

``` text
Archive Quest
```

Likewise:

``` text
🐉 BOSS
[ Archive ]
```

and:

``` text
🏆 ACHIEVEMENT
[ Archive ]
```

Archived entities remain available in history if useful.

------------------------------------------------------------------------

# 36. Phase 25 --- Firebase Sync

Every persistent entity must support:

``` text
Create
Read
Update
Archive
Sync
```

Synchronization should preserve:

-   Stable IDs
-   Timestamps
-   User ownership
-   Status
-   AI metadata
-   Local/remote reconciliation

AI-generated entities must behave like normal application entities after
acceptance.

------------------------------------------------------------------------

# 37. Phase 26 --- Prevent AI Repetition

Store rejection/archive information.

For example:

``` text
questId
archivedAt
archivedBy
reason?
```

A reason does not need to be mandatory.

Provide the AI with compact history such as:

``` text
Previously archived:
- "Study 3 times this week"
- "Knowledge Run"
```

The AI should avoid repeatedly proposing substantially identical
content.

------------------------------------------------------------------------

# 38. Phase 27 --- Deterministic Pop-Ups

Examples:

``` text
🎉 LEVEL UP!

Level 12 → Level 13
```

``` text
⚔️ QUEST COMPLETE

Knowledge Run

+150 XP
+25 Coins
```

``` text
🐉 BOSS DEFEATED

The Knowledge Beast

+500 XP
```

No chat UI is required in the normal product flow.

AI remains background infrastructure.

------------------------------------------------------------------------

# 39. Phase 28 --- Evaluation Harness

A harness is worthwhile, but the first version should stay small.

Create approximately 30 synthetic users with very different activity
patterns.

Examples:

### Fitness

``` text
Running
Gym
Cycling
Walking
```

### Music

``` text
Piano
Guitar
Music Theory
```

### Engineering

``` text
LeetCode
System Design
Reading
Mock Interview
```

### Creative

``` text
Drawing
Photography
Video Editing
```

### Mixed

``` text
Gym
Reading
Piano
Study
Meditation
```

------------------------------------------------------------------------

# 40. Harness --- Structural Tests

Automatically check every AI response:

``` text
✓ Valid JSON
✓ Schema valid
✓ Valid stat IDs
✓ Valid habit IDs
✓ Valid quest types
✓ Valid boss types
✓ Valid achievement requirements
✓ Reward bounds valid
✓ Quest count within limit
✓ Boss count within limit
✓ No historical mutations
✓ No arbitrary stats
✓ No unauthorized entity mutations
```

------------------------------------------------------------------------

# 41. Harness --- Quality Evaluation

Evaluate:

``` text
Relevance
Personalization
Variety
Difficulty
Usefulness
Novelty
Consistency
```

Initially, manually inspect outputs.

Later, an evaluator model can assist with scoring.

The evaluator must not approve production state.

------------------------------------------------------------------------

# 42. Harness --- Regression Testing

Store:

``` text
input context
+
expected characteristics
+
previous output
+
evaluation score
```

Whenever you change:

-   Prompt
-   Model
-   Schema
-   Game rules

run the same synthetic dataset.

------------------------------------------------------------------------

# 43. Phase 29 --- AI Cost Controls

Track:

``` text
lastAnalysisAt
activityCountAtLastAnalysis
promptTokens
completionTokens
provider
model
```

Example:

``` text
If:
    less than 24h
AND
    fewer than 3 new activities
AND
    no major game event

Then:
    skip AI
```

------------------------------------------------------------------------

# 44. Phase 30 --- AI Versioning

Store:

``` text
aiProvider
aiModel
promptVersion
schemaVersion
generatedAt
```

This enables debugging and regression analysis.

------------------------------------------------------------------------

# 45. Phase 31 --- Disposable AI Interpretation

AI interpretation should be replaceable.

``` text
REALITY
Activity history
    ↓
Deterministic engine
    ↓
AUTHORITATIVE GAME STATE


AI INTERPRETATION
Life model
Activity mappings
Quest proposals
Boss proposals
Achievement proposals
    ↓
Can be regenerated
```

Changing:

``` text
game-master-v1
```

to:

``` text
game-master-v2
```

must not corrupt activity history or deterministic progression.

------------------------------------------------------------------------

# 46. Phase 32 --- UI Evolution

## Dashboard

Show:

``` text
Level
XP progress
Momentum
Top stats
Current quest
Current boss
```

## Log

Keep it extremely fast.

Do not add RPG configuration here.

## Progress

Show:

``` text
Character
Stats
Achievements
Level history
```

## Adventure

Show:

``` text
Quests
Boss
Challenges
```

## Store

Keep the user's personal rewards and economics.

------------------------------------------------------------------------

# 47. Recommended User Flow

## Morning

``` text
LEVEL 17
████████░░ 82%

🔥 Momentum 76

TODAY

🏃 Run
📚 Study
🎹 Piano
```

## User logs an activity

Tap:

``` text
🏃 Run
```

Immediately:

``` text
+5 🪙
+25 XP
+20 Fitness XP
🔥 Momentum +2
⚔️ Boss -20 HP
```

No AI request.

## Background AI refresh

``` text
AI Game Master
↓
Reads recent activity
↓
Understands patterns
↓
Proposes:
    Weekly quest
    Boss
    Achievement
```

Application validates everything.

## Next app open

``` text
⚔️ NEW QUEST

THE ENDURANCE RUN

Complete 3 runs this week.

██████░░░░

Reward:
+100 XP
+20 Coins
```

The user never configured it.

------------------------------------------------------------------------

# 48. Implementation Order

Build in this exact sequence:

``` text
01. Document current architecture
02. Define ActivityEvent abstraction
03. Define fixed StatId vocabulary
04. Implement XP calculation
05. Implement Level calculation
06. Add XP to activity processing
07. Add Level UI
08. Implement deterministic stat XP
09. Add character/stat UI
10. Define AI schemas
11. Add runtime validation
12. Define AI permission boundaries
13. Build Game Master context builder
14. Build provider abstraction
15. Add user API-key configuration
16. Add Settings AI Connection Test
17. Add structured-output diagnostic tests
18. Build first Game Master prompt
19. Build AI response validation pipeline
20. Build AI refresh mechanism
21. Build AI activity-to-stat mapping
22. Build deterministic quest engine
23. Build deterministic quest rewards
24. Build quest UI
25. Build boss engine
26. Build boss UI
27. Build deterministic achievements
28. Build AI-generated achievement proposals
29. Build deterministic game notifications
30. Build synthetic-user dataset
31. Build structural evaluation harness
32. Build quality evaluation process
33. Add regression tests
34. Add AI cost controls
35. Add prompt/model/schema versioning
36. Polish dashboard
37. Run real-world testing
38. Tune XP/momentum/reward formulas
```

------------------------------------------------------------------------

# 49. Do Not Build Yet

Avoid these until the core loop is validated:

-   Full chat product
-   AI chatbot as a primary UX
-   Autonomous agent loops
-   Multi-agent architecture
-   Complex skill trees
-   User-created quests
-   User-created bosses
-   User-configured character classes
-   Leaderboards
-   Multiplayer
-   Social features
-   AI-generated habits by default
-   AI-controlled XP
-   AI-controlled coin balance
-   AI-controlled level
-   AI-controlled momentum

The **Settings AI Test** is an exception: it is a diagnostic/development
interface, not a product chatbot.

------------------------------------------------------------------------

# 50. Most Important Architectural Boundary

``` text
                    REAL LIFE
                       │
                       ▼
                Activity Logging
                       │
                       ▼
               ACTIVITY LEDGER
                SOURCE OF TRUTH
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
       GAME ENGINE          AI GAME MASTER
             │                   │
       XP / Levels         Interpretation
       Coins               Personalization
       Momentum            Quests
       Progress            Boss concepts
       Stats               Achievements
             │                   │
             │              Structured
             │               proposals
             │                   │
             │                   ▼
             │              Validation
             │                   │
             └─────────┬─────────┘
                       ▼
                   GAME WORLD
```

### Central rule

> **The deterministic engine makes Life Gamify a game; AI makes the game
> personal.**

------------------------------------------------------------------------

# 51. Definition of Success

The feature is successful if a new user can:

1.  Create a few habits.
2.  Log them with one tap.
3.  Automatically accumulate XP.
4.  Automatically level up.
5.  See meaningful life stats.
6.  Eventually receive personalized quests.
7.  Eventually encounter personalized bosses.
8.  Receive satisfying deterministic notifications.
9.  Never need to understand how the AI works.
10. Never need to maintain an RPG database.
11. Test their configured AI provider from Settings.
12. See a clear success/failure result when testing the provider.
13. Archive AI-generated content whenever they want.

The desired reaction is:

> **"I don't know how this app figured out what challenge I should do
> next, but this is exactly what I needed to work on."**

Not:

> "I have to configure my character before I can use this."

------------------------------------------------------------------------

# 52. First Milestone

Do not attempt the entire roadmap initially.

The first implementation milestone should be:

``` text
Habit
 ↓
Activity Log
 ↓
Coins
 ↓
XP
 ↓
Level
 ↓
6–7 Stats
 ↓
Character UI
```

Then:

``` text
Settings
 ↓
API Key
 ↓
Test Connection
 ↓
Test Structured Output
 ↓
Test Game Master
```

Once that is stable:

``` text
AI
 ↓
Activity interpretation
 ↓
Structured proposals
 ↓
Validation
 ↓
One personalized quest
```

Then:

``` text
Quest
 ↓
Deterministic progress
 ↓
Deterministic reward
 ↓
Firebase persistence
 ↓
User archive/remove
```

Then:

``` text
Boss
 ↓
Deterministic damage/progress
 ↓
Firebase persistence
 ↓
User archive/remove
```

Then:

``` text
Achievements
 ↓
Personalization
 ↓
Firebase persistence
 ↓
User archive/remove
```

This keeps every phase incremental and testable.

------------------------------------------------------------------------

# Final Architecture

``` text
              LIFE
                │
                ▼
          FAST LOGGING
                │
                ▼
         ACTIVITY LEDGER
                │
       ┌────────┴────────┐
       │                 │
       ▼                 ▼
DETERMINISTIC        AI GAME MASTER
   ENGINE                  │
       │            Structured proposals
       │                   │
       │              Validation layer
       │                   │
       │                   ▼
       │              Personalized
       │                content
       │                   │
       └─────────┬─────────┘
                 ▼
              GAME WORLD

XP • Levels • Stats • Momentum
Quests • Bosses • Achievements
                 │
                 ▼
              FIREBASE
                 ↕
            Local State
```

## The final responsibility split

**User**

-   Logs activities quickly
-   Defines personal coin economics
-   Creates/manages rewards
-   Can archive/remove AI-generated content
-   Optionally supplies an AI API key

**Deterministic Game Engine**

-   XP
-   Levels
-   Momentum
-   Streaks
-   Stat XP
-   Coin calculations
-   Quest progress
-   Boss damage
-   Achievement progress
-   Rewards

**AI Game Master**

-   Understands activities
-   Maps activities to supported stats
-   Detects patterns
-   Generates quest definitions
-   Generates boss definitions
-   Generates achievement definitions
-   Generates game narrative
-   Suggests notifications

**Validation Layer**

-   Enforces schemas
-   Enforces enums
-   Validates IDs
-   Enforces bounds
-   Prevents unauthorized mutations
-   Rejects invalid AI output

**Firebase**

-   Persists all persistent entities
-   Synchronizes state
-   Preserves stable IDs and lifecycle metadata
-   Stores AI metadata/versioning

> **User effort stays tiny. Game mechanics stay deterministic. AI stays
> replaceable and bounded. Firebase keeps the experience persistent.**
