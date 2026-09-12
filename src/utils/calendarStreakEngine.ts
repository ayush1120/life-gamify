import { Habit, RewardLog, StreakFreezeState } from '../types';
import { toLocalDateString } from './dateUtils';
import { getValidHabitLogs } from './habitAnalytics';

export type CalendarDayStatus = 
  | 'completed'
  | 'frozen'
  | 'missed'
  | 'today-pending'
  | 'repair-available'
  | 'future'
  | 'padding';

export interface UnifiedCalendarDay {
  date: Date;
  dateStr: string;
  dayNumber: number;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  isToday: boolean;
  isFuture: boolean;
  isPast: boolean;
  isPadding: boolean;
  status: CalendarDayStatus;
  completionsCount: number;
  rewardEarned: number;
  logs: RewardLog[];
  daysRemainingToRepair?: number;
}

export interface MonthSummaryStats {
  year: number;
  month: number; // 0-indexed (0 = Jan, 11 = Dec)
  monthName: string;
  monthLabel: string;
  totalDaysInMonth: number;
  daysElapsed: number;
  completedDays: number;
  frozenDays: number;
  activeDays: number;
  totalLogs: number;
  totalCoinsEarned: number;
  completionRate: number; // percentage 0 - 100
}

export interface UnifiedMonthCalendarData {
  year: number;
  month: number;
  monthLabel: string;
  isCurrentMonth: boolean;
  days: UnifiedCalendarDay[];
  stats: MonthSummaryStats;
}

export interface CalendarEngineOptions {
  mode: 'global' | 'habit';
  habit?: Habit;
  rewardLogs: RewardLog[];
  streakFreezeState?: StreakFreezeState;
  targetDate?: Date; // used for "today" normalization
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Checks if a given year is a leap year
 */
export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

/**
 * Returns the number of days in a specific year and month (0-indexed month)
 */
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Computes previous month and year handling January -> December boundary
 */
export const getPreviousMonth = (year: number, month: number): { year: number; month: number } => {
  if (month === 0) {
    return { year: year - 1, month: 11 };
  }
  return { year, month: month - 1 };
};

/**
 * Computes next month and year handling December -> January boundary
 */
export const getNextMonth = (year: number, month: number): { year: number; month: number } => {
  if (month === 11) {
    return { year: year + 1, month: 0 };
  }
  return { year, month: month + 1 };
};

/**
 * Formats a localized YYYY-MM-DD string for year, month (0-indexed), and day
 */
export const buildDateKey = (year: number, month: number, day: number): string => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

/**
 * Centralized Engine for generating a Monthly Calendar and Activity Visualization
 * Guarantees zero data leakage between global and habit contexts.
 */
export const buildUnifiedMonthCalendar = (
  year: number,
  month: number,
  options: CalendarEngineOptions
): UnifiedMonthCalendarData => {
  const now = options.targetDate || new Date();
  const todayStr = toLocalDateString(now);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const isCurrentMonth = year === currentYear && month === currentMonth;

  // 1. Context-Specific Log Filtering (Strict isolation)
  let contextLogs: RewardLog[] = [];
  if (options.mode === 'habit' && options.habit) {
    // Strictly isolate to the given habit
    contextLogs = getValidHabitLogs(options.habit.id, options.rewardLogs);
  } else {
    // Global mode: include all valid un-retracted habit completions
    contextLogs = (options.rewardLogs || []).filter(
      l => !l.isRetracted && !isNaN(new Date(l.timestamp).getTime())
    );
  }

  // 2. Index logs by local date string YYYY-MM-DD
  const logsByDate = new Map<string, RewardLog[]>();
  for (const log of contextLogs) {
    const dStr = log.localDateStr || toLocalDateString(log.timestamp);
    if (!dStr) continue;
    const existing = logsByDate.get(dStr) || [];
    existing.push(log);
    logsByDate.set(dStr, existing);
  }

  // 3. Freeze & Repair state
  const frozenDatesSet = new Set(options.streakFreezeState?.frozenDates || []);
  const repairMap = new Map<string, number>(
    (options.streakFreezeState?.pendingRepairDates || []).map(r => [r.dateStr, r.daysRemaining])
  );

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday

  const days: UnifiedCalendarDay[] = [];

  // 4. Leading Padding Days (from previous month)
  const prevMonthInfo = getPreviousMonth(year, month);
  const prevMonthDaysCount = getDaysInMonth(prevMonthInfo.year, prevMonthInfo.month);

  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const padDay = prevMonthDaysCount - i;
    const padDate = new Date(prevMonthInfo.year, prevMonthInfo.month, padDay);
    const dateStr = buildDateKey(prevMonthInfo.year, prevMonthInfo.month, padDay);

    days.push({
      date: padDate,
      dateStr,
      dayNumber: padDay,
      dayOfWeek: padDate.getDay(),
      isToday: false,
      isFuture: false,
      isPast: true,
      isPadding: true,
      status: 'padding',
      completionsCount: 0,
      rewardEarned: 0,
      logs: []
    });
  }

