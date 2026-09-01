import { 
  loadStoredLogs, 
  loadStoredRedemptions 
} from '../storage';
import { HabitStats, StatBreakdown, StatId } from '../../types';

export class ProgressService {
  public static async calculateProgress(_userId?: string): Promise<HabitStats> {
    const logs = loadStoredLogs();
    const redemptions = loadStoredRedemptions();

    const totalCoinsEarned = logs
      .filter(l => !l.isRetracted)
      .reduce((sum, l) => sum + (Number(l.rewardEarned) || 0), 0);

    const totalCoinsSpent = redemptions
      .reduce((sum, r) => sum + (Number(r.coinsSpent) || 0), 0);

    const coinBalance = totalCoinsEarned - totalCoinsSpent;

    const todayStr = new Date().toLocaleDateString('en-CA');
    const todayLogs = logs.filter(l => (l.localDateStr || l.timestamp.split('T')[0]) === todayStr && !l.isRetracted);
    const todayCount = todayLogs.length;
    const todayCoinsEarned = todayLogs.reduce((sum, l) => sum + (Number(l.rewardEarned) || 0), 0);

    // Calculate unique active days & streak
    const activeDates = Array.from(new Set(logs.filter(l => !l.isRetracted).map(l => l.localDateStr || l.timestamp.split('T')[0]))).sort();
    const currentStreak = activeDates.length > 0 ? 1 : 0;
    const longestStreak = activeDates.length;
    const averagePerDay = activeDates.length > 0 ? Number((logs.length / activeDates.length).toFixed(1)) : 0;

    // Total XP = total coins earned * 10
    const totalXp = totalCoinsEarned * 10;
    const level = Math.max(1, Math.floor(totalXp / 100) + 1);
    const levelProgress = totalXp % 100;
    const xpToNextLevel = 100 - levelProgress;

    const baseStats: StatId[] = ['health', 'fitness', 'knowledge', 'career', 'creativity', 'discipline', 'social'];
    const statsBreakdown: any = {};

    baseStats.forEach(stat => {
      const statXp = Math.floor(totalXp / baseStats.length);
      const statLevel = Math.max(1, Math.floor(statXp / 100) + 1);
      statsBreakdown[stat] = {
        stat,
        name: stat.charAt(0).toUpperCase() + stat.slice(1),
        icon: stat === 'health' ? '❤️' : stat === 'fitness' ? '⚡' : stat === 'knowledge' ? '🧠' : stat === 'discipline' ? '🛡️' : '✨',
        color: '#3b82f6',
        description: `${stat} progression`,
        xp: statXp,
        level: statLevel,
        levelProgress: statXp % 100,
        xpToNextLevel: 100 - (statXp % 100)
      };
    });

    const progress: HabitStats = {
      totalCoinsEarned,
      totalCoinsSpent,
      coinBalance,
      phantomDebt: 0,
      todayCount,
      todayCoinsEarned,
      currentStreak,
      longestStreak,
      averagePerDay,
      totalXp,
      level,
      levelProgress,
      xpToNextLevel,
      statsBreakdown: statsBreakdown as StatBreakdown,
      streakFreezeState: {
        availableFreezes: 1,
        maxFreezes: 2,
        consecutiveDaysForRecovery: 3,
        consecutiveDaysCount: 0,
        frozenDates: []
      }
    };

    return progress;
  }
}
