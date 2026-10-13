import { Goal, GoalMilestone, GoalFrequencyPeriod } from '../types';

import { GoalSchema, GoalMilestoneSchema } from '../domain/contracts';
import { formatDateKey } from './streakUtils';
import { getStartOfISOWeek, getStartOfMonth } from './frequencyUtils';

/**
 * Validates and normalizes a goal title.
 * Must be non-empty after trimming and up to 150 characters.
 */
export const validateGoalTitle = (rawTitle: unknown): string => {
  if (typeof rawTitle !== 'string') {
    throw new Error('Goal title must be a string');
  }
  const trimmed = rawTitle.trim();
  if (trimmed.length === 0) {
    throw new Error('Goal title cannot be empty');
  }
  if (trimmed.length > 150) {
    throw new Error('Goal title cannot exceed 150 characters');
  }
  return trimmed;
};

/**
 * Validates and normalizes a milestone title.
 */
export const validateMilestoneTitle = (rawTitle: unknown): string => {
  if (typeof rawTitle !== 'string') {
    throw new Error('Milestone title must be a string');
  }
  const trimmed = rawTitle.trim();
  if (trimmed.length === 0) {
    throw new Error('Milestone title cannot be empty');
  }
  if (trimmed.length > 150) {
    throw new Error('Milestone title cannot exceed 150 characters');
  }
  return trimmed;
};

/**
 * Validates a Goal object against the Zod domain schema.
 */
export const validateGoal = (data: unknown): Goal => {
  return GoalSchema.parse(data) as Goal;
};

/**
 * Validates a GoalMilestone object against the Zod domain schema.
 */
export const validateMilestone = (data: unknown): GoalMilestone => {
  return GoalMilestoneSchema.parse(data) as GoalMilestone;
};

/**
 * Formats duration given in canonical seconds into human-readable string.
 * e.g. 90 -> '1m 30s', 3600 -> '1h', 5400 -> '1h 30m'
 */
export const formatDurationDisplay = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  if (seconds === 0) return '0m';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSecs = seconds % 60;

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
  }

  if (minutes > 0) {
    if (remainingSecs > 0) {
      return `${minutes}m ${remainingSecs}s`;
    }
    return `${minutes}m`;
  }

  return `${remainingSecs}s`;
};

/**
 * Converts hours and minutes into canonical seconds.
 */
export const convertToSeconds = (hours: number = 0, minutes: number = 0, seconds: number = 0): number => {
  const h = Math.max(0, Math.floor(hours || 0));
  const m = Math.max(0, Math.floor(minutes || 0));
  const s = Math.max(0, Math.floor(seconds || 0));
  return h * 3600 + m * 60 + s;
};

/**
 * Computes frequency period key for a given date in local time.
 */
export const getGoalFrequencyPeriodKey = (
  period: GoalFrequencyPeriod = 'daily',
  targetDate: Date = new Date()
): string => {
  if (period === 'weekly') {
    return formatDateKey(getStartOfISOWeek(targetDate));
  }
  if (period === 'monthly') {
    return formatDateKey(getStartOfMonth(targetDate)).substring(0, 7); // 'YYYY-MM'
  }
  return formatDateKey(targetDate); // 'YYYY-MM-DD'
};

/**
 * Returns human-readable label for frequency period.
 */
export const getGoalFrequencyPeriodLabel = (period: GoalFrequencyPeriod = 'daily'): string => {
  switch (period) {
    case 'weekly':
      return 'This Week';
    case 'monthly':
      return 'This Month';
    case 'daily':
    default:
      return 'Today';
  }
};

export interface GoalProgressCalculation {
  hasProgress: boolean;
  current: number;
  target?: number;
  percentage?: number;
  visualPercentage?: number;
  formattedCurrent: string;
  formattedTarget?: string;
  isTargetMet: boolean;
  remaining?: number;
  periodLabel?: string;
  periodKey?: string;
}

/**
 * Pure calculation of goal progress based on its progressConfig and values.
 */
