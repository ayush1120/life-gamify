import { ActivityLogSchema } from '../../domain/contracts';
import { 
  loadStoredLogs, 
  saveStoredLogs,
  loadStoredHabits 
} from '../storage';
import { 
  syncFirestoreRewardLog
} from '../firebase';
import { RewardLog } from '../../types';

export class ActivityService {
  public static async getActivityLogs(_userId?: string): Promise<RewardLog[]> {
    return loadStoredLogs();
  }

  public static async logActivity(habitId: string, userId?: string): Promise<RewardLog> {
    const habits = loadStoredHabits();
    const habit = habits.find(h => h.id === habitId);
    if (!habit) {
      throw new Error(`Cannot log activity: Habit ${habitId} not found`);
    }

    const now = new Date();
    const localDateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD

    const newLog: RewardLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      activityId: habit.id,
      habitName: habit.name,
      icon: habit.icon,
      timestamp: now.toISOString(),
      localDateStr,
      rewardEarned: habit.rewardValue,
      unit: 'coins'
    };

    const validated = ActivityLogSchema.parse(newLog);
    const existingLogs = loadStoredLogs();
    const updated = [validated as RewardLog, ...existingLogs];
    saveStoredLogs(updated);

    if (userId) {
      await syncFirestoreRewardLog(userId, validated as RewardLog);
    }
    return validated as RewardLog;
  }
}
