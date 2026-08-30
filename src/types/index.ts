export type HabitFrequency = 'daily' | 'weekly' | 'monthly';
export type HabitCategory = 'Work' | 'Health' | 'Career' | 'Music' | 'Personal' | 'Fitness' | 'Learning' | string;
export type StatId = 'health' | 'fitness' | 'knowledge' | 'career' | 'creativity' | 'discipline' | 'social';

export interface StatWeight {
  stat: StatId;
  weight: number; // 0.0 to 1.0, normalized so sum = 1.0
}

export interface ActivityMapping {
  habitId: string;
  stats: StatWeight[];
  source: 'default' | 'ai' | 'user';
  confidence?: number;
  updatedAt?: string;
}

export interface StatProgress {
  stat: StatId;
  name: string;
  icon: string;
  color: string;
  description: string;
  xp: number;
  level: number;
  levelProgress: number; // 0 - 100%
  xpToNextLevel: number;
}

export type StatBreakdown = Record<StatId, StatProgress>;

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string; // Emoji or Lucide icon key
  rewardValue: number; // e.g. 5 coins
  maxPerPeriod?: number; // Maximum allowed completions per frequency period (default 1, 0 for unlimited)
  maxPerDay?: number; // Kept for backward compatibility
  frequency: HabitFrequency; // 'daily' | 'weekly' | 'monthly' (default 'daily')
  isQuickHabit?: boolean; // Favorite marker for quick 1-tap logging
  category?: HabitCategory; // Primary category e.g. 'Health'
  tags?: string[]; // Array of tags e.g. ['Health', 'Work']
  active: boolean;
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreReward {
  id: string;
  name: string;
  description?: string;
  cost: number; // Coins required (e.g. 12)
  icon: string; // Emoji or preset icon
  image?: string; // Data URL or URL path for custom uploaded image
  active: boolean;
  category: 'Snacks' | 'Break' | 'Entertainment' | 'Custom' | string;
  createdAt: string;
  updatedAt: string;
}

export interface RewardLog {
  id: string;
  activityId: string;
  habitName: string;
  icon: string;
  timestamp: string; // ISO date string (absolute UTC time)
  localDateStr?: string; // Semantic local date (e.g. "2026-08-30") when the log occurred
  rewardEarned: number; // Coins earned
  unit: string;
  isRetracted?: boolean; // True if retracted in deficit
  retractedAt?: string; // Timestamp when retracted
  karmaFeeApplied?: number; // 2% Karma Surcharge applied
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  rewardName: string;
  coinsSpent: number;
  timestamp: string; // ISO date string
  icon?: string;
  image?: string;
  note?: string;
}

export type QuestType = 'daily' | 'weekly' | 'milestone';
export type QuestDifficulty = 'easy' | 'medium' | 'hard';
export type QuestStatus = 'active' | 'completed' | 'archived' | 'dismissed';

export interface QuestRequirement {
  habitId: string;
  habitName?: string;
  targetCount: number;
  currentCount?: number;
}

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  requirements: QuestRequirement[];
  xpReward: number;
  coinReward: number;
  status: QuestStatus;
  createdAt: string;
  completedAt?: string;
  archivedAt?: string;
  source: 'ai' | 'template' | 'user';
}

export type BossStatus = 'active' | 'defeated' | 'expired' | 'archived' | 'dismissed';
export type BossDifficulty = 'easy' | 'medium' | 'hard' | 'epic';

export interface BossDefinition {
  id: string;
  name: string;
  title?: string;
  theme: string;
  description: string;
  relevantStats: StatId[];
  maxHp: number;
  currentHp: number;
  durationDays: number;
  startDate: string;
  endDate: string;
  xpReward: number;
  coinReward: number;
  status: BossStatus;
  createdAt: string;
  defeatedAt?: string;
  source: 'ai' | 'template';
}

export type AchievementStatus = 'locked' | 'unlocked' | 'archived' | 'dismissed';

export interface AchievementRequirement {
  habitId?: string;
  stat?: StatId;
  targetCount?: number;
  targetLevel?: number;
  description: string;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category?: string;
  requirements: AchievementRequirement[];
  xpReward: number;
  coinReward: number;
  status: AchievementStatus;
  unlockedAt?: string;
  source: 'ai' | 'system';
}

export type GameNotificationType = 'level_up' | 'quest_complete' | 'boss_defeated' | 'achievement_unlocked' | 'milestone' | 'game_master';

export interface GameNotification {
  id: string;
  type: GameNotificationType;
  title: string;
  message: string;
  icon?: string;
  timestamp: string;
  read: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'openrouter';

export interface AISettings {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  enabled: boolean;
  lastAnalysisAt?: string;
  lastAnalysisActivityCount?: number;
}

export type ThemeOption = 'dark' | 'light';
export type CelebrationStyle = 'confetti' | 'coinShower' | 'fireworks' | 'starburst';

export interface Settings {
  theme: ThemeOption;
  celebrationStyle: CelebrationStyle;
  soundEnabled: boolean;
  currencySymbol: string; // '🪙'
  currencyName: string; // 'Coins'
  playerName?: string; // Player display name
  allowedEmail?: string; // Owner email for single-user auth lock
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
  aiSettings?: AISettings;
}


export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isOwner: boolean;
}

export interface PendingStreakRepair {
  dateStr: string; // YYYY-MM-DD that was missed
  expiresAtDateStr: string; // YYYY-MM-DD when the repair window closes
  daysRemaining: number; // 1 or 2 days left to repair
}

export interface StreakFreezeState {
  availableFreezes: number; // Current active streak freezes (0 to maxFreezes, default 0)
  maxFreezes: number; // Max capacity (default 2)
  consecutiveDaysForRecovery: number; // Consecutive active days needed to regain 1 freeze (default 3)
  consecutiveDaysCount: number; // Current progress towards next freeze (0 to 3)
  frozenDates: string[]; // List of YYYY-MM-DD dates protected by a streak freeze
  pendingRepairDates?: PendingStreakRepair[]; // Missed dates within the 2-day repair window
  lastEvaluatedDate?: string;
}

export interface HabitStats {
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  coinBalance: number;
  phantomDebt: number; // Active Karma Deficit
  todayCount: number;
  todayCoinsEarned: number;
  currentStreak: number;
  longestStreak: number;
  averagePerDay: number;
  totalXp: number;
  level: number;
  levelProgress: number; // Percentage (0-100) towards the next level
  xpToNextLevel: number; // Remaining XP needed to reach next level
  statsBreakdown: StatBreakdown;
  streakFreezeState: StreakFreezeState;
  habitStreakFreezeStates?: Record<string, StreakFreezeState>;
}

