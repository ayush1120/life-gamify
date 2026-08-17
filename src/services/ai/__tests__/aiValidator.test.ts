import { describe, it, expect } from 'vitest';
import { 
  validateGameMasterResponse, 
  convertProposalToQuest, 
  convertProposalToBoss,
  convertProposalToAchievement 
} from '../aiValidator';
import { GameMasterContext } from '../aiContract';
import { Habit } from '../../../types';

describe('Phase 9 & 10: AI Contract & Runtime Schema Validation', () => {
  const mockContext: GameMasterContext = {
    user: {
      level: 5,
      totalXp: 1200,
      statsBreakdown: {
        health: { level: 2, xp: 200, name: 'Health' },
        fitness: { level: 4, xp: 600, name: 'Fitness' },
        knowledge: { level: 3, xp: 300, name: 'Knowledge' },
        career: { level: 1, xp: 50, name: 'Career' },
        creativity: { level: 0, xp: 0, name: 'Creativity' },
        discipline: { level: 3, xp: 400, name: 'Discipline' },
        social: { level: 0, xp: 0, name: 'Social' }
      }
    },
    habits: [
      { id: 'h_gym', name: 'Gym', category: 'Fitness', frequency: 'daily', rewardValue: 6, active: true },
      { id: 'h_read', name: 'Read', category: 'Learning', frequency: 'daily', rewardValue: 4, active: true },
      { id: 'h_code', name: 'Code', category: 'Work', frequency: 'daily', rewardValue: 5, active: true }
    ],
    recentActivity: [],
    activeQuests: [],
    activeBoss: null
  };

  it('validates and accepts a compliant Game Master proposal', () => {
    const validRaw = {
      version: 'game-master-v1',
      summary: 'Focused challenge for technical and physical mastery.',
      activityMappings: [
        {
          habitId: 'h_gym',
          stats: [
            { stat: 'fitness', weight: 0.8 },
            { stat: 'discipline', weight: 0.2 }
          ]
        }
      ],
      quests: [
        {
          title: 'Iron Routine',
          description: 'Hit the gym 4 times this week.',
          type: 'weekly',
          difficulty: 'medium',
          requirements: [{ habitId: 'h_gym', targetCount: 4 }]
        }
      ],
      boss: {
        name: 'The Procrastination Golem',
        theme: 'Consistency',
        description: 'Chisel away the stone with regular coding and workouts.',
        relevantStats: ['fitness', 'career'],
        durationDays: 14,
        difficulty: 'medium'
      },
      achievements: [
        {
          name: 'Gym Apprentice',
          description: 'Log Gym 10 times.',
          icon: '🏋️',
          requirements: [{ habitId: 'h_gym', targetCount: 10, description: 'Log 10 workouts' }]
        }
      ],
      notifications: [
        {
          type: 'milestone',
          title: 'Streak Alert',
          message: 'You have logged consistently this week!'
        }
      ]
    };

    const result = validateGameMasterResponse(validRaw, mockContext);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.data?.quests).toHaveLength(1);
    expect(result.data?.boss?.name).toBe('The Procrastination Golem');
  });

  it('rejects hallucinated or invented habit IDs', () => {
    const invalidRaw = {
      quests: [
        {
          title: 'Ghost Habit Quest',
          description: 'Do nonexistent habit.',
          type: 'weekly',
          difficulty: 'easy',
          requirements: [{ habitId: 'h_nonexistent_habit_123', targetCount: 3 }]
        }
      ]
    };

    const result = validateGameMasterResponse(invalidRaw, mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('unknown habitId'))).toBe(true);
  });

  it('rejects arbitrary or unsupported stat IDs', () => {
    const invalidRaw = {
      activityMappings: [
        {
          habitId: 'h_gym',
          stats: [
            { stat: 'magic_power', weight: 1.0 }
          ]
        }
      ]
    };

    const result = validateGameMasterResponse(invalidRaw, mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('invalid stat'))).toBe(true);
  });

  it('enforces maximum limit bounds (max 3 quests)', () => {
    const rawOverLimit = {
      quests: [
        { title: 'Q1', description: 'D1', requirements: [{ habitId: 'h_gym', targetCount: 1 }] },
        { title: 'Q2', description: 'D2', requirements: [{ habitId: 'h_read', targetCount: 1 }] },
        { title: 'Q3', description: 'D3', requirements: [{ habitId: 'h_code', targetCount: 1 }] },
        { title: 'Q4', description: 'D4', requirements: [{ habitId: 'h_gym', targetCount: 1 }] }
      ]
    };

    const result = validateGameMasterResponse(rawOverLimit, mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('exceeding maximum limit of 3'))).toBe(true);
  });

  describe('Deterministic conversion functions', () => {
    const mockHabits: Habit[] = [
      {
        id: 'h_gym',
        name: 'Gym',
        rewardValue: 5,
        frequency: 'daily',
        active: true,
        icon: '🏋️',
        color: '#ff0000',
        order: 0,
        createdAt: '',
        updatedAt: ''
      }
    ];

    it('calculates deterministic quest rewards based on requirements and difficulty', () => {
      const proposal = {
        title: 'Gym Master',
        description: 'Complete 4 workouts.',
        type: 'weekly' as const,
        difficulty: 'medium' as const,
        requirements: [{ habitId: 'h_gym', targetCount: 4 }]
      };

      // 4 * 5 coins = 20 base coins.
      // medium XP = 20 * 5 * 1.5 = 150 XP.
      // medium Coins = 20 * 1.25 = 25 coins.
      const quest = convertProposalToQuest(proposal, mockHabits);
      expect(quest.xpReward).toBe(150);
      expect(quest.coinReward).toBe(25);
      expect(quest.status).toBe('active');
      expect(quest.requirements[0].habitName).toBe('Gym');
    });

    it('calculates deterministic boss HP scaling with user level and duration', () => {
      const bossProp = {
        name: 'Sloth Titan',
        theme: 'Endurance',
        description: 'Outlast procrastination.',
        relevantStats: ['fitness' as const],
        durationDays: 30,
        difficulty: 'medium' as const
      };

      // Level 5 => levelMultiplier = 5 * 0.5 + 1 = 3.5.
      // Base HP 600 * 1 * 3.5 = 2100 HP.
      const boss = convertProposalToBoss(bossProp, 5);
      expect(boss.maxHp).toBe(2100);
      expect(boss.currentHp).toBe(2100);
      expect(boss.xpReward).toBe(Math.round(2100 * 1.5));
      expect(boss.coinReward).toBe(Math.round(2100 * 0.1));
    });

    it('calculates deterministic achievement properties from proposal', () => {
      const achProp = {
        name: 'Gym Legend',
        description: 'Complete 50 gym sessions',
        icon: '🏆',
        category: 'Fitness',
        requirements: [{ habitId: 'h_gym', targetCount: 50, description: '50 workouts' }]
      };
      const ach = convertProposalToAchievement(achProp);
      expect(ach.name).toBe('Gym Legend');
      expect(ach.xpReward).toBe(250);
      expect(ach.coinReward).toBe(30);
      expect(ach.status).toBe('locked');
    });
  });
});

