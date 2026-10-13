import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoalService } from '../goalService';
import { Goal } from '../../../types';

vi.mock('../../storage', () => {
  let stored: Goal[] = [];
  return {
    loadStoredGoals: vi.fn(() => [...stored]),
    saveStoredGoals: vi.fn((goals: Goal[]) => {
      stored = [...goals];
    }),
    __resetStoredGoals: () => {
      stored = [];
    }
  };
});

vi.mock('../../firebase', () => ({
  syncFirestoreGoal: vi.fn().mockResolvedValue(undefined),
  deleteFirestoreGoal: vi.fn().mockResolvedValue(undefined)
}));

import { saveStoredGoals } from '../../storage';
import { syncFirestoreGoal, deleteFirestoreGoal } from '../../firebase';


describe('GoalService domain operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (saveStoredGoals as any)([]);
  });

  it('creates a title-only Goal with default values', async () => {
    const goal = await GoalService.createGoal({ title: 'Learn Spanish' }, 'user-123');

    expect(goal.id).toMatch(/^goal-/);
    expect(goal.title).toBe('Learn Spanish');
    expect(goal.status).toBe('active');
    expect(goal.milestones).toEqual([]);
    expect(goal.progressConfig).toBeUndefined();
    expect(goal.currentProgress).toBeUndefined();
    expect(syncFirestoreGoal).toHaveBeenCalledWith('user-123', goal);
  });

  it('rejects creation with empty title', async () => {
    await expect(GoalService.createGoal({ title: '   ' })).rejects.toThrow('Goal title cannot be empty');
  });

  it('updates goal status to completed and sets completedAt', async () => {
    const created = await GoalService.createGoal({ title: 'Complete 10K Run' });
    expect(created.completedAt).toBeUndefined();

    const updated = await GoalService.updateGoal(created.id, { status: 'completed' });
    expect(updated.status).toBe('completed');
    expect(updated.completedAt).toBeDefined();

    // Reopen goal
    const reopened = await GoalService.updateGoal(created.id, { status: 'active' });
    expect(reopened.status).toBe('active');
    expect(reopened.completedAt).toBeUndefined();
  });

  it('archives and unarchives a goal', async () => {
    const created = await GoalService.createGoal({ title: 'Build Personal Website' });
    const archived = await GoalService.updateGoal(created.id, { status: 'archived' });
    expect(archived.status).toBe('archived');
    expect(archived.archivedAt).toBeDefined();

    const active = await GoalService.updateGoal(created.id, { status: 'active' });
    expect(active.status).toBe('active');
    expect(active.archivedAt).toBeUndefined();
  });

  it('deletes a goal and removes it from Firestore', async () => {
    const goal = await GoalService.createGoal({ title: 'To Delete' }, 'user-123');
    await GoalService.deleteGoal(goal.id, 'user-123');

    const remaining = await GoalService.getGoals();
    expect(remaining).toHaveLength(0);
    expect(deleteFirestoreGoal).toHaveBeenCalledWith('user-123', goal.id);
  });

  describe('Milestones', () => {
    it('adds, toggles, reorders, and deletes milestones', async () => {
      const goal = await GoalService.createGoal({ title: 'Write a Book' });

      // Add milestones
      const withM1 = await GoalService.addMilestone(goal.id, { title: 'Chapter 1' });
      expect(withM1.milestones).toHaveLength(1);
      expect(withM1.milestones![0].title).toBe('Chapter 1');
      expect(withM1.milestones![0].isCompleted).toBe(false);

      const withM2 = await GoalService.addMilestone(goal.id, { title: 'Chapter 2' });
      expect(withM2.milestones).toHaveLength(2);

      const m1Id = withM2.milestones![0].id;
      const m2Id = withM2.milestones![1].id;

      // Toggle milestone 1 complete
      const toggled = await GoalService.toggleMilestone(goal.id, m1Id);
      expect(toggled.milestones![0].isCompleted).toBe(true);
      expect(toggled.milestones![0].completedAt).toBeDefined();

      // Completing all milestones does NOT auto-complete the parent goal (MVP rule)
      const toggled2 = await GoalService.toggleMilestone(goal.id, m2Id);
      expect(toggled2.milestones![1].isCompleted).toBe(true);
      expect(toggled2.status).toBe('active');

      // Reorder milestones
      const reordered = await GoalService.reorderMilestones(goal.id, [toggled2.milestones![1], toggled2.milestones![0]]);
      expect(reordered.milestones![0].id).toBe(m2Id);
      expect(reordered.milestones![0].order).toBe(0);
      expect(reordered.milestones![1].id).toBe(m1Id);
      expect(reordered.milestones![1].order).toBe(1);

      // Deleting a milestone does not delete the goal
      const afterDelete = await GoalService.deleteMilestone(goal.id, m1Id);
      expect(afterDelete.milestones).toHaveLength(1);
      expect(afterDelete.id).toBe(goal.id);
    });
  });

  describe('Progress tracking', () => {
    it('increments and decrements count progress and clamps at 0', async () => {
      const goal = await GoalService.createGoal({
        title: 'Read Books',
        progressConfig: {
          type: 'count',
          label: 'Books read',
          targetValue: 10
        }
      });

      // Increment
      const step1 = await GoalService.updateProgress(goal.id, { amount: 3, isDelta: true });
      expect(step1.currentProgress).toBe(3);

      // Set directly
      const step2 = await GoalService.updateProgress(goal.id, { amount: 5, isDelta: false });
      expect(step2.currentProgress).toBe(5);

      // Decrement below 0 clamps to 0
      const step3 = await GoalService.updateProgress(goal.id, { amount: -10, isDelta: true });
      expect(step3.currentProgress).toBe(0);
    });

    it('updates frequency progress without overwriting other periods', async () => {
      const goal = await GoalService.createGoal({
        title: 'Workouts',
        progressConfig: {
          type: 'frequency',
          label: 'Workouts',
          period: 'weekly',
          targetValue: 3
        }
      });

      // Log occurrence in week 1
      const week1 = await GoalService.updateProgress(goal.id, {
        amount: 1,
        isDelta: true,
        periodKey: '2026-10-05'
      });
      expect(week1.progressPeriods?.['2026-10-05']).toBe(1);

      // Log occurrence in week 2
      const week2 = await GoalService.updateProgress(goal.id, {
        amount: 2,
        isDelta: true,
        periodKey: '2026-10-12'
      });
      expect(week2.progressPeriods?.['2026-10-05']).toBe(1); // Preserved!
      expect(week2.progressPeriods?.['2026-10-12']).toBe(2);
    });
  });
});
