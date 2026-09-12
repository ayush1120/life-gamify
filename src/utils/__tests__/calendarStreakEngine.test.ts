import { describe, it, expect } from 'vitest';
import { 
  buildUnifiedMonthCalendar, 
  isLeapYear, 
  getDaysInMonth, 
  getPreviousMonth, 
  getNextMonth,
  buildDateKey
} from '../calendarStreakEngine';
import { Habit, RewardLog } from '../../types';

describe('Centralized Calendar & Streak Engine', () => {
  const dummyHabit1: Habit = {
    id: 'habit-exercise',
    name: 'Morning Workout',
    icon: '🏋️',
    rewardValue: 10,
    frequency: 'daily',
    active: true,
    color: '#ef4444',
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const dummyHabit2: Habit = {
    id: 'habit-reading',
    name: 'Read Book',
    icon: '📚',
    rewardValue: 5,
    frequency: 'daily',
    active: true,
    color: '#3b82f6',
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const sampleLogs: RewardLog[] = [
    {
      id: 'log-1',
      activityId: 'habit-exercise',
      habitName: 'Morning Workout',
      icon: '🏋️',
      rewardEarned: 10,
      timestamp: '2026-09-01T08:00:00.000Z',
      localDateStr: '2026-09-01',
      unit: 'coins'
    },
    {
      id: 'log-2',
      activityId: 'habit-exercise',
      habitName: 'Morning Workout',
      icon: '🏋️',
      rewardEarned: 10,
      timestamp: '2026-09-02T08:00:00.000Z',
      localDateStr: '2026-09-02',
      unit: 'coins'
    },
    {
      id: 'log-3',
      activityId: 'habit-reading',
      habitName: 'Read Book',
      icon: '📚',
      rewardEarned: 5,
      timestamp: '2026-09-02T20:00:00.000Z',
      localDateStr: '2026-09-02',
      unit: 'coins'
    },
    {
      id: 'log-4',
      activityId: 'habit-reading',
      habitName: 'Read Book',
      icon: '📚',
      rewardEarned: 5,
      timestamp: '2026-09-05T20:00:00.000Z',
      localDateStr: '2026-09-05',
      unit: 'coins'
    }
  ];

  describe('1. Date Math, Boundaries & Leap Years', () => {
    it('correctly calculates leap years', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2028)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(1900)).toBe(false);
      expect(isLeapYear(2025)).toBe(false);
      expect(isLeapYear(2026)).toBe(false);
    });

    it('returns correct days in month including leap Februaries', () => {
      expect(getDaysInMonth(2024, 1)).toBe(29); // Feb 2024 (leap)
      expect(getDaysInMonth(2026, 1)).toBe(28); // Feb 2026 (non-leap)
      expect(getDaysInMonth(2026, 8)).toBe(30); // Sep 2026
      expect(getDaysInMonth(2026, 7)).toBe(31); // Aug 2026
    });

    it('handles year boundary transitions in navigation', () => {
      expect(getPreviousMonth(2026, 0)).toEqual({ year: 2025, month: 11 }); // Jan -> Dec
      expect(getNextMonth(2025, 11)).toEqual({ year: 2026, month: 0 }); // Dec -> Jan
      expect(getPreviousMonth(2026, 8)).toEqual({ year: 2026, month: 7 }); // Sep -> Aug
      expect(getNextMonth(2026, 8)).toEqual({ year: 2026, month: 9 }); // Sep -> Oct
    });

    it('builds date key formatted YYYY-MM-DD', () => {
      expect(buildDateKey(2026, 8, 5)).toBe('2026-09-05');
      expect(buildDateKey(2026, 0, 1)).toBe('2026-01-01');
      expect(buildDateKey(2026, 11, 31)).toBe('2026-12-31');
    });
  });

  describe('2. Global Context Calendar', () => {
    it('aggregates all qualifying activities across habits in global mode', () => {
      const fixedTarget = new Date('2026-09-10T12:00:00');
      const calendar = buildUnifiedMonthCalendar(2026, 8, {
        mode: 'global',
        rewardLogs: sampleLogs,
        targetDate: fixedTarget
      });

      expect(calendar.monthLabel).toBe('September 2026');
      expect(calendar.stats.totalDaysInMonth).toBe(30);

      // On Sep 2, both habit-exercise and habit-reading were logged
      const sep2 = calendar.days.find(d => d.dateStr === '2026-09-02');
      expect(sep2).toBeDefined();
      expect(sep2?.status).toBe('completed');
      expect(sep2?.completionsCount).toBe(2);
      expect(sep2?.rewardEarned).toBe(15);
      expect(sep2?.logs.length).toBe(2);

      // Total completed days in month should be 3 (Sep 1, Sep 2, Sep 5)
      expect(calendar.stats.completedDays).toBe(3);
      expect(calendar.stats.totalLogs).toBe(4);
      expect(calendar.stats.totalCoinsEarned).toBe(30);
    });
  });

  describe('3. Habit Context Calendar (Strict Isolation / No Data Leakage)', () => {
    it('shows only exercise habit completions when viewing habit-exercise', () => {
      const fixedTarget = new Date('2026-09-10T12:00:00');
      const calendar = buildUnifiedMonthCalendar(2026, 8, {
        mode: 'habit',
        habit: dummyHabit1,
        rewardLogs: sampleLogs,
        targetDate: fixedTarget
      });

      // On Sep 5, only habit-reading was logged -> for habit-exercise, Sep 5 must be missed!
      const sep5 = calendar.days.find(d => d.dateStr === '2026-09-05');
      expect(sep5).toBeDefined();
      expect(sep5?.status).toBe('missed');
      expect(sep5?.completionsCount).toBe(0);
      expect(sep5?.logs.length).toBe(0);

      // On Sep 2, habit-exercise was logged 1 time
      const sep2 = calendar.days.find(d => d.dateStr === '2026-09-02');
      expect(sep2?.status).toBe('completed');
      expect(sep2?.completionsCount).toBe(1);
      expect(sep2?.rewardEarned).toBe(10);
      expect(sep2?.logs.length).toBe(1);
      expect(sep2?.logs[0].activityId).toBe('habit-exercise');

      // Total completed days for habit-exercise should be 2 (Sep 1 and Sep 2)
      expect(calendar.stats.completedDays).toBe(2);
      expect(calendar.stats.totalCoinsEarned).toBe(20);
    });

    it('shows only reading habit completions when viewing habit-reading', () => {
      const fixedTarget = new Date('2026-09-10T12:00:00');
      const calendar = buildUnifiedMonthCalendar(2026, 8, {
        mode: 'habit',
        habit: dummyHabit2,
        rewardLogs: sampleLogs,
        targetDate: fixedTarget
      });

      // On Sep 1, only habit-exercise was logged -> for habit-reading, Sep 1 must be missed!
      const sep1 = calendar.days.find(d => d.dateStr === '2026-09-01');
      expect(sep1?.status).toBe('missed');
      expect(sep1?.completionsCount).toBe(0);

      // On Sep 5, habit-reading was logged
      const sep5 = calendar.days.find(d => d.dateStr === '2026-09-05');
      expect(sep5?.status).toBe('completed');
      expect(sep5?.completionsCount).toBe(1);

      // Total completed days for habit-reading should be 2 (Sep 2 and Sep 5)
      expect(calendar.stats.completedDays).toBe(2);
      expect(calendar.stats.totalCoinsEarned).toBe(10);
    });
  });

  describe('4. Streak Freeze & Repair States', () => {
    it('correctly flags frozen days', () => {
      const fixedTarget = new Date('2026-09-10T12:00:00');
      const calendar = buildUnifiedMonthCalendar(2026, 8, {
        mode: 'global',
        rewardLogs: sampleLogs,
        streakFreezeState: {
          availableFreezes: 1,
          maxFreezes: 2,
          consecutiveDaysForRecovery: 3,
          consecutiveDaysCount: 1,
          frozenDates: ['2026-09-03'],
          pendingRepairDates: []
        },
        targetDate: fixedTarget
      });

      const sep3 = calendar.days.find(d => d.dateStr === '2026-09-03');
      expect(sep3?.status).toBe('frozen');
      expect(calendar.stats.frozenDays).toBe(1);
      expect(calendar.stats.activeDays).toBe(4); // 3 completed + 1 frozen
    });
  });

  describe('5. Month Grid & Padding Cells', () => {
    it('ensures the grid is an exact multiple of 7 (complete weeks)', () => {
      const calendar = buildUnifiedMonthCalendar(2026, 8, {
        mode: 'global',
        rewardLogs: []
      });

      expect(calendar.days.length % 7).toBe(0);
      expect(calendar.days.filter(d => !d.isPadding).length).toBe(30);
    });
  });
});
