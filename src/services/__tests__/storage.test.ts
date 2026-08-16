import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  saveStoredHabits,
  saveStoredLogs,
  saveStoredRedemptions,
  saveStoredRewards,
  saveStoredSettings
} from '../storage';
import { Habit, RewardLog, RewardRedemption, Settings, StoreReward } from '../../types';

const habit: Habit = {
  id: 'habit-1', name: 'Walk', icon: '🚶', rewardValue: 3, maxPerPeriod: 1,
  frequency: 'daily', active: true, color: '#fff', order: 1,
  createdAt: '2026-08-16T00:00:00.000Z', updatedAt: '2026-08-16T00:00:00.000Z'
};
const reward: StoreReward = {
  id: 'reward-1', name: 'Coffee', icon: '☕', cost: 5, active: true,
  category: 'Break', createdAt: '2026-08-16T00:00:00.000Z', updatedAt: '2026-08-16T00:00:00.000Z'
};
const log: RewardLog = {
  id: 'log-1', activityId: habit.id, habitName: habit.name, icon: habit.icon,
  timestamp: '2026-08-16T00:00:00.000Z', rewardEarned: 3, unit: 'Coins'
};
const redemption: RewardRedemption = {
  id: 'redemption-1', rewardId: reward.id, rewardName: reward.name,
  coinsSpent: 5, timestamp: '2026-08-16T00:00:00.000Z'
};
const settings: Settings = {
  theme: 'dark', celebrationStyle: 'confetti', soundEnabled: true,
  currencySymbol: '🪙', currencyName: 'Coins'
};

describe('LocalStorage persistence', () => {
  const setItem = vi.fn();

  beforeEach(() => {
    setItem.mockReset();
    vi.stubGlobal('localStorage', { setItem });
  });

  it.each([
    ['habits', saveStoredHabits, [habit], 'life_gamify_habits_v2'],
    ['rewards', saveStoredRewards, [reward], 'life_gamify_store_rewards_v2'],
    ['reward logs', saveStoredLogs, [log], 'life_gamify_reward_logs_v2'],
    ['redemptions', saveStoredRedemptions, [redemption], 'life_gamify_redemptions_v2'],
    ['settings', saveStoredSettings, settings, 'life_gamify_settings_v2']
  ] as const)('writes %s to its stable storage key', (_entity, save, value, key) => {
    (save as (value: unknown) => void)(value);

    expect(setItem).toHaveBeenCalledOnce();
    expect(setItem).toHaveBeenCalledWith(key, JSON.stringify(value));
  });
});
