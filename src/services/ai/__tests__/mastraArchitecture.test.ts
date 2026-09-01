import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  HabitSchema, 
  QuestSchema 
} from '../../../domain/contracts';
import { HabitService } from '../../domain/habitService';
import { ActivityService } from '../../domain/activityService';
import { QuestService } from '../../domain/questService';
import { BossService } from '../../domain/bossService';
import { ProgressService } from '../../domain/progressService';
import { mastra, LIFE_GAMIFY_TOOLS } from '../mastra';
import { aiGateway, AIStreamEvent } from '../gateway/aiGateway';

describe('Life Gamify AI & Native Architecture Goal', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => {
        for (const key of Object.keys(store)) {
          delete store[key];
        }
      }
    });
  });

  describe('1. Canonical Domain Contracts', () => {
    it('validates a correct habit contract', () => {
      const habit = {
        id: 'h-1',
        name: 'Morning Meditation',
        icon: '🧘',
        rewardValue: 5,
        frequency: 'daily',
        active: true,
        color: '#3b82f6',
        order: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const parsed = HabitSchema.parse(habit);
      expect(parsed.name).toBe('Morning Meditation');
    });

    it('validates quest schema and constraints', () => {
      const quest = {
        id: 'q-1',
        title: 'Mindful Streak',
        description: 'Meditate 2 days in a row',
        type: 'daily',
        difficulty: 'easy',
        requirements: [{ habitId: 'h-1', targetCount: 2, currentCount: 0 }],
        xpReward: 50,
        coinReward: 5,
        status: 'active',
        createdAt: new Date().toISOString(),
        source: 'ai'
      };
      const parsed = QuestSchema.parse(quest);
      expect(parsed.xpReward).toBe(50);
    });
  });

  describe('2. Application Domain Services', () => {
    it('creates and manages habits via HabitService', async () => {
      const habit = await HabitService.createHabit({
        name: 'Read 20 Pages',
        rewardValue: 10,
        category: 'Learning'
      });
      expect(habit.id).toBeDefined();
      expect(habit.name).toBe('Read 20 Pages');

      const all = await HabitService.getHabits();
      expect(all.some(h => h.id === habit.id)).toBe(true);
    });

    it('logs activity and calculates progress deterministically', async () => {
      const habit = await HabitService.createHabit({
        name: 'Gym Cardio',
        rewardValue: 5
      });
      const log = await ActivityService.logActivity(habit.id);
      expect(log.rewardEarned).toBe(5);

      const progress = await ProgressService.calculateProgress();
      expect(progress.totalCoinsEarned).toBeGreaterThanOrEqual(5);
      expect(progress.totalXp).toBeGreaterThanOrEqual(50);
      expect(progress.level).toBeGreaterThanOrEqual(1);
    });

    it('creates and updates quests via QuestService', async () => {
      const quest = await QuestService.createQuest({
        title: 'Hydration Challenge',
        xpReward: 80,
        coinReward: 8
      });
      expect(quest.title).toBe('Hydration Challenge');

      const completed = await QuestService.updateQuestStatus(quest.id, 'completed');
      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBeDefined();
    });

    it('creates and damages raid bosses via BossService', async () => {
      const boss = await BossService.createBoss({
        name: 'Chronos',
        maxHp: 100,
        currentHp: 100
      });
      expect(boss.currentHp).toBe(100);

      const damaged = await BossService.damageBoss(boss.id, 40);
      expect(damaged.currentHp).toBe(60);
      expect(damaged.status).toBe('active');

      const defeated = await BossService.damageBoss(boss.id, 60);
      expect(defeated.currentHp).toBe(0);
      expect(defeated.status).toBe('defeated');
      expect(defeated.defeatedAt).toBeDefined();
    });
  });

  describe('3. Mastra Tools & AI Orchestration Layer', () => {
    it('executes getUserProgressTool calling ProgressService', async () => {
      const result = await LIFE_GAMIFY_TOOLS.getUserProgressTool.execute({});
      expect(result.level).toBeDefined();
      expect(result.totalXp).toBeDefined();
    });

    it('executes createQuestTool producing a mutation proposal awaiting user approval', async () => {
      const result = await LIFE_GAMIFY_TOOLS.createQuestTool.execute({
        title: 'Neural Flow',
        description: 'Focus for 30 minutes',
        type: 'daily',
        difficulty: 'medium',
        xpReward: 60,
        coinReward: 6,
        requirements: [{ habitId: 'h-test', targetCount: 1 }]
      });
      expect(result.proposed).toBe(true);
      expect(result.proposalId).toBeDefined();
      expect(result.proposal.status).toBe('pending');
    });

    it('executes dailyProgressAnalysisWorkflow', async () => {
      const workflowResult = await mastra.getWorkflow('daily-progress-analysis').execute();
      expect(workflowResult.success).toBe(true);
      expect(workflowResult.steps.length).toBeGreaterThan(0);
    });
  });

  describe('4. Life Gamify AI Gateway & Service Boundary', () => {
    it('streams events through aiGateway.streamChat', async () => {
      const events: AIStreamEvent[] = [];
      const response = await aiGateway.streamChat(
        { message: 'What are my stats?' },
        (event) => events.push(event)
      );

      expect(response.message).toBeDefined();
      expect(events.some(e => e.type === 'message_start')).toBe(true);
      expect(events.some(e => e.type === 'tool_call')).toBe(true);
      expect(events.some(e => e.type === 'message_complete')).toBe(true);
    });
  });
});
