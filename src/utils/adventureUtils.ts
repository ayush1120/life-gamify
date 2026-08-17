import { 
  QuestDefinition, 
  BossDefinition, 
  AchievementDefinition, 
  RewardLog, 
  Habit, 
  HabitStats, 
  ActivityMapping, 
  StatId 
} from '../types';
import { toLocalDateString } from './dateUtils';
import { computeStatsBreakdown } from './progressionUtils';

export interface QuestProgressSummary {
  isComplete: boolean;
  percentage: number;
  requirements: Array<{
    habitId: string;
    habitName?: string;
    targetCount: number;
    currentCount: number;
    completed: boolean;
  }>;
}

export interface BossStateSummary {
  currentHp: number;
  damageDealt: number;
  percentage: number;
  isDefeated: boolean;
  isExpired: boolean;
  daysRemaining: number;
}

/**
 * Computes deterministic progress for an active quest from the activity ledger history (Phase 17).
 */
export const computeQuestProgress = (
  quest: QuestDefinition,
  rewardLogs: RewardLog[],
  now: Date = new Date()
): QuestProgressSummary => {
  const validLogs = rewardLogs.filter(l => !l.isRetracted);

  // Time window filtering based on quest type
  let filteredLogs = validLogs;
  if (quest.type === 'daily') {
    const todayStr = toLocalDateString(now);
    filteredLogs = validLogs.filter(l => toLocalDateString(l.timestamp) === todayStr);
  } else if (quest.type === 'weekly') {
    // Current calendar week (Monday to Sunday)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diffToMonday = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekStartMs = startOfWeek.getTime();
    filteredLogs = validLogs.filter(l => new Date(l.timestamp).getTime() >= weekStartMs);
  } else {
    // Milestone: since quest createdAt timestamp
    const questCreatedMs = quest.createdAt ? new Date(quest.createdAt).getTime() : 0;
    filteredLogs = validLogs.filter(l => new Date(l.timestamp).getTime() >= questCreatedMs);
  }

  // Count completions per habit
  const habitCounts: Record<string, number> = {};
  for (const log of filteredLogs) {
    habitCounts[log.activityId] = (habitCounts[log.activityId] || 0) + 1;
  }

  let totalTarget = 0;
  let totalCurrent = 0;
  let allCompleted = true;

  const requirementsSummary = (quest.requirements || []).map(req => {
    const currentCount = habitCounts[req.habitId] || 0;
    const completed = currentCount >= req.targetCount;
    totalTarget += req.targetCount;
    totalCurrent += Math.min(currentCount, req.targetCount);
    if (!completed) allCompleted = false;

    return {
      habitId: req.habitId,
      habitName: req.habitName,
      targetCount: req.targetCount,
      currentCount,
      completed
    };
  });

  const percentage = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0;

  return {
    isComplete: allCompleted && requirementsSummary.length > 0,
    percentage,
    requirements: requirementsSummary
  };
};

/**
 * Computes deterministic boss battle state (Damage, Remaining HP, Defeat status) (Phase 20).
 * Boss damage = accumulated stat XP in the boss's relevantStats since boss.startDate.
 */
export const computeBossState = (
  boss: BossDefinition,
  rewardLogs: RewardLog[],
  habits: Habit[],
  activityMappings: Record<string, ActivityMapping> = {},
  now: Date = new Date()
): BossStateSummary => {
  const startDateMs = boss.startDate ? new Date(boss.startDate).getTime() : 0;
  const endDateMs = boss.endDate ? new Date(boss.endDate).getTime() : (startDateMs + 30 * 24 * 3600 * 1000);

  // Filter logs recorded during the active boss battle period
  const bossPeriodLogs = rewardLogs.filter(l => {
    if (l.isRetracted) return false;
    const logTime = new Date(l.timestamp).getTime();
    return logTime >= startDateMs;
  });

  // Calculate stat XP earned during this battle
  const battleStatsBreakdown = computeStatsBreakdown(bossPeriodLogs, habits, activityMappings);

  let damageDealt = 0;
  for (const stat of boss.relevantStats) {
    if (battleStatsBreakdown[stat as StatId]) {
      damageDealt += battleStatsBreakdown[stat as StatId].xp;
    }
  }

  const currentHp = Math.max(0, boss.maxHp - damageDealt);
  const percentage = boss.maxHp > 0 ? Math.max(0, Math.min(100, Math.round((currentHp / boss.maxHp) * 100))) : 0;
  const isDefeated = currentHp === 0;
  const isExpired = !isDefeated && now.getTime() > endDateMs;
  const msRemaining = Math.max(0, endDateMs - now.getTime());
  const daysRemaining = Math.ceil(msRemaining / (1000 * 3600 * 24));

  return {
    currentHp,
    damageDealt,
    percentage,
    isDefeated,
    isExpired,
    daysRemaining
  };
};

/**
 * Checks if an achievement unlock requirement is satisfied (Phase 22).
 */
export const checkAchievementUnlock = (
  achievement: AchievementDefinition,
  stats: HabitStats,
  rewardLogs: RewardLog[]
): boolean => {
  const validLogs = rewardLogs.filter(l => !l.isRetracted);

  for (const req of achievement.requirements) {
    if (req.habitId && req.targetCount) {
      const count = validLogs.filter(l => l.activityId === req.habitId).length;
      if (count < req.targetCount) return false;
    }

    if (req.stat && req.targetLevel) {
      const statProg = stats.statsBreakdown?.[req.stat];
      if (!statProg || statProg.level < req.targetLevel) return false;
    }
  }

  return achievement.requirements.length > 0;
};
