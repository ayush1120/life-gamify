import { describe, it, expect } from 'vitest';
import { evaluateHabitStreakAndFreezes, applyStreakRepair, DEFAULT_STREAK_FREEZE_STATE } from '../streakUtils';
import { Habit, RewardLog } from '../../types';

describe('Edge Cases: Dual Streaks, Multi-Day Repairs & Frequency Support', () => {
  const habitGym: Habit = {
    id: 'habit-gym',
    name: 'Gym Workout',
    icon: '🏋️',
    rewardValue: 5,
    frequency: 'daily',
    active: true,
    color: '#3b82f6',
    order: 1,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  };

  const weeklyHabit: Habit = {
    id: 'habit-weekly-run',
    name: 'Long Run',
    icon: '🏃',
    rewardValue: 15,
    frequency: 'weekly',
    maxPerPeriod: 1,
    active: true,
    color: '#10b981',
    order: 2,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  };

  const makeLog = (habitId: string, dateStr: string): RewardLog => ({
    id: `log-${habitId}-${dateStr}`,
    activityId: habitId,
    habitName: habitId === 'habit-gym' ? 'Gym Workout' : 'Long Run',
    icon: '🏋️',
    timestamp: `${dateStr}T10:00:00`,
    rewardEarned: 5,
    unit: 'times'
  });

  it('Edge Case 1: Multi-day missed repair (Monday + Tuesday repaired with 2 freezes)', () => {
    // Aug 10, 11, 12 (3 days = 1st freeze)
    // Aug 13, 14, 15 (3 days = 2nd freeze -> 2 freezes ready!)
    // Missed Aug 16 (Monday)
    // Missed Aug 17 (Tuesday)
    // Today Aug 18 (Wednesday)
    const targetDate = new Date('2026-08-18T12:00:00');
    const logs = [
      makeLog('habit-gym', '2026-08-10'),
      makeLog('habit-gym', '2026-08-11'),
      makeLog('habit-gym', '2026-08-12'),
      makeLog('habit-gym', '2026-08-13'),
      makeLog('habit-gym', '2026-08-14'),
      makeLog('habit-gym', '2026-08-15'),
      // Missed 16 and 17
      makeLog('habit-gym', '2026-08-18'), // done today
    ];

    const initialEval = evaluateHabitStreakAndFreezes(habitGym, logs, DEFAULT_STREAK_FREEZE_STATE, targetDate);
    expect(initialEval.streakFreezeState.availableFreezes).toBe(2);
    expect(initialEval.streakFreezeState.pendingRepairDates?.length).toBe(2);

    // Repair Aug 16
    let state = applyStreakRepair(initialEval.streakFreezeState, '2026-08-16');
    expect(state.availableFreezes).toBe(1);

    // Repair Aug 17
    state = applyStreakRepair(state, '2026-08-17');
    expect(state.availableFreezes).toBe(0);

    // Re-evaluate with both repaired
    const finalEval = evaluateHabitStreakAndFreezes(habitGym, logs, state, targetDate);
    // Streak spans all 9 days (10, 11, 12, 13, 14, 15, 16(F), 17(F), 18)
    expect(finalEval.currentStreak).toBe(9);
  });

  it('Edge Case 2: Weekly habit recovery (3 consecutive weeks earns 1 weekly freeze)', () => {
    // Week 1: Monday Aug 3
    // Week 2: Monday Aug 10
    // Week 3: Monday Aug 17
    const targetDate = new Date('2026-08-19T12:00:00');
    const logs = [
      makeLog('habit-weekly-run', '2026-08-04'),
      makeLog('habit-weekly-run', '2026-08-11'),
      makeLog('habit-weekly-run', '2026-08-18'),
    ];

    const result = evaluateHabitStreakAndFreezes(weeklyHabit, logs, DEFAULT_STREAK_FREEZE_STATE, targetDate);
    expect(result.currentStreak).toBe(3);
    expect(result.streakFreezeState.availableFreezes).toBe(1);
  });

  it('Edge Case 3: Retracted log dynamically removes unearned freeze', () => {
    // 3 logs originally (Aug 10, 11, 12 -> 1 freeze earned)
    const logs = [
      makeLog('habit-gym', '2026-08-10'),
      makeLog('habit-gym', '2026-08-11'),
      makeLog('habit-gym', '2026-08-12'),
    ];

    const evalBefore = evaluateHabitStreakAndFreezes(habitGym, logs, DEFAULT_STREAK_FREEZE_STATE, new Date('2026-08-12T12:00:00'));
    expect(evalBefore.streakFreezeState.availableFreezes).toBe(1);

    // Retract Aug 11 log
    const retractedLogs = logs.map(l => l.id.includes('2026-08-11') ? { ...l, isRetracted: true } : l);
    const evalAfter = evaluateHabitStreakAndFreezes(habitGym, retractedLogs, DEFAULT_STREAK_FREEZE_STATE, new Date('2026-08-12T12:00:00'));
    
    // Because Aug 11 was retracted, 3 consecutive days was not completed -> 0 freezes
    expect(evalAfter.streakFreezeState.availableFreezes).toBe(0);
  });

  it('Edge Case 4: Frequency change from daily to weekly preserves earned freeze balance', () => {
    // User earned 1 freeze under daily habit (Aug 10, 11, 12)
    const logs = [
      makeLog('habit-gym', '2026-08-10'),
      makeLog('habit-gym', '2026-08-11'),
      makeLog('habit-gym', '2026-08-12'),
    ];

    const dailyEval = evaluateHabitStreakAndFreezes(habitGym, logs, DEFAULT_STREAK_FREEZE_STATE, new Date('2026-08-12T12:00:00'));
    expect(dailyEval.streakFreezeState.availableFreezes).toBe(1);

    // Habit frequency changes to 'weekly'
    const updatedWeeklyHabit: Habit = { ...habitGym, frequency: 'weekly', maxPerPeriod: 2 };
    const weeklyEval = evaluateHabitStreakAndFreezes(updatedWeeklyHabit, logs, dailyEval.streakFreezeState, new Date('2026-08-12T12:00:00'));

    // Freeze balance is preserved
    expect(weeklyEval.streakFreezeState.availableFreezes).toBe(1);
    // Weekly streak is 1 (completed week of Aug 10)
    expect(weeklyEval.currentStreak).toBe(1);
  });

  it('Edge Case 5: Frequency change correctly maps historically spent daily freezes to the new weekly period', () => {
    // User earned freezes, then missed a day (Tuesday Aug 11) and froze it while the habit was 'daily'.
    const logs = [
      makeLog('habit-gym', '2026-08-10'),
      // Missed 11
      makeLog('habit-gym', '2026-08-12'),
    ];

    // Simulate an initial daily state where Aug 11 was repaired
    const repairedDailyState = {
      ...DEFAULT_STREAK_FREEZE_STATE,
      availableFreezes: 0,
      frozenDates: ['2026-08-11'] // A daily frozen date!
    };

    const dailyEval = evaluateHabitStreakAndFreezes(habitGym, logs, repairedDailyState, new Date('2026-08-12T12:00:00'));
    // In daily, streak is unbroken (3 days) because 11 is frozen
    expect(dailyEval.currentStreak).toBe(3);

    // Now user changes habit frequency to weekly (Target: 3x per week).
    const updatedWeeklyHabit: Habit = { ...habitGym, frequency: 'weekly', maxPerPeriod: 3 };
    
    // Evaluate weekly streak!
    // Week starts Aug 10. They logged Aug 10, Aug 12 (count = 2). Target is 3.
    // However, they had previously frozen a day in this week ('2026-08-11').
    // The engine should map '2026-08-11' to the week '2026-08-10' and consider the week bridged/frozen.
    const weeklyEval = evaluateHabitStreakAndFreezes(updatedWeeklyHabit, logs, repairedDailyState, new Date('2026-08-12T12:00:00'));

    // The entire week should be bridged, so currentStreak is 1!
    expect(weeklyEval.currentStreak).toBe(1);
    expect(weeklyEval.streakFreezeState.frozenDates).toContain('2026-08-11'); // Original key preserved
  });

  it('Edge Case 6: The "Chasm" prevents offering unrepairable days', () => {
    // Habit created Aug 10
    const logs = [
      makeLog('habit-gym', '2026-08-10'),
    ];
    // Missed Aug 11 (T-3), Missed Aug 12 (T-2), Missed Aug 13 (T-1). Target Date Aug 14 (Today).
    // Because Aug 11 (T-3) is missed, repairing Aug 12 or 13 will fall into a chasm (an unrepairable broken streak).
    const targetDate = new Date('2026-08-14T12:00:00');
    
    // Simulate user having a freeze banked (they shouldn't be allowed to spend it)
    const stateWithFreezes = { ...DEFAULT_STREAK_FREEZE_STATE, availableFreezes: 1 };
    
    const result = evaluateHabitStreakAndFreezes(habitGym, logs, stateWithFreezes, targetDate);
    
    // Engine should detect the chasm at T-3 and refuse to offer pending repairs for T-1 and T-2
    expect(result.streakFreezeState.pendingRepairDates?.length).toBe(0);
  });

  it('Edge Case 7: Semantic Local Date locking prevents Timezone Travel bugs', () => {
    // A user in NY (UTC-4) logs a habit on Aug 15th at 10 PM NY time.
    // That is Aug 16th 02:00 UTC!
    const timestampUTC = '2026-08-16T02:00:00.000Z'; // 2 AM UTC
    
    const legacyLog: RewardLog = {
      ...makeLog('habit-gym', '2026-08-16'),
      timestamp: timestampUTC,
      localDateStr: '2026-08-15' // The migration locks it to the semantic local day
    };

    // Even if the user travels to Tokyo, the engine respects the localDateStr!
    // So on Aug 16th (Target Date), the engine should see they logged it on Aug 15th, not Aug 16th!
    const targetDate = new Date('2026-08-16T12:00:00.000Z');
    const result = evaluateHabitStreakAndFreezes(habitGym, [legacyLog], DEFAULT_STREAK_FREEZE_STATE, targetDate);
    
    // Because they logged it on the 15th, and target date is 16th, the streak is 1 (done yesterday, still alive)
    // If the engine used raw UTC, it would say they did it on the 16th.
    expect(result.currentStreak).toBe(1);
    
    // Let's verify what happens if localDateStr is MISSING (fallback behavior)
    const fallbackLog: RewardLog = {
      ...makeLog('habit-gym', '2026-08-16'),
      timestamp: timestampUTC
    };
    // Delete localDateStr
    delete fallbackLog.localDateStr;
    
    // In fallback mode, because their system local time evaluates '2026-08-16T02:00:00Z', 
    // it will dynamically resolve based on the environment running the test. 
    // We just verify it doesn't crash.
    const resultFallback = evaluateHabitStreakAndFreezes(habitGym, [fallbackLog], DEFAULT_STREAK_FREEZE_STATE, targetDate);
    expect(typeof resultFallback.currentStreak).toBe('number');
  });
});
