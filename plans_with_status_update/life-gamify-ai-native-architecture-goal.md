# Life Gamify — Recommended AI & Native Architecture Goal

## Objective

Build Life Gamify with a clean separation between:

- **Shared application layer** — React/TypeScript UI and business logic
- **AI orchestration layer** — Mastra-based agents, tools, and workflows
- **Native platform layers** — iOS/Swift and Android/Kotlin capabilities
- **Persistence layer** — Firebase

The architecture must allow Life Gamify to use Mastra for complex AI/tool-calling/automation while independently using native platform AI capabilities such as Apple's Foundation Models.

---

## Repository Architecture

Maintain the existing separate-repository architecture:

```text
Life Gamify
├── main application repository
│   ├── React application
│   ├── shared TypeScript/domain code
│   ├── AI / Mastra
│   └── Firebase/application services
│
├── life-gamify-ios
│   └── Swift / native iOS layer
│
└── life-gamify-android
    └── Kotlin / native Android layer
```

### Hard boundary

**Mastra belongs in the main application repository.**

Do not put Mastra inside the iOS or Android repositories.

The native repositories are responsible for platform-specific capabilities. Mastra is responsible for application-level AI orchestration.

---

# Target Architecture

```text
                         LIFE GAMIFY
                              │
             ┌────────────────┼────────────────┐
             │                │                │
        Shared App         AI Layer        Native Layers
             │                │                │
          React/TS          Mastra       ┌─────┴─────┐
             │                │           │           │
       UI + Business      Agents        iOS       Android
          Logic            Tools          │           │
             │            Workflows      Siri       Native
             │                │          Apple      APIs
             │                │       Foundation
             │                │         Models
             └────────────────┼────────────────┘
                              │
                           Firebase
```

---

# AI Access Point / Communication Boundary

The Mastra layer must have a **proper, explicit application access point** so the React application and future clients can communicate with the AI layer without importing or depending on Mastra internals.

The recommended flow is:

```text
React / Client
      ↓
Life Gamify AI API / Gateway
      ↓
Mastra
      ↓
Agents / Tools / Workflows
      ↓
Application Services
      ↓
Firebase
```

For example, expose a dedicated AI API namespace such as:

```text
/api/ai/chat
/api/ai/analyze-progress
/api/ai/generate-quest
```

The exact framework and routing mechanism should follow the existing main application's backend/API architecture.

### Chat must use this access point

A user-facing AI chat should work conceptually as:

```text
User
 ↓
React Chat UI
 ↓
AI client/service
 ↓
POST /api/ai/chat
 ↓
Mastra Chat Agent
 ↓
Tools (when required)
 ↓
Application Services
 ↓
Firebase
 ↓
Mastra response
 ↓
AI API
 ↓
React
 ↓
User
```

The client should send a structured request containing the minimum required context, for example:

```ts
interface ChatRequest {
  conversationId?: string;
  message: string;
  // authenticated user identity should come from the
  // application's authentication/session mechanism
}
```

The server should resolve the authenticated user and retrieve authoritative Life Gamify context itself. Do not trust the client to supply authoritative user data, XP, quests, achievements, permissions, or other sensitive state.

### Streaming

The AI access point should be designed to support **streaming responses** for chat if the existing application stack supports it.

Conceptually:

```text
React Chat UI
      ↓
AI API
      ↓
Mastra
      ↓
stream tokens/events
      ↓
React Chat UI
```

This should allow the user to see the response progressively rather than waiting for the entire generation to complete.

### Tool-call events

The access point should also be capable of representing structured tool activity where useful.

For example:

```text
message_start
tool_call
tool_result
message_delta
message_complete
error
```

The exact event protocol should follow the application's existing conventions.

The important requirement is that tool execution remains server-side and controlled by Mastra/application services.

### Authentication and authorization

Every AI API request must use the application's existing authentication mechanism.

The AI gateway should:

1. Authenticate the request.
2. Resolve the Life Gamify user.
3. Establish the user's AI/application context.
4. Pass only the required context into Mastra.
5. Ensure every tool call executes under the correct user authorization.
6. Never allow the client to impersonate another user.

### Keep the API independent of Mastra

The public/client-facing contract should be a **Life Gamify AI API**, not a Mastra-specific API.

Prefer:

```text
POST /api/ai/chat
```

over exposing implementation-specific endpoints such as:

```text
POST /api/mastra/agent/...
```

This keeps Mastra replaceable in the future.

---

# Architectural Principles

## 1. React must not depend directly on Mastra internals

The React application should interact with an application-level AI interface through the dedicated AI API/access point.

```text
React
  ↓
AI Service interface
  ↓
Life Gamify AI API
  ↓
Mastra
```

React should never instantiate Mastra agents, import Mastra server modules, or contain Mastra-specific orchestration logic.

Do not expose Mastra-specific agent/workflow implementation details throughout the UI/business logic.

Example conceptual interface:

