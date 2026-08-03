import { Habit, RewardLog, HabitFrequency } from '../types';

/**
 * Returns ISO Date string for start of day (00:00:00.000 local/UTC).
 */
export const getStartOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Returns ISO Date string for start of ISO week (Monday 00:00:00.000).
 */
export const getStartOfISOWeek = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/**
 * Returns ISO Date string for start of calendar month (1st of month 00:00:00.000).
 */
export const getStartOfMonth = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Returns all valid (non-retracted) logs for a habit recorded in its current frequency period.
 */
export const getLogsInCurrentPeriod = (habit: Habit, logs: RewardLog[], targetDate: Date = new Date()): RewardLog[] => {
  const frequency: HabitFrequency = habit.frequency || 'daily';
  let startDate: Date;

  if (frequency === 'weekly') {
    startDate = getStartOfISOWeek(targetDate);
  } else if (frequency === 'monthly') {
    startDate = getStartOfMonth(targetDate);
  } else {
    startDate = getStartOfDay(targetDate);
  }

  const startTime = startDate.getTime();

  return logs.filter(log => {
    if (log.activityId !== habit.id || log.isRetracted) return false;
    const logTime = new Date(log.timestamp).getTime();
    return logTime >= startTime;
  });
};

/**
 * Checks if a habit still has remaining completions available in its current frequency period.
 */
export const isHabitDueInPeriod = (habit: Habit, logs: RewardLog[], targetDate: Date = new Date()): boolean => {
  const periodLogs = getLogsInCurrentPeriod(habit, logs, targetDate);
  const maxAllowed = habit.maxPerPeriod ?? habit.maxPerDay ?? 1;
  if (maxAllowed === 0) return true; // Unlimited
  return periodLogs.length < maxAllowed;
};

/**
 * Calculates current period progress percentage and stats for a habit.
 */
export const getPeriodProgress = (habit: Habit, logs: RewardLog[]) => {
  const periodLogs = getLogsInCurrentPeriod(habit, logs);
  const count = periodLogs.length;
  const max = habit.maxPerPeriod ?? habit.maxPerDay ?? 1;
  const percentage = max === 0 ? 100 : Math.min(100, Math.round((count / max) * 100));
  const isComplete = max > 0 && count >= max;

  return {
    count,
    max,
    percentage,
    isComplete,
    remaining: max === 0 ? Infinity : Math.max(0, max - count)
  };
};

/**
 * Returns human readable frequency period label.
 */
export const getPeriodLabel = (frequency: HabitFrequency): string => {
  switch (frequency) {
    case 'weekly':
      return 'This Week';
    case 'monthly':
      return 'This Month';
    case 'daily':
    default:
      return 'Today';
  }
};

/**
 * Sanitizes and normalizes tag strings (max 25 chars, alphanumeric & spaces/hyphens).
 */
export const sanitizeTag = (rawTag: string): string => {
  if (!rawTag) return '';
  return rawTag
    .trim()
    .replace(/[^\w\s-]/gi, '')
    .slice(0, 25);
};
