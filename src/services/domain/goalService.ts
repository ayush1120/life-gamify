import { GoalSchema, GoalMilestoneSchema } from '../../domain/contracts';
import { loadStoredGoals, saveStoredGoals } from '../storage';
import { syncFirestoreGoal, deleteFirestoreGoal } from '../firebase';
import { Goal, GoalMilestone, GoalStatus } from '../../types';
import { validateGoalTitle, validateMilestoneTitle } from '../../utils/goalUtils';

export class GoalService {
  public static async getGoals(userId?: string): Promise<Goal[]> {
    return loadStoredGoals(userId);
  }

  public static async getGoalById(id: string, userId?: string): Promise<Goal | undefined> {
    const goals = await this.getGoals(userId);
    return goals.find(g => g.id === id);
  }

  public static async createGoal(goalData: Partial<Goal>, userId?: string): Promise<Goal> {
    const goals = await this.getGoals(userId);
    const validTitle = validateGoalTitle(goalData.title);
    const now = new Date().toISOString();

    const newGoal: Goal = {
      id: goalData.id || `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: userId || goalData.userId,
      title: validTitle,
      description: goalData.description?.trim() || undefined,
      status: goalData.status || 'active',
      startDate: goalData.startDate || undefined,
      deadline: goalData.deadline || undefined,
      icon: goalData.icon || '🎯',
      color: goalData.color || '#f59e0b',
      progressConfig: goalData.progressConfig || undefined,
      currentProgress: goalData.currentProgress !== undefined ? Math.max(0, goalData.currentProgress) : (goalData.progressConfig ? 0 : undefined),
      progressPeriods: goalData.progressPeriods || (goalData.progressConfig?.type === 'frequency' ? {} : undefined),
      milestones: goalData.milestones || [],
      createdAt: now,
      updatedAt: now
    };

    const validated = GoalSchema.parse(newGoal) as Goal;
    const updatedList = [validated, ...goals];
    saveStoredGoals(updatedList, userId);

    if (userId) {
      await syncFirestoreGoal(userId, validated);
    }
    return validated;
  }

  public static async updateGoal(id: string, updates: Partial<Goal>, userId?: string): Promise<Goal> {
    const goals = await this.getGoals(userId);
    const index = goals.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error(`Goal with ID ${id} not found`);
    }

    const current = goals[index];
    const now = new Date().toISOString();

    let newStatus = updates.status || current.status;
    let completedAt = current.completedAt;
    let archivedAt = current.archivedAt;

    if (updates.status && updates.status !== current.status) {
      if (updates.status === 'completed') {
        completedAt = now;
      } else if (updates.status === 'active' && current.status === 'completed') {
        completedAt = undefined;
      }

      if (updates.status === 'archived') {
        archivedAt = now;
      } else if (current.status === 'archived') {
        archivedAt = undefined;
      }

    }

    const title = updates.title !== undefined ? validateGoalTitle(updates.title) : current.title;

    const merged: Goal = {
      ...current,
      ...updates,
      title,
      status: newStatus,
      completedAt,
      archivedAt,
      updatedAt: now
    };

    const validated = GoalSchema.parse(merged) as Goal;
    goals[index] = validated;
    saveStoredGoals(goals, userId);

    if (userId) {
      await syncFirestoreGoal(userId, validated);
    }
    return validated;
  }

  public static async deleteGoal(id: string, userId?: string): Promise<void> {
    const goals = await this.getGoals(userId);
    const filtered = goals.filter(g => g.id !== id);
    saveStoredGoals(filtered, userId);

    if (userId) {
      await deleteFirestoreGoal(userId, id);
    }
  }

  public static async setStatus(id: string, status: GoalStatus, userId?: string): Promise<Goal> {
    return this.updateGoal(id, { status }, userId);
  }

  public static async addMilestone(
    goalId: string, 
    data: { title: string; description?: string }, 
    userId?: string
  ): Promise<Goal> {
    const goal = await this.getGoalById(goalId, userId);
    if (!goal) throw new Error(`Goal ${goalId} not found`);

    const validTitle = validateMilestoneTitle(data.title);
    const now = new Date().toISOString();
    const existing = goal.milestones || [];

    const newMilestone: GoalMilestone = {
      id: `ms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: validTitle,
      description: data.description?.trim() || undefined,
      isCompleted: false,
      order: existing.length,
      createdAt: now,
      updatedAt: now
    };

    const validatedMs = GoalMilestoneSchema.parse(newMilestone) as GoalMilestone;
    const updatedMilestones = [...existing, validatedMs];

    return this.updateGoal(goalId, { milestones: updatedMilestones }, userId);
  }

