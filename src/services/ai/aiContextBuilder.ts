import { HabitStats, Habit, RewardLog, QuestDefinition, BossDefinition } from '../../types';
import { GameMasterContext } from './aiContract';

/**
 * Builds the compact structured context for the AI Game Master (Phase 11 & 26).
 * Extracts 14-30 day activity ledger history, active quests/bosses, and archived items.
 */
export const buildGameMasterContext = (
  stats: HabitStats,
  habits: Habit[],
  rewardLogs: RewardLog[],
  activeQuests: QuestDefinition[] = [],
  activeBoss: BossDefinition | null = null,
  archivedQuests: QuestDefinition[] = [],
  archivedBosses: BossDefinition[] = []
): GameMasterContext => {
  // 1. User progression summary
  const userStatsBreakdown: GameMasterContext['user']['statsBreakdown'] = {} as any;
  if (stats.statsBreakdown) {
    for (const [statId, progress] of Object.entries(stats.statsBreakdown)) {
      userStatsBreakdown[statId as keyof typeof userStatsBreakdown] = {
        level: progress.level,
        xp: progress.xp,
        name: progress.name
      };
    }
  }

  // 2. Active habits catalogue
  const habitsSummary = habits
    .filter(h => h.active)
    .map(h => ({
      id: h.id,
      name: h.name,
      category: h.category || 'General',
      tags: h.tags || [],
      frequency: h.frequency || 'daily',
      rewardValue: h.rewardValue,
      active: h.active
    }));

  // 3. Recent activity history (last 30 days of non-retracted logs)
  const thirtyDaysAgoMs = Date.now() - 30 * 24 * 3600 * 1000;
  const recentLogs = rewardLogs
    .filter(l => !l.isRetracted && new Date(l.timestamp).getTime() >= thirtyDaysAgoMs)
    .slice(0, 50)
    .map(l => ({
      habitId: l.activityId,
      habitName: l.habitName,
      timestamp: l.timestamp,
      rewardEarned: l.rewardEarned
    }));

  // 4. Current active quests
  const questsSummary = activeQuests
    .filter(q => q.status === 'active')
    .map(q => ({
      id: q.id,
      title: q.title,
      type: q.type
    }));

  // 5. Current active boss
  const bossSummary = activeBoss && activeBoss.status === 'active'
    ? {
        id: activeBoss.id,
        name: activeBoss.name,
        relevantStats: activeBoss.relevantStats
      }
    : null;

  // 6. Archived items summary to prevent repetitive suggestions (Phase 26)
  const archivedItemsSummary: string[] = [
    ...archivedQuests.map(q => `Quest: "${q.title}" (${q.type})`),
    ...archivedBosses.map(b => `Boss: "${b.name}" (${b.theme})`)
  ].slice(0, 10);

  return {
    user: {
      level: stats.level,
      totalXp: stats.totalXp,
      statsBreakdown: userStatsBreakdown
    },
    habits: habitsSummary,
    recentActivity: recentLogs,
    activeQuests: questsSummary,
    activeBoss: bossSummary,
    archivedItemsSummary: archivedItemsSummary.length > 0 ? archivedItemsSummary : undefined
  };
};
