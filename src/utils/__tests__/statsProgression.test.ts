import { describe, it, expect } from 'vitest';
import { 
  getDefaultHabitMapping, 
  normalizeStatWeights, 
  computeStatsBreakdown, 
  STAT_DEFINITIONS, 
  ALL_STAT_IDS,
  getDefaultStatsBreakdown 
} from '../progressionUtils';
import { Habit, RewardLog } from '../../types';

describe('Phase 6 & 7: Deterministic Multi-Stats & Activity Mappings', () => {
  it('should define all 7 core life stats with complete metadata', () => {
    expect(ALL_STAT_IDS).toHaveLength(7);
    for (const stat of ALL_STAT_IDS) {
      const def = STAT_DEFINITIONS[stat];
      expect(def).toBeDefined();
      expect(def.name).toBeTruthy();
      expect(def.icon).toBeTruthy();
      expect(def.color).toMatch(/^#/);
      expect(def.description).toBeTruthy();
    }
  });

  it('should generate default zeroed stats breakdown', () => {
    const defaultStats = getDefaultStatsBreakdown();
    for (const stat of ALL_STAT_IDS) {
      expect(defaultStats[stat].xp).toBe(0);
      expect(defaultStats[stat].level).toBe(0);
      expect(defaultStats[stat].levelProgress).toBe(0);
    }
  });


  describe('normalizeStatWeights', () => {
    it('normalizes weights so they sum to 1.0', () => {
      const weights = normalizeStatWeights([
        { stat: 'fitness', weight: 4 },
        { stat: 'discipline', weight: 1 },
      ]);
      expect(weights).toEqual([
        { stat: 'fitness', weight: 0.8 },
        { stat: 'discipline', weight: 0.2 },
      ]);
    });

    it('falls back to 100% discipline if weights are empty or invalid', () => {
      const empty = normalizeStatWeights([]);
      expect(empty).toEqual([{ stat: 'discipline', weight: 1.0 }]);

      const negative = normalizeStatWeights([{ stat: 'fitness', weight: -5 }]);
      expect(negative).toEqual([{ stat: 'discipline', weight: 1.0 }]);
    });
  });

  describe('getDefaultHabitMapping', () => {
    it('infers fitness mapping for gym/workout habits', () => {
      const habit: Partial<Habit> = { id: 'h1', name: 'Morning Workout', category: 'Fitness' };
      const mapping = getDefaultHabitMapping(habit);
      expect(mapping.habitId).toBe('h1');
      expect(mapping.source).toBe('default');
      expect(mapping.stats).toEqual([
        { stat: 'fitness', weight: 0.8 },
        { stat: 'discipline', weight: 0.2 },
      ]);
    });

    it('infers knowledge mapping for reading/studying habits', () => {
      const habit: Partial<Habit> = { id: 'h2', name: 'Read 20 pages', category: 'Learning' };
      const mapping = getDefaultHabitMapping(habit);
      expect(mapping.stats).toEqual([
        { stat: 'knowledge', weight: 0.8 },
        { stat: 'discipline', weight: 0.2 },
      ]);
    });

    it('infers career mapping for coding/work habits', () => {
      const habit: Partial<Habit> = { id: 'h3', name: 'Code React App', category: 'Work' };
      const mapping = getDefaultHabitMapping(habit);
      expect(mapping.stats).toEqual([
        { stat: 'career', weight: 0.75 },
        { stat: 'discipline', weight: 0.25 },
      ]);
    });

    it('infers creativity mapping for music/art habits', () => {
      const habit: Partial<Habit> = { id: 'h4', name: 'Play Piano', category: 'Music' };
      const mapping = getDefaultHabitMapping(habit);
      expect(mapping.stats).toEqual([
        { stat: 'creativity', weight: 0.8 },
        { stat: 'discipline', weight: 0.2 },
      ]);
    });

    it('falls back to 100% discipline for uncategorized habits', () => {
      const habit: Partial<Habit> = { id: 'h5', name: 'Make Bed', category: 'Other' };
      const mapping = getDefaultHabitMapping(habit);
      expect(mapping.stats).toEqual([{ stat: 'discipline', weight: 1.0 }]);
    });
  });

  describe('computeStatsBreakdown', () => {
    const habits: Habit[] = [
      {
        id: 'h1',
        name: 'Gym',
        category: 'Fitness',
        rewardValue: 10,
        frequency: 'daily',
        active: true,
        icon: '🏋️',
        color: '#ff0000',
        order: 0,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      },
      {
        id: 'h2',
        name: 'Study',
        category: 'Learning',
        rewardValue: 5,
        frequency: 'daily',
        active: true,
        icon: '📚',
        color: '#00ff00',
        order: 1,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      },
    ];

    it('calculates deterministic stat XP distribution from valid logs', () => {
      const logs: RewardLog[] = [
        // h1 gives 10 coins * 5 = 50 XP. Fitness 80% (40 XP), Discipline 20% (10 XP)
        { id: 'l1', activityId: 'h1', habitName: 'Gym', icon: '🏋️', timestamp: '2026-08-01T10:00:00Z', rewardEarned: 10, unit: 'coins' },
        // h2 gives 5 coins * 5 = 25 XP. Knowledge 80% (20 XP), Discipline 20% (5 XP)
        { id: 'l2', activityId: 'h2', habitName: 'Study', icon: '📚', timestamp: '2026-08-01T11:00:00Z', rewardEarned: 5, unit: 'coins' },
      ];

      const breakdown = computeStatsBreakdown(logs, habits);

      expect(breakdown.fitness.xp).toBe(40);
      expect(breakdown.knowledge.xp).toBe(20);
      expect(breakdown.discipline.xp).toBe(15);
      expect(breakdown.health.xp).toBe(0);
      expect(breakdown.career.xp).toBe(0);
      expect(breakdown.creativity.xp).toBe(0);
      expect(breakdown.social.xp).toBe(0);
    });

    it('ignores retracted logs when computing stat XP', () => {
      const logs: RewardLog[] = [
        { id: 'l1', activityId: 'h1', habitName: 'Gym', icon: '🏋️', timestamp: '2026-08-01T10:00:00Z', rewardEarned: 10, unit: 'coins' },
        { id: 'l2', activityId: 'h1', habitName: 'Gym', icon: '🏋️', timestamp: '2026-08-01T11:00:00Z', rewardEarned: 10, unit: 'coins', isRetracted: true },
      ];

      const breakdown = computeStatsBreakdown(logs, habits);
      expect(breakdown.fitness.xp).toBe(40);
      expect(breakdown.discipline.xp).toBe(10);
    });

    it('respects custom / AI activity mappings when provided', () => {
      const logs: RewardLog[] = [
        { id: 'l1', activityId: 'h1', habitName: 'Gym', icon: '🏋️', timestamp: '2026-08-01T10:00:00Z', rewardEarned: 10, unit: 'coins' }, // 50 XP
      ];

      const customMappings = {
        h1: {
          habitId: 'h1',
          stats: [
            { stat: 'health' as const, weight: 0.5 },
            { stat: 'fitness' as const, weight: 0.5 },
          ],
          source: 'ai' as const,
        },
      };

      const breakdown = computeStatsBreakdown(logs, habits, customMappings);
      expect(breakdown.health.xp).toBe(25);
      expect(breakdown.fitness.xp).toBe(25);
      expect(breakdown.discipline.xp).toBe(0);
    });
  });
});