  public static async updateMilestone(
    goalId: string,
    milestoneId: string,
    updates: Partial<GoalMilestone>,
    userId?: string
  ): Promise<Goal> {
    const goal = await this.getGoalById(goalId, userId);
    if (!goal) throw new Error(`Goal ${goalId} not found`);

    const existing = goal.milestones || [];
    const index = existing.findIndex(m => m.id === milestoneId);
    if (index === -1) throw new Error(`Milestone ${milestoneId} not found`);

    const currentMs = existing[index];
    const now = new Date().toISOString();

    const title = updates.title !== undefined ? validateMilestoneTitle(updates.title) : currentMs.title;
    let isCompleted = updates.isCompleted !== undefined ? updates.isCompleted : currentMs.isCompleted;
    let completedAt = currentMs.completedAt;

    if (updates.isCompleted !== undefined && updates.isCompleted !== currentMs.isCompleted) {
      completedAt = updates.isCompleted ? now : undefined;
    }

    const updatedMs: GoalMilestone = {
      ...currentMs,
      ...updates,
      title,
      isCompleted,
      completedAt,
      updatedAt: now
    };

    const validatedMs = GoalMilestoneSchema.parse(updatedMs) as GoalMilestone;
    const nextMilestones = [...existing];
    nextMilestones[index] = validatedMs;

    return this.updateGoal(goalId, { milestones: nextMilestones }, userId);
  }

  public static async toggleMilestone(
    goalId: string,
    milestoneId: string,
    userId?: string
  ): Promise<Goal> {
    const goal = await this.getGoalById(goalId, userId);
    if (!goal) throw new Error(`Goal ${goalId} not found`);

    const ms = (goal.milestones || []).find(m => m.id === milestoneId);
    if (!ms) throw new Error(`Milestone ${milestoneId} not found`);

    return this.updateMilestone(goalId, milestoneId, { isCompleted: !ms.isCompleted }, userId);
  }

  public static async deleteMilestone(
    goalId: string,
    milestoneId: string,
    userId?: string
  ): Promise<Goal> {
    const goal = await this.getGoalById(goalId, userId);
    if (!goal) throw new Error(`Goal ${goalId} not found`);

    const existing = goal.milestones || [];
    const filtered = existing.filter(m => m.id !== milestoneId).map((m, idx) => ({
      ...m,
      order: idx
    }));

    return this.updateGoal(goalId, { milestones: filtered }, userId);
  }

  public static async reorderMilestones(
    goalId: string,
    reorderedMilestones: GoalMilestone[],
    userId?: string
  ): Promise<Goal> {
    const normalized = reorderedMilestones.map((m, idx) => ({
      ...m,
      order: idx,
      updatedAt: new Date().toISOString()
    }));
    return this.updateGoal(goalId, { milestones: normalized }, userId);
  }

  public static async updateProgress(
    goalId: string,
    options: {
      amount: number;
      isDelta?: boolean;
      periodKey?: string;
    },
    userId?: string
  ): Promise<Goal> {
    const goal = await this.getGoalById(goalId, userId);
    if (!goal) throw new Error(`Goal ${goalId} not found`);
    if (!goal.progressConfig) throw new Error(`Goal ${goalId} does not have progress tracking enabled`);

    const { amount, isDelta = false, periodKey } = options;

    if (goal.progressConfig.type === 'frequency') {
      if (!periodKey) throw new Error('Period key is required for frequency progress update');
      const periods = { ...(goal.progressPeriods || {}) };
      const currentVal = periods[periodKey] || 0;
      const nextVal = isDelta ? Math.max(0, currentVal + amount) : Math.max(0, amount);
      periods[periodKey] = nextVal;

      return this.updateGoal(goalId, { progressPeriods: periods }, userId);
    }

    // count or duration
    const currentVal = goal.currentProgress || 0;
    const nextVal = isDelta ? Math.max(0, currentVal + amount) : Math.max(0, amount);

    return this.updateGoal(goalId, { currentProgress: nextVal }, userId);
  }
}
