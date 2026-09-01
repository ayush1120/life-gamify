import { z } from 'zod';
import { HabitService } from '../../../domain/habitService';
import { ActivityService } from '../../../domain/activityService';
import { QuestService } from '../../../domain/questService';
import { BossService } from '../../../domain/bossService';
import { AchievementService } from '../../../domain/achievementService';
import { ProgressService } from '../../../domain/progressService';
import { StatIdSchema, QuestDifficultySchema, QuestTypeSchema } from '../../../../domain/contracts';

export interface MastraToolDefinition<TInput = any, TOutput = any> {
  id: string;
  name: string;
  description: string;
  schema: z.ZodType<TInput>;
  execute: (input: TInput, context?: { userId?: string }) => Promise<TOutput>;
}

// ==========================================
// 1. USER / PROGRESS TOOLS
// ==========================================

export const getUserProgressTool: MastraToolDefinition = {
  id: 'getUserProgress',
  name: 'Get User Progress',
  description: 'Fetches the current user level, total XP, coin balance, current streak, and individual stat breakdown (Health, Discipline, Fitness, etc.).',
  schema: z.object({}),
  execute: async (_, context) => {
    return await ProgressService.calculateProgress(context?.userId);
  }
};

export const getHabitsTool: MastraToolDefinition = {
  id: 'getHabits',
  name: 'Get Habits',
  description: 'Fetches all active habits and daily activities configured by the player.',
  schema: z.object({
    activeOnly: z.boolean().optional().default(true)
  }),
  execute: async ({ activeOnly }, context) => {
    const habits = await HabitService.getHabits(context?.userId);
    return activeOnly ? habits.filter(h => h.active) : habits;
  }
};

export const getActivityLogsTool: MastraToolDefinition = {
  id: 'getActivityLogs',
  name: 'Get Activity Logs',
  description: 'Fetches recent habit completion logs with timestamps, coins earned, and streaks.',
  schema: z.object({
    limit: z.number().int().min(1).max(50).optional().default(20)
  }),
  execute: async ({ limit }, context) => {
    const logs = await ActivityService.getActivityLogs(context?.userId);
    return logs.slice(0, limit);
  }
};

// ==========================================
// 2. QUEST TOOLS
// ==========================================

export const getQuestsTool: MastraToolDefinition = {
  id: 'getQuests',
  name: 'Get Quests',
  description: 'Retrieves current active, completed, or archived player quests.',
  schema: z.object({
    status: z.enum(['active', 'completed', 'archived', 'all']).optional().default('active')
  }),
  execute: async ({ status }, context) => {
    const quests = await QuestService.getQuests(context?.userId);
    if (status === 'all') return quests;
    return quests.filter(q => q.status === status);
  }
};

export const createQuestTool: MastraToolDefinition = {
  id: 'createQuest',
  name: 'Create Quest',
  description: 'Generates a new tailored RPG quest with XP and Coin rewards to motivate habit consistency.',
  schema: z.object({
    title: z.string().min(3).max(100),
    description: z.string().min(5).max(500),
    type: QuestTypeSchema.default('daily'),
    difficulty: QuestDifficultySchema.default('medium'),
    xpReward: z.number().int().min(10).max(1000),
    coinReward: z.number().int().min(1).max(100),
    requirements: z.array(
      z.object({
        habitId: z.string(),
        habitName: z.string().optional(),
        targetCount: z.number().int().positive()
      })
    ).min(1)
  }),
  execute: async (input, context) => {
    return await QuestService.createQuest(input, context?.userId);
  }
};

export const updateQuestStatusTool: MastraToolDefinition = {
  id: 'updateQuestStatus',
  name: 'Update Quest Status',
  description: 'Marks a quest as completed or archived.',
  schema: z.object({
    questId: z.string().min(1),
    status: z.enum(['active', 'completed', 'archived', 'dismissed'])
  }),
  execute: async ({ questId, status }, context) => {
    return await QuestService.updateQuestStatus(questId, status, context?.userId);
  }
};

// ==========================================
// 3. BOSS ENCOUNTER TOOLS
// ==========================================

export const getBossesTool: MastraToolDefinition = {
  id: 'getBosses',
  name: 'Get Bosses',
  description: 'Retrieves active or previous raid boss encounters.',
  schema: z.object({
    activeOnly: z.boolean().optional().default(true)
  }),
  execute: async ({ activeOnly }, context) => {
    const bosses = await BossService.getBosses(context?.userId);
    return activeOnly ? bosses.filter(b => b.status === 'active') : bosses;
  }
};

export const createBossTool: MastraToolDefinition = {
  id: 'createBoss',
  name: 'Create Boss Encounter',
  description: 'Spawns a new epic raid boss encounter (e.g. Chronos the Time-Devourer) linked to habit progression.',
  schema: z.object({
    name: z.string().min(3),
    title: z.string().optional(),
    theme: z.string().default('⏳'),
    description: z.string(),
    relevantStats: z.array(StatIdSchema).min(1),
    maxHp: z.number().int().min(20).max(1000),
    durationDays: z.number().int().min(1).max(30),
    xpReward: z.number().int().min(50).max(2000),
    coinReward: z.number().int().min(5).max(200)
  }),
  execute: async (input, context) => {
    return await BossService.createBoss(input, context?.userId);
  }
};

export const damageBossTool: MastraToolDefinition = {
  id: 'damageBoss',
  name: 'Damage Boss',
  description: 'Applies damage to an active raid boss when player habits are completed.',
  schema: z.object({
    bossId: z.string().min(1),
    damage: z.number().int().positive()
  }),
  execute: async ({ bossId, damage }, context) => {
    return await BossService.damageBoss(bossId, damage, context?.userId);
  }
};

// ==========================================
// 4. ACHIEVEMENT TOOLS
// ==========================================

export const getAchievementsTool: MastraToolDefinition = {
  id: 'getAchievements',
  name: 'Get Achievements',
  description: 'Fetches player milestone achievements and unlock statuses.',
  schema: z.object({
    status: z.enum(['locked', 'unlocked', 'all']).optional().default('all')
  }),
  execute: async ({ status }, context) => {
    const achievements = await AchievementService.getAchievements(context?.userId);
    if (status === 'all') return achievements;
    return achievements.filter(a => a.status === status);
  }
};

export const createAchievementTool: MastraToolDefinition = {
  id: 'createAchievement',
  name: 'Create Achievement',
  description: 'Creates a new milestone achievement reward.',
  schema: z.object({
    name: z.string().min(3),
    description: z.string(),
    icon: z.string().default('🏆'),
    category: z.string().optional(),
    xpReward: z.number().int().min(10).max(1000),
    coinReward: z.number().int().min(1).max(100),
    requirements: z.array(
      z.object({
        description: z.string(),
        targetCount: z.number().int().positive().optional(),
        stat: StatIdSchema.optional()
      })
    )
  }),
  execute: async (input, context) => {
    return await AchievementService.createAchievement(input, context?.userId);
  }
};

// All available Life Gamify Mastra Tools
export const LIFE_GAMIFY_TOOLS = {
  getUserProgressTool,
  getHabitsTool,
  getActivityLogsTool,
  getQuestsTool,
  createQuestTool,
  updateQuestStatusTool,
  getBossesTool,
  createBossTool,
  damageBossTool,
  getAchievementsTool,
  createAchievementTool
};
