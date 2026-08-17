import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  Habit, 
  StoreReward, 
  RewardLog, 
  RewardRedemption, 
  Settings, 
  UserProfile, 
  HabitStats,
  ActivityMapping,
  QuestDefinition,
  BossDefinition,
  AchievementDefinition,
  GameNotification
} from '../types';
import { 
  loadStoredHabits, saveStoredHabits,
  loadStoredRewards, saveStoredRewards,
  loadStoredLogs, saveStoredLogs,
  loadStoredRedemptions, saveStoredRedemptions,
  loadStoredSettings, saveStoredSettings,
  loadStoredActivityMappings, saveStoredActivityMappings,
  loadStoredQuests, saveStoredQuests,
  loadStoredBosses, saveStoredBosses,
  loadStoredAchievements, saveStoredAchievements,
  loadStoredNotifications, saveStoredNotifications
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
  subscribeFirestoreRewards,
  syncFirestoreHabits,
  syncFirestoreHabit,
  deleteFirestoreHabit,
  syncFirestoreRewards,
  syncFirestoreReward,
  deleteFirestoreReward,
  syncFirestoreRewardLog,
  deleteFirestoreLog,
  syncFirestoreRedemption,
  deleteFirestoreRedemption,
  subscribeFirestoreActivityMappings,
  syncFirestoreActivityMapping,
  syncFirestoreActivityMappings,
  subscribeFirestoreQuests,
  syncFirestoreQuest,
  deleteFirestoreQuest,
  subscribeFirestoreBosses,
  syncFirestoreBoss,
  subscribeFirestoreAchievements,
  syncFirestoreAchievement,
  subscribeFirestoreNotifications,
  syncFirestoreNotification,
  deleteFirestoreNotification,
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
  activityMappings: Record<string, ActivityMapping>;
  quests: QuestDefinition[];
  bosses: BossDefinition[];
  achievements: AchievementDefinition[];
  notifications: GameNotification[];
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
  
  // RPG State & Actions
  updateActivityMapping: (mapping: ActivityMapping) => void;
  addQuest: (quest: QuestDefinition) => void;
  updateQuest: (quest: QuestDefinition) => void;
  archiveQuest: (questId: string) => void;
  deleteQuest: (questId: string) => void;
  addBoss: (boss: BossDefinition) => void;
  updateBoss: (boss: BossDefinition) => void;
  archiveBoss: (bossId: string) => void;
  updateAchievement: (achievement: AchievementDefinition) => void;
  markNotificationRead: (id: string) => void;
  dismissNotification: (id: string) => void;


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
  const lastLogTimeRef = React.useRef<Record<string, number>>({});
  const [habits, setHabits] = useState<Habit[]>(loadStoredHabits);
  const [rewards, setRewards] = useState<StoreReward[]>(loadStoredRewards);
  const [rewardLogs, setRewardLogs] = useState<RewardLog[]>(loadStoredLogs);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>(loadStoredRedemptions);
  const [settings, setSettings] = useState<Settings>(loadStoredSettings);
  const [activityMappings, setActivityMappings] = useState<Record<string, ActivityMapping>>(loadStoredActivityMappings);
  const [quests, setQuests] = useState<QuestDefinition[]>(loadStoredQuests);
  const [bosses, setBosses] = useState<BossDefinition[]>(loadStoredBosses);
  const [achievements, setAchievements] = useState<AchievementDefinition[]>(loadStoredAchievements);
  const [notifications, setNotifications] = useState<GameNotification[]>(loadStoredNotifications);

  const getInitialTab = (): string => {
    const hash = window.location.hash.replace('#', '').trim();
    const pathname = window.location.pathname.replace(/^\//, '').trim();
    const validTabs = ['dashboard', 'adventure', 'log-activity', 'store', 'habits', 'history', 'analytics', 'settings', 'overlay-demo'];
    if (validTabs.includes(hash) || hash.startsWith('habits/')) return hash;
    if (validTabs.includes(pathname) || pathname.startsWith('habits/')) return pathname;
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
      const validTabs = ['dashboard', 'adventure', 'log-activity', 'store', 'habits', 'history', 'analytics', 'settings', 'overlay-demo'];
      if (validTabs.includes(hash) || hash.startsWith('habits/')) {
        setActiveTabState(hash);
      } else if (validTabs.includes(pathname) || pathname.startsWith('habits/')) {
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

        // 5. Live Rewards Subscription
        const unsubRewards = subscribeFirestoreRewards(authUser.uid, (cloudRewards) => {
          if (cloudRewards.length > 0) {
            setRewards(cloudRewards);
            saveStoredRewards(cloudRewards);
          } else {
            syncFirestoreRewards(authUser.uid, rewards);
          }
        });

        // 6. Live Activity Mappings Subscription
        const unsubMappings = subscribeFirestoreActivityMappings(authUser.uid, (cloudMappings) => {
          if (Object.keys(cloudMappings).length > 0) {
            setActivityMappings(cloudMappings);
            saveStoredActivityMappings(cloudMappings);
          } else {
            syncFirestoreActivityMappings(authUser.uid, activityMappings);
          }
        });

        // 7. Live Quests Subscription
        const unsubQuests = subscribeFirestoreQuests(authUser.uid, (cloudQuests) => {
          if (cloudQuests.length > 0) {
            setQuests(cloudQuests);
            saveStoredQuests(cloudQuests);
          }
        });

        // 8. Live Bosses Subscription
        const unsubBosses = subscribeFirestoreBosses(authUser.uid, (cloudBosses) => {
          if (cloudBosses.length > 0) {
            setBosses(cloudBosses);
            saveStoredBosses(cloudBosses);
          }
        });

        // 9. Live Achievements Subscription
        const unsubAchievements = subscribeFirestoreAchievements(authUser.uid, (cloudAch) => {
          if (cloudAch.length > 0) {
            setAchievements(cloudAch);
            saveStoredAchievements(cloudAch);
          }
        });

        // 10. Live Notifications Subscription
        const unsubNotifs = subscribeFirestoreNotifications(authUser.uid, (cloudNotifs) => {
          if (cloudNotifs.length > 0) {
            setNotifications(cloudNotifs);
            saveStoredNotifications(cloudNotifs);
          }
        });

        unsubs.push(
          unsubHabits, 
          unsubLogs, 
          unsubRedemptions, 
          unsubSettings, 
          unsubRewards,
          unsubMappings,
          unsubQuests,
          unsubBosses,
          unsubAchievements,
          unsubNotifs
        );
        showToast(`Welcome, ${authUser.displayName || 'User'}! ☁️ Live Cloud Synced`);
      }
    }, settings);

    return () => {
      unsubscribeAuth();
      unsubs.forEach(unsub => unsub());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  useEffect(() => { saveStoredActivityMappings(activityMappings); }, [activityMappings]);
  useEffect(() => { saveStoredQuests(quests); }, [quests]);
  useEffect(() => { saveStoredBosses(bosses); }, [bosses]);
  useEffect(() => { saveStoredAchievements(achievements); }, [achievements]);
  useEffect(() => { saveStoredNotifications(notifications); }, [notifications]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Calculate Coin Economy & Multi-Stat Progression Statistics using pure deterministic ledger service
  const stats: HabitStats = useMemo(() => {
    return computeLedgerStats(rewardLogs, redemptions, habits, activityMappings);
  }, [rewardLogs, redemptions, habits, activityMappings]);

  // Habit Logging Action
  const logHabit = (habitId: string, event?: React.MouseEvent) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !habit.active) return;

    const now = Date.now();
    if (lastLogTimeRef.current[habitId] && now - lastLogTimeRef.current[habitId] < 300) {
      return;
    }
    lastLogTimeRef.current[habitId] = now;

    const attemptTime = new Date(now);

    if (!isHabitDueInPeriod(habit, rewardLogs, attemptTime)) {
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
      id: `log-${now}-${Math.random().toString(36).substring(2, 8)}`,
      activityId: habit.id,
      habitName: habit.name,
      icon: habit.icon,
      timestamp: attemptTime.toISOString(),
      rewardEarned: habit.rewardValue,
      unit: 'coins'
    };

    const updatedLogs = [newLog, ...rewardLogs];
    setRewardLogs(updatedLogs);
    if (user) syncFirestoreRewardLog(user.uid, newLog);

    playSound.crunch(settings.soundEnabled);
    triggerCelebration(settings.celebrationStyle);
  };

  const purchaseReward = (rewardId: string, note?: string): boolean => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return false;

    if (stats.coinBalance < reward.cost) {
      showToast(`Not enough coins! Need ${reward.cost - stats.coinBalance} more.`);
      return false;
    }

    const newRedemption: RewardRedemption = {
      id: `redemption-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      rewardId: reward.id,
      rewardName: reward.name,
      coinsSpent: reward.cost,
      timestamp: new Date().toISOString(),
      icon: reward.icon,
      image: reward.image,
      note
    };

    const updated = [newRedemption, ...redemptions];
    setRedemptions(updated);
    if (user) syncFirestoreRedemption(user.uid, newRedemption);

    playSound.fanfare(settings.soundEnabled);

    setShowPurchaseSuccessModal(newRedemption);
    return true;
  };


  const addHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newHabit: Habit = {
      ...habitData,
      id: `habit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      createdAt: now,
      updatedAt: now
    };
    const updated = [...habits, newHabit];
    setHabits(updated);
    if (user) syncFirestoreHabit(user.uid, newHabit);
    showToast(`Added habit "${newHabit.name}"`);
  };

  const updateHabit = (updatedHabit: Habit) => {
    const updated = habits.map(h => h.id === updatedHabit.id ? { ...updatedHabit, updatedAt: new Date().toISOString() } : h);
    setHabits(updated);
    if (user) syncFirestoreHabit(user.uid, updatedHabit);
    showToast(`Updated habit "${updatedHabit.name}"`);
  };

  const deleteHabit = (id: string) => {
    const target = habits.find(h => h.id === id);
    setHabits(habits.filter(h => h.id !== id));
    if (user) deleteFirestoreHabit(user.uid, id);
    showToast(`Deleted habit "${target?.name || ''}"`);
  };

  const toggleHabitActive = (id: string) => {
    const target = habits.find(h => h.id === id);
    if (!target) return;
    const updated = { ...target, active: !target.active, updatedAt: new Date().toISOString() };
    updateHabit(updated);
  };

  const toggleQuickHabit = (id: string) => {
    const target = habits.find(h => h.id === id);
    if (!target) return;
    const updated = { ...target, isQuickHabit: !target.isQuickHabit, updatedAt: new Date().toISOString() };
    updateHabit(updated);
  };

  const reorderHabits = (newHabits: Habit[]) => {
    const reordered = newHabits.map((h, idx) => ({ ...h, order: idx + 1 }));
    setHabits(reordered);
    if (user) syncFirestoreHabits(user.uid, reordered);
  };

  const addReward = (rewardData: Omit<StoreReward, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newReward: StoreReward = {
      ...rewardData,
      id: `reward-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      createdAt: now,
      updatedAt: now
    };
    const updated = [...rewards, newReward];
    setRewards(updated);
    if (user) syncFirestoreReward(user.uid, newReward);
    showToast(`Added reward "${newReward.name}"`);
  };

  const updateReward = (updatedReward: StoreReward) => {
    const updated = rewards.map(r => r.id === updatedReward.id ? { ...updatedReward, updatedAt: new Date().toISOString() } : r);
    setRewards(updated);
    if (user) syncFirestoreReward(user.uid, updatedReward);
    showToast(`Updated reward "${updatedReward.name}"`);
  };

  const deleteReward = (id: string) => {
    const target = rewards.find(r => r.id === id);
    setRewards(rewards.filter(r => r.id !== id));
    if (user) deleteFirestoreReward(user.uid, id);
    showToast(`Deleted reward "${target?.name || ''}"`);
  };

  const toggleRewardActive = (id: string) => {
    const target = rewards.find(r => r.id === id);
    if (!target) return;
    const updated = { ...target, active: !target.active, updatedAt: new Date().toISOString() };
    updateReward(updated);
  };

  // --- RPG ACTIONS ---
  const updateActivityMapping = (mapping: ActivityMapping) => {
    const updated = { ...activityMappings, [mapping.habitId]: mapping };
    setActivityMappings(updated);
    if (user) syncFirestoreActivityMapping(user.uid, mapping);
    showToast('Activity stat mapping updated');
  };

  const addQuest = (quest: QuestDefinition) => {
    const updated = [quest, ...quests];
    setQuests(updated);
    if (user) syncFirestoreQuest(user.uid, quest);
  };

  const updateQuest = (quest: QuestDefinition) => {
    const updated = quests.map(q => q.id === quest.id ? quest : q);
    setQuests(updated);
    if (user) syncFirestoreQuest(user.uid, quest);
  };

  const archiveQuest = (questId: string) => {
    const target = quests.find(q => q.id === questId);
    if (!target) return;
    const updatedQuest: QuestDefinition = {
      ...target,
      status: 'archived',
      archivedAt: new Date().toISOString()
    };
    updateQuest(updatedQuest);
    showToast(`Quest "${target.title}" archived`);
  };

  const deleteQuest = (questId: string) => {
    setQuests(quests.filter(q => q.id !== questId));
    if (user) deleteFirestoreQuest(user.uid, questId);
  };

  const addBoss = (boss: BossDefinition) => {

    const updated = [boss, ...bosses];
    setBosses(updated);
    if (user) syncFirestoreBoss(user.uid, boss);
  };

  const updateBoss = (boss: BossDefinition) => {
    const updated = bosses.map(b => b.id === boss.id ? boss : b);
    setBosses(updated);
    if (user) syncFirestoreBoss(user.uid, boss);
  };

  const archiveBoss = (bossId: string) => {
    const target = bosses.find(b => b.id === bossId);
    if (!target) return;
    const updatedBoss: BossDefinition = {
      ...target,
      status: 'archived'
    };
    updateBoss(updatedBoss);
    showToast(`Boss challenge "${target.name}" archived`);
  };

  const updateAchievement = (achievement: AchievementDefinition) => {
    const updated = achievements.map(a => a.id === achievement.id ? achievement : a);
    setAchievements(updated);
    if (user) syncFirestoreAchievement(user.uid, achievement);
  };

  const markNotificationRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    const target = updated.find(n => n.id === id);
    if (user && target) syncFirestoreNotification(user.uid, target);
  };

  const dismissNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    if (user) deleteFirestoreNotification(user.uid, id);
  };

  const deleteLog = (logId: string) => {
    const targetLog = rewardLogs.find(l => l.id === logId);
    if (!targetLog) return;

    const isFreeGrace = isHabitLogGracePeriod(targetLog.timestamp);
    const wouldBeInDeficit = (stats.coinBalance - targetLog.rewardEarned) < 0;

    if (wouldBeInDeficit && !isFreeGrace) {
      // Deficit Retraction (Spent Coins Scenario): Apply 2% Karma Surcharge
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
      // Non-Deficit Delete: Cleanly remove log from history
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
      saveStoredSettings(updated);
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
        activityMappings,
        quests,
        bosses,
        achievements,
        notifications,
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
        updateActivityMapping,
        addQuest,
        updateQuest,
        archiveQuest,
        deleteQuest,
        addBoss,
        updateBoss,
        archiveBoss,

        updateAchievement,
        markNotificationRead,
        dismissNotification,
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
