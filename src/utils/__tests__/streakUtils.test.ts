import { describe, it, expect } from 'vitest';
import { evaluateStreakAndFreezes, DEFAULT_STREAK_FREEZE_STATE, getStreakCalendarData, applyStreakRepair } from '../streakUtils';
import { RewardLog } from '../../types';

describe('streakUtils with Streak Freeze & 3-Day Recovery', () => {
  const makeLog = (id: string, dateStr: string, reward = 5): RewardLog => ({
    id: `log-${id}`,
    activityId: 'habit-1',
    habitName: 'Run',
    icon: '🏃',
    timestamp: `${dateStr}T10:00:00`,
    rewardEarned: reward,
    unit: 'times'
  });

  it('should return 0 streak and 0 freezes initially for empty logs', () => {
    const result = evaluateStreakAndFreezes([]);
    expect(result.currentStreak).toBe(0);
    expect(result.streakFreezeState.availableFreezes).toBe(0);
    expect(result.streakFreezeState.frozenDates.length).toBe(0);
  });

  it('should earn 1 freeze after 3 consecutive days of habits (0 -> 1)', () => {
    const targetDate = new Date('2026-08-30T12:00:00');
    const logs = [
      makeLog('1', '2026-08-28'),
      makeLog('2', '2026-08-29'),
      makeLog('3', '2026-08-30'),
    ];

    const result = evaluateStreakAndFreezes(logs, DEFAULT_STREAK_FREEZE_STATE, targetDate);
    expect(result.currentStreak).toBe(3);
    expect(result.streakFreezeState.availableFreezes).toBe(1);
    expect(result.streakFreezeState.consecutiveDaysCount).toBe(0);
  });

  it('should cap max freezes at 2 when completing multiple 3-day blocks', () => {
    // 6 consecutive days completed
    const targetDate = new Date('2026-08-30T12:00:00');
    const logs = [
      makeLog('1', '2026-08-25'),
      makeLog('2', '2026-08-26'),
      makeLog('3', '2026-08-27'), // +1 freeze (1)
      makeLog('4', '2026-08-28'),
      makeLog('5', '2026-08-29'),
      makeLog('6', '2026-08-30'), // +1 freeze (2 - capped at max)
    ];

    const result = evaluateStreakAndFreezes(logs, DEFAULT_STREAK_FREEZE_STATE, targetDate);
    expect(result.currentStreak).toBe(6);
    expect(result.streakFreezeState.availableFreezes).toBe(2);
  });

  it('should detect missed yesterday in the 2-day repair window and allow repair', () => {
    // Earn 1 freeze (Aug 25, 26, 27)
    // Missed Aug 28 (yesterday relative to Aug 29)
    // Today Aug 29
    const targetDate = new Date('2026-08-29T12:00:00');
    const logs = [
      makeLog('1', '2026-08-25'),
      makeLog('2', '2026-08-26'),
      makeLog('3', '2026-08-27'),
    ];

    const result = evaluateStreakAndFreezes(logs, DEFAULT_STREAK_FREEZE_STATE, targetDate);
    expect(result.streakFreezeState.availableFreezes).toBe(1);
    expect(result.streakFreezeState.pendingRepairDates?.length).toBe(1);
    expect(result.streakFreezeState.pendingRepairDates?.[0].dateStr).toBe('2026-08-28');

    // Repair Aug 28
    const repaired = applyStreakRepair(result.streakFreezeState, '2026-08-28');
    expect(repaired.availableFreezes).toBe(0);
    expect(repaired.frozenDates).toContain('2026-08-28');

    // Re-evaluate with repaired state
    const evalRepaired = evaluateStreakAndFreezes(logs, repaired, targetDate);
    // Streak: 25, 26, 27, 28(F) = 4
    expect(evalRepaired.currentStreak).toBe(4);
  });

  it('should generate calendar data identifying completed, frozen, and repair-available days', () => {
    const targetDate = new Date('2026-08-30T12:00:00');
    const logs = [
      makeLog('1', '2026-08-28'),
      makeLog('2', '2026-08-30'),
    ];
    const frozenDates = ['2026-08-27'];
    const pendingRepairs = [{ dateStr: '2026-08-29', expiresAtDateStr: '2026-08-31', daysRemaining: 2 }];

    const calendar = getStreakCalendarData(logs, frozenDates, pendingRepairs, 7, targetDate);
    expect(calendar.length).toBe(7);

    const day27 = calendar.find(d => d.dateStr === '2026-08-27');
    const day28 = calendar.find(d => d.dateStr === '2026-08-28');
    const day29 = calendar.find(d => d.dateStr === '2026-08-29');
    const day30 = calendar.find(d => d.dateStr === '2026-08-30');

    expect(day27?.status).toBe('frozen');
    expect(day28?.status).toBe('completed');
    expect(day29?.status).toBe('repair-available');
    expect(day30?.status).toBe('completed');
  });
});
