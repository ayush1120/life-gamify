import { describe, it, expect } from 'vitest';
import { Habit, RewardLog } from '../../types';
import { getValidHabitLogs, getHabitLifetimeStats, getHabitCurrentStreak, getHabitLongestStreak } from '../habitAnalytics';

const mockHabit: Habit = {
  id: 'h1',
  name: 'Test Habit',
  icon: '🧪',
  rewardValue: 10,
  maxPerPeriod: 1,
  frequency: 'daily',
  active: true,
  color: '#000000',
  order: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('Habit Analytics', () => {
  it('filters and sorts valid logs correctly', () => {
    const logs: RewardLog[] = [
      { id: '1', activityId: 'h1', habitName: 'Test', icon: '🧪', timestamp: '2023-01-01T10:00:00.000Z', rewardEarned: 10, unit: 'c' },
      { id: '2', activityId: 'h2', habitName: 'Other', icon: '🧪', timestamp: '2023-01-01T11:00:00.000Z', rewardEarned: 10, unit: 'c' },
      { id: '3', activityId: 'h1', habitName: 'Test', icon: '🧪', timestamp: 'invalid-date', rewardEarned: 10, unit: 'c' },
      { id: '4', activityId: 'h1', habitName: 'Test', icon: '🧪', timestamp: '2023-01-02T10:00:00.000Z', rewardEarned: 10, unit: 'c', isRetracted: true },
      { id: '5', activityId: 'h1', habitName: 'Test', icon: '🧪', timestamp: '2023-01-03T10:00:00.000Z', rewardEarned: 10, unit: 'c' },
    ];

    const validLogs = getValidHabitLogs('h1', logs);
    expect(validLogs).toHaveLength(2);
    expect(validLogs[0].id).toBe('5'); // Newest first
    expect(validLogs[1].id).toBe('1');
  });

  it('calculates lifetime stats', () => {
    const logs: RewardLog[] = [
      { id: '1', activityId: 'h1', habitName: 'Test', icon: '🧪', timestamp: '2023-01-01T10:00:00.000Z', rewardEarned: 10, unit: 'c' },
      { id: '2', activityId: 'h1', habitName: 'Test', icon: '🧪', timestamp: '2023-01-02T10:00:00.000Z', rewardEarned: 15, unit: 'c' },
    ];
    
    const stats = getHabitLifetimeStats(logs);
    expect(stats.completionCount).toBe(2);
    expect(stats.lifetimeCoins).toBe(25);
  });

  it('calculates current daily streak correctly', () => {
    const today = new Date('2023-01-05T12:00:00Z');
    const logs: RewardLog[] = [
      { id: '1', activityId: 'h1', habitName: 'Test', icon: '🧪', timestamp: '2023-01-03T10:00:00.000Z', rewardEarned: 10, unit: 'c' },
      { id: '2', activityId: 'h1', habitName: 'Test', icon: '🧪', timestamp: '2023-01-04T10:00:00.000Z', rewardEarned: 10, unit: 'c' },
    ];

    // Done yesterday, not today -> streak should be 2
    expect(getHabitCurrentStreak(mockHabit, logs, today)).toBe(2);

    // Done today -> streak should be 3
    const logsWithToday = [...logs, { id: '3', activityId: 'h1', habitName: 'Test', icon: '🧪', timestamp: '2023-01-05T10:00:00.000Z', rewardEarned: 10, unit: 'c' }];
    expect(getHabitCurrentStreak(mockHabit, logsWithToday, today)).toBe(3);

    // Missed yesterday -> streak should be 0
    const todayLater = new Date('2023-01-06T12:00:00Z');
    expect(getHabitCurrentStreak(mockHabit, logs, todayLater)).toBe(0);
  });

  it('calculates longest streak correctly', () => {
    const logs: RewardLog[] = [
      { id: '1', activityId: 'h1', habitName: 'Test', icon: '🧪', timestamp: '2023-01-01T10:00:00.000Z', rewardEarned: 10, unit: 'c' },
      { id: '2', activityId: 'h1', habitName: 'Test', icon: '🧪', timestamp: '2023-01-02T10:00:00.000Z', rewardEarned: 10, unit: 'c' }, // streak 2
      { id: '3', activityId: 'h1', habitName: 'Test', icon: '🧪', timestamp: '2023-01-04T10:00:00.000Z', rewardEarned: 10, unit: 'c' },
      { id: '4', activityId: 'h1', habitName: 'Test', icon: '🧪', timestamp: '2023-01-05T10:00:00.000Z', rewardEarned: 10, unit: 'c' },
      { id: '5', activityId: 'h1', habitName: 'Test', icon: '🧪', timestamp: '2023-01-06T10:00:00.000Z', rewardEarned: 10, unit: 'c' }, // streak 3
    ];

    expect(getHabitLongestStreak(mockHabit, logs)).toBe(3);
  });
});