export const calculateGoalProgress = (
  goal: Goal,
  targetDate: Date = new Date()
): GoalProgressCalculation => {
  const config = goal.progressConfig;
  if (!config) {
    return {
      hasProgress: false,
      current: 0,
      formattedCurrent: '',
      isTargetMet: false
    };
  }

  let current = 0;
  let target = config.targetValue && config.targetValue > 0 ? config.targetValue : undefined;
  let periodLabel: string | undefined;
  let periodKey: string | undefined;
  let formattedCurrent = '';
  let formattedTarget: string | undefined;

  if (config.type === 'count') {
    current = Math.max(0, goal.currentProgress || 0);
    const unit = config.unit ? ` ${config.unit}` : '';
    formattedCurrent = `${current}${unit}`;
    if (target !== undefined) {
      formattedTarget = `${target}${unit}`;
    }
  } else if (config.type === 'duration') {
    // Current and target in canonical seconds
    current = Math.max(0, goal.currentProgress || 0);
    formattedCurrent = formatDurationDisplay(current);
    if (target !== undefined) {
      formattedTarget = formatDurationDisplay(target);
    }
  } else if (config.type === 'frequency') {
    const period = config.period || 'daily';
    periodKey = getGoalFrequencyPeriodKey(period, targetDate);
    periodLabel = getGoalFrequencyPeriodLabel(period);
    current = Math.max(0, goal.progressPeriods?.[periodKey] || 0);
    const unit = config.unit ? ` ${config.unit}` : ' times';
    formattedCurrent = `${current}${unit}`;
    if (target !== undefined) {
      formattedTarget = `${target}${unit}`;
    }
  }

  const isTargetMet = target !== undefined && current >= target;
  let percentage: number | undefined;
  let visualPercentage: number | undefined;
  let remaining: number | undefined;

  if (target !== undefined && target > 0) {
    percentage = Math.round((current / target) * 100);
    // Visual progress is capped at 100% per spec, while raw value & percentage can exceed
    visualPercentage = Math.min(100, Math.max(0, percentage));
    remaining = Math.max(0, target - current);
  }

  return {
    hasProgress: true,
    current,
    target,
    percentage,
    visualPercentage,
    formattedCurrent,
    formattedTarget,
    isTargetMet,
    remaining,
    periodLabel,
    periodKey
  };
};

export interface GoalDeadlineEvaluation {
  hasDeadline: boolean;
  isOverdue: boolean;
  formattedDeadline?: string;
  badgeText: string;
  daysRemaining?: number;
  daysOverdue?: number;
}

/**
 * Pure evaluation of goal deadline and overdue status.
 * Rules:
 * - Undated goals NEVER show as overdue.
 * - Completed/archived goals NEVER show as overdue.
 * - Date comparison uses local calendar dates to avoid timezone shift.
 */
export const evaluateGoalDeadline = (
  goal: Goal,
  targetDate: Date = new Date()
): GoalDeadlineEvaluation => {
  if (!goal.deadline || goal.deadline.trim() === '') {
    return {
      hasDeadline: false,
      isOverdue: false,
      badgeText: 'No deadline'
    };
  }

  const deadlineClean = goal.deadline.trim();
  // Format deadline for display
  // Supports YYYY-MM-DD or ISO strings
  const parts = deadlineClean.split('T')[0].split('-');
  let deadlineYear = 0;
  let deadlineMonth = 0;
  let deadlineDay = 0;

  if (parts.length === 3) {
    deadlineYear = parseInt(parts[0], 10);
    deadlineMonth = parseInt(parts[1], 10) - 1;
    deadlineDay = parseInt(parts[2], 10);
  } else {
    const d = new Date(deadlineClean);
    if (!isNaN(d.getTime())) {
      deadlineYear = d.getFullYear();
      deadlineMonth = d.getMonth();
      deadlineDay = d.getDate();
    }
  }

  const deadlineDate = new Date(deadlineYear, deadlineMonth, deadlineDay);
  const formattedDeadline = deadlineDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: deadlineDate.getFullYear() !== targetDate.getFullYear() ? 'numeric' : undefined
  });

  if (goal.status === 'completed') {
    return {
      hasDeadline: true,
      isOverdue: false,
      formattedDeadline,
      badgeText: 'Completed'
    };
  }

  if (goal.status === 'archived') {
    return {
      hasDeadline: true,
      isOverdue: false,
      formattedDeadline,
      badgeText: 'Archived'
    };
  }

  // Calculate midnight diff in local days
  const todayMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const deadlineMidnight = new Date(deadlineYear, deadlineMonth, deadlineDay);

  const diffMs = deadlineMidnight.getTime() - todayMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays);
    return {
      hasDeadline: true,
      isOverdue: true,
      formattedDeadline,
      daysOverdue,
      badgeText: daysOverdue === 1 ? '1 day overdue' : `${daysOverdue} days overdue`
    };
  }

  if (diffDays === 0) {
    return {
      hasDeadline: true,
      isOverdue: false,
      formattedDeadline,
      daysRemaining: 0,
      badgeText: 'Due today'
    };
  }

  return {
    hasDeadline: true,
    isOverdue: false,
    formattedDeadline,
    daysRemaining: diffDays,
    badgeText: diffDays === 1 ? 'Due tomorrow' : `Due in ${diffDays} days`
  };
};

export interface MilestonesSummary {
  total: number;
  completed: number;
  percentage: number;
  allCompleted: boolean;
  summaryText: string;
}

/**
 * Calculates milestone completion summary.
 */
export const getMilestonesSummary = (milestones: GoalMilestone[] = []): MilestonesSummary => {
  const total = milestones.length;
  const completed = milestones.filter(m => m.isCompleted).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allCompleted = total > 0 && completed === total;
  const summaryText = total === 0 
    ? 'No milestones' 
    : `${completed} of ${total} milestone${total === 1 ? '' : 's'} completed`;

  return {
    total,
    completed,
    percentage,
    allCompleted,
    summaryText
  };
};