  // 5. Days of the Current Month
  let completedDays = 0;
  let frozenDays = 0;
  let totalCoinsEarned = 0;
  let totalLogs = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = buildDateKey(year, month, day);
    const dateObj = new Date(year, month, day, 12, 0, 0); // safe noon time to avoid DST boundary issues
    const dayOfWeek = dateObj.getDay();

    const isToday = dateStr === todayStr;
    const isFuture = dateStr > todayStr;
    const isPast = dateStr < todayStr;

    const dayLogs = logsByDate.get(dateStr) || [];
    const count = dayLogs.length;
    const rewards = dayLogs.reduce((sum, l) => sum + (l.rewardEarned || 0), 0);
    const isFrozen = frozenDatesSet.has(dateStr);
    const repairDaysRemaining = repairMap.get(dateStr);

    let status: CalendarDayStatus = 'missed';

    if (isFuture) {
      status = 'future';
    } else if (count > 0) {
      status = 'completed';
      completedDays++;
    } else if (isFrozen) {
      status = 'frozen';
      frozenDays++;
    } else if (repairDaysRemaining !== undefined) {
      status = 'repair-available';
    } else if (isToday) {
      status = 'today-pending';
    } else {
      status = 'missed';
    }

    if (!isFuture) {
      totalLogs += count;
      totalCoinsEarned += rewards;
    }

    days.push({
      date: dateObj,
      dateStr,
      dayNumber: day,
      dayOfWeek,
      isToday,
      isFuture,
      isPast,
      isPadding: false,
      status,
      completionsCount: count,
      rewardEarned: rewards,
      logs: dayLogs,
      daysRemainingToRepair: repairDaysRemaining
    });
  }

  // 6. Trailing Padding Days (to complete the 7-column grid)
  const remainingCells = (7 - (days.length % 7)) % 7;
  const nextMonthInfo = getNextMonth(year, month);

  for (let padDay = 1; padDay <= remainingCells; padDay++) {
    const padDate = new Date(nextMonthInfo.year, nextMonthInfo.month, padDay);
    const dateStr = buildDateKey(nextMonthInfo.year, nextMonthInfo.month, padDay);

    days.push({
      date: padDate,
      dateStr,
      dayNumber: padDay,
      dayOfWeek: padDate.getDay(),
      isToday: false,
      isFuture: true,
      isPast: false,
      isPadding: true,
      status: 'padding',
      completionsCount: 0,
      rewardEarned: 0,
      logs: []
    });
  }

  // 7. Calculate Elapsed Days and Completion Rate
  let daysElapsed = 0;
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    // Past month: full month elapsed
    daysElapsed = daysInMonth;
  } else if (isCurrentMonth) {
    // Current month: elapsed up to today
    daysElapsed = now.getDate();
  } else {
    // Future month: 0 days elapsed
    daysElapsed = 0;
  }

  const activeDays = completedDays + frozenDays;
  const completionRate = daysElapsed > 0 
    ? Math.min(100, Math.round((activeDays / daysElapsed) * 100))
    : 0;

  const monthName = MONTH_NAMES[month];
  const monthLabel = `${monthName} ${year}`;

  const stats: MonthSummaryStats = {
    year,
    month,
    monthName,
    monthLabel,
    totalDaysInMonth: daysInMonth,
    daysElapsed,
    completedDays,
    frozenDays,
    activeDays,
    totalLogs,
    totalCoinsEarned,
    completionRate
  };

  return {
    year,
    month,
    monthLabel,
    isCurrentMonth,
    days,
    stats
  };
};
