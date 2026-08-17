import { Habit, RewardLog, StatId, StatWeight, ActivityMapping, StatBreakdown } from '../types';


export const XP_MULTIPLIER = 5;

export const ALL_STAT_IDS: StatId[] = ['health', 'fitness', 'knowledge', 'career', 'creativity', 'discipline', 'social'];

export const STAT_DEFINITIONS: Record<StatId, { name: string; icon: string; color: string; description: string }> = {
  health: { name: 'Health', icon: '❤️', color: '#ef4444', description: 'Physical well-being, nutrition, sleep, and recovery' },
  fitness: { name: 'Fitness', icon: '⚡', color: '#f97316', description: 'Exercise, endurance, strength, and physical performance' },
  knowledge: { name: 'Knowledge', icon: '🧠', color: '#3b82f6', description: 'Learning, reading, research, and intellectual mastery' },
  career: { name: 'Career', icon: '💼', color: '#8b5cf6', description: 'Professional growth, deep work, projects, and productivity' },
  creativity: { name: 'Creativity', icon: '🎨', color: '#ec4899', description: 'Art, music, writing, design, and inventive pursuits' },
  discipline: { name: 'Discipline', icon: '🛡️', color: '#10b981', description: 'Habit consistency, focus, routine, and self-mastery' },
  social: { name: 'Social', icon: '🤝', color: '#06b6d4', description: 'Relationships, community, communication, and connection' },
};

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
    xpToNextLevel: Math.max(0, xpForNextLevel - totalXp)
  };
};

/**
 * Normalizes stat weights so they sum precisely to 1.0.
 */
export const normalizeStatWeights = (stats: StatWeight[]): StatWeight[] => {
  const valid = stats.filter(s => ALL_STAT_IDS.includes(s.stat) && s.weight > 0);
  if (valid.length === 0) {
    return [{ stat: 'discipline', weight: 1.0 }];
  }
  const totalWeight = valid.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight <= 0) {
    return [{ stat: 'discipline', weight: 1.0 }];
  }
  return valid.map(s => ({
    stat: s.stat,
    weight: Number((s.weight / totalWeight).toFixed(3))
  }));
};

/**
 * Deterministically generates a default ActivityMapping for a habit
 * using category, tags, and name keywords as semantic hints.
 */
export const getDefaultHabitMapping = (habit: Partial<Habit>): ActivityMapping => {
  const habitId = habit.id || 'temp';
  const category = (habit.category || '').toLowerCase();
  const name = (habit.name || '').toLowerCase();
  const tags = (habit.tags || []).map(t => t.toLowerCase());

  const allText = `${category} ${name} ${tags.join(' ')}`;

  // Category/keyword matching rules
  if (category === 'fitness' || allText.includes('gym') || allText.includes('workout') || allText.includes('run') || allText.includes('walk') || allText.includes('exercise')) {
    return {
      habitId,
      stats: [
        { stat: 'fitness', weight: 0.8 },
        { stat: 'discipline', weight: 0.2 }
      ],
      source: 'default',
      confidence: 0.85
    };
  }

  if (category === 'health' || allText.includes('sleep') || allText.includes('water') || allText.includes('diet') || allText.includes('meditat') || allText.includes('stretch')) {
    return {
      habitId,
      stats: [
        { stat: 'health', weight: 0.75 },
        { stat: 'discipline', weight: 0.25 }
      ],
      source: 'default',
      confidence: 0.85
    };
  }

  if (category === 'learning' || category === 'knowledge' || allText.includes('read') || allText.includes('study') || allText.includes('book') || allText.includes('course') || allText.includes('research')) {
    return {
      habitId,
      stats: [
        { stat: 'knowledge', weight: 0.8 },
        { stat: 'discipline', weight: 0.2 }
      ],
      source: 'default',
      confidence: 0.85
    };
  }

  if (category === 'career' || category === 'work' || allText.includes('code') || allText.includes('program') || allText.includes('project') || allText.includes('email') || allText.includes('meeting')) {
    return {
      habitId,
      stats: [
        { stat: 'career', weight: 0.75 },
        { stat: 'discipline', weight: 0.25 }
      ],
      source: 'default',
      confidence: 0.85
    };
  }

  if (category === 'music' || category === 'creativity' || allText.includes('art') || allText.includes('guitar') || allText.includes('piano') || allText.includes('draw') || allText.includes('write')) {
    return {
      habitId,
      stats: [
        { stat: 'creativity', weight: 0.8 },
        { stat: 'discipline', weight: 0.2 }
      ],
      source: 'default',
      confidence: 0.85
    };
  }

  if (category === 'social' || allText.includes('friend') || allText.includes('call') || allText.includes('family') || allText.includes('network') || allText.includes('meetup')) {
    return {
      habitId,
      stats: [
        { stat: 'social', weight: 0.75 },
        { stat: 'discipline', weight: 0.25 }
      ],
      source: 'default',
      confidence: 0.85
    };
  }

  if (category === 'personal') {
    return {
      habitId,
      stats: [
        { stat: 'discipline', weight: 0.6 },
        { stat: 'health', weight: 0.4 }
      ],
      source: 'default',
      confidence: 0.7
    };
  }

  // Fallback default: 100% discipline
  return {
    habitId,
    stats: [{ stat: 'discipline', weight: 1.0 }],
    source: 'default',
    confidence: 0.6
  };
};

