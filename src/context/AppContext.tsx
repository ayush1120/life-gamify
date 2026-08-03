import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Habit, StoreReward, RewardLog, RewardRedemption, Settings, UserProfile, HabitStats } from '../types';
import { 
  loadStoredHabits, saveStoredHabits,
  loadStoredRewards, saveStoredRewards,
  loadStoredLogs, saveStoredLogs,
  loadStoredRedemptions, saveStoredRedemptions,
  loadStoredSettings, saveStoredSettings
} from '../services/storage';
import { playSound } from '../services/sound';
import { triggerCelebration } from '../services/celebration';
import { syncFirestoreSettings, isFirebaseConfigured } from '../services/firebase';
import { computeLedgerStats, calculateKarmaSurcharge } from '../services/ledger';

interface AppContextType {
  habits: Habit[];
  rewards: StoreReward[];
  rewardLogs: RewardLog[];
  redemptions: RewardRedemption[];
  settings: Settings;
  user: UserProfile | null;
  stats: HabitStats;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  
  // Actions
  logHabit: (habitId: string, event?: React.MouseEvent) => void;
  purchaseReward: (rewardId: string, note?: string) => boolean;
  
  // Habit CRUD
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateHabit: (habit: Habit) => void;
  deleteHabit: (id: string) => void;
  toggleHabitActive: (id: string) => void;
  reorderHabits: (habits: Habit[]) => void;
  
