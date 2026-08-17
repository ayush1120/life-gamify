import { describe, it, expect } from 'vitest';
import { buildGameMasterContext } from '../aiContextBuilder';
import { shouldRunGameMasterAnalysis } from '../llmService';
import { Habit, RewardLog, HabitStats, QuestDefinition, BossDefinition } from '../../../types';
import { getDefaultStatsBreakdown } from '../../../utils/progressionUtils';

describe('Phase 11 & 29: AI Context Builder & Cost Controls', () => {
  const mockStats: HabitStats = {
    totalCoinsEarned: 100,
    totalCoinsSpent: 40,
    coinBalance: 60,
    phantomDebt: 0,
    todayCount: 2,
    todayCoinsEarned: 10,
    currentStreak: 3,
    longestStreak: 5,
    averagePerDay: 5,
    totalXp: 500,
    level: 3,
    levelProgress: 45,
    xpToNextLevel: 100,
    statsBreakdown: getDefaultStatsBreakdown()
  };

  const mockHabits: Habit[] = [
    {
      id: 'h1',
      name: 'Gym',
      category: 'Fitness',
      tags: ['Health'],
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

  const mockLogs: RewardLog[] = [
    {
      id: 'l1',
      activityId: 'h1',
      habitName: 'Gym',
      icon: '🏋️',
      timestamp: new Date().toISOString(),
      rewardEarned: 5,
      unit: 'coins'
    }
  ];

  const mockQuests: QuestDefinition[] = [
    {
      id: 'q1',
      title: 'Fitness Quest',
      description: 'Go to gym',
      type: 'weekly',
      difficulty: 'medium',
      requirements: [{ habitId: 'h1', targetCount: 3 }],
      xpReward: 100,
      coinReward: 20,
      status: 'active',
      createdAt: '',
      source: 'ai'
    }
  ];

  const mockBoss: BossDefinition = {
    id: 'b1',
    name: 'Sloth King',
    theme: 'Action',
    description: 'Crush the sloth',
    relevantStats: ['fitness'],
    maxHp: 500,
    currentHp: 300,
    durationDays: 30,
    startDate: '',
    endDate: '',
    xpReward: 750,
    coinReward: 50,
    status: 'active',
    createdAt: '',
    source: 'ai'
  };

  it('builds full structured AI context correctly', () => {
    const context = buildGameMasterContext(mockStats, mockHabits, mockLogs, mockQuests, mockBoss);

    expect(context.user.level).toBe(3);
    expect(context.user.totalXp).toBe(500);
    expect(context.habits).toHaveLength(1);
    expect(context.habits[0].name).toBe('Gym');
    expect(context.recentActivity).toHaveLength(1);
    expect(context.activeQuests).toHaveLength(1);
    expect(context.activeBoss?.name).toBe('Sloth King');
  });

  it('enforces cost control analysis conditions', () => {
    // Disabled settings
    expect(shouldRunGameMasterAnalysis({ provider: 'gemini', enabled: false })).toBe(false);

    // Initial run with valid API key
    expect(shouldRunGameMasterAnalysis({ provider: 'gemini', apiKey: 'test_key', enabled: true }, 5)).toBe(true);

    // Ran 1 hour ago with 1 new activity -> skip
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    expect(shouldRunGameMasterAnalysis({
      provider: 'gemini',
      apiKey: 'test_key',
      enabled: true,
      lastAnalysisAt: oneHourAgo,
      lastAnalysisActivityCount: 5
    }, 6)).toBe(false);

    // Ran 25 hours ago with 4 new activities -> run
    const yesterday = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
    expect(shouldRunGameMasterAnalysis({
      provider: 'gemini',
      apiKey: 'test_key',
      enabled: true,
      lastAnalysisAt: yesterday,
      lastAnalysisActivityCount: 5
    }, 9)).toBe(true);

    // Forced manual refresh -> always true
    expect(shouldRunGameMasterAnalysis(undefined, 0, true)).toBe(true);
  });
});
