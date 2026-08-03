import { Habit, StoreReward, RewardLog, RewardRedemption, Settings } from '../types';

const STORAGE_KEYS = {
  HABITS: 'life_gamify_habits_v2',
  STORE_REWARDS: 'life_gamify_store_rewards_v2',
  REWARD_LOGS: 'life_gamify_reward_logs_v2',
  REDEMPTIONS: 'life_gamify_redemptions_v2',
  SETTINGS: 'life_gamify_settings_v2'
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  celebrationStyle: 'confetti',
  soundEnabled: true,
  currencySymbol: '🪙',
  currencyName: 'Coins',
  allowedEmail: ''
};

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-1',
    name: 'Run 5km',
    description: 'Cardio run outdoors or on treadmill',
    icon: '🏃',
    rewardValue: 5,
    maxPerDay: 1,
    active: true,
    color: '#f59e0b',
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'habit-2',
    name: 'Gym Workout',
    description: 'Strength training or hypertrophy session',
    icon: '🏋️',
    rewardValue: 4,
    maxPerDay: 1,
    active: true,
    color: '#ce7647',
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'habit-3',
    name: '16-Hour Fast',
    description: 'Intermittent fasting till 12 PM',
    icon: '⏳',
    rewardValue: 6,
    maxPerDay: 1,
    active: true,
    color: '#10b981',
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'habit-4',
    name: 'Reach Home Before 4:30 PM',
    description: 'Punctuality and early work wrap-up',
    icon: '🏡',
    rewardValue: 2,
    maxPerDay: 1,
    active: true,
    color: '#6366f1',
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'habit-5',
    name: 'Read 20 Pages',
    description: 'Non-fiction or personal development reading',
    icon: '📚',
    rewardValue: 3,
    maxPerDay: 2,
    active: true,
    color: '#ec4899',
    order: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const DEFAULT_STORE_REWARDS: StoreReward[] = [
  {
    id: 'reward-1',
    name: 'Bourbon Biscuit Packet',
    description: 'Treat yourself to 1 delicious packet of Sunfeast Bourbon biscuits',
    cost: 12,
    icon: '🍪',
    active: true,
    category: 'Snacks',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'reward-2',
    name: 'Doomscrolling (15 mins)',
    description: 'Guilt-free social media feed scrolling window',
    cost: 5,
    icon: '📱',
    active: true,
    category: 'Break',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'reward-3',
    name: 'Chai / Coffee Break',
    description: 'Relax with your favorite hot cup of tea or fresh brew',
    cost: 8,
    icon: '☕',
    active: true,
    category: 'Break',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'reward-4',
    name: '1 Hour Video Games',
    description: 'Unwind with an hour of gaming on PC or console',
    cost: 20,
    icon: '🎮',
    active: true,
    category: 'Entertainment',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'reward-5',
    name: 'Watch Movie / Episode',
    description: 'Enjoy a full movie or TV show episode',
    cost: 25,
    icon: '🎬',
    active: true,
    category: 'Entertainment',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Helper to convert user uploaded image file into a Data URL (base64)
export const processImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

export const loadStoredHabits = (): Habit[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (!raw) {
      saveStoredHabits(DEFAULT_HABITS);
      return DEFAULT_HABITS;
    }
    const habits: Habit[] = JSON.parse(raw);
    return habits.map(h => ({
      ...h,
      maxPerDay: h.maxPerDay !== undefined ? h.maxPerDay : 1
    }));
  } catch (e) {
    console.error('Failed loading habits from local storage', e);
    return DEFAULT_HABITS;
  }
};

export const saveStoredHabits = (habits: Habit[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  } catch (e) {
    console.error('Failed saving habits to local storage', e);
  }
};

export const loadStoredRewards = (): StoreReward[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STORE_REWARDS);
    if (!raw) {
      saveStoredRewards(DEFAULT_STORE_REWARDS);
      return DEFAULT_STORE_REWARDS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed loading store rewards from local storage', e);
    return DEFAULT_STORE_REWARDS;
  }
};

export const saveStoredRewards = (rewards: StoreReward[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.STORE_REWARDS, JSON.stringify(rewards));
  } catch (e) {
    console.error('Failed saving store rewards to local storage', e);
  }
};

export const loadStoredLogs = (): RewardLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REWARD_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed loading logs from local storage', e);
    return [];
  }
};

export const saveStoredLogs = (logs: RewardLog[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.REWARD_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed saving logs to local storage', e);
  }
};

export const loadStoredRedemptions = (): RewardRedemption[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REDEMPTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed loading redemptions from local storage', e);
    return [];
  }
};

export const saveStoredRedemptions = (redemptions: RewardRedemption[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.REDEMPTIONS, JSON.stringify(redemptions));
  } catch (e) {
    console.error('Failed saving redemptions to local storage', e);
  }
};

export const loadStoredSettings = (): Settings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveStoredSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed loading settings from local storage', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveStoredSettings = (settings: Settings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed saving settings to local storage', e);
  }
};

export const exportAllData = () => {
  return {
    habits: loadStoredHabits(),
    storeRewards: loadStoredRewards(),
    rewardLogs: loadStoredLogs(),
    redemptions: loadStoredRedemptions(),
    settings: loadStoredSettings(),
    exportedAt: new Date().toISOString()
  };
};

export const importAllData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.habits) saveStoredHabits(data.habits);
    if (data.storeRewards) saveStoredRewards(data.storeRewards);
    if (data.rewardLogs) saveStoredLogs(data.rewardLogs);
    if (data.redemptions) saveStoredRedemptions(data.redemptions);
    if (data.settings) saveStoredSettings(data.settings);
    return true;
  } catch (e) {
    console.error('Failed importing data', e);
    return false;
  }
};
