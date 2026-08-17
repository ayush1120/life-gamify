export type HabitFrequency = 'daily' | 'weekly' | 'monthly';
export type HabitCategory = 'Work' | 'Health' | 'Career' | 'Music' | 'Personal' | 'Fitness' | 'Learning' | string;
export type StatId = 'health' | 'fitness' | 'knowledge' | 'career' | 'creativity' | 'discipline' | 'social';

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
  timestamp: string; // ISO date string
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

export type ThemeOption = 'dark' | 'light';
export type CelebrationStyle = 'confetti' | 'coinShower' | 'fireworks' | 'starburst';

export interface Settings {
  theme: ThemeOption;
  celebrationStyle: CelebrationStyle;
  soundEnabled: boolean;
  currencySymbol: string; // '🪙'
  currencyName: string; // 'Coins'
  allowedEmail?: string; // Owner email for single-user auth lock
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isOwner: boolean;
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
}
