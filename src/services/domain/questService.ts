import { QuestSchema } from '../../domain/contracts';
import { 
  loadStoredQuests, 
  saveStoredQuests 
} from '../storage';
import { 
  syncFirestoreQuest
} from '../firebase';
import { QuestDefinition, QuestStatus } from '../../types';

export class QuestService {
  public static async getQuests(_userId?: string): Promise<QuestDefinition[]> {
    return loadStoredQuests();
  }

  public static async getActiveQuests(userId?: string): Promise<QuestDefinition[]> {
    const quests = await this.getQuests(userId);
    return quests.filter(q => q.status === 'active');
  }

  public static async createQuest(questData: Partial<QuestDefinition>, userId?: string): Promise<QuestDefinition> {
    const quests = await this.getQuests(userId);
    const newQuest: QuestDefinition = {
      id: questData.id || `quest-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: questData.title || 'New Quest',
      description: questData.description || 'Complete your habits to fulfill this quest.',
      type: questData.type || 'daily',
      difficulty: questData.difficulty || 'medium',
      requirements: questData.requirements || [],
      xpReward: Math.max(10, Math.min(1000, Number(questData.xpReward) || 50)),
      coinReward: Math.max(1, Math.min(100, Number(questData.coinReward) || 5)),
      status: questData.status || 'active',
      createdAt: new Date().toISOString(),
      source: questData.source || 'ai'
    };

    const validated = QuestSchema.parse(newQuest);
    const updated = [validated as QuestDefinition, ...quests];
    saveStoredQuests(updated);

    if (userId) {
      await syncFirestoreQuest(userId, validated as QuestDefinition);
    }
    return validated as QuestDefinition;
  }

  public static async updateQuestStatus(id: string, status: QuestStatus, userId?: string): Promise<QuestDefinition> {
    const quests = await this.getQuests(userId);
    const index = quests.findIndex(q => q.id === id);
    if (index === -1) {
      throw new Error(`Quest ${id} not found`);
    }

    const updated: QuestDefinition = {
      ...quests[index],
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : quests[index].completedAt,
      archivedAt: status === 'archived' || status === 'dismissed' ? new Date().toISOString() : quests[index].archivedAt
    };

    const validated = QuestSchema.parse(updated);
    quests[index] = validated as QuestDefinition;
    saveStoredQuests(quests);

    if (userId) {
      await syncFirestoreQuest(userId, validated as QuestDefinition);
    }
    return validated as QuestDefinition;
  }

  public static async archiveQuest(id: string, userId?: string): Promise<QuestDefinition> {
    return this.updateQuestStatus(id, 'archived', userId);
  }
}
