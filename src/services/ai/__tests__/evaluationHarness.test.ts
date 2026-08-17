import { describe, it, expect } from 'vitest';
import { buildGameMasterContext } from '../aiContextBuilder';
import { validateGameMasterResponse, convertProposalToQuest, convertProposalToBoss } from '../aiValidator';
import { getDefaultHabitMapping, computeStatsBreakdown } from '../../../utils/progressionUtils';
import { computeQuestProgress, computeBossState } from '../../../utils/adventureUtils';
import { Habit, RewardLog, HabitStats } from '../../../types';


interface PersonaProfile {
  name: string;
  categoryFocus: string;
  habits: Habit[];
  logs: RewardLog[];
  stats: HabitStats;
}

const createMockPersona = (
  name: string,
  category: string,
  habitNames: string[],
  logCountPerHabit: number = 3
): PersonaProfile => {
  const habits: Habit[] = habitNames.map((hName, idx) => ({
    id: `habit_${name.toLowerCase()}_${idx + 1}`,
    name: hName,
    category,
    tags: [category, 'Self-Improvement'],
    rewardValue: (idx + 1) * 3,
    frequency: 'daily',
    active: true,
    icon: '✨',
    color: '#8b5cf6',
    order: idx + 1,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  }));

  const logs: RewardLog[] = [];
  habits.forEach((habit) => {
    for (let i = 0; i < logCountPerHabit; i++) {
      logs.push({
        id: `log_${habit.id}_${i}`,
        activityId: habit.id,
        habitName: habit.name,
        icon: habit.icon,
        timestamp: new Date(Date.now() - (i + 1) * 24 * 3600 * 1000).toISOString(),
        rewardEarned: habit.rewardValue,
        unit: 'coins'
      });
    }
  });

  const totalCoins = logs.reduce((s, l) => s + l.rewardEarned, 0);
  const totalXp = totalCoins * 5;
  const breakdown = computeStatsBreakdown(logs, habits);

  return {
    name,
    categoryFocus: category,
    habits,
    logs,
    stats: {
      totalCoinsEarned: totalCoins,
      totalCoinsSpent: 0,
      coinBalance: totalCoins,
      phantomDebt: 0,
      todayCount: 0,
      todayCoinsEarned: 0,
      currentStreak: logCountPerHabit,
      longestStreak: logCountPerHabit,
      averagePerDay: 5,
      totalXp,
      level: 4,
      levelProgress: 50,
      xpToNextLevel: 150,
      statsBreakdown: breakdown
    }
  };
};

describe('Phase 28, 40-42: Evaluation Harness Across Synthetic User Personas', () => {
  const personas: PersonaProfile[] = [
    createMockPersona('Fitness_Enthusiast', 'Fitness', ['Morning Run 5km', 'Gym Strength Session', 'Cycling', 'Stretching']),
    createMockPersona('Music_Virtuoso', 'Music', ['Piano Practice', 'Guitar Jam', 'Music Theory Study']),
    createMockPersona('Software_Engineer', 'Work', ['LeetCode Algorithm', 'System Design Reading', 'React Feature Development', 'Code Review']),
    createMockPersona('Creative_Artist', 'Creativity', ['Digital Illustration', 'Photography Walk', 'Video Editing']),
    createMockPersona('Balanced_Lifestyle', 'Personal', ['Morning Meditation', '30 Min Reading', 'Evening Walk', 'Healthy Meal Prep'])
  ];

  personas.forEach(persona => {
    describe(`Persona: ${persona.name} (${persona.categoryFocus})`, () => {
      it('builds valid AI Context with proper habit catalogue and activity ledger', () => {
        const context = buildGameMasterContext(persona.stats, persona.habits, persona.logs);
        expect(context.habits).toHaveLength(persona.habits.length);
        expect(context.recentActivity.length).toBeGreaterThan(0);
        expect(context.user.totalXp).toBe(persona.stats.totalXp);
      });

      it('generates consistent default stat mappings matching persona theme', () => {
        persona.habits.forEach(habit => {
          const mapping = getDefaultHabitMapping(habit);
          expect(mapping.habitId).toBe(habit.id);
          expect(mapping.stats.length).toBeGreaterThan(0);
          const totalWeight = mapping.stats.reduce((s, sw) => s + sw.weight, 0);
          expect(totalWeight).toBeCloseTo(1.0, 1);
        });
      });

      it('structurally validates and accepts a synthetic Game Master proposal for this persona', () => {
        const context = buildGameMasterContext(persona.stats, persona.habits, persona.logs);
        const primaryHabit = persona.habits[0];

        const proposal = {
          version: 'game-master-v1',
          summary: `Challenge geared towards ${persona.categoryFocus} growth.`,
          activityMappings: [
            {
              habitId: primaryHabit.id,
              stats: [{ stat: 'discipline' as const, weight: 1.0 }]
            }
          ],
          quests: [
            {
              title: `${persona.name} Challenge`,
              description: `Complete ${primaryHabit.name} 3 times.`,
              type: 'weekly' as const,
              difficulty: 'medium' as const,
              requirements: [{ habitId: primaryHabit.id, targetCount: 3 }]
            }
          ],
          boss: {
            name: `Guardian of ${persona.categoryFocus}`,
            theme: 'Consistency',
            description: 'Battle through steady dedication.',
            relevantStats: ['discipline' as const],
            durationDays: 14,
            difficulty: 'medium' as const
          },
          achievements: [
            {
              name: `${persona.name} Master`,
              description: `Log ${primaryHabit.name} 10 times`,
              icon: '🌟',
              requirements: [{ habitId: primaryHabit.id, targetCount: 10, description: '10 sessions' }]
            }
          ],
          notifications: [
            {
              type: 'game_master' as const,
              title: 'New Chapter',
              message: 'Your adventure awaits.'
            }
          ]
        };

        const result = validateGameMasterResponse(proposal, context);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);

        // Verify deterministic conversions
        const quest = convertProposalToQuest(proposal.quests[0], persona.habits);
        expect(quest.xpReward).toBeGreaterThan(0);
        expect(quest.coinReward).toBeGreaterThan(0);

        const questProgress = computeQuestProgress(quest, persona.logs);
        expect(questProgress.percentage).toBeGreaterThanOrEqual(0);

        const boss = convertProposalToBoss(proposal.boss, persona.stats.level);
        expect(boss.maxHp).toBeGreaterThan(0);
        expect(boss.currentHp).toBe(boss.maxHp);

        const bossState = computeBossState(boss, persona.logs, persona.habits);
        expect(bossState.currentHp).toBeLessThanOrEqual(boss.maxHp);
      });
    });
  });
});