  // Store Reward CRUD
  addReward: (reward: Omit<StoreReward, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateReward: (reward: StoreReward) => void;
  deleteReward: (id: string) => void;
  toggleRewardActive: (id: string) => void;
  
  deleteLog: (logId: string) => void;
  deleteRedemption: (redemptionId: string) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  
  // Modals & FX State
  flyingReward: { habitName: string; icon: string; amount: number; x: number; y: number } | null;
  setFlyingReward: React.Dispatch<React.SetStateAction<{ habitName: string; icon: string; amount: number; x: number; y: number } | null>>;
  showPurchaseSuccessModal: RewardRedemption | null;
  setShowPurchaseSuccessModal: (redemption: RewardRedemption | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>(loadStoredHabits);
  const [rewards, setRewards] = useState<StoreReward[]>(loadStoredRewards);
  const [rewardLogs, setRewardLogs] = useState<RewardLog[]>(loadStoredLogs);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>(loadStoredRedemptions);
  const [settings, setSettings] = useState<Settings>(loadStoredSettings);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // FX States
  const [flyingReward, setFlyingReward] = useState<{ habitName: string; icon: string; amount: number; x: number; y: number } | null>(null);
  const [showPurchaseSuccessModal, setShowPurchaseSuccessModal] = useState<RewardRedemption | null>(null);

  // Guest Owner User for immediate seamless local use
  const [user] = useState<UserProfile | null>({
    uid: 'local-owner-uid',
    email: settings.allowedEmail || 'owner@lifegamify.local',
    displayName: 'Habit Master',
    photoURL: null,
    isOwner: true
  });

  // Apply Theme to root element & body
  useEffect(() => {
    const themeClass = `theme-${settings.theme || 'light'}`;
    document.documentElement.className = themeClass;
    document.body.className = themeClass;
  }, [settings.theme]);

  // Save changes to LocalStorage & Sync to Firebase
  useEffect(() => { saveStoredHabits(habits); }, [habits]);
  useEffect(() => { saveStoredRewards(rewards); }, [rewards]);
  useEffect(() => { saveStoredLogs(rewardLogs); }, [rewardLogs]);
  useEffect(() => { saveStoredRedemptions(redemptions); }, [redemptions]);
  useEffect(() => { 
    saveStoredSettings(settings); 
    if (user && isFirebaseConfigured(settings)) {
      syncFirestoreSettings(user.uid, settings);
    }
  }, [settings, user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Calculate Coin Economy Statistics using pure ledger service
  const stats: HabitStats = useMemo(() => {
    return computeLedgerStats(rewardLogs, redemptions);
  }, [rewardLogs, redemptions]);

  // Habit Logging Action
  const logHabit = (habitId: string, event?: React.MouseEvent) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const maxPerDay = habit.maxPerDay !== undefined ? habit.maxPerDay : 1;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = rewardLogs.filter(l => l.activityId === habitId && l.timestamp.startsWith(todayStr)).length;

    if (maxPerDay > 0 && todayCount >= maxPerDay) {
      showToast(`Daily limit reached for "${habit.name}" (${maxPerDay} max per day)! 🎯`);
      return;
    }

    if (event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setFlyingReward({
        habitName: habit.name,
        icon: habit.icon,
        amount: habit.rewardValue,
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }

    const newLog: RewardLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      activityId: habit.id,
      habitName: habit.name,
      icon: habit.icon,
      timestamp: new Date().toISOString(),
      rewardEarned: habit.rewardValue,
      unit: settings.currencyName || 'Coins'
    };

    setRewardLogs([newLog, ...rewardLogs]);
    playSound.crunch(settings.soundEnabled);
    showToast(`+${habit.rewardValue} ${settings.currencySymbol} earned for ${habit.name}! 🎉`);
  };

  // Purchase Store Reward Action
  const purchaseReward = (rewardId: string, note?: string): boolean => {
    const targetReward = rewards.find(r => r.id === rewardId);
    if (!targetReward) return false;

    if (stats.coinBalance < targetReward.cost) {
      showToast(`Not enough ${settings.currencyName}! You need ${targetReward.cost - stats.coinBalance} more ${settings.currencySymbol}.`);
      return false;
    }

    const newRedemption: RewardRedemption = {
      id: `redemption-${Date.now()}`,
      rewardId: targetReward.id,
      rewardName: targetReward.name,
      coinsSpent: targetReward.cost,
      timestamp: new Date().toISOString(),
      icon: targetReward.icon,
      image: targetReward.image,
      note
    };

    setRedemptions([newRedemption, ...redemptions]);
    playSound.fanfare(settings.soundEnabled);

    // Trigger celebration particle effect based on user setting
    triggerCelebration(settings.celebrationStyle);

    setShowPurchaseSuccessModal(newRedemption);
    return true;
  };

  // Habit CRUD Actions
  const addHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: `habit-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setHabits([...habits, newHabit]);
    showToast(`Created habit: ${newHabit.name}`);
  };

  const updateHabit = (updated: Habit) => {
    setHabits(habits.map(h => h.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : h));
    showToast(`Updated habit: ${updated.name}`);
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
    showToast(`Deleted habit`);
  };

  const toggleHabitActive = (id: string) => {
    setHabits(habits.map(h => h.id === id ? { ...h, active: !h.active, updatedAt: new Date().toISOString() } : h));
  };

  const reorderHabits = (newOrder: Habit[]) => {
    setHabits(newOrder.map((h, i) => ({ ...h, order: i + 1 })));
  };

  // Store Reward CRUD Actions
  const addReward = (rewardData: Omit<StoreReward, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newReward: StoreReward = {
      ...rewardData,
      id: `reward-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setRewards([...rewards, newReward]);
    showToast(`Added Store Reward: ${newReward.name}`);
  };

  const updateReward = (updated: StoreReward) => {
    setRewards(rewards.map(r => r.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : r));
    showToast(`Updated reward: ${updated.name}`);
  };

  const deleteReward = (id: string) => {
    setRewards(rewards.filter(r => r.id !== id));
    showToast('Reward deleted');
  };

  const toggleRewardActive = (id: string) => {
    setRewards(rewards.map(r => r.id === id ? { ...r, active: !r.active, updatedAt: new Date().toISOString() } : r));
  };

  const deleteLog = (logId: string) => {
    const targetLog = rewardLogs.find(l => l.id === logId);
    if (!targetLog) return;

    if (targetLog.isRetracted) {
      showToast('This log has already been retracted');
      return;
    }

    const validLogs = rewardLogs.filter(l => !l.isRetracted);
    const totalEarned = validLogs.reduce((sum, log) => sum + log.rewardEarned, 0);
    const totalSpent = redemptions.reduce((sum, r) => sum + r.coinsSpent, 0);
    const isDeficit = (totalEarned - targetLog.rewardEarned) < totalSpent;

    if (isDeficit) {
      const karmaFee = calculateKarmaSurcharge(stats.coinBalance);
      setRewardLogs(rewardLogs.map(l => l.id === logId ? {
        ...l,
        isRetracted: true,
        retractedAt: new Date().toISOString(),
        karmaFeeApplied: karmaFee
      } : l));
      showToast(`Log retracted. Phantom Debt created (-${karmaFee} ${settings.currencySymbol} surcharge)`);
    } else {
      setRewardLogs(rewardLogs.filter(l => l.id !== logId));
      showToast('Log removed cleanly');
    }
  };

  const deleteRedemption = (redemptionId: string) => {
    const target = redemptions.find(r => r.id === redemptionId);
    if (!target) return;

    setRedemptions(redemptions.filter(r => r.id !== redemptionId));
    showToast(`Refunded purchase for "${target.rewardName}"!`);
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    showToast('Settings saved');
  };

  return (
    <AppContext.Provider
      value={{
        habits,
        rewards,
        rewardLogs,
        redemptions,
        settings,
        user,
        stats,
        activeTab,
        setActiveTab,
        toastMessage,
        showToast,
        logHabit,
        purchaseReward,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabitActive,
        reorderHabits,
        addReward,
        updateReward,
        deleteReward,
        toggleRewardActive,
        deleteLog,
        deleteRedemption,
        updateSettings,
        flyingReward,
        setFlyingReward,
        showPurchaseSuccessModal,
        setShowPurchaseSuccessModal
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
