import { Habit, RewardLog } from '../types';
import { getStartOfDay, getStartOfISOWeek, getStartOfMonth } from './frequencyUtils';

export const getValidHabitLogs = (habitId: string, logs: RewardLog[]): RewardLog[] => {
  return logs
    .filter(log => log.activityId === habitId && !log.isRetracted && !isNaN(new Date(log.timestamp).getTime()))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // newest first
};

export const getHabitLifetimeStats = (validLogs: RewardLog[]) => {
  return {
    completionCount: validLogs.length,
    lifetimeCoins: validLogs.reduce((sum, log) => sum + (log.rewardEarned || 0), 0)
  };
};

export const getHabitTimeline = (validLogs: RewardLog[], limit: number = 10): RewardLog[] => {
  return validLogs.slice(0, limit);
};

// Advanced streaks/calendar could be expanded, but basic daily streak implementation for now.
export const getHabitCurrentStreak = (habit: Habit, validLogs: RewardLog[], targetDate: Date = new Date()): number => {
  if (validLogs.length === 0) return 0;
  
  const frequency = habit.frequency || 'daily';
  let streak = 0;
  
  // Clone date so we can step backward without mutating targetDate
  const currentCheck = new Date(targetDate);
  
  // Create a fast lookup for whether a period has a log
  const periodHasLog = (date: Date) => {
    let start: Date;
    let end: Date;
    if (frequency === 'weekly') {
      start = getStartOfISOWeek(date);
      end = new Date(start);
      end.setDate(start.getDate() + 7);
    } else if (frequency === 'monthly') {
      start = getStartOfMonth(date);
      end = new Date(start);
      end.setMonth(start.getMonth() + 1);
    } else {
      start = getStartOfDay(date);
      end = new Date(start);
      end.setDate(start.getDate() + 1);
    }
    const tStart = start.getTime();
    const tEnd = end.getTime();
    return validLogs.some(l => {
      const lt = new Date(l.timestamp).getTime();
      return lt >= tStart && lt < tEnd;
    });
  };

  // Check if current period has a log. If not, streak MIGHT be 0, or it's still alive from previous period.
  const hasCurrent = periodHasLog(currentCheck);
  
  // Start stepping back
  const stepDate = new Date(currentCheck);
  
  if (!hasCurrent) {
    // If not completed this period, move one period back to see if streak is still active from last period
    if (frequency === 'weekly') {
      stepDate.setDate(stepDate.getDate() - 7);
    } else if (frequency === 'monthly') {
      stepDate.setMonth(stepDate.getMonth() - 1);
    } else {
      stepDate.setDate(stepDate.getDate() - 1);
    }
    
    if (!periodHasLog(stepDate)) {
      return 0; // Not done current OR previous, streak is dead.
    }
  }

  // Count backwards
  while (periodHasLog(stepDate)) {
    streak++;
    if (frequency === 'weekly') {
      stepDate.setDate(stepDate.getDate() - 7);
    } else if (frequency === 'monthly') {
      stepDate.setMonth(stepDate.getMonth() - 1);
    } else {
      stepDate.setDate(stepDate.getDate() - 1);
    }
  }

  return streak;
};

export const getHabitLongestStreak = (habit: Habit, validLogs: RewardLog[]): number => {
  if (validLogs.length === 0) return 0;
  
  // This is a simplified best-streak calculation
  // To do it accurately, we'd need to group all logs by period and find longest contiguous periods.
  // For V1, we will map valid logs to period identifiers, sort them, and count consecutive.
  const frequency = habit.frequency || 'daily';
  
  const getPeriodKey = (d: Date) => {
    if (frequency === 'weekly') return getStartOfISOWeek(d).getTime();
    if (frequency === 'monthly') return getStartOfMonth(d).getTime();
    return getStartOfDay(d).getTime();
  };

  const uniquePeriods = Array.from(new Set(validLogs.map(l => getPeriodKey(new Date(l.timestamp))))).sort((a, b) => a - b);
  
  if (uniquePeriods.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < uniquePeriods.length; i++) {
    const prevDate = new Date(uniquePeriods[i - 1]);
    
    // Calculate what the "next expected period" should be after prevDate
    const expectedNext = new Date(prevDate);
    if (frequency === 'weekly') {
      expectedNext.setDate(expectedNext.getDate() + 7);
    } else if (frequency === 'monthly') {
      expectedNext.setMonth(expectedNext.getMonth() + 1);
    } else {
      expectedNext.setDate(expectedNext.getDate() + 1);
    }

    if (uniquePeriods[i] === expectedNext.getTime()) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
};
