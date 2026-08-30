import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HeroBanner } from '../components/HeroBanner';
import { CoinVault } from '../components/CoinVault';
import { HabitCard } from '../components/HabitCard';
import { HabitModal } from '../components/HabitModal';
import { StoreRewardCard } from '../components/StoreRewardCard';
import { CoinToken } from '../components/CoinToken';
import { LevelProgressBar } from '../components/LevelProgressBar';
import { CharacterStatsCard } from '../components/CharacterStatsCard';
import { QuestCard } from '../components/QuestCard';
import { BossCard } from '../components/BossCard';
import { toLocalDateString } from '../utils/dateUtils';
import { Zap, ArrowRight, ShoppingBag, History, Sword, Flame } from 'lucide-react';


export const Dashboard: React.FC = () => {
  const { 
    habits, 
    rewards, 
    rewardLogs, 
    quests, 
    bosses, 
    stats,
    setActiveTab, 
    setIsStreakDetailsModalOpen, 
    setIsStreakFreezeModalOpen 
  } = useApp();
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);

  const activeHabits = habits.filter(h => h.active).sort((a, b) => a.order - b.order);
  const featuredRewards = rewards.filter(r => r.active).slice(0, 3);
  const activeQuests = quests.filter(q => q.status === 'active');
  const activeBoss = bosses.find(b => b.status === 'active') || null;

  const todayStr = toLocalDateString(new Date());
  const todayLogs = rewardLogs.filter(l => toLocalDateString(l.timestamp) === todayStr);
  const habitTodayCounts = todayLogs.reduce((acc, log) => {
    acc[log.activityId] = (acc[log.activityId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentLogs = React.useMemo(() => {
    const freezeLogs: typeof rewardLogs = [];
    Object.entries(stats.habitStreakFreezeStates || {}).forEach(([habitId, state]) => {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;
      state.frozenDates.forEach(dateStr => {
        freezeLogs.push({
          id: `freeze-${habitId}-${dateStr}`,
          activityId: habitId,
          habitName: `Streak Repaired: ${habit.name}`,
          icon: '❄️',
          timestamp: `${dateStr}T23:59:59.000Z`,
          rewardEarned: 0,
          unit: 'freeze'
        });
      });
    });
    
    // Global App Freeze mapping
    if (stats.streakFreezeState?.frozenDates) {
      stats.streakFreezeState.frozenDates.forEach((dateStr: string) => {
        freezeLogs.push({
          id: `freeze-app-${dateStr}`,
          activityId: 'app',
          habitName: `App Streak Repaired`,
          icon: '❄️',
          timestamp: `${dateStr}T23:59:59.000Z`,
          rewardEarned: 0,
          unit: 'freeze'
        });
      });
    }

    return [...rewardLogs, ...freezeLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [rewardLogs, habits, stats.habitStreakFreezeStates, stats.streakFreezeState]);
  const freezeState = stats.streakFreezeState || {
    availableFreezes: 2,
    maxFreezes: 2,
    consecutiveDaysForRecovery: 3,
    consecutiveDaysCount: 0,
    frozenDates: []
  };

  return (
    <div className="space-y-8 pb-12">

      {/* Hero Banner */}
      <HeroBanner onOpenHabitModal={() => setIsHabitModalOpen(true)} />

      {/* Streak & Freeze Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-1">
        {/* Streak Pill Card */}
        <div 
          onClick={() => setIsStreakDetailsModalOpen(true)}
          className="glass-panel p-4 rounded-2xl border border-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-outfit text-xl font-extrabold text-amber-400">
                  {stats.currentStreak} Days
                </span>
                <span className="text-xs font-semibold text-slate-400">Streak</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Best: <span className="text-amber-300 font-bold">{stats.longestStreak}d</span> • Tap for calendar
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-400 opacity-70 group-hover:translate-x-1 transition-transform" />
        </div>

        {/* Streak Freeze Pill Card */}
        <div 
          onClick={() => setIsStreakFreezeModalOpen(true)}
          className="glass-panel p-4 rounded-2xl border border-sky-500/20 hover:border-sky-400/50 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
              ❄️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-outfit text-sm font-bold text-sky-400 dark:text-sky-300">
                  Streak Freeze
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 text-[10px] font-extrabold font-outfit">
                  {freezeState.availableFreezes}/{freezeState.maxFreezes} Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {freezeState.availableFreezes >= freezeState.maxFreezes
                  ? 'Max Capacity • Rest Day Shield'
                  : `${freezeState.consecutiveDaysCount}/${freezeState.consecutiveDaysForRecovery} active days to regain ❄️`}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-sky-400 opacity-70 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Level Progress */}
      <div className="px-1">
        <LevelProgressBar />
      </div>

      {/* Character Multi-Stat RPG Progression */}
      <div className="px-1">
        <CharacterStatsCard />
      </div>

      {/* Active Quests */}
      {activeQuests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sword className="w-5 h-5" style={{ color: 'var(--text-accent)' }} />
              <h2 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Active RPG Quests ({activeQuests.length})
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('adventure')}
              className="text-xs font-bold flex items-center gap-1 cursor-pointer hover:opacity-80"
              style={{ color: 'var(--text-accent)' }}
            >
              <span>Adventure Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeQuests.slice(0, 2).map(quest => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        </div>
      )}

      {/* World Boss Battle */}
      {activeBoss && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-red-400" />
              <h2 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                World Boss Battle
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('adventure')}
              className="text-xs font-bold flex items-center gap-1 cursor-pointer hover:opacity-80 text-red-400"
            >
              <span>Battle Arena</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <BossCard boss={activeBoss} />
        </div>
      )}

      {/* Coin Vault & Treasury */}
      <CoinVault />



      {/* Quick Log Habits Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5" style={{ color: 'var(--text-accent)' }} />
            <h2 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Quick Log Habits ({activeHabits.length})
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('habits')}
            className="text-xs font-bold flex items-center gap-1 cursor-pointer hover:opacity-80"
            style={{ color: 'var(--text-accent)' }}
          >
            <span>Manage Habits</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeHabits.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center space-y-3" style={{ color: 'var(--text-muted)' }}>
            <p>No active habits right now.</p>
            <button
              onClick={() => setIsHabitModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs cursor-pointer"
            >
              Add Your First Habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                todayCount={habitTodayCounts[habit.id] || 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Featured Reward Store Shelf */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5" style={{ color: 'var(--text-accent)' }} />
            <h2 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Featured Reward Store Shelf
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('store')}
            className="text-xs font-bold flex items-center gap-1 cursor-pointer hover:opacity-80"
            style={{ color: 'var(--text-accent)' }}
          >
            <span>View All ({rewards.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {featuredRewards.map((reward) => (
            <StoreRewardCard key={reward.id} reward={reward} />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-outfit text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <History className="w-5 h-5" style={{ color: 'var(--text-accent)' }} />
            <span>Recent Activity</span>
          </h3>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs font-semibold cursor-pointer hover:opacity-80"
            style={{ color: 'var(--text-accent)' }}
          >
            View Full History
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>
            No activity recorded yet. Tap a habit card above to earn your first coins!
          </p>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => {
              const dateObj = new Date(log.timestamp);
              const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-xl text-xs transition-colors"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{log.icon}</span>
                    <div>
                      <span className="font-bold text-sm block" style={{ color: 'var(--text-primary)' }}>{log.habitName}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{dateStr} at {timeStr}</span>
                    </div>
                  </div>
                  <span
                    className={`font-outfit font-extrabold text-sm px-2.5 py-1 rounded-lg ${log.unit === 'freeze' ? 'text-sky-400 bg-sky-500/10 border border-sky-400/20' : ''}`}
                    style={log.unit !== 'freeze' ? {
                      color: 'var(--text-accent)',
                      background: 'var(--pill-badge-bg)',
                      border: '1px solid var(--pill-badge-border)',
                    } : {}}
                  >
                    {log.unit === 'freeze' ? (
                      <span>Freeze Used</span>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <span>+{log.rewardEarned}</span>
                        <CoinToken size={14} />
                      </div>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <HabitModal isOpen={isHabitModalOpen} onClose={() => setIsHabitModalOpen(false)} />
    </div>
  );
};
