import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  doc: vi.fn((db: unknown, ...path: string[]) => ({ db, path })),
  getApps: vi.fn(() => []),
  getFirestore: vi.fn(() => ({ name: 'firestore' })),
  initializeApp: vi.fn(() => ({ name: 'app' })),
  setDoc: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('firebase/app', () => ({
  getApps: mocks.getApps,
  initializeApp: mocks.initializeApp
}));
vi.mock('firebase/auth', () => ({}));
vi.mock('firebase/firestore', () => ({
  deleteDoc: mocks.deleteDoc,
  doc: mocks.doc,
  getFirestore: mocks.getFirestore,
  setDoc: mocks.setDoc
}));

import {
  deleteFirestoreHabit,
  deleteFirestoreLog,
  deleteFirestoreRedemption,
  deleteFirestoreReward,
  initFirebase,
  syncFirestoreHabit,
  syncFirestoreHabits,
  syncFirestoreRedemption,
  syncFirestoreReward,
  syncFirestoreRewardLog,
  syncFirestoreRewards,
  syncFirestoreSettings
} from '../firebase';
import { Habit, RewardLog, RewardRedemption, Settings, StoreReward } from '../../types';

const userId = 'user-123';
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
  currencySymbol: '🪙', currencyName: 'Coins', firebaseApiKey: 'secret'
};

describe('Firestore write helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getApps.mockReturnValue([]);
    initFirebase();
  });

  it.each([
    ['habit', syncFirestoreHabit, habit, `users/${userId}/activities`, habit.id],
    ['reward', syncFirestoreReward, reward, `users/${userId}/rewards`, reward.id],
    ['reward log', syncFirestoreRewardLog, log, `users/${userId}/rewardLogs`, log.id],
    ['redemption', syncFirestoreRedemption, redemption, `users/${userId}/rewardRedemptions`, redemption.id]
  ] as const)('writes a %s to its expected document path', async (_entity, sync, value, collectionPath, id) => {
    await (sync as (id: string, value: unknown) => Promise<void>)(userId, value);

    expect(mocks.doc).toHaveBeenCalledWith(expect.anything(), collectionPath, id);
    expect(mocks.setDoc).toHaveBeenCalledWith(expect.objectContaining({ path: [collectionPath, id] }), value);
  });

  it('writes every habit and reward in bulk sync', async () => {
    await syncFirestoreHabits(userId, [habit]);
    await syncFirestoreRewards(userId, [reward]);

    expect(mocks.setDoc).toHaveBeenCalledWith(expect.objectContaining({ path: [`users/${userId}/activities`, habit.id] }), habit);
    expect(mocks.setDoc).toHaveBeenCalledWith(expect.objectContaining({ path: [`users/${userId}/rewards`, reward.id] }), reward);
  });

  it('removes each deletable entity from its expected document path', async () => {
    await deleteFirestoreHabit(userId, habit.id);
    await deleteFirestoreReward(userId, reward.id);
    await deleteFirestoreLog(userId, log.id);
    await deleteFirestoreRedemption(userId, redemption.id);

    expect(mocks.deleteDoc).toHaveBeenCalledWith(expect.objectContaining({ path: [`users/${userId}/activities`, habit.id] }));
    expect(mocks.deleteDoc).toHaveBeenCalledWith(expect.objectContaining({ path: [`users/${userId}/rewards`, reward.id] }));
    expect(mocks.deleteDoc).toHaveBeenCalledWith(expect.objectContaining({ path: [`users/${userId}/rewardLogs`, log.id] }));
    expect(mocks.deleteDoc).toHaveBeenCalledWith(expect.objectContaining({ path: [`users/${userId}/rewardRedemptions`, redemption.id] }));
  });

  it('writes settings without Firebase credentials', async () => {
    await syncFirestoreSettings(userId, settings);

    expect(mocks.setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: [`users/${userId}/settings`, 'preferences'] }),
      expect.not.objectContaining({ firebaseApiKey: expect.anything() })
    );
  });
});
