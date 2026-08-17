import { RewardLog, RewardRedemption, HabitStats, Habit, ActivityMapping } from '../types';
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

/**
 * Computes all Coin Economy Statistics dynamically from chronological transactions.
 */
export const computeLedgerStats = (
  rewardLogs: RewardLog[],
  redemptions: RewardRedemption[],
  habits: Habit[] = [],
  activityMappings: Record<string, ActivityMapping> = {}
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

  // Calculate streaks using valid logs only (in local timezone)
  const uniqueLogDates = Array.from(
    new Set(validLogs.map(l => toLocalDateString(l.timestamp)))
  ).filter(Boolean).sort().reverse();

  let currentStreak = 0;
  const checkDate = new Date();

  for (let i = 0; i < 365; i++) {
    const dateStr = toLocalDateString(checkDate);
    if (uniqueLogDates.includes(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      // If user hasn't logged today yet, check yesterday before breaking streak
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDates = [...uniqueLogDates].sort();
  let prevDateObj: Date | null = null;

  for (const dStr of sortedDates) {
    const dObj = new Date(`${dStr}T00:00:00`);
    if (!prevDateObj) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((dObj.getTime() - prevDateObj.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    prevDateObj = dObj;
    if (tempStreak > longestStreak) longestStreak = tempStreak;
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
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    averagePerDay,
    totalXp,
    level: progress.level,
    levelProgress: progress.percentage,
    xpToNextLevel: progress.xpToNextLevel,
    statsBreakdown
  };
};

