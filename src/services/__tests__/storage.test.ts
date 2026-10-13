import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  saveStoredHabits,
  saveStoredLogs,
  saveStoredRedemptions,
  saveStoredRewards,
  saveStoredSettings,
  saveStoredGoals,
  loadStoredGoals,
  getGoalsStorageKey,
  setLastAuthenticatedUserId,
  getLastAuthenticatedUserId,
  exportAllData,
  importAllData
} from '../storage';

import { Habit, RewardLog, RewardRedemption, Settings, StoreReward, Goal } from '../../types';

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
const goal: Goal = {
  id: 'goal-1', title: 'Learn Spanish', status: 'active',
  createdAt: '2026-10-14T00:00:00.000Z', updatedAt: '2026-10-14T00:00:00.000Z'
};

describe('LocalStorage persistence', () => {
  const setItem = vi.fn();
  const getItem = vi.fn();

  beforeEach(() => {
    setItem.mockReset();
    getItem.mockReset();
    vi.stubGlobal('localStorage', { setItem, getItem });
  });

  it.each([
    ['habits', saveStoredHabits, [habit], 'life_gamify_habits_v2'],
    ['rewards', saveStoredRewards, [reward], 'life_gamify_store_rewards_v2'],
    ['reward logs', saveStoredLogs, [log], 'life_gamify_reward_logs_v2'],
    ['redemptions', saveStoredRedemptions, [redemption], 'life_gamify_redemptions_v2'],
    ['settings', saveStoredSettings, settings, 'life_gamify_settings_v2'],
    ['goals', saveStoredGoals, [goal], 'life_gamify_goals_v2']
  ] as const)('writes %s to its stable storage key', (_entity, save, value, key) => {
    (save as (value: unknown) => void)(value);

    expect(setItem).toHaveBeenCalledOnce();
    expect(setItem).toHaveBeenCalledWith(key, JSON.stringify(value));
  });

  it('includes goals in exportAllData', () => {
    getItem.mockImplementation((key: string) => {
      if (key === 'life_gamify_goals_v2') return JSON.stringify([goal]);
      return null;
    });

    const exported = exportAllData();
    expect(exported.goals).toEqual([goal]);
  });

  it('restores goals in importAllData and handles backward compatibility', () => {
    const importPayload = JSON.stringify({
      goals: [goal]
    });
    const success = importAllData(importPayload);
    expect(success).toBe(true);
    expect(setItem).toHaveBeenCalledWith('life_gamify_goals_v2', JSON.stringify([goal]));

    // Older backup without goals still imports cleanly
    setItem.mockClear();
    const olderPayload = JSON.stringify({ habits: [habit] });
    expect(importAllData(olderPayload)).toBe(true);
  });

  it('scopes goal storage keys per authenticated user', () => {
    expect(getGoalsStorageKey('user-A')).toBe('life_gamify_goals_v2_user-A');
    expect(getGoalsStorageKey('user-B')).toBe('life_gamify_goals_v2_user-B');
    expect(getGoalsStorageKey(null)).toBe('life_gamify_goals_v2');
    expect(getGoalsStorageKey()).toBe('life_gamify_goals_v2');
  });

  it('saves and loads goals strictly isolated between accounts', () => {
    const goalA: Goal = { ...goal, id: 'goal-A', userId: 'user-A', title: 'User A Goal' };
    const goalB: Goal = { ...goal, id: 'goal-B', userId: 'user-B', title: 'User B Goal' };

    saveStoredGoals([goalA], 'user-A');
    expect(setItem).toHaveBeenCalledWith('life_gamify_goals_v2_user-A', JSON.stringify([goalA]));

    saveStoredGoals([goalB], 'user-B');
    expect(setItem).toHaveBeenCalledWith('life_gamify_goals_v2_user-B', JSON.stringify([goalB]));

    getItem.mockImplementation((key: string) => {
      if (key === 'life_gamify_goals_v2_user-A') return JSON.stringify([goalA]);
      if (key === 'life_gamify_goals_v2_user-B') return JSON.stringify([goalB]);
      return null;
    });

    expect(loadStoredGoals('user-A')).toEqual([goalA]);
    expect(loadStoredGoals('user-B')).toEqual([goalB]);
    expect(loadStoredGoals('user-C')).toEqual([]);
    expect(loadStoredGoals(null)).toEqual([]);
  });

  it('tracks and clears last authenticated user id', () => {
    const removeItem = vi.fn();
    vi.stubGlobal('localStorage', { setItem, getItem, removeItem });

    setLastAuthenticatedUserId('user-A');
    expect(setItem).toHaveBeenCalledWith('life_gamify_last_auth_user_id', 'user-A');

    getItem.mockReturnValue('user-A');
    expect(getLastAuthenticatedUserId()).toBe('user-A');

    setLastAuthenticatedUserId(null);
    expect(removeItem).toHaveBeenCalledWith('life_gamify_last_auth_user_id');
  });
});

