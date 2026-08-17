import { describe, it, expect } from 'vitest';
import { calculateXp, calculateLevel, getXpRequiredForLevel, getLevelProgress } from '../progressionUtils';

describe('progressionUtils', () => {
  describe('calculateXp', () => {
    it('calculates XP as 5x coins', () => {
      expect(calculateXp(10)).toBe(50);
      expect(calculateXp(100)).toBe(500);
      expect(calculateXp(0)).toBe(0);
    });
  });

  describe('getXpRequiredForLevel', () => {
    it('calculates the correct XP boundaries for early levels', () => {
      expect(getXpRequiredForLevel(1)).toBe(100);
      expect(getXpRequiredForLevel(2)).toBe(282); // floor(100 * 2^1.5)
      expect(getXpRequiredForLevel(3)).toBe(519); // floor(100 * 3^1.5)
    });
    
    it('returns 0 for level <= 0', () => {
      expect(getXpRequiredForLevel(0)).toBe(0);
      expect(getXpRequiredForLevel(-5)).toBe(0);
    });
  });

  describe('calculateLevel', () => {
    it('calculates level 0 for <100 XP', () => {
      expect(calculateLevel(0)).toBe(0);
      expect(calculateLevel(99)).toBe(0);
    });

    it('calculates correct level for specific XP boundaries', () => {
      expect(calculateLevel(100)).toBe(1);
      expect(calculateLevel(282)).toBe(2);
      expect(calculateLevel(519)).toBe(3);
    });

    it('calculates correctly for XP between levels', () => {
      expect(calculateLevel(150)).toBe(1);
      expect(calculateLevel(300)).toBe(2);
      expect(calculateLevel(500)).toBe(2);
    });
  });

  describe('getLevelProgress', () => {
    it('returns correct progression object for level 0', () => {
      const progress = getLevelProgress(50);
      expect(progress.level).toBe(0);
      expect(progress.currentLevelXp).toBe(0);
      expect(progress.nextLevelXp).toBe(100);
      expect(progress.xpIntoLevel).toBe(50);
      expect(progress.xpNeededForLevel).toBe(100);
      expect(progress.percentage).toBe(50);
      expect(progress.xpToNextLevel).toBe(50);
    });

    it('returns correct progression object for level 1 (boundary)', () => {
      const progress = getLevelProgress(100);
      expect(progress.level).toBe(1);
      expect(progress.currentLevelXp).toBe(100);
      expect(progress.nextLevelXp).toBe(282);
      expect(progress.xpIntoLevel).toBe(0);
      expect(progress.xpNeededForLevel).toBe(182);
      expect(progress.percentage).toBe(0);
      expect(progress.xpToNextLevel).toBe(182);
    });

    it('returns correct progression object mid-level', () => {
      const progress = getLevelProgress(191); // halfway between 100 and 282
      expect(progress.level).toBe(1);
      expect(progress.percentage).toBe(50);
      expect(progress.xpToNextLevel).toBe(91);
    });
  });
});
