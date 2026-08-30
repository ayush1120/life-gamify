import { describe, it, expect } from 'vitest';
import { RewardLog } from '../../types';
import { getValidHabitLogs, getHabitLifetimeStats } from '../habitAnalytics';

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

});
