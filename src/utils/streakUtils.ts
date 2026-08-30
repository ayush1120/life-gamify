import { Habit, RewardLog, StreakFreezeState, PendingStreakRepair, HabitFrequency } from '../types';
import { toLocalDateString } from './dateUtils';
import { getValidHabitLogs } from './habitAnalytics';
import { getStartOfISOWeek, getStartOfMonth } from './frequencyUtils';

export const DEFAULT_STREAK_FREEZE_STATE: StreakFreezeState = {
  availableFreezes: 0, // Starts at 0 per user requirement
  maxFreezes: 2,
  consecutiveDaysForRecovery: 3,
  consecutiveDaysCount: 0,
  frozenDates: [],
  pendingRepairDates: []
};

/**
 * Normalizes a date into YYYY-MM-DD in local time
 */
export const formatDateKey = (d: Date | string): string => {
  return toLocalDateString(d);
};

/**
 * Adds `days` to a date without mutating the original
 */
export const addDays = (d: Date, days: number): Date => {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Returns list of YYYY-MM-DD date strings between start (inclusive) and end (inclusive)
 */
export const getDateRange = (startDate: Date, endDate: Date): string[] => {
  const dates: string[] = [];
  const curr = new Date(startDate);
  curr.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (curr <= end) {
    dates.push(formatDateKey(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

export interface StreakEvaluationResult {
  currentStreak: number;
  longestStreak: number;
  streakFreezeState: StreakFreezeState;
  freezeEarnedToday: boolean;
}

/**
 * Evaluates daily streak history, checks for 3-day recovery to earn streak freezes,
 * and identifies missed days within the 2-day repair window.
 */
export const evaluateStreakAndFreezes = (
  validLogs: RewardLog[],
  savedFreezeState: StreakFreezeState = DEFAULT_STREAK_FREEZE_STATE,
  targetDate: Date = new Date()
): StreakEvaluationResult => {
  const maxFreezes = savedFreezeState?.maxFreezes ?? 2;
  const daysForRecovery = savedFreezeState?.consecutiveDaysForRecovery ?? 3;
  const frozenDatesSet = new Set<string>(savedFreezeState?.frozenDates || []);

  if (!validLogs || validLogs.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakFreezeState: {
        ...DEFAULT_STREAK_FREEZE_STATE,
        maxFreezes,
        consecutiveDaysForRecovery: daysForRecovery,
        frozenDates: Array.from(frozenDatesSet)
      },
      freezeEarnedToday: false
    };
  }

  // Set of dates where user completed at least 1 valid habit
  const loggedDateSet = new Set(
    validLogs.map(l => l.localDateStr || formatDateKey(l.timestamp)).filter(Boolean)
  );

  const sortedLoggedDates = Array.from(loggedDateSet).sort();
  const earliestDateStr = sortedLoggedDates[0];
  const earliestDate = new Date(`${earliestDateStr}T00:00:00`);

  const todayStr = formatDateKey(targetDate);
  const targetDateMidnight = new Date(`${todayStr}T00:00:00`);

  const allDays = getDateRange(earliestDate, targetDateMidnight);

  let runningConsecutive = 0;
  let simulatedFreezes = 0; // Starts at 0, earned through 3-day blocks
  let freezeEarnedToday = false;

  for (let i = 0; i < allDays.length; i++) {
    const dayStr = allDays[i];
    const isToday = dayStr === todayStr;
    const hasLog = loggedDateSet.has(dayStr);
    const isFrozen = frozenDatesSet.has(dayStr);

    if (hasLog) {
      runningConsecutive++;
      if (runningConsecutive >= daysForRecovery) {
        if (simulatedFreezes < maxFreezes) {
          simulatedFreezes++;
          if (isToday) {
            freezeEarnedToday = true;
          }
        }
        runningConsecutive = 0; // Reset 3-day counter after earning
      }
    } else if (isFrozen) {
      // Repaired / frozen day preserves streak, but does not count as active completion towards earning next freeze
      runningConsecutive = 0;
    } else {
      if (!isToday) {
        // Missed day in the past resets consecutive earn count
        runningConsecutive = 0;
      }
    }
  }

  // Account for freezes spent on manual repairs:
  const spentCount = frozenDatesSet.size;
  const baseFreezes = Math.max(savedFreezeState?.availableFreezes || 0, simulatedFreezes);
  const netAvailableFreezes = Math.max(0, Math.min(maxFreezes, baseFreezes - spentCount));

  // --- IDENTIFY MISSED DAYS IN 2-DAY REPAIR WINDOW ---
  // Any missed, non-frozen day in the last 2 days (T-1, T-2) that occurred after the habit was active
  const pendingRepairDates: PendingStreakRepair[] = [];

  const yesterdayDate = addDays(targetDateMidnight, -1);
  const yesterdayStr = formatDateKey(yesterdayDate);
  const twoDaysAgoDate = addDays(targetDateMidnight, -2);
  const twoDaysAgoStr = formatDateKey(twoDaysAgoDate);
  const threeDaysAgoDate = addDays(targetDateMidnight, -3);
  const threeDaysAgoStr = formatDateKey(threeDaysAgoDate);

  const yesterdayMissed = !loggedDateSet.has(yesterdayStr) && !frozenDatesSet.has(yesterdayStr) && allDays.includes(yesterdayStr);
  const twoDaysAgoMissed = !loggedDateSet.has(twoDaysAgoStr) && !frozenDatesSet.has(twoDaysAgoStr) && allDays.includes(twoDaysAgoStr);

  if (yesterdayMissed || twoDaysAgoMissed) {
    // Determine the earliest day in the repair window that is missed
    const dayBeforeEarliest = twoDaysAgoMissed ? threeDaysAgoStr : twoDaysAgoStr;
    
    // Check if the day BEFORE the earliest missed day is also missed (unrepairable chasm)
    const chasmExists = allDays.includes(dayBeforeEarliest) && !loggedDateSet.has(dayBeforeEarliest) && !frozenDatesSet.has(dayBeforeEarliest);
    
    if (!chasmExists) {
      if (yesterdayMissed) {
        pendingRepairDates.push({
          dateStr: yesterdayStr,
          expiresAtDateStr: formatDateKey(addDays(yesterdayDate, 2)),
          daysRemaining: 2
        });
      }
      if (twoDaysAgoMissed) {
        pendingRepairDates.push({
          dateStr: twoDaysAgoStr,
          expiresAtDateStr: formatDateKey(addDays(twoDaysAgoDate, 2)),
          daysRemaining: 1
        });
      }
    }
  }

  // --- CALCULATE CURRENT STREAK ---
  let currentStreak = 0;
  const checkDate = new Date(targetDateMidnight);
  const checkTodayStr = formatDateKey(checkDate);

  const isTodayCompleted = loggedDateSet.has(checkTodayStr);
  const isTodayFrozen = frozenDatesSet.has(checkTodayStr);

  if (isTodayCompleted || isTodayFrozen) {
    currentStreak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // If today is not logged yet, check yesterday to keep streak active
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Walk backwards
  while (true) {
    const dStr = formatDateKey(checkDate);
    if (loggedDateSet.has(dStr) || frozenDatesSet.has(dStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // --- CALCULATE LONGEST STREAK ---
  let longestStreak = 0;
  let tempStreak = 0;

  for (const dayStr of allDays) {
    if (loggedDateSet.has(dayStr) || frozenDatesSet.has(dayStr)) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      if (dayStr !== todayStr) {
        tempStreak = 0;
      }
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  const updatedFreezeState: StreakFreezeState = {
    availableFreezes: netAvailableFreezes,
    maxFreezes,
    consecutiveDaysForRecovery: daysForRecovery,
    consecutiveDaysCount: runningConsecutive,
    frozenDates: Array.from(frozenDatesSet),
    pendingRepairDates,
    lastEvaluatedDate: todayStr
  };

  return {
    currentStreak,
    longestStreak,
    streakFreezeState: updatedFreezeState,
    freezeEarnedToday
  };
};

/**
 * Evaluates per-habit streak & freeze state for a specific habit across daily, weekly, or monthly frequencies
 */
export const evaluateHabitStreakAndFreezes = (
  habit: Habit,
  rewardLogs: RewardLog[],
  savedFreezeState: StreakFreezeState = DEFAULT_STREAK_FREEZE_STATE,
  targetDate: Date = new Date()
): StreakEvaluationResult => {
  const validHabitLogs = getValidHabitLogs(habit.id, rewardLogs);
  const frequency: HabitFrequency = habit.frequency || 'daily';

  if (frequency === 'weekly') {
    return evaluateWeeklyHabitStreak(habit, validHabitLogs, savedFreezeState, targetDate);
  } else if (frequency === 'monthly') {
    return evaluateMonthlyHabitStreak(habit, validHabitLogs, savedFreezeState, targetDate);
  }

  // Default daily evaluation
  return evaluateStreakAndFreezes(validHabitLogs, savedFreezeState, targetDate);
};

/**
 * Evaluates weekly habit streak (3 consecutive completed weeks = 1 freeze, 2-week repair window)
 */
function evaluateWeeklyHabitStreak(
  habit: Habit,
  validLogs: RewardLog[],
  savedFreezeState: StreakFreezeState,
  targetDate: Date
): StreakEvaluationResult {
  const maxFreezes = savedFreezeState?.maxFreezes ?? 2;
  const targetPerWeek = habit.maxPerPeriod ?? 1;
  
  // Map any historical frozen dates (even if daily) to their ISO week start to preserve them across frequency changes
  const frozenWeeksSet = new Set<string>();
  for (const fDateStr of (savedFreezeState?.frozenDates || [])) {
    const fDate = new Date(`${fDateStr}T00:00:00`);
    if (!isNaN(fDate.getTime())) {
      frozenWeeksSet.add(formatDateKey(getStartOfISOWeek(fDate)));
    }
  }

  if (validLogs.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakFreezeState: {
        ...DEFAULT_STREAK_FREEZE_STATE,
        frozenDates: savedFreezeState.frozenDates || []
      },
      freezeEarnedToday: false
    };
  }

  // Group logs by ISO Week start string (YYYY-MM-DD of Monday)
  const logsByWeek = new Map<string, number>();
  for (const log of validLogs) {
    const logDateStr = log.localDateStr || formatDateKey(new Date(log.timestamp));
    const logLocalDate = new Date(`${logDateStr}T00:00:00`);
    const weekStartStr = formatDateKey(getStartOfISOWeek(logLocalDate));
    logsByWeek.set(weekStartStr, (logsByWeek.get(weekStartStr) || 0) + 1);
  }

  const sortedWeeks = Array.from(logsByWeek.keys()).sort();
  const earliestWeek = new Date(`${sortedWeeks[0]}T00:00:00`);
  const currentWeekStart = getStartOfISOWeek(targetDate);
  const currentWeekStr = formatDateKey(currentWeekStart);

  // Generate all weeks from earliest to current
  const allWeeks: string[] = [];
  const curr = new Date(earliestWeek);
  while (curr <= currentWeekStart) {
    allWeeks.push(formatDateKey(curr));
    curr.setDate(curr.getDate() + 7);
  }

  let runningConsecutive = 0;
  let simulatedFreezes = 0;
  let freezeEarnedToday = false;

  for (const weekStr of allWeeks) {
    const isCurrentWeek = weekStr === currentWeekStr;
    const count = logsByWeek.get(weekStr) || 0;
    const isDone = count >= targetPerWeek;
    const isFrozen = frozenWeeksSet.has(weekStr);

    if (isDone) {
      runningConsecutive++;
      if (runningConsecutive >= 3) {
        if (simulatedFreezes < maxFreezes) {
          simulatedFreezes++;
          if (isCurrentWeek) freezeEarnedToday = true;
        }
        runningConsecutive = 0;
      }
    } else if (isFrozen) {
      runningConsecutive = 0;
    } else {
      if (!isCurrentWeek) runningConsecutive = 0;
    }
  }

  const spentCount = frozenWeeksSet.size;
  const baseFreezes = Math.max(savedFreezeState?.availableFreezes || 0, simulatedFreezes);
  const netAvailableFreezes = Math.max(0, Math.min(maxFreezes, baseFreezes - spentCount));

  // Check 2-week repair window for missed past weeks
  const pendingRepairDates: PendingStreakRepair[] = [];
  const lastWeekStr = formatDateKey(addDays(currentWeekStart, -7));
  const twoWeeksAgoStr = formatDateKey(addDays(currentWeekStart, -14));
  const threeWeeksAgoStr = formatDateKey(addDays(currentWeekStart, -21));

  const lastWeekMissed = allWeeks.includes(lastWeekStr) && (logsByWeek.get(lastWeekStr) || 0) < targetPerWeek && !frozenWeeksSet.has(lastWeekStr);
  const twoWeeksAgoMissed = allWeeks.includes(twoWeeksAgoStr) && (logsByWeek.get(twoWeeksAgoStr) || 0) < targetPerWeek && !frozenWeeksSet.has(twoWeeksAgoStr);

  if (lastWeekMissed || twoWeeksAgoMissed) {
    const weekBeforeEarliest = twoWeeksAgoMissed ? threeWeeksAgoStr : twoWeeksAgoStr;
    const chasmExists = allWeeks.includes(weekBeforeEarliest) && (logsByWeek.get(weekBeforeEarliest) || 0) < targetPerWeek && !frozenWeeksSet.has(weekBeforeEarliest);
    
    if (!chasmExists) {
      if (lastWeekMissed) {
        pendingRepairDates.push({
          dateStr: lastWeekStr,
          expiresAtDateStr: formatDateKey(addDays(new Date(`${lastWeekStr}T00:00:00`), 14)),
          daysRemaining: 2
        });
      }
      if (twoWeeksAgoMissed) {
        pendingRepairDates.push({
          dateStr: twoWeeksAgoStr,
          expiresAtDateStr: formatDateKey(addDays(new Date(`${twoWeeksAgoStr}T00:00:00`), 14)),
          daysRemaining: 1
        });
      }
    }
  }

  // Calculate weekly current streak
  let currentStreak = 0;
  const checkWeek = new Date(currentWeekStart);
  const currentWeekDone = (logsByWeek.get(currentWeekStr) || 0) >= targetPerWeek;
  const currentWeekFrozen = frozenWeeksSet.has(currentWeekStr);

  if (currentWeekDone || currentWeekFrozen) {
    currentStreak = 1;
    checkWeek.setDate(checkWeek.getDate() - 7);
  } else {
    checkWeek.setDate(checkWeek.getDate() - 7);
  }

  while (true) {
    const wStr = formatDateKey(checkWeek);
    const done = (logsByWeek.get(wStr) || 0) >= targetPerWeek;
    const frozen = frozenWeeksSet.has(wStr);
    if (done || frozen) {
      currentStreak++;
      checkWeek.setDate(checkWeek.getDate() - 7);
    } else {
      break;
    }
  }

  return {
    currentStreak,
    longestStreak: currentStreak,
    streakFreezeState: {
      availableFreezes: netAvailableFreezes,
      maxFreezes,
      consecutiveDaysForRecovery: 3,
      consecutiveDaysCount: runningConsecutive,
      frozenDates: savedFreezeState.frozenDates || [],
      pendingRepairDates,
      lastEvaluatedDate: formatDateKey(targetDate)
    },
    freezeEarnedToday
  };
}

/**
 * Evaluates monthly habit streak
 */
function evaluateMonthlyHabitStreak(
  habit: Habit,
  validLogs: RewardLog[],
  savedFreezeState: StreakFreezeState,
  targetDate: Date
): StreakEvaluationResult {
  const maxFreezes = savedFreezeState?.maxFreezes ?? 2;
  const targetPerMonth = habit.maxPerPeriod ?? 1;
  
  // Map any historical frozen dates (even if daily) to their calendar month start to preserve them across frequency changes
  const frozenMonthsSet = new Set<string>();
  for (const fDateStr of (savedFreezeState?.frozenDates || [])) {
    const fDate = new Date(`${fDateStr}T00:00:00`);
    if (!isNaN(fDate.getTime())) {
      frozenMonthsSet.add(formatDateKey(getStartOfMonth(fDate)));
    }
  }

  if (validLogs.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakFreezeState: {
        ...DEFAULT_STREAK_FREEZE_STATE,
        frozenDates: savedFreezeState.frozenDates || []
      },
      freezeEarnedToday: false
    };
  }

  const logsByMonth = new Map<string, number>();
  for (const log of validLogs) {
    const logDateStr = log.localDateStr || formatDateKey(new Date(log.timestamp));
    const logLocalDate = new Date(`${logDateStr}T00:00:00`);
    const monthStartStr = formatDateKey(getStartOfMonth(logLocalDate));
    logsByMonth.set(monthStartStr, (logsByMonth.get(monthStartStr) || 0) + 1);
  }

  const sortedMonths = Array.from(logsByMonth.keys()).sort();
  const earliestMonth = new Date(`${sortedMonths[0]}T00:00:00`);
  const currentMonthStart = getStartOfMonth(targetDate);
  const currentMonthStr = formatDateKey(currentMonthStart);

  const allMonths: string[] = [];
  const curr = new Date(earliestMonth);
  while (curr <= currentMonthStart) {
    allMonths.push(formatDateKey(curr));
    curr.setMonth(curr.getMonth() + 1);
  }

  let runningConsecutive = 0;
  let simulatedFreezes = 0;
  let freezeEarnedToday = false;

  for (const monthStr of allMonths) {
    const isCurrentMonth = monthStr === currentMonthStr;
    const count = logsByMonth.get(monthStr) || 0;
    const isDone = count >= targetPerMonth;
    const isFrozen = frozenMonthsSet.has(monthStr);

    if (isDone) {
      runningConsecutive++;
      if (runningConsecutive >= 3) {
        if (simulatedFreezes < maxFreezes) {
          simulatedFreezes++;
          if (isCurrentMonth) freezeEarnedToday = true;
        }
        runningConsecutive = 0;
      }
    } else if (isFrozen) {
      runningConsecutive = 0;
    } else {
      if (!isCurrentMonth) runningConsecutive = 0;
    }
  }

  const spentCount = frozenMonthsSet.size;
  const baseFreezes = Math.max(savedFreezeState?.availableFreezes || 0, simulatedFreezes);
  const netAvailableFreezes = Math.max(0, Math.min(maxFreezes, baseFreezes - spentCount));

  // 1-month repair window for last month if missed
  const pendingRepairDates: PendingStreakRepair[] = [];
  const lastMonthDate = new Date(currentMonthStart);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthStr = formatDateKey(lastMonthDate);
  
  const twoMonthsAgoDate = new Date(currentMonthStart);
  twoMonthsAgoDate.setMonth(twoMonthsAgoDate.getMonth() - 2);
  const twoMonthsAgoStr = formatDateKey(twoMonthsAgoDate);

  const lastMonthMissed = allMonths.includes(lastMonthStr) && (logsByMonth.get(lastMonthStr) || 0) < targetPerMonth && !frozenMonthsSet.has(lastMonthStr);

  if (lastMonthMissed) {
    const chasmExists = allMonths.includes(twoMonthsAgoStr) && (logsByMonth.get(twoMonthsAgoStr) || 0) < targetPerMonth && !frozenMonthsSet.has(twoMonthsAgoStr);
    if (!chasmExists) {
      pendingRepairDates.push({
        dateStr: lastMonthStr,
        expiresAtDateStr: formatDateKey(new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 2, 0)),
        daysRemaining: 1
      });
    }
  }

  let currentStreak = 0;
  const checkMonth = new Date(currentMonthStart);
  const currentMonthDone = (logsByMonth.get(currentMonthStr) || 0) >= targetPerMonth;
  const currentMonthFrozen = frozenMonthsSet.has(currentMonthStr);

  if (currentMonthDone || currentMonthFrozen) {
    currentStreak = 1;
    checkMonth.setMonth(checkMonth.getMonth() - 1);
  } else {
    checkMonth.setMonth(checkMonth.getMonth() - 1);
  }

  while (true) {
    const mStr = formatDateKey(checkMonth);
    const done = (logsByMonth.get(mStr) || 0) >= targetPerMonth;
    const frozen = frozenMonthsSet.has(mStr);
    if (done || frozen) {
      currentStreak++;
      checkMonth.setMonth(checkMonth.getMonth() - 1);
    } else {
      break;
    }
  }

  return {
    currentStreak,
    longestStreak: currentStreak,
    streakFreezeState: {
      availableFreezes: netAvailableFreezes,
      maxFreezes,
      consecutiveDaysForRecovery: 3,
      consecutiveDaysCount: runningConsecutive,
      frozenDates: savedFreezeState.frozenDates || [],
      pendingRepairDates,
      lastEvaluatedDate: formatDateKey(targetDate)
    },
    freezeEarnedToday
  };
}

/**
 * Consumes 1 streak freeze to repair a missed day
 */
export const applyStreakRepair = (
  freezeState: StreakFreezeState,
  dateToRepair: string
): StreakFreezeState => {
  if (freezeState.availableFreezes <= 0) {
    return freezeState;
  }

  const newFrozenDates = Array.from(new Set([...(freezeState.frozenDates || []), dateToRepair]));
  const newPendingRepairs = (freezeState.pendingRepairDates || []).filter(r => r.dateStr !== dateToRepair);

  return {
    ...freezeState,
    availableFreezes: Math.max(0, freezeState.availableFreezes - 1),
    frozenDates: newFrozenDates,
    pendingRepairDates: newPendingRepairs
  };
};

export type DayStatus = 'completed' | 'frozen' | 'missed' | 'today-pending' | 'repair-available' | 'future';

export interface CalendarDayInfo {
  date: Date;
  dateStr: string;
  dayNumber: number;
  dayName: string;
  isToday: boolean;
  status: DayStatus;
  habitCount: number;
  rewardEarned: number;
  daysRemainingToRepair?: number;
}

/**
 * Returns calendar days for streak view / history heatmap
 */
export const getStreakCalendarData = (
  validLogs: RewardLog[],
  frozenDates: string[] = [],
  pendingRepairs: PendingStreakRepair[] = [],
  daysCount: number = 35,
  targetDate: Date = new Date()
): CalendarDayInfo[] => {
  const result: CalendarDayInfo[] = [];
  const todayStr = formatDateKey(targetDate);
  const frozenSet = new Set(frozenDates);
  const repairMap = new Map(pendingRepairs.map(r => [r.dateStr, r.daysRemaining]));

  const logsByDate = validLogs.reduce((acc, log) => {
    const dStr = formatDateKey(log.timestamp);
    if (!acc[dStr]) {
      acc[dStr] = { count: 0, rewards: 0 };
    }
    acc[dStr].count += 1;
    acc[dStr].rewards += (log.rewardEarned || 0);
    return acc;
  }, {} as Record<string, { count: number; rewards: number }>);

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = addDays(targetDate, -i);
    const dateStr = formatDateKey(d);
    const isToday = dateStr === todayStr;
    const dayData = logsByDate[dateStr] || { count: 0, rewards: 0 };
    const repairRemaining = repairMap.get(dateStr);

    let status: DayStatus = 'missed';
    if (dayData.count > 0) {
      status = 'completed';
    } else if (frozenSet.has(dateStr)) {
      status = 'frozen';
    } else if (repairRemaining !== undefined) {
      status = 'repair-available';
    } else if (isToday) {
      status = 'today-pending';
    }

    result.push({
      date: d,
      dateStr,
      dayNumber: d.getDate(),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday,
      status,
      habitCount: dayData.count,
      rewardEarned: dayData.rewards,
      daysRemainingToRepair: repairRemaining
    });
  }

  return result;
};
