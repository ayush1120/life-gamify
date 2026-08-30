import { describe, it, expect } from 'vitest';
import { computeQuestProgress, computeBossState, checkAchievementUnlock } from '../adventureUtils';
import { QuestDefinition, BossDefinition, AchievementDefinition, RewardLog, Habit, HabitStats } from '../../types';
import { getDefaultStatsBreakdown } from '../progressionUtils';

describe('Phase 16-22: Deterministic Adventure Mechanics (Quests, Bosses, Achievements)', () => {
  const mockHabits: Habit[] = [
    {
      id: 'h_gym',
      name: 'Gym',
      category: 'Fitness',
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

  describe('computeQuestProgress', () => {
    const dailyQuest: QuestDefinition = {
      id: 'q_daily',
      title: 'Daily Warrior',
      description: 'Log gym today',
      type: 'daily',
      difficulty: 'easy',
      requirements: [{ habitId: 'h_gym', targetCount: 1 }],
      xpReward: 30,
      coinReward: 6,
      status: 'active',
      createdAt: new Date().toISOString(),
      source: 'ai'
    };

    it('calculates daily quest progress accurately', () => {
      const now = new Date();
      const logs: RewardLog[] = [
        {
          id: 'l1',
          activityId: 'h_gym',
          habitName: 'Gym',
          icon: '🏋️',
          timestamp: now.toISOString(),
          rewardEarned: 5,
          unit: 'coins'
        }
      ];

      const progress = computeQuestProgress(dailyQuest, logs, now);
      expect(progress.isComplete).toBe(true);
      expect(progress.percentage).toBe(100);
      expect(progress.requirements[0].currentCount).toBe(1);
    });

    it('returns incomplete when no logs for today', () => {
      const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
      const logs: RewardLog[] = [
        {
          id: 'l1',
          activityId: 'h_gym',
          habitName: 'Gym',
          icon: '🏋️',
          timestamp: yesterday.toISOString(),
          rewardEarned: 5,
          unit: 'coins'
        }
      ];

      const progress = computeQuestProgress(dailyQuest, logs, new Date());
      expect(progress.isComplete).toBe(false);
      expect(progress.percentage).toBe(0);
    });
  });

  describe('computeBossState', () => {
    const mockBoss: BossDefinition = {
      id: 'b1',
      name: 'The Iron Behemoth',
      theme: 'Strength',
      description: 'Deal 100 fitness damage',
      relevantStats: ['fitness'],
      maxHp: 100,
      currentHp: 100,
      durationDays: 30,
      startDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      endDate: new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString(),
      xpReward: 300,
      coinReward: 20,
      status: 'active',
      createdAt: '',
      source: 'ai'
    };

    it('calculates boss damage dealt from relevant stat XP', () => {
      // 2 Gym logs (5 coins each * 5 XP = 25 XP each, Fitness 80% = 20 XP each -> 40 Fitness XP total)
      const logs: RewardLog[] = [
        { id: 'l1', activityId: 'h_gym', habitName: 'Gym', icon: '🏋️', timestamp: new Date().toISOString(), rewardEarned: 5, unit: 'coins' },
        { id: 'l2', activityId: 'h_gym', habitName: 'Gym', icon: '🏋️', timestamp: new Date().toISOString(), rewardEarned: 5, unit: 'coins' },
      ];

      const state = computeBossState(mockBoss, logs, mockHabits);
      expect(state.damageDealt).toBe(40);
      expect(state.currentHp).toBe(60);
      expect(state.percentage).toBe(60);
      expect(state.isDefeated).toBe(false);
    });

    it('marks boss as defeated when damage >= maxHp', () => {
      // 5 logs = 5 * 20 = 100 Fitness XP damage -> 0 HP remaining
      const logs: RewardLog[] = Array.from({ length: 5 }, (_, i) => ({
        id: `l${i}`,
        activityId: 'h_gym',
        habitName: 'Gym',
        icon: '🏋️',
        timestamp: new Date().toISOString(),
        rewardEarned: 5,
        unit: 'coins'
      }));

      const state = computeBossState(mockBoss, logs, mockHabits);
      expect(state.damageDealt).toBe(100);
      expect(state.currentHp).toBe(0);
      expect(state.isDefeated).toBe(true);
    });
  });

  describe('checkAchievementUnlock', () => {
    const mockAch: AchievementDefinition = {
      id: 'a1',
      name: 'Gym Novice',
      description: 'Log Gym 3 times',
      icon: '🏋️',
      requirements: [{ habitId: 'h_gym', targetCount: 3, description: '3 workouts' }],
      xpReward: 100,
      coinReward: 10,
      status: 'locked',
      source: 'ai'
    };

    const mockStats: HabitStats = {
      totalCoinsEarned: 0,
      totalCoinsSpent: 0,
      coinBalance: 0,
      phantomDebt: 0,
      todayCount: 0,
      todayCoinsEarned: 0,
      currentStreak: 0,
      longestStreak: 0,
      averagePerDay: 0,
      totalXp: 0,
      level: 0,
      levelProgress: 0,
      xpToNextLevel: 100,
      statsBreakdown: getDefaultStatsBreakdown(),
      streakFreezeState: {
        availableFreezes: 2,
        maxFreezes: 2,
        consecutiveDaysForRecovery: 3,
        consecutiveDaysCount: 0,
        frozenDates: []
      }
    };

    it('returns true when activity count threshold is reached', () => {
      const logs: RewardLog[] = [
        { id: 'l1', activityId: 'h_gym', habitName: 'Gym', icon: '🏋️', timestamp: '', rewardEarned: 5, unit: 'coins' },
        { id: 'l2', activityId: 'h_gym', habitName: 'Gym', icon: '🏋️', timestamp: '', rewardEarned: 5, unit: 'coins' },
        { id: 'l3', activityId: 'h_gym', habitName: 'Gym', icon: '🏋️', timestamp: '', rewardEarned: 5, unit: 'coins' }
      ];

      expect(checkAchievementUnlock(mockAch, mockStats, logs)).toBe(true);
    });

    it('returns false when threshold is not reached', () => {
      const logs: RewardLog[] = [
        { id: 'l1', activityId: 'h_gym', habitName: 'Gym', icon: '🏋️', timestamp: '', rewardEarned: 5, unit: 'coins' }
      ];

      expect(checkAchievementUnlock(mockAch, mockStats, logs)).toBe(false);
    });
  });
});