/**
 * Initializes a default zeroed-out StatBreakdown.
 */
export const getDefaultStatsBreakdown = (): StatBreakdown => {
  const breakdown = {} as StatBreakdown;
  for (const stat of ALL_STAT_IDS) {
    const def = STAT_DEFINITIONS[stat];
    const progress = getLevelProgress(0);
    breakdown[stat] = {
      stat,
      name: def.name,
      icon: def.icon,
      color: def.color,
      description: def.description,
      xp: 0,
      level: progress.level,
      levelProgress: progress.percentage,
      xpToNextLevel: progress.xpToNextLevel
    };
  }
  return breakdown;
};

/**
 * Computes deterministic multi-stat breakdown from the append-only activity ledger.
 */
export const computeStatsBreakdown = (
  rewardLogs: RewardLog[],
  habits: Habit[],
  customMappings: Record<string, ActivityMapping> = {}
): StatBreakdown => {
  const habitsMap = new Map<string, Habit>();
  for (const h of habits) {
    habitsMap.set(h.id, h);
  }

  // Running XP accumulation for each of the 7 stats
  const statXpTotals: Record<StatId, number> = {
    health: 0,
    fitness: 0,
    knowledge: 0,
    career: 0,
    creativity: 0,
    discipline: 0,
    social: 0
  };

  const validLogs = rewardLogs.filter(log => !log.isRetracted);

  for (const log of validLogs) {
    const habit = habitsMap.get(log.activityId);
    let mapping = customMappings[log.activityId];
    if (!mapping) {
      mapping = habit ? getDefaultHabitMapping(habit) : {
        habitId: log.activityId,
        stats: [{ stat: 'discipline', weight: 1.0 }],
        source: 'default'
      };
    }

    const logXp = calculateXp(log.rewardEarned);
    const normalizedStats = normalizeStatWeights(mapping.stats);

    for (const item of normalizedStats) {
      statXpTotals[item.stat] += logXp * item.weight;
    }
  }

  const breakdown = {} as StatBreakdown;

  for (const stat of ALL_STAT_IDS) {
    const totalStatXp = Math.round(statXpTotals[stat]);
    const def = STAT_DEFINITIONS[stat];
    const progress = getLevelProgress(totalStatXp);

    breakdown[stat] = {
      stat,
      name: def.name,
      icon: def.icon,
      color: def.color,
      description: def.description,
      xp: totalStatXp,
      level: progress.level,
      levelProgress: progress.percentage,
      xpToNextLevel: progress.xpToNextLevel
    };
  }

  return breakdown;
};

