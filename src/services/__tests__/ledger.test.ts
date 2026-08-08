import { describe, it, expect } from 'vitest';
import { 
  calculateMistakeFee, 
  calculateKarmaSurcharge, 
  calculateRestockingFee, 
  isGracePeriod, 
  isHabitLogGracePeriod,
  isRedemptionGracePeriod,
  computeLedgerStats 
} from '../ledger';
import { RewardLog, RewardRedemption } from '../../types';

describe('Karma Ledger Calculations & Security Defenses', () => {

  describe('1% Mistake Fee (Normal Log Deletes)', () => {
    it('returns 0 when vault balance is 0', () => {
      expect(calculateMistakeFee(0)).toBe(0);
      expect(calculateMistakeFee(-10)).toBe(0);
    });

    it('calculates 1% fee rounded up with minimum 1 coin when balance > 0', () => {
      expect(calculateMistakeFee(1)).toBe(1);
      expect(calculateMistakeFee(50)).toBe(1);
      expect(calculateMistakeFee(100)).toBe(1);
      expect(calculateMistakeFee(101)).toBe(2);
      expect(calculateMistakeFee(250)).toBe(3);
    });
  });

  describe('2% Karma Surcharge (Spent Log Retractions)', () => {
    it('returns 0 when vault balance is 0', () => {
      expect(calculateKarmaSurcharge(0)).toBe(0);
    });

    it('calculates 2% surcharge rounded up with minimum 1 coin when balance > 0', () => {
      expect(calculateKarmaSurcharge(1)).toBe(1);
      expect(calculateKarmaSurcharge(40)).toBe(1);
      expect(calculateKarmaSurcharge(50)).toBe(1);
      expect(calculateKarmaSurcharge(51)).toBe(2);
      expect(calculateKarmaSurcharge(100)).toBe(2);
      expect(calculateKarmaSurcharge(101)).toBe(3);
    });
  });

  describe('15% Late Restocking Fee (Store Refunds)', () => {
    it('returns 0 when item cost is 0', () => {
      expect(calculateRestockingFee(0)).toBe(0);
    });

    it('calculates 15% restocking fee rounded up with minimum 1 coin when spent > 0', () => {
      expect(calculateRestockingFee(1)).toBe(1);
      expect(calculateRestockingFee(5)).toBe(1);
      expect(calculateRestockingFee(10)).toBe(2); // ceil(1.5) = 2
      expect(calculateRestockingFee(20)).toBe(3); // ceil(3) = 3
      expect(calculateRestockingFee(25)).toBe(4); // ceil(3.75) = 4
    });
  });

  describe('5-Minute Habit Log Accidental Tap Grace Window', () => {
    it('qualifies for 100% free deletion (0% fee) if <= 5 minutes elapsed', () => {
      const now = Date.now();
      const log10SecAgo = new Date(now - 10 * 1000).toISOString();
      const log2MinAgo = new Date(now - 2 * 60 * 1000).toISOString();
      const log5MinAgo = new Date(now - 5 * 60 * 1000).toISOString();

      expect(isHabitLogGracePeriod(log10SecAgo, now)).toBe(true);
      expect(isHabitLogGracePeriod(log2MinAgo, now)).toBe(true);
      expect(isHabitLogGracePeriod(log5MinAgo, now)).toBe(true);
    });

    it('requires 1% mistake fee if > 5 minutes elapsed', () => {
      const now = Date.now();
      const log5Min1SecAgo = new Date(now - (5 * 60 + 1) * 1000).toISOString();
      const log10MinAgo = new Date(now - 10 * 60 * 1000).toISOString();
      const log1HourAgo = new Date(now - 60 * 60 * 1000).toISOString();

      expect(isHabitLogGracePeriod(log5Min1SecAgo, now)).toBe(false);
      expect(isHabitLogGracePeriod(log10MinAgo, now)).toBe(false);
      expect(isHabitLogGracePeriod(log1HourAgo, now)).toBe(false);
    });

    it('handles clock shifts safely without crashing', () => {
      const now = Date.now();
      const futureTime = new Date(now + 10000).toISOString();
      expect(isHabitLogGracePeriod(futureTime, now)).toBe(true);
    });
  });

  describe('1-Hour Refund Grace Window', () => {
    it('qualifies for 100% free refund if <= 60 minutes elapsed', () => {
      const now = Date.now();
      const purchase30mAgo = new Date(now - 30 * 60 * 1000).toISOString();
      const purchase60mAgo = new Date(now - 60 * 60 * 1000).toISOString();

      expect(isRedemptionGracePeriod(purchase30mAgo, now)).toBe(true);
      expect(isRedemptionGracePeriod(purchase60mAgo, now)).toBe(true);
      expect(isGracePeriod(purchase30mAgo, now)).toBe(true);
    });

    it('triggers late restocking fee if > 60 minutes elapsed', () => {
      const now = Date.now();
      const purchase61mAgo = new Date(now - 61 * 60 * 1000).toISOString();
      const purchase2HoursAgo = new Date(now - 120 * 60 * 1000).toISOString();

      expect(isRedemptionGracePeriod(purchase61mAgo, now)).toBe(false);
      expect(isRedemptionGracePeriod(purchase2HoursAgo, now)).toBe(false);
      expect(isGracePeriod(purchase61mAgo, now)).toBe(false);
    });

    it('handles clock shifts safely without crashing', () => {
      const now = Date.now();
      const futureTime = new Date(now + 10000).toISOString();
      expect(isRedemptionGracePeriod(futureTime, now)).toBe(true);
    });
  });

  describe('Compute Ledger Stats & Phantom Debt Flow', () => {

    it('computes accurate non-negative coin balance for normal earnings and spend', () => {
      const logs: RewardLog[] = [
        { id: '1', activityId: 'h1', habitName: 'Run', icon: '🏃', rewardEarned: 20, timestamp: '2026-08-01T10:00:00Z', unit: 'Coins' },
        { id: '2', activityId: 'h2', habitName: 'Gym', icon: '🏋️', rewardEarned: 30, timestamp: '2026-08-01T11:00:00Z', unit: 'Coins' },
      ];
      const redemptions: RewardRedemption[] = [
        { id: 'r1', rewardId: 'rw1', rewardName: 'Snack', coinsSpent: 15, timestamp: '2026-08-01T12:00:00Z' }
      ];

      const stats = computeLedgerStats(logs, redemptions);
      expect(stats.totalCoinsEarned).toBe(50);
      expect(stats.totalCoinsSpent).toBe(15);
      expect(stats.coinBalance).toBe(35);
      expect(stats.phantomDebt).toBe(0);
    });

    it('calculates Phantom Debt when logs are retracted after spend', () => {
      const logs: RewardLog[] = [
        { id: '1', activityId: 'h1', habitName: 'Run', icon: '🏃', rewardEarned: 20, timestamp: '2026-08-01T10:00:00Z', unit: 'Coins' },
        // Log 2 retracted in deficit with a 2-coin Karma Surcharge
        { id: '2', activityId: 'h2', habitName: 'Gym', icon: '🏋️', rewardEarned: 20, timestamp: '2026-08-01T11:00:00Z', unit: 'Coins', isRetracted: true, retractedAt: '2026-08-01T13:00:00Z', karmaFeeApplied: 2 }
      ];
      const redemptions: RewardRedemption[] = [
        { id: 'r1', rewardId: 'rw1', rewardName: 'Gaming', coinsSpent: 30, timestamp: '2026-08-01T12:00:00Z' }
      ];

      const stats = computeLedgerStats(logs, redemptions);
      expect(stats.totalCoinsEarned).toBe(20); // Retracted log excluded from total earned
      expect(stats.coinBalance).toBe(0); // Clamped at 0
      expect(stats.phantomDebt).toBe(12); // (30 spent - 20 active earned) + 2 karma fee = 12
    });

    it('automatically pays off Phantom Debt when new habits are logged', () => {
      const logs: RewardLog[] = [
        { id: '1', activityId: 'h1', habitName: 'Run', icon: '🏃', rewardEarned: 10, timestamp: '2026-08-01T10:00:00Z', unit: 'Coins' },
        { id: '2', activityId: 'h2', habitName: 'Gym', icon: '🏋️', rewardEarned: 10, timestamp: '2026-08-01T11:00:00Z', unit: 'Coins', isRetracted: true, karmaFeeApplied: 0 },
        // New log to pay off debt
        { id: '3', activityId: 'h3', habitName: 'Read', icon: '📚', rewardEarned: 15, timestamp: '2026-08-01T14:00:00Z', unit: 'Coins' }
      ];
      const redemptions: RewardRedemption[] = [
        { id: 'r1', rewardId: 'rw1', rewardName: 'Gaming', coinsSpent: 15, timestamp: '2026-08-01T12:00:00Z' }
      ];

      // Before log 3: Earned 10, Spent 15 -> Balance 0, Debt 5.
      // Log 3 adds 15: 5 pays debt -> Debt 0, Balance 10.
      const stats = computeLedgerStats(logs, redemptions);
      expect(stats.phantomDebt).toBe(0);
      expect(stats.coinBalance).toBe(10);
    });

  });

});