```ts
interface LifeGamifyAI {
  chat(input: ChatInput): Promise<ChatResult>;
  analyzeProgress(input: ProgressInput): Promise<ProgressResult>;
  generateQuest(input: QuestGenerationInput): Promise<QuestResult>;
}
```

The exact interface should follow the existing codebase conventions.

---

# 2. Establish canonical domain contracts

Create or consolidate canonical shared domain models/contracts for entities such as:

```text
User
Habit
ActivityLog
UserProgress
XP
Quest
Achievement
Boss
```

These contracts should be usable by:

- React/shared application code
- Mastra tools
- Native integration boundaries

The goal is that all layers agree on what a Life Gamify entity means without sharing implementation details.

---

# 3. Keep business rules outside the AI agents

AI agents should orchestrate application capabilities, but they must not become the source of truth for core business rules.

Use:

```text
Agent
  ↓
Tool
  ↓
Application service / domain logic
  ↓
Firebase
```

For example, the agent may decide to create a quest, but validation such as:

- valid quest structure
- valid XP values
- authorization
- entity constraints
- persistence rules

must remain enforced by application/domain services.

AI output must never bypass these rules.

---

# 4. Build typed Life Gamify tools for Mastra

Expose controlled tools for application operations.

Initial tool categories should include:

### User / Progress

```text
getUserProfile
getHabits
getActivityLogs
getProgress
getXP
```

### Quests

```text
getQuests
createQuest
updateQuest
archiveQuest
```

### Achievements

```text
getAchievements
createAchievement
archiveAchievement
```

### Bosses

```text
getBosses
createBoss
updateBoss
archiveBoss
```

### Activity

```text
logActivity
```

Do not give the model arbitrary direct Firebase/database access.

All mutations should pass through validated application services.

---

# 5. Build Mastra agents on top of the tools

The initial architecture should support agents such as:

```text
Chat Agent
Progress Agent
Quest Agent
```

Conceptually:

```text
                    Mastra
                      │
          ┌───────────┼───────────┐
          │           │           │
       Chat        Progress     Quest
       Agent        Agent       Agent
          │           │           │
          └───────────┼───────────┘
                      │
                    Tools
                      │
              Application Services
                      │
                   Firebase
```

Do not create a monolithic agent containing all Life Gamify behavior.

Prefer focused capabilities that can be composed.

---

# 6. Use Mastra workflows for automation

Mastra should also become the orchestration layer for multi-step AI workflows and automation.

Example:

```text
Daily Progress Analysis
        ↓
Fetch recent activity
        ↓
Analyze consistency
        ↓
Evaluate progression
        ↓
Determine whether intervention is useful
        ↓
Generate/update Life Gamify entities
        ↓
Persist through application tools
```

Potential future workflows include:

- daily progression analysis
- adaptive quest generation
- achievement generation
- boss progression
- habit-pattern analysis
- personalized challenges
- periodic AI coaching

Automations should use the same typed tools and application services as interactive AI.

---

# 7. Keep native AI separate from Mastra

Native AI capabilities must remain platform-specific.

## iOS

```text
React
  ↓
Native Bridge
  ↓
Swift
  ↓
Apple Foundation Models / iOS APIs
```

## Android

```text
React
  ↓
Native Bridge
  ↓
Kotlin
  ↓
Android-specific platform capabilities
```

Do not make Mastra responsible for invoking platform-specific native implementations.

Do not move native AI orchestration into the iOS/Android repositories.

---

# 8. Introduce an AI capability abstraction

The long-term application architecture should allow different AI implementations to satisfy different use cases.

Conceptually:

```text
                 AI Request
                     │
                     ▼
               AI Capability
                  Router
                /                   On-device       Mastra
             │               │
          Native          Server AI
```

Examples:

```text
Simple/private/low-latency task
    → native on-device model

Complex tool-calling workflow
    → Mastra

Scheduled automation
    → Mastra

OS-integrated functionality
    → native
```

The exact routing mechanism should be introduced only where justified; do not over-engineer it in the first milestone.

---

# 9. Security and credentials

Mastra/server-side AI infrastructure must own:

```text
Model/API credentials
Privileged tool execution
AI orchestration
Automation execution
Server-side validation
```

Do not ship privileged model/provider secrets inside the mobile application.

The client should communicate with authenticated application/AI APIs.

---

# 10. Keep Firebase as the persistence layer

Mastra should not introduce a second source of truth.

The intended flow is:

```text
AI
 ↓
Mastra Tool
 ↓
Application Service
 ↓
Firebase
```

Firebase remains the canonical persistence layer for Life Gamify application data.

---

# Implementation Order

Build in this order:

## Phase 1 — Understand existing architecture

Before changing code:

1. Inspect the main application repository.
2. Inspect the existing iOS native repository.
3. Inspect the existing Android native repository.
4. Read the existing architecture/documentation.
5. Identify current Firebase/data/application-service boundaries.
6. Identify existing native bridges/interfaces.
7. Identify existing AI-related code.
8. Avoid duplicating abstractions that already exist.

