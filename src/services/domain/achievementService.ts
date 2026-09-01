import { AchievementSchema } from '../../domain/contracts';
import { 
  loadStoredAchievements, 
  saveStoredAchievements 
} from '../storage';
import { 
  syncFirestoreAchievement 
} from '../firebase';
import { AchievementDefinition } from '../../types';

export class AchievementService {
  public static async getAchievements(_userId?: string): Promise<AchievementDefinition[]> {
    return loadStoredAchievements();
  }

  public static async createAchievement(achData: Partial<AchievementDefinition>, userId?: string): Promise<AchievementDefinition> {
    const achievements = await this.getAchievements(userId);
    const newAch: AchievementDefinition = {
      id: achData.id || `ach-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: achData.name || 'New Milestone',
      description: achData.description || 'Achieve greatness in Life Gamify.',
      icon: achData.icon || '🏆',
      category: achData.category || 'General',
      requirements: achData.requirements || [{ description: 'Complete milestone requirements' }],
      xpReward: Math.max(10, Math.min(1000, Number(achData.xpReward) || 100)),
      coinReward: Math.max(1, Math.min(100, Number(achData.coinReward) || 15)),
      status: achData.status || 'locked',
      source: achData.source || 'ai'
    };

    const validated = AchievementSchema.parse(newAch);
    const updated = [validated as AchievementDefinition, ...achievements];
    saveStoredAchievements(updated);

    if (userId) {
      await syncFirestoreAchievement(userId, validated as AchievementDefinition);
    }
    return validated as AchievementDefinition;
  }

  public static async unlockAchievement(id: string, userId?: string): Promise<AchievementDefinition> {
    const achievements = await this.getAchievements(userId);
    const index = achievements.findIndex(a => a.id === id);
    if (index === -1) throw new Error(`Achievement ${id} not found`);

    const updated: AchievementDefinition = {
      ...achievements[index],
      status: 'unlocked',
      unlockedAt: new Date().toISOString()
    };

    const validated = AchievementSchema.parse(updated);
    achievements[index] = validated as AchievementDefinition;
    saveStoredAchievements(achievements);

    if (userId) {
      await syncFirestoreAchievement(userId, validated as AchievementDefinition);
    }
    return validated as AchievementDefinition;
  }

  public static async archiveAchievement(id: string, userId?: string): Promise<AchievementDefinition> {
    const achievements = await this.getAchievements(userId);
    const index = achievements.findIndex(a => a.id === id);
    if (index === -1) throw new Error(`Achievement ${id} not found`);

    const updated: AchievementDefinition = {
      ...achievements[index],
      status: 'archived'
    };

    const validated = AchievementSchema.parse(updated);
    achievements[index] = validated as AchievementDefinition;
    saveStoredAchievements(achievements);

    if (userId) {
      await syncFirestoreAchievement(userId, validated as AchievementDefinition);
    }
    return validated as AchievementDefinition;
  }
}
