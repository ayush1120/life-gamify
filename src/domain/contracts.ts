import { z } from 'zod';

// ==========================================
// 1. STATS & ATTRIBUTES CONTRACTS
// ==========================================

export const StatIdSchema = z.enum([
  'health',
  'fitness',
  'knowledge',
  'career',
  'creativity',
  'discipline',
  'social'
]);

export const StatWeightSchema = z.object({
  stat: StatIdSchema,
  weight: z.number().min(0).max(1)
});

export const StatProgressSchema = z.object({
  stat: StatIdSchema,
  name: z.string(),
  icon: z.string(),
  color: z.string(),
  description: z.string(),
  xp: z.number().nonnegative(),
  level: z.number().int().positive(),
  levelProgress: z.number().min(0).max(100),
  xpToNextLevel: z.number().nonnegative()
});

// ==========================================
// 2. USER & AUTHENTICATION CONTRACTS
// ==========================================

export const UserProfileSchema = z.object({
  uid: z.string().min(1),
  email: z.string().nullable(),
  displayName: z.string().nullable(),
  photoURL: z.string().nullable(),
  isOwner: z.boolean().default(true)
});
export type UserContract = z.infer<typeof UserProfileSchema>;

// ==========================================
// 3. HABIT CONTRACTS
// ==========================================

export const HabitFrequencySchema = z.enum(['daily', 'weekly', 'monthly']);

export const HabitSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string(),
  rewardValue: z.number().nonnegative(),
  maxPerPeriod: z.number().int().nonnegative().optional(),
  maxPerDay: z.number().int().nonnegative().optional(),
  frequency: HabitFrequencySchema.default('daily'),
  isQuickHabit: z.boolean().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  active: z.boolean().default(true),
  color: z.string(),
  order: z.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type HabitContract = z.infer<typeof HabitSchema>;

// ==========================================
// 4. ACTIVITY & REWARD LOG CONTRACTS
// ==========================================

export const ActivityLogSchema = z.object({
  id: z.string().min(1),
  activityId: z.string().min(1),
  habitName: z.string().min(1),
  icon: z.string(),
  timestamp: z.string(),
  localDateStr: z.string().optional(),
  rewardEarned: z.number().nonnegative(),
  unit: z.string().default('coins'),
  isRetracted: z.boolean().optional(),
  retractedAt: z.string().optional(),
  karmaFeeApplied: z.number().optional()
});
export type ActivityLogContract = z.infer<typeof ActivityLogSchema>;

// ==========================================
// 5. PROGRESS & XP CONTRACTS
// ==========================================

export const StreakFreezeStateSchema = z.object({
  availableFreezes: z.number().int().min(0),
  maxFreezes: z.number().int().min(0).default(2),
  consecutiveDaysForRecovery: z.number().int().min(1).default(3),
  consecutiveDaysCount: z.number().int().min(0).default(0),
  frozenDates: z.array(z.string()).default([]),
  pendingRepairDates: z.array(
    z.object({
      dateStr: z.string(),
      expiresAtDateStr: z.string(),
      daysRemaining: z.number().int()
    })
  ).optional(),
  lastEvaluatedDate: z.string().optional()
});

export const UserProgressSchema = z.object({
  totalCoinsEarned: z.number().nonnegative(),
  totalCoinsSpent: z.number().nonnegative(),
  coinBalance: z.number(),
  phantomDebt: z.number().nonnegative(),
  todayCount: z.number().int().nonnegative(),
  todayCoinsEarned: z.number().nonnegative(),
  currentStreak: z.number().int().nonnegative(),
  longestStreak: z.number().int().nonnegative(),
  averagePerDay: z.number().nonnegative(),
  totalXp: z.number().nonnegative(),
  level: z.number().int().positive(),
  levelProgress: z.number().min(0).max(100),
  xpToNextLevel: z.number().nonnegative(),
  statsBreakdown: z.record(StatIdSchema, StatProgressSchema),
  streakFreezeState: StreakFreezeStateSchema
});
export type UserProgressContract = z.infer<typeof UserProgressSchema>;

// ==========================================
// 6. QUEST CONTRACTS
// ==========================================

export const QuestTypeSchema = z.enum(['daily', 'weekly', 'milestone']);
export const QuestDifficultySchema = z.enum(['easy', 'medium', 'hard']);
export const QuestStatusSchema = z.enum(['active', 'completed', 'archived', 'dismissed']);

export const QuestRequirementSchema = z.object({
  habitId: z.string(),
  habitName: z.string().optional(),
  targetCount: z.number().int().positive(),
  currentCount: z.number().int().min(0).default(0)
});

export const QuestSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  type: QuestTypeSchema.default('daily'),
  difficulty: QuestDifficultySchema.default('medium'),
  requirements: z.array(QuestRequirementSchema),
  xpReward: z.number().int().positive(),
  coinReward: z.number().int().positive(),
  status: QuestStatusSchema.default('active'),
  createdAt: z.string(),
  completedAt: z.string().optional(),
  archivedAt: z.string().optional(),
  source: z.enum(['ai', 'template', 'user']).default('ai')
});
export type QuestContract = z.infer<typeof QuestSchema>;

// ==========================================
// 7. BOSS ENCOUNTER CONTRACTS
// ==========================================

export const BossStatusSchema = z.enum(['active', 'defeated', 'expired', 'archived', 'dismissed']);
export const BossDifficultySchema = z.enum(['easy', 'medium', 'hard', 'epic']);

export const BossSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string().optional(),
  theme: z.string(),
  description: z.string(),
  relevantStats: z.array(StatIdSchema),
  maxHp: z.number().int().positive(),
  currentHp: z.number().int().min(0),
  durationDays: z.number().int().positive(),
  startDate: z.string(),
  endDate: z.string(),
  xpReward: z.number().int().positive(),
  coinReward: z.number().int().positive(),
  status: BossStatusSchema.default('active'),
  createdAt: z.string(),
  defeatedAt: z.string().optional(),
  source: z.enum(['ai', 'template']).default('ai')
});
export type BossContract = z.infer<typeof BossSchema>;

// ==========================================
// 8. ACHIEVEMENT CONTRACTS
// ==========================================

export const AchievementStatusSchema = z.enum(['locked', 'unlocked', 'archived', 'dismissed']);

export const AchievementRequirementSchema = z.object({
  habitId: z.string().optional(),
  stat: StatIdSchema.optional(),
  targetCount: z.number().int().positive().optional(),
  targetLevel: z.number().int().positive().optional(),
  description: z.string()
});

export const AchievementSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  icon: z.string(),
  category: z.string().optional(),
  requirements: z.array(AchievementRequirementSchema),
  xpReward: z.number().int().positive(),
  coinReward: z.number().int().positive(),
  status: AchievementStatusSchema.default('locked'),
  unlockedAt: z.string().optional(),
  source: z.enum(['ai', 'system']).default('system')
});
export type AchievementContract = z.infer<typeof AchievementSchema>;
