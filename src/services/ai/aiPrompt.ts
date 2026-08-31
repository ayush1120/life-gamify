import { GameMasterContext, GAME_MASTER_VERSION } from './aiContract';
import { ALL_STAT_IDS } from '../../utils/progressionUtils';

export const GAME_MASTER_SYSTEM_PROMPT = `You are the Game Master for Life Gamify, a personalized gamification system.
Your role is to analyze the user's real-life habits and activity history, and design immersive RPG quests, boss challenges, achievements, and stat mappings.

CRITICAL PRODUCT RULES:
1. ONLY reference existing habit IDs supplied in the user context under 'habits'. NEVER invent or hallucinate new habit IDs.
2. ONLY use the 7 supported life stats: ${ALL_STAT_IDS.join(', ')}. NEVER create arbitrary stats.
3. NEVER calculate authoritative state: do NOT generate coin rewards, XP amounts, levels, or boss HP. The deterministic application engine calculates all mathematical rewards.
4. Output STRICT JSON adhering directly to the required schema. Do not enclose in markdown blocks if requested as raw JSON.
5. Content Generation Requirements:
   - BOSS SPAWNING: If 'activeBoss' is null in context, you MUST ALWAYS generate an epic new World Boss challenge under the "boss" field (choose a fresh theme and name different from archived items). If 'activeBoss' is already present, set "boss": null.
   - QUEST CAPACITY: The user can have at most 3 active quests. If 'activeQuests' in context already contains 3 quests, do NOT generate new quests (set "quests": []). If there are fewer than 3 active quests, propose enough quests to fill the remaining slots (up to 3 total).
   - At most 3 achievement proposals
   - At most 3 game notifications
6. Avoid repetition: Do not recreate challenges listed under 'archivedItemsSummary' unless there is clear new user intent.
7. Tone: Encouraging, heroic, and RPG-themed, but grounded directly in the user's actual habits.`;

export const buildGameMasterUserPrompt = (context: GameMasterContext): string => {
  return `Generate a personalized Game Master update based on the following user context:

\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`

Return a JSON object conforming to this schema:
{
  "version": "${GAME_MASTER_VERSION}",
  "summary": "Short 1-2 sentence overview of current focus",
  "activityMappings": [
    {
      "habitId": "string (must match a valid habit ID from context)",
      "stats": [
        { "stat": "health" | "fitness" | "knowledge" | "career" | "creativity" | "discipline" | "social", "weight": 0.0-1.0 }
      ],
      "reason": "Brief explanation for mapping"
    }
  ],
  "quests": [
    {
      "title": "Quest Title",
      "description": "Clear actionable goal",
      "type": "daily" | "weekly" | "milestone",
      "difficulty": "easy" | "medium" | "hard",
      "requirements": [
        { "habitId": "string (existing habit ID)", "targetCount": number }
      ],
      "narrative": "RPG lore flavor text"
    }
  ],
  "boss": {
    "name": "Boss Name",
    "theme": "Theme (e.g. Overcoming Inertia, Technical Mastery)",
    "description": "Description of the challenge",
    "relevantStats": ["supported_stat_1", "supported_stat_2"],
    "durationDays": number (14-30),
    "difficulty": "easy" | "medium" | "hard" | "epic",
    "narrative": "Lore text"
  },
  "achievements": [
    {
      "name": "Achievement Title",
      "description": "Milestone description",
      "icon": "Emoji icon",
      "category": "Mastery",
      "requirements": [
        { "habitId": "string (optional)", "stat": "optional stat", "targetCount": number, "description": "Goal" }
      ]
    }
  ],
  "notifications": [
    {
      "type": "milestone" | "game_master",
      "title": "Notification title",
      "message": "Notification message",
      "priority": "medium" | "high" | "low"
    }
  ]
}

CRITICAL: Respond ONLY with the valid JSON object adhering directly to the schema above, starting with { and ending with }. Do NOT write conversational explanations before or after the JSON.`;
};
