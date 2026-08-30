import { RewardLog, RewardRedemption, HabitStats, Habit, ActivityMapping, StreakFreezeState } from '../types';
import { toLocalDateString } from '../utils/dateUtils';
import { calculateXp, getLevelProgress, computeStatsBreakdown } from '../utils/progressionUtils';

/**
 * Calculates the 1% Mistake Fee for normal habit log deletions.
 * Formula: Math.max(1, Math.ceil(vaultBalance * 0.01)) if balance > 0, else 0.
 */
export const calculateMistakeFee = (vaultBalance: number): number => {
  if (vaultBalance <= 0) return 0;
  return Math.max(1, Math.ceil(vaultBalance * 0.01));
};

/**
 * Calculates the 2% Karma Surcharge applied when retracting a spent habit log.
 * Formula: Math.max(1, Math.ceil(vaultBalance * 0.02)) if balance > 0, else 0.
 */
export const calculateKarmaSurcharge = (vaultBalance: number): number => {
  if (vaultBalance <= 0) return 0;
  return Math.max(1, Math.ceil(vaultBalance * 0.02));
};

/**
 * Calculates the 15% Late Restocking Fee for store reward refunds (>60 minutes).
 * Formula: Math.max(1, Math.ceil(coinsSpent * 0.15)) if coinsSpent > 0, else 0.
 */
export const calculateRestockingFee = (coinsSpent: number): number => {
  if (coinsSpent <= 0) return 0;
  return Math.max(1, Math.ceil(coinsSpent * 0.15));
};

/**
 * Checks if a habit log is within the 5-Minute Grace Period (300,000 ms) for a 100% free deletion (Accidental Tap Protection).
 */
export const isHabitLogGracePeriod = (logTimestamp: string, nowMs: number = Date.now()): boolean => {
  const logTime = new Date(logTimestamp).getTime();
  const elapsedMs = Math.max(0, nowMs - logTime);
  return elapsedMs <= 300000; // 5 minutes = 300,000 ms
};

/**
 * Checks if a store redemption is within the 1-Hour (60 minute) Grace Period for a free refund.
 */
export const isRedemptionGracePeriod = (purchaseTimestamp: string, nowMs: number = Date.now()): boolean => {
  const purchaseTime = new Date(purchaseTimestamp).getTime();
  const elapsedMs = Math.max(0, nowMs - purchaseTime);
  return elapsedMs <= 3600000; // 60 minutes = 3,600,000 ms
};

/** Alias for store redemption grace period */
export const isGracePeriod = isRedemptionGracePeriod;

import { evaluateStreakAndFreezes, evaluateHabitStreakAndFreezes, DEFAULT_STREAK_FREEZE_STATE } from '../utils/streakUtils';

/**
 * Computes all Coin Economy Statistics dynamically from chronological transactions.
 */
export const computeLedgerStats = (
  rewardLogs: RewardLog[],
  redemptions: RewardRedemption[],
  habits: Habit[] = [],
  activityMappings: Record<string, ActivityMapping> = {},
  initialStreakFreezeState: StreakFreezeState = DEFAULT_STREAK_FREEZE_STATE,
  savedHabitFreezeStates: Record<string, StreakFreezeState> = {}
): HabitStats => {
  const validLogs = rewardLogs.filter(l => !l.isRetracted);
  const totalCoinsEarned = validLogs.reduce((sum, log) => sum + log.rewardEarned, 0);

  // Combine active earnings, redemptions, and karma surcharges in chronological order
  const transactions: Array<{
    type: 'EARN' | 'SPEND' | 'KARMA_FEE';
    amount: number;
    timestamp: string;
  }> = [];

  for (const log of rewardLogs) {
    if (log.isRetracted) {
      if (log.karmaFeeApplied && log.karmaFeeApplied > 0) {
        transactions.push({
          type: 'KARMA_FEE',
          amount: log.karmaFeeApplied,
          timestamp: log.retractedAt || log.timestamp
        });
      }
    } else {
      transactions.push({
        type: 'EARN',
        amount: log.rewardEarned,
        timestamp: log.timestamp
      });
    }
  }

  for (const r of redemptions) {
    transactions.push({
      type: 'SPEND',
      amount: r.coinsSpent,
      timestamp: r.timestamp
    });
  }

  // Sort by timestamp ascending
  transactions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let runningBalance = 0;
  let activePhantomDebt = 0;
  let totalCoinsSpent = 0;

  for (const tx of transactions) {
    if (tx.type === 'EARN') {
      if (activePhantomDebt > 0) {
        const debtPaid = Math.min(activePhantomDebt, tx.amount);
        activePhantomDebt -= debtPaid;
        runningBalance += (tx.amount - debtPaid);
      } else {
        runningBalance += tx.amount;
      }
    } else if (tx.type === 'KARMA_FEE') {
      activePhantomDebt += tx.amount;
    } else {
      // SPEND
      totalCoinsSpent += tx.amount;
      if (runningBalance >= tx.amount) {
        runningBalance -= tx.amount;
      } else {
        const covered = runningBalance;
        const deficit = tx.amount - covered;
        runningBalance = 0;
        activePhantomDebt += deficit;
      }
    }
  }

  // Calculate today stats using valid logs only (in local timezone)
  const todayStr = toLocalDateString(new Date());
  const todayLogs = validLogs.filter(log => toLocalDateString(log.timestamp) === todayStr);
  const todayCount = todayLogs.length;
  const todayCoinsEarned = todayLogs.reduce((s, l) => s + l.rewardEarned, 0);

  // Evaluate app-wide streaks and streak freezes (including 3-day recovery logic & 2-day repair)
  const streakEval = evaluateStreakAndFreezes(validLogs, initialStreakFreezeState);

  // Evaluate per-habit streaks and streak freezes
  const evaluatedHabitFreezeStates: Record<string, StreakFreezeState> = {};
  for (const habit of habits) {
    const habitEval = evaluateHabitStreakAndFreezes(
      habit, 
      rewardLogs, 
      savedHabitFreezeStates[habit.id] || DEFAULT_STREAK_FREEZE_STATE
    );
    evaluatedHabitFreezeStates[habit.id] = habitEval.streakFreezeState;
  }

  const firstLogDate = validLogs.length > 0 
    ? new Date(validLogs[validLogs.length - 1].timestamp)
    : new Date();
  const daysActive = Math.max(1, Math.ceil((new Date().getTime() - firstLogDate.getTime()) / (1000 * 3600 * 24)));
  const averagePerDay = Number((totalCoinsEarned / daysActive).toFixed(1));

  // --- PROGRESSION STATS ---
  const totalXp = calculateXp(totalCoinsEarned);
  const progress = getLevelProgress(totalXp);
  const statsBreakdown = computeStatsBreakdown(rewardLogs, habits, activityMappings);

  return {
    totalCoinsEarned,
    totalCoinsSpent,
    coinBalance: Math.max(0, runningBalance),
    phantomDebt: activePhantomDebt,
    todayCount,
    todayCoinsEarned,
    currentStreak: streakEval.currentStreak,
    longestStreak: streakEval.longestStreak,
    averagePerDay,
    totalXp,
    level: progress.level,
    levelProgress: progress.percentage,
    xpToNextLevel: progress.xpToNextLevel,
    statsBreakdown,
    streakFreezeState: streakEval.streakFreezeState,
    habitStreakFreezeStates: evaluatedHabitFreezeStates
  };
};

