import { BossSchema } from '../../domain/contracts';
import { 
  loadStoredBosses, 
  saveStoredBosses 
} from '../storage';
import { 
  syncFirestoreBoss
} from '../firebase';
import { BossDefinition } from '../../types';

export class BossService {
  public static async getBosses(_userId?: string): Promise<BossDefinition[]> {
    return loadStoredBosses();
  }

  public static async getActiveBoss(userId?: string): Promise<BossDefinition | undefined> {
    const bosses = await this.getBosses(userId);
    return bosses.find(b => b.status === 'active');
  }

  public static async createBoss(bossData: Partial<BossDefinition>, userId?: string): Promise<BossDefinition> {
    const bosses = await this.getBosses(userId);
    const now = new Date();
    const durationDays = Math.max(1, Math.min(30, Number(bossData.durationDays) || 5));
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const newBoss: BossDefinition = {
      id: bossData.id || `boss-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: bossData.name || 'Chronos the Time-Devourer',
      title: bossData.title || 'Lord of Procrastination',
      theme: bossData.theme || '⏳',
      description: bossData.description || 'A mythical boss challenging your consistency.',
      relevantStats: bossData.relevantStats || ['discipline', 'fitness'],
      maxHp: Math.max(20, Math.min(1000, Number(bossData.maxHp) || 120)),
      currentHp: Math.max(20, Math.min(1000, Number(bossData.maxHp) || 120)),
      durationDays,
      startDate: now.toISOString(),
      endDate,
      xpReward: Math.max(50, Math.min(2000, Number(bossData.xpReward) || 200)),
      coinReward: Math.max(5, Math.min(200, Number(bossData.coinReward) || 25)),
      status: 'active',
      createdAt: now.toISOString(),
      source: bossData.source || 'ai'
    };

    const validated = BossSchema.parse(newBoss);
    const updated = [validated as BossDefinition, ...bosses.filter(b => b.status !== 'active')];
    saveStoredBosses(updated);

    if (userId) {
      await syncFirestoreBoss(userId, validated as BossDefinition);
    }
    return validated as BossDefinition;
  }

  public static async damageBoss(bossId: string, damage: number, userId?: string): Promise<BossDefinition> {
    const bosses = await this.getBosses(userId);
    const index = bosses.findIndex(b => b.id === bossId);
    if (index === -1) {
      throw new Error(`Boss ${bossId} not found`);
    }

    const current = bosses[index];
    const newHp = Math.max(0, current.currentHp - damage);
    const isDefeated = newHp === 0;

    const updated: BossDefinition = {
      ...current,
      currentHp: newHp,
      status: isDefeated ? 'defeated' : current.status,
      defeatedAt: isDefeated ? new Date().toISOString() : current.defeatedAt
    };

    const validated = BossSchema.parse(updated);
    bosses[index] = validated as BossDefinition;
    saveStoredBosses(bosses);

    if (userId) {
      await syncFirestoreBoss(userId, validated as BossDefinition);
    }
    return validated as BossDefinition;
  }

  public static async archiveBoss(id: string, userId?: string): Promise<BossDefinition> {
    const bosses = await this.getBosses(userId);
    const index = bosses.findIndex(b => b.id === id);
    if (index === -1) throw new Error(`Boss ${id} not found`);

    const updated: BossDefinition = {
      ...bosses[index],
      status: 'archived'
    };
    const validated = BossSchema.parse(updated);
    bosses[index] = validated as BossDefinition;
    saveStoredBosses(bosses);

    if (userId) {
      await syncFirestoreBoss(userId, validated as BossDefinition);
    }
    return validated as BossDefinition;
  }
}
