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
import { 
  syncFirestoreSettings, 
  isFirebaseConfigured, 
  onAuthChange,
  subscribeFirestoreHabits,
  subscribeFirestoreLogs,
  subscribeFirestoreRedemptions,
  subscribeFirestoreSettings,
  syncFirestoreHabits,
  deleteFirestoreHabit,
  syncFirestoreRewardLog,
  deleteFirestoreLog,
  syncFirestoreRedemption,
  deleteFirestoreRedemption,
  signInWithGoogle as firebaseGoogleSignIn,
  logoutFirebase
} from '../services/firebase';
import { computeLedgerStats, calculateKarmaSurcharge, calculateMistakeFee, isHabitLogGracePeriod } from '../services/ledger';
import { isHabitDueInPeriod, getPeriodLabel } from '../utils/frequencyUtils';

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
  
  // Auth Actions
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;

  // Actions
  logHabit: (habitId: string, event?: React.MouseEvent) => void;
  purchaseReward: (rewardId: string, note?: string) => boolean;
  
  // Habit CRUD
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateHabit: (habit: Habit) => void;
  deleteHabit: (id: string) => void;
  toggleHabitActive: (id: string) => void;
  toggleQuickHabit: (id: string) => void;
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
  setFlyingReward: (val: { habitName: string; icon: string; amount: number; x: number; y: number } | null) => void;
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
  const getInitialTab = (): string => {
    const hash = window.location.hash.replace('#', '').trim();
    const pathname = window.location.pathname.replace(/^\//, '').trim();
    const validTabs = ['dashboard', 'log-activity', 'store', 'habits', 'history', 'analytics', 'settings', 'overlay-demo'];
    if (validTabs.includes(hash)) return hash;
    if (validTabs.includes(pathname)) return pathname;
    return 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    window.location.hash = tab;
  };

  // Apply theme CSS class and dynamic meta theme-color for system bars (Android/iOS)
  useEffect(() => {
    const isDark = settings.theme !== 'light';
    const themeColor = isDark ? '#080c18' : '#fffbeb';
    
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'dark');
    document.documentElement.classList.add(isDark ? 'theme-dark' : 'theme-light', isDark ? 'dark' : 'light');

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor);
    }
  }, [settings.theme]);

  useEffect(() => {
    const handleHashOrPathChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      const pathname = window.location.pathname.replace(/^\//, '').trim();
      const validTabs = ['dashboard', 'log-activity', 'store', 'habits', 'history', 'analytics', 'settings', 'overlay-demo'];
      if (validTabs.includes(hash)) {
        setActiveTabState(hash);
      } else if (validTabs.includes(pathname)) {
        setActiveTabState(pathname);
      }
    };
    window.addEventListener('hashchange', handleHashOrPathChange);
    window.addEventListener('popstate', handleHashOrPathChange);
    return () => {
      window.removeEventListener('hashchange', handleHashOrPathChange);
      window.removeEventListener('popstate', handleHashOrPathChange);
    };
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // FX States
  const [flyingReward, setFlyingReward] = useState<{ habitName: string; icon: string; amount: number; x: number; y: number } | null>(null);
  const [showPurchaseSuccessModal, setShowPurchaseSuccessModal] = useState<RewardRedemption | null>(null);

  // User Profile state (null = Local Mode, UserProfile = Google Auth User)
  const [user, setUser] = useState<UserProfile | null>(null);

  // Subscribe to Firebase Google Authentication State & Real-Time Cloud Listeners
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubscribeAuth = onAuthChange((authUser) => {
      // Clean up previous user subscriptions
      unsubs.forEach(unsub => unsub());
      unsubs = [];

      setUser(authUser);

      if (authUser) {
        // 1. Live Habits Subscription
        const unsubHabits = subscribeFirestoreHabits(authUser.uid, (cloudHabits) => {
          if (cloudHabits.length > 0) {
            setHabits(cloudHabits);
            saveStoredHabits(cloudHabits);
          } else {
            syncFirestoreHabits(authUser.uid, habits);
          }
        });

        // 2. Live Logs Subscription (Completions & Retracts)
        const unsubLogs = subscribeFirestoreLogs(authUser.uid, (cloudLogs) => {
          if (cloudLogs.length > 0) {
            setRewardLogs(cloudLogs);
            saveStoredLogs(cloudLogs);
          } else {
            // If cloud logs are empty, sync existing local logs to cloud
            const localLogs = loadStoredLogs();
            if (localLogs.length > 0) {
              localLogs.forEach(log => syncFirestoreRewardLog(authUser.uid, log));
            }
          }
        });

        // 3. Live Redemptions Subscription (Store Reward Purchases)
        const unsubRedemptions = subscribeFirestoreRedemptions(authUser.uid, (cloudRedemptions) => {
          if (cloudRedemptions.length > 0) {
            setRedemptions(cloudRedemptions);
            saveStoredRedemptions(cloudRedemptions);
          } else {
            // If cloud redemptions are empty, sync existing local redemptions to cloud
            const localRedemptions = loadStoredRedemptions();
            if (localRedemptions.length > 0) {
              localRedemptions.forEach(r => syncFirestoreRedemption(authUser.uid, r));
            }
          }
        });

        // 4. Live Settings Subscription
        const unsubSettings = subscribeFirestoreSettings(authUser.uid, (cloudSettings) => {
          if (cloudSettings) {
            setSettings(prev => {
              const updated = { ...prev, ...cloudSettings };
              saveStoredSettings(updated);
              return updated;
            });
          }
        });

        unsubs.push(unsubHabits, unsubLogs, unsubRedemptions, unsubSettings);
        showToast(`Welcome, ${authUser.displayName || 'User'}! ☁️ Live Cloud Synced`);
      }
    }, settings);

    return () => {
      unsubscribeAuth();
      unsubs.forEach(unsub => unsub());
    };
  }, [settings.firebaseApiKey, settings.firebaseProjectId]);

  const signInWithGoogle = async () => {
    try {
      await firebaseGoogleSignIn(settings);
    } catch (e) {
      console.error('Google Sign-In Error:', e);
      const msg = e instanceof Error ? e.message : 'Google Sign-In failed. Check Firebase config.';
      showToast(msg);
    }
  };

  const logout = async () => {
    try {
      await logoutFirebase();
      setUser(null);
      showToast('Signed out of Google account');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // Apply Theme to root element & body
  useEffect(() => {
    const themeClass = `theme-${settings.theme || 'light'}`;
    document.documentElement.className = themeClass;
    document.body.className = themeClass;
  }, [settings.theme]);

  // Save changes to LocalStorage for offline resilience
  useEffect(() => { saveStoredHabits(habits); }, [habits]);
  useEffect(() => { saveStoredRewards(rewards); }, [rewards]);
  useEffect(() => { saveStoredLogs(rewardLogs); }, [rewardLogs]);
  useEffect(() => { saveStoredRedemptions(redemptions); }, [redemptions]);
  useEffect(() => { saveStoredSettings(settings); }, [settings]);

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

    if (!isHabitDueInPeriod(habit, rewardLogs)) {
      const label = getPeriodLabel(habit.frequency || 'daily');
      const max = habit.maxPerPeriod ?? habit.maxPerDay ?? 1;
      showToast(`Limit reached for "${habit.name}" (${max} max per ${label.toLowerCase()})! 🎯`);
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
    if (user) syncFirestoreRewardLog(user.uid, newLog);
    playSound.crunch(settings.soundEnabled);
    showToast(`Completed "${habit.name}"! +${habit.rewardValue} ${settings.currencySymbol}`);
  };

  // Store Reward Purchase Action
  const purchaseReward = (rewardId: string, note?: string): boolean => {
    const targetReward = rewards.find(r => r.id === rewardId);
    if (!targetReward) return false;

    if (stats.coinBalance < targetReward.cost) {
      showToast(`Not enough ${settings.currencyName}! You need ${targetReward.cost - stats.coinBalance} more coins.`);
      playSound.pop(settings.soundEnabled);
      return false;
    }

    const newRedemption: RewardRedemption = {
      id: `redemption-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      rewardId: targetReward.id,
      rewardName: targetReward.name,
      coinsSpent: targetReward.cost,
      timestamp: new Date().toISOString(),
      icon: targetReward.icon,
      image: targetReward.image,
      note
    };

    setRedemptions([newRedemption, ...redemptions]);
    if (user) syncFirestoreRedemption(user.uid, newRedemption);

    playSound.fanfare(settings.soundEnabled);
    triggerCelebration(settings.celebrationStyle);
    setShowPurchaseSuccessModal(newRedemption);
    showToast(`Redeemed "${targetReward.name}" for ${targetReward.cost} ${settings.currencySymbol}! 🎉`);
    return true;
  };

  // Habit CRUD Actions
  const addHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: `habit-${Date.now()}`,
      order: habits.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [...habits, newHabit];
    setHabits(updated);
    if (user) syncFirestoreHabits(user.uid, updated);
    showToast(`Added habit: ${newHabit.name}`);
  };

  const updateHabit = (updated: Habit) => {
    const newHabits = habits.map(h => h.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : h);
    setHabits(newHabits);
    if (user) syncFirestoreHabits(user.uid, newHabits);
    showToast(`Updated habit: ${updated.name}`);
  };

  const deleteHabit = (id: string) => {
    const newHabits = habits.filter(h => h.id !== id);
    setHabits(newHabits);
    if (user) deleteFirestoreHabit(user.uid, id);
    showToast('Habit deleted');
  };

  const toggleHabitActive = (id: string) => {
    const newHabits = habits.map(h => h.id === id ? { ...h, active: !h.active, updatedAt: new Date().toISOString() } : h);
    setHabits(newHabits);
    if (user) syncFirestoreHabits(user.uid, newHabits);
  };

  const toggleQuickHabit = (id: string) => {
    const target = habits.find(h => h.id === id);
    if (!target) return;
    const nextState = !target.isQuickHabit;
    const newHabits = habits.map(h => h.id === id ? { ...h, isQuickHabit: nextState, updatedAt: new Date().toISOString() } : h);
    setHabits(newHabits);
    if (user) syncFirestoreHabits(user.uid, newHabits);
    showToast(nextState ? `Starred "${target.name}" as Quick Habit ⭐️` : `Unmarked "${target.name}" from Quick Habits`);
  };

  const reorderHabits = (newOrder: Habit[]) => {
    const ordered = newOrder.map((h, i) => ({ ...h, order: i + 1 }));
    setHabits(ordered);
    if (user) syncFirestoreHabits(user.uid, ordered);
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

    const isFreeGrace = isHabitLogGracePeriod(targetLog.timestamp);

    if (isDeficit) {
      const karmaFee = calculateKarmaSurcharge(stats.coinBalance);
      const retractedLog: RewardLog = {
        ...targetLog,
        isRetracted: true,
        retractedAt: new Date().toISOString(),
        karmaFeeApplied: karmaFee
      };
      setRewardLogs(rewardLogs.map(l => l.id === logId ? retractedLog : l));
      if (user) syncFirestoreRewardLog(user.uid, retractedLog);
      showToast(`Log retracted. Phantom Debt created (-${karmaFee} surcharge)`);
    } else {
      // Non-Deficit Delete: Cleanly remove log from history (No Phantom Debt, No Retracted status!)
      setRewardLogs(rewardLogs.filter(l => l.id !== logId));
      if (user) deleteFirestoreLog(user.uid, logId);

      if (isFreeGrace) {
        showToast('Log removed cleanly (5-Min Accidental Tap Grace Period)! 🛡️');
      } else {
        const mistakeFee = calculateMistakeFee(stats.coinBalance);
        showToast(`Log removed cleanly (-${targetLog.rewardEarned} coins + ${mistakeFee} fee)`);
      }
    }
  };

  const deleteRedemption = (redemptionId: string) => {
    const target = redemptions.find(r => r.id === redemptionId);
    if (!target) return;

    setRedemptions(redemptions.filter(r => r.id !== redemptionId));
    if (user) deleteFirestoreRedemption(user.uid, redemptionId);
    showToast(`Refunded purchase for "${target.rewardName}"!`);
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (user && isFirebaseConfigured(updated)) {
        syncFirestoreSettings(user.uid, updated);
      }
      return updated;
    });
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
        signInWithGoogle,
        logout,
        logHabit,
        purchaseReward,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabitActive,
        toggleQuickHabit,
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
