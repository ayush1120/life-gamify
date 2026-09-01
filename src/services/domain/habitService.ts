import { HabitSchema } from '../../domain/contracts';
import { 
  loadStoredHabits, 
  saveStoredHabits 
} from '../storage';
import { 
  syncFirestoreHabit
} from '../firebase';
import { Habit } from '../../types';

export class HabitService {
  public static async getHabits(_userId?: string): Promise<Habit[]> {
    return loadStoredHabits();
  }

  public static async getHabitById(id: string, userId?: string): Promise<Habit | undefined> {
    const habits = await this.getHabits(userId);
    return habits.find(h => h.id === id);
  }

  public static async createHabit(habitData: Partial<Habit>, userId?: string): Promise<Habit> {
    const habits = await this.getHabits(userId);
    const newHabit: Habit = {
      id: habitData.id || `habit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: habitData.name || 'New Habit',
      description: habitData.description || '',
      icon: habitData.icon || '⭐',
      rewardValue: habitData.rewardValue ?? 5,
      frequency: habitData.frequency || 'daily',
      category: habitData.category || 'Personal',
      tags: habitData.tags || [],
      active: habitData.active ?? true,
      color: habitData.color || '#3b82f6',
      order: habitData.order ?? habits.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const validated = HabitSchema.parse(newHabit);
    const updatedList = [...habits, validated as Habit];
    saveStoredHabits(updatedList);

    if (userId) {
      await syncFirestoreHabit(userId, validated as Habit);
    }
    return validated as Habit;
  }

  public static async updateHabit(id: string, updates: Partial<Habit>, userId?: string): Promise<Habit> {
    const habits = await this.getHabits(userId);
    const index = habits.findIndex(h => h.id === id);
    if (index === -1) {
      throw new Error(`Habit with ID ${id} not found`);
    }

    const updated: Habit = {
      ...habits[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const validated = HabitSchema.parse(updated);
    habits[index] = validated as Habit;
    saveStoredHabits(habits);

    if (userId) {
      await syncFirestoreHabit(userId, validated as Habit);
    }
    return validated as Habit;
  }

  public static async archiveHabit(id: string, userId?: string): Promise<Habit> {
    return this.updateHabit(id, { active: false }, userId);
  }
}
