import { describe, it, expect } from 'vitest';
import { 
  validateGoalTitle, 
  validateMilestoneTitle, 
  formatDurationDisplay, 
  convertToSeconds, 
  getGoalFrequencyPeriodKey, 
  calculateGoalProgress, 
  evaluateGoalDeadline, 
  getMilestonesSummary,
  validateGoal
} from '../goalUtils';
import { Goal, GoalMilestone } from '../../types';

describe('goalUtils domain validation & calculations', () => {
  describe('Title validation', () => {
    it('accepts valid titles and trims whitespace', () => {
      expect(validateGoalTitle('  Read 20 Books  ')).toBe('Read 20 Books');
    });

    it('rejects empty or whitespace-only titles', () => {
      expect(() => validateGoalTitle('')).toThrow('Goal title cannot be empty');
      expect(() => validateGoalTitle('   ')).toThrow('Goal title cannot be empty');
      expect(() => validateGoalTitle(null)).toThrow('Goal title must be a string');
    });

    it('rejects overly long titles (>150 chars)', () => {
      const longTitle = 'A'.repeat(151);
      expect(() => validateGoalTitle(longTitle)).toThrow('Goal title cannot exceed 150 characters');
    });

    it('validates milestone titles similarly', () => {
      expect(validateMilestoneTitle('  Milestone 1 ')).toBe('Milestone 1');
      expect(() => validateMilestoneTitle('')).toThrow('Milestone title cannot be empty');
    });
  });

  describe('Duration formatting and conversion', () => {
    it('formats seconds into human readable duration strings', () => {
      expect(formatDurationDisplay(0)).toBe('0m');
      expect(formatDurationDisplay(45)).toBe('45s');
      expect(formatDurationDisplay(60)).toBe('1m');
      expect(formatDurationDisplay(90)).toBe('1m 30s');
      expect(formatDurationDisplay(3600)).toBe('1h');
      expect(formatDurationDisplay(5400)).toBe('1h 30m');
      expect(formatDurationDisplay(3661)).toBe('1h 1m');
    });

    it('converts hours and minutes to canonical seconds', () => {
      expect(convertToSeconds(1, 0, 0)).toBe(3600);
      expect(convertToSeconds(1, 30, 0)).toBe(5400);
      expect(convertToSeconds(0, 45, 10)).toBe(2710);
      expect(convertToSeconds(-1, -5)).toBe(0);
    });
  });

  describe('Frequency period keys', () => {
    const fixedDate = new Date(2026, 9, 14, 12, 0, 0); // 2026-10-14 (Wednesday)

    it('generates daily period keys (YYYY-MM-DD)', () => {
      expect(getGoalFrequencyPeriodKey('daily', fixedDate)).toBe('2026-10-14');
    });

    it('generates weekly period keys (ISO week Monday start)', () => {
      // 2026-10-14 is a Wednesday, Monday of that week was 2026-10-12
      expect(getGoalFrequencyPeriodKey('weekly', fixedDate)).toBe('2026-10-12');
    });

    it('generates monthly period keys (YYYY-MM)', () => {
      expect(getGoalFrequencyPeriodKey('monthly', fixedDate)).toBe('2026-10');
    });
  });

  describe('Progress calculations', () => {
    it('returns hasProgress: false when progressConfig is absent', () => {
      const goal: Goal = {
        id: 'g-1',
        title: 'Learn Biology',
        status: 'active',
        createdAt: '2026-10-14T00:00:00.000Z',
        updatedAt: '2026-10-14T00:00:00.000Z'
      };
      const res = calculateGoalProgress(goal);
      expect(res.hasProgress).toBe(false);
      expect(res.percentage).toBeUndefined();
    });

    it('calculates count progress with target and remaining', () => {
      const goal: Goal = {
        id: 'g-2',
        title: 'Read 20 Books',
        status: 'active',
        progressConfig: {
          type: 'count',
          label: 'Books read',
          unit: 'books',
          targetValue: 20
        },
        currentProgress: 8,
        createdAt: '2026-10-14T00:00:00.000Z',
        updatedAt: '2026-10-14T00:00:00.000Z'
      };
      const res = calculateGoalProgress(goal);
      expect(res.hasProgress).toBe(true);
      expect(res.current).toBe(8);
      expect(res.target).toBe(20);
      expect(res.percentage).toBe(40);
      expect(res.visualPercentage).toBe(40);
      expect(res.remaining).toBe(12);
      expect(res.formattedCurrent).toBe('8 books');
      expect(res.formattedTarget).toBe('20 books');
      expect(res.isTargetMet).toBe(false);
    });

    it('caps visual progress at 100% when exceeding target while preserving raw values', () => {
      const goal: Goal = {
        id: 'g-3',
        title: 'Read 20 Books',
        status: 'active',
        progressConfig: {
          type: 'count',
          label: 'Books read',
          unit: 'books',
          targetValue: 20
        },
        currentProgress: 25,
        createdAt: '2026-10-14T00:00:00.000Z',
        updatedAt: '2026-10-14T00:00:00.000Z'
      };
      const res = calculateGoalProgress(goal);
      expect(res.current).toBe(25);
      expect(res.percentage).toBe(125);
      expect(res.visualPercentage).toBe(100);
      expect(res.isTargetMet).toBe(true);
      expect(res.remaining).toBe(0);
    });

    it('supports progress tracking without a target value (no fake percentages)', () => {
      const goal: Goal = {
        id: 'g-4',
        title: 'Review Papers',
        status: 'active',
        progressConfig: {
          type: 'count',
          label: 'Papers reviewed',
          unit: 'papers'
        },
        currentProgress: 14,
        createdAt: '2026-10-14T00:00:00.000Z',
        updatedAt: '2026-10-14T00:00:00.000Z'
      };
      const res = calculateGoalProgress(goal);
      expect(res.hasProgress).toBe(true);
      expect(res.current).toBe(14);
      expect(res.target).toBeUndefined();
      expect(res.percentage).toBeUndefined();
      expect(res.visualPercentage).toBeUndefined();
      expect(res.formattedCurrent).toBe('14 papers');
      expect(res.formattedTarget).toBeUndefined();
    });

    it('calculates duration progress in canonical seconds', () => {
      const goal: Goal = {
        id: 'g-5',
        title: 'Study 100 Hours',
        status: 'active',
        progressConfig: {
          type: 'duration',
          label: 'Study duration',
          targetValue: 360000 // 100 hours in seconds
        },
        currentProgress: 90000, // 25 hours in seconds
        createdAt: '2026-10-14T00:00:00.000Z',
        updatedAt: '2026-10-14T00:00:00.000Z'
      };
      const res = calculateGoalProgress(goal);
      expect(res.hasProgress).toBe(true);
      expect(res.percentage).toBe(25);
      expect(res.formattedCurrent).toBe('25h');
      expect(res.formattedTarget).toBe('100h');
    });

    it('calculates frequency progress scoped to active period', () => {
      const fixedDate = new Date(2026, 9, 14); // 2026-10-14 (week of 2026-10-12)
      const goal: Goal = {
        id: 'g-6',
        title: 'Practice Piano Weekly',
        status: 'active',
        progressConfig: {
          type: 'frequency',
          label: 'Piano sessions',
          unit: 'sessions',
          period: 'weekly',
          targetValue: 4
        },
        progressPeriods: {
          '2026-10-05': 4, // Previous week preserved
          '2026-10-12': 3  // Current week
        },
        createdAt: '2026-10-14T00:00:00.000Z',
        updatedAt: '2026-10-14T00:00:00.000Z'
      };
      const res = calculateGoalProgress(goal, fixedDate);
      expect(res.hasProgress).toBe(true);
      expect(res.current).toBe(3);
      expect(res.target).toBe(4);
      expect(res.percentage).toBe(75);
      expect(res.periodLabel).toBe('This Week');
      expect(res.formattedCurrent).toBe('3 sessions');
      expect(res.formattedTarget).toBe('4 sessions');
    });
  });

  describe('Deadline and overdue evaluation', () => {
    const fixedToday = new Date(2026, 9, 14, 12, 0, 0); // Oct 14, 2026

    it('undated goals are never overdue', () => {
      const goal: Goal = {
        id: 'g-undated',
        title: 'Learn Piano',
        status: 'active',
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z'
      };
      const evalRes = evaluateGoalDeadline(goal, fixedToday);
      expect(evalRes.hasDeadline).toBe(false);
      expect(evalRes.isOverdue).toBe(false);
      expect(evalRes.badgeText).toBe('No deadline');
    });

    it('completed goals are never overdue, even if deadline is in the past', () => {
      const goal: Goal = {
        id: 'g-completed',
        title: 'Finished Project',
        status: 'completed',
        deadline: '2026-10-10', // 4 days ago
        completedAt: '2026-10-09T00:00:00.000Z',
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-09T00:00:00.000Z'
      };
      const evalRes = evaluateGoalDeadline(goal, fixedToday);
      expect(evalRes.isOverdue).toBe(false);
      expect(evalRes.badgeText).toBe('Completed');
    });

    it('identifies overdue active goals correctly', () => {
      const goal: Goal = {
        id: 'g-overdue',
        title: 'Overdue Goal',
        status: 'active',
        deadline: '2026-10-12', // 2 days ago
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z'
      };
      const evalRes = evaluateGoalDeadline(goal, fixedToday);
      expect(evalRes.isOverdue).toBe(true);
      expect(evalRes.daysOverdue).toBe(2);
      expect(evalRes.badgeText).toBe('2 days overdue');
    });

    it('identifies goals due today', () => {
      const goal: Goal = {
        id: 'g-today',
        title: 'Due Today Goal',
        status: 'active',
        deadline: '2026-10-14',
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z'
      };
      const evalRes = evaluateGoalDeadline(goal, fixedToday);
      expect(evalRes.isOverdue).toBe(false);
      expect(evalRes.badgeText).toBe('Due today');
    });

    it('identifies goals due in future days', () => {
      const goal: Goal = {
        id: 'g-future',
        title: 'Future Goal',
        status: 'active',
        deadline: '2026-10-20', // in 6 days
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z'
      };
      const evalRes = evaluateGoalDeadline(goal, fixedToday);
      expect(evalRes.isOverdue).toBe(false);
      expect(evalRes.daysRemaining).toBe(6);
      expect(evalRes.badgeText).toBe('Due in 6 days');
    });
  });

  describe('Milestones summary', () => {
    it('summarizes empty milestones', () => {
      const res = getMilestonesSummary([]);
      expect(res.total).toBe(0);
      expect(res.completed).toBe(0);
      expect(res.allCompleted).toBe(false);
      expect(res.summaryText).toBe('No milestones');
    });

    it('summarizes partial and full milestone completion', () => {
      const milestones: GoalMilestone[] = [
        { id: 'm-1', title: 'Chapter 1', isCompleted: true, order: 0, createdAt: '', updatedAt: '' },
        { id: 'm-2', title: 'Chapter 2', isCompleted: false, order: 1, createdAt: '', updatedAt: '' },
        { id: 'm-3', title: 'Chapter 3', isCompleted: true, order: 2, createdAt: '', updatedAt: '' }
      ];
      const res = getMilestonesSummary(milestones);
      expect(res.total).toBe(3);
      expect(res.completed).toBe(2);
      expect(res.percentage).toBe(67);
      expect(res.allCompleted).toBe(false);
      expect(res.summaryText).toBe('2 of 3 milestones completed');
    });
  });

  describe('Schema validation', () => {
    it('parses valid minimal title-only Goal', () => {
      const parsed = validateGoal({
        id: 'g-min',
        title: 'Only Title',
        createdAt: '2026-10-14T00:00:00.000Z',
        updatedAt: '2026-10-14T00:00:00.000Z'
      });
      expect(parsed.title).toBe('Only Title');
      expect(parsed.status).toBe('active');
      expect(parsed.milestones).toEqual([]);
    });

    it('rejects goal with invalid negative currentProgress', () => {
      expect(() => validateGoal({
        id: 'g-invalid',
        title: 'Invalid',
        currentProgress: -5,
        createdAt: '2026-10-14T00:00:00.000Z',
        updatedAt: '2026-10-14T00:00:00.000Z'
      })).toThrow();
    });
  });
});