Do not replace existing architecture merely to match this document. Adapt the goal to the current codebase where appropriate.

---

## Phase 2 — Domain contracts

Establish or consolidate canonical shared contracts for:

- User
- Habit
- ActivityLog
- Progress
- XP
- Quest
- Achievement
- Boss

Ensure these contracts are suitable for both normal application logic and AI tool interfaces.

---

## Phase 3 — Application service layer

Ensure important application mutations and queries are accessible through clean application/domain services.

Examples:

```text
QuestService
AchievementService
BossService
ProgressService
ActivityService
```

Names should follow existing project conventions.

The important requirement is that AI tools do not manipulate Firebase directly.

---

## Phase 4 — AI Service boundary

Introduce the shared application-level AI interface.

React should depend on this interface rather than directly on Mastra implementation details.

---

## Phase 5 — Build the AI access point

Create the dedicated Life Gamify AI API/gateway in the main application repository.

At minimum, establish the chat access point:

```text
POST /api/ai/chat
```

The access point must:

- authenticate the user
- establish user/application context
- validate requests
- invoke the appropriate AI capability
- support streaming where practical
- return structured errors
- keep Mastra implementation details server-side

Add additional AI endpoints only when there is a concrete capability that benefits from a separate contract.

---

## Phase 6 — Integrate Mastra

Add Mastra to the main application repository.

Create a clear AI module/package structure for:

```text
agents/
tools/
workflows/
models/
context/
```

Adapt naming and placement to existing repository conventions.

The AI API should invoke this Mastra layer internally.

---

## Phase 11 — Implement tools

Implement the first set of strongly typed Life Gamify tools.

Every tool must:

1. Validate input.
2. Enforce authorization/context.
3. Call application/domain services.
4. Persist/read through the existing Firebase layer.
5. Return structured results.
6. Never expose unrestricted database access to the model.

---

## Phase 7 — Implement the first agent

Start with a focused Life Gamify chat/assistant capability.

It should be able to:

- understand user requests
- retrieve relevant Life Gamify context
- call appropriate tools
- perform multi-step operations where necessary
- return a useful user-facing response

Do not build every agent at once.

---

## Phase 8 — Add workflows and automation

Once the tool and agent architecture is stable, add Mastra workflows for multi-step and scheduled AI behavior.

Prioritize workflows that provide real Life Gamify value rather than building framework infrastructure for its own sake.

---

## Phase 9 — Native bridges

Continue/complete the existing native architecture independently:

```text
React
  ↕
Native bridge
  ↕
iOS / Android native capabilities
```

Expose only narrow, stable interfaces to the shared application.

---

## Phase 10 — Native Foundation Model integration

For iOS, integrate Apple's Foundation Models through the native Swift layer where appropriate.

The shared React application should see a capability/interface, not Apple's framework implementation details.

Do not make the Mastra architecture dependent on Apple's Foundation Models.

---

# Definition of Done

The architecture is successful when:

- Mastra exists in the main application repository.
- A dedicated Life Gamify AI API/access point exists for client communication.
- The chat experience can communicate with Mastra through that access point.
- The AI API authenticates users and establishes the correct Life Gamify context.
- Streaming AI responses are supported where practical.
- iOS and Android remain independent native repositories.
- React does not depend on Mastra implementation details.
- Mastra has typed Life Gamify tools.
- AI tools use application/domain services rather than direct unrestricted Firebase access.
- Firebase remains the canonical persistence layer.
- Agents can perform controlled tool calling.
- Mastra workflows can perform multi-step AI automation.
- Native iOS/Android capabilities remain independently accessible through native bridges.
- Apple Foundation Models can be used without coupling the shared application to iOS.
- AI implementation can evolve without requiring a rewrite of the UI.
- Core business rules remain deterministic and outside the LLM.
- The architecture is simple enough to operate without unnecessary microservices or infrastructure.

---

# Non-Goals

Do **not**:

- Put Mastra inside `life-gamify-ios`.
- Put Mastra inside `life-gamify-android`.
- Expose Mastra internals directly to React or native clients.
- Move core business logic into AI agents.
- Give LLMs unrestricted Firebase/database access.
- Make Apple Foundation Models the central AI architecture.
- Build a large microservice architecture prematurely.
- Create a complex AI router before there are multiple meaningful AI execution paths.
- Rewrite working native architecture just to introduce Mastra.
- Duplicate existing domain models or services unnecessarily.

---

# Guiding Principle

The final separation should be:

```text
React
= Product UI + application/business logic

Mastra
= AI orchestration + tool calling + agents + workflows + automation

Firebase
= Persistent application data

iOS / Android Native
= Platform capabilities and native AI
```

The system should make these boundaries explicit while keeping the implementation as small and incremental as possible.
