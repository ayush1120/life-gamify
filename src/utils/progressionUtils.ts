/**
 * Progression Utils (Phase 3 & 4)
 * 
 * Handles the deterministic calculation of XP and Levels based strictly on 
 * the total number of coins earned in the activity ledger.
 */

export const XP_MULTIPLIER = 5;

/**
 * Derives total XP deterministically from total coins earned.
 * Formula: baseXP = coinReward * XP_MULTIPLIER
 */
export const calculateXp = (totalCoinsEarned: number): number => {
  return totalCoinsEarned * XP_MULTIPLIER;
};

/**
 * Calculates the total XP required to reach a specific level.
 * Formula: required XP ≈ 100 * level^1.5
 * Level 1 = 100
 * Level 2 = 282
 * Level 3 = 519
 */
export const getXpRequiredForLevel = (level: number): number => {
  if (level <= 0) return 0;
  return Math.floor(100 * Math.pow(level, 1.5));
};

/**
 * Calculates the current Level based on total XP.
 * Uses a while loop to ensure it precisely matches the floored boundary of getXpRequiredForLevel.
 */
export const calculateLevel = (totalXp: number): number => {
  if (totalXp < 100) return 0;
  
  let level = 1;
  while (getXpRequiredForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
};

/**
 * Calculates the current progression state for the active level.
 */
export const getLevelProgress = (totalXp: number) => {
  const currentLevel = calculateLevel(totalXp);
  const xpForCurrentLevel = getXpRequiredForLevel(currentLevel);
  const xpForNextLevel = getXpRequiredForLevel(currentLevel + 1);
  
  const xpIntoLevel = totalXp - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  const percentage = Math.min(100, Math.max(0, Math.floor((xpIntoLevel / xpNeededForLevel) * 100)));
  
  return {
    level: currentLevel,
    currentLevelXp: xpForCurrentLevel,
    nextLevelXp: xpForNextLevel,
    xpIntoLevel,
    xpNeededForLevel,
    percentage,
    xpToNextLevel: xpForNextLevel - totalXp
  };
};
