import { describe, it, expect } from 'vitest';
import { Habit, RewardLog } from '../../types';
import { 
  getLogsInCurrentPeriod, 
  isHabitDueInPeriod, 
  getPeriodProgress, 
  sanitizeTag 
} from '../frequencyUtils';

const mockHabitDaily: Habit = {
  id: 'h-daily',
  name: 'Daily Drink Water',
  icon: '💧',
  rewardValue: 2,
  maxPerPeriod: 2,
  frequency: 'daily',
  active: true,
  color: '#f59e0b',
  order: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const mockHabitWeekly: Habit = {
  id: 'h-weekly',
  name: 'Weekly Gym Workout',
  icon: '🏋️',
  rewardValue: 5,
  maxPerPeriod: 3,
  frequency: 'weekly',
  active: true,
  color: '#ce7647',
  order: 2,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('Frequency Utilities Unit Tests', () => {
  it('correctly filters logs in current daily period', () => {
    const todayISO = new Date().toISOString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayISO = yesterdayDate.toISOString();

    const logs: RewardLog[] = [
      { id: 'l1', activityId: 'h-daily', habitName: 'Water', icon: '💧', timestamp: todayISO, rewardEarned: 2, unit: 'Coins' },
      { id: 'l2', activityId: 'h-daily', habitName: 'Water', icon: '💧', timestamp: yesterdayISO, rewardEarned: 2, unit: 'Coins' }
    ];

    const currentLogs = getLogsInCurrentPeriod(mockHabitDaily, logs);
    expect(currentLogs).toHaveLength(1);
    expect(currentLogs[0].id).toBe('l1');
  });

  it('correctly filters logs out that are past the current period end boundary', () => {
    const todayISO = new Date().toISOString();
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowISO = tomorrowDate.toISOString();

    const logs: RewardLog[] = [
      { id: 'l1', activityId: 'h-daily', habitName: 'Water', icon: '💧', timestamp: todayISO, rewardEarned: 2, unit: 'Coins' },
      { id: 'l2', activityId: 'h-daily', habitName: 'Water', icon: '💧', timestamp: tomorrowISO, rewardEarned: 2, unit: 'Coins' }
    ];

    const currentLogs = getLogsInCurrentPeriod(mockHabitDaily, logs);
    expect(currentLogs).toHaveLength(1);
    expect(currentLogs[0].id).toBe('l1');
  });

  it('correctly calculates habit due status in period', () => {
    const todayISO = new Date().toISOString();

    const emptyLogs: RewardLog[] = [];
    expect(isHabitDueInPeriod(mockHabitDaily, emptyLogs)).toBe(true);

    const oneLog: RewardLog[] = [
      { id: 'l1', activityId: 'h-daily', habitName: 'Water', icon: '💧', timestamp: todayISO, rewardEarned: 2, unit: 'Coins' }
    ];
    expect(isHabitDueInPeriod(mockHabitDaily, oneLog)).toBe(true);

    const twoLogs: RewardLog[] = [
      { id: 'l1', activityId: 'h-daily', habitName: 'Water', icon: '💧', timestamp: todayISO, rewardEarned: 2, unit: 'Coins' },
      { id: 'l2', activityId: 'h-daily', habitName: 'Water', icon: '💧', timestamp: todayISO, rewardEarned: 2, unit: 'Coins' }
    ];
    expect(isHabitDueInPeriod(mockHabitDaily, twoLogs)).toBe(false);
  });

  it('calculates period progress percentage accurately', () => {
    const todayISO = new Date().toISOString();
    const oneLog: RewardLog[] = [
      { id: 'l1', activityId: 'h-weekly', habitName: 'Gym', icon: '🏋️', timestamp: todayISO, rewardEarned: 5, unit: 'Coins' }
    ];

    const progress = getPeriodProgress(mockHabitWeekly, oneLog);
    expect(progress.count).toBe(1);
    expect(progress.max).toBe(3);
    expect(progress.percentage).toBe(33);
    expect(progress.isComplete).toBe(false);
    expect(progress.remaining).toBe(2);
  });

  it('sanitizes tag strings against XSS injection and length overflow', () => {
    expect(sanitizeTag('   Work & Fitness  ')).toBe('Work  Fitness');
    expect(sanitizeTag('SuperLongTagNameThatExceedsTwentyFiveCharactersTotal')).toBe('SuperLongTagNameThatExcee');
    expect(sanitizeTag('<script>alert("xss")</script>')).toBe('scriptalertxssscript');
  });
});
