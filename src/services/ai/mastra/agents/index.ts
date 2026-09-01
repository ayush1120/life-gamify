import { LIFE_GAMIFY_TOOLS, MastraToolDefinition } from '../tools';
import { getLLMProvider } from '../../llmService';
import { loadStoredSettings } from '../../../storage';

export interface MastraAgentConfig {
  id: string;
  name: string;
  instructions: string;
  tools: Record<string, MastraToolDefinition>;
}

export class MastraAgent {
  public id: string;
  public name: string;
  public instructions: string;
  public tools: Record<string, MastraToolDefinition>;

  constructor(config: MastraAgentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.instructions = config.instructions;
    this.tools = config.tools;
  }

  public async generate(prompt: string, context?: { userId?: string; history?: { role: string; content: string }[] }) {
    // Prepare context by evaluating relevant tools
    let contextualData = '';
    try {
      if (this.tools.getUserProgressTool) {
        const progress = await this.tools.getUserProgressTool.execute({}, context);
        contextualData += `\n[Player Stats]: Level ${progress.level}, Total XP: ${progress.totalXp}, Coins: ${progress.coinBalance}, Streak: ${progress.currentStreak} days`;
      }
      if (this.tools.getHabitsTool) {
        const habits = await this.tools.getHabitsTool.execute({ activeOnly: true }, context);
        contextualData += `\n[Active Habits]: ${habits.map((h: any) => `${h.icon} ${h.name} (${h.rewardValue} coins)`).join(', ')}`;
      }
      if (this.tools.getQuestsTool) {
        const quests = await this.tools.getQuestsTool.execute({ status: 'active' }, context);
        if (quests.length > 0) {
          contextualData += `\n[Active Quests]: ${quests.map((q: any) => `${q.title} (${q.xpReward} XP, ${q.coinReward} Coins)`).join(', ')}`;
        }
      }
    } catch (err) {
      console.warn('[MastraAgent] Non-critical context resolution warning:', err);
    }

    let responseText = '';
    const settings = loadStoredSettings();
    const provider = getLLMProvider(settings.aiSettings);
    if (provider) {
      const messages = [
        { role: 'system' as const, content: `${this.instructions}\n\nContext Data:${contextualData}` },
        ...(context?.history || []).map(h => ({ role: h.role as any, content: h.content })),
        { role: 'user' as const, content: prompt }
      ];
      responseText = await provider.chat(messages);
    } else {
      responseText = `⚔️ **${this.name}**: Greetings, adventurer! Based on your current stats (${contextualData.trim() || 'Level 1'}), keep your daily habit momentum strong!`;
    }

    return {
      text: responseText,
      agentId: this.id,
      agentName: this.name,
      timestamp: new Date().toISOString()
    };
  }
}

// 1. Conversational RPG Game Master Chat Agent
export const chatAgent = new MastraAgent({
  id: 'chat-agent',
  name: 'Game Master Chat Agent',
  instructions: `You are the legendary AI Game Master of Life Gamify. 
You guide the player with wisdom, strategic habit coaching, and RPG lore. 
Provide concise, motivational, and tailored advice based on their current level, stats, and active quests.`,
  tools: {
    getUserProgressTool: LIFE_GAMIFY_TOOLS.getUserProgressTool,
    getHabitsTool: LIFE_GAMIFY_TOOLS.getHabitsTool,
    getActivityLogsTool: LIFE_GAMIFY_TOOLS.getActivityLogsTool,
    getQuestsTool: LIFE_GAMIFY_TOOLS.getQuestsTool,
    getBossesTool: LIFE_GAMIFY_TOOLS.getBossesTool,
    getAchievementsTool: LIFE_GAMIFY_TOOLS.getAchievementsTool
  }
});

// 2. Progress & Consistency Analysis Agent
export const progressAgent = new MastraAgent({
  id: 'progress-agent',
  name: 'Progress & Consistency Agent',
  instructions: `You are the analytical Progress Evaluator for Life Gamify. 
Analyze recent activity logs, identify streak risks, evaluate stat imbalances, and generate progression insights.`,
  tools: {
    getUserProgressTool: LIFE_GAMIFY_TOOLS.getUserProgressTool,
    getActivityLogsTool: LIFE_GAMIFY_TOOLS.getActivityLogsTool,
    getHabitsTool: LIFE_GAMIFY_TOOLS.getHabitsTool
  }
});

// 3. Quest & Boss Encounter Generation Agent
export const questAgent = new MastraAgent({
  id: 'quest-agent',
  name: 'Quest & Boss Generation Agent',
  instructions: `You are the Quest Architect for Life Gamify. 
Generate balanced, inspiring quests and raid boss encounters tailored to the player's weakest stats and current habits.`,
  tools: {
    getUserProgressTool: LIFE_GAMIFY_TOOLS.getUserProgressTool,
    getHabitsTool: LIFE_GAMIFY_TOOLS.getHabitsTool,
    createQuestTool: LIFE_GAMIFY_TOOLS.createQuestTool,
    createBossTool: LIFE_GAMIFY_TOOLS.createBossTool
  }
});

export const LIFE_GAMIFY_AGENTS = {
  chatAgent,
  progressAgent,
  questAgent
};
