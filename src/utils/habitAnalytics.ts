import { RewardLog } from '../types';
export const getValidHabitLogs = (habitId: string, logs: RewardLog[]): RewardLog[] => {
  return logs
    .filter(log => log.activityId === habitId && !log.isRetracted && !isNaN(new Date(log.timestamp).getTime()))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // newest first
};

export const getHabitLifetimeStats = (validLogs: RewardLog[]) => {
  return {
    completionCount: validLogs.length,
    lifetimeCoins: validLogs.reduce((sum, log) => sum + (log.rewardEarned || 0), 0)
  };
};

export type TimelineEvent = 
  | { type: 'log'; id: string; timestamp: string; rewardEarned: number; icon: string; habitName: string }
  | { type: 'freeze'; id: string; timestamp: string; dateStr: string };

export const getHabitTimeline = (
  validLogs: RewardLog[], 
  frozenDates: string[] = [], 
  limit: number = 10
): TimelineEvent[] => {
  const events: TimelineEvent[] = validLogs.map(log => ({
    type: 'log',
    id: log.id,
    timestamp: log.timestamp,
    rewardEarned: log.rewardEarned || 0,
    icon: log.icon,
    habitName: log.habitName
  }));

  frozenDates.forEach(dateStr => {
    // We synthesize a timestamp at the end of the frozen day so it interleaves nicely
    events.push({
      type: 'freeze',
      id: `freeze-${dateStr}`,
      timestamp: `${dateStr}T23:59:59.000Z`,
      dateStr
    });
  });

  return events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};
