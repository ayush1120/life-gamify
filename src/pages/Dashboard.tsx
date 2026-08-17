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
import { toLocalDateString } from '../utils/dateUtils';
import { Zap, ArrowRight, ShoppingBag, History } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { habits, rewards, rewardLogs, setActiveTab } = useApp();
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);

  const activeHabits = habits.filter(h => h.active).sort((a, b) => a.order - b.order);
  const featuredRewards = rewards.filter(r => r.active).slice(0, 3);

  const todayStr = toLocalDateString(new Date());
  const todayLogs = rewardLogs.filter(l => toLocalDateString(l.timestamp) === todayStr);
  const habitTodayCounts = todayLogs.reduce((acc, log) => {
    acc[log.activityId] = (acc[log.activityId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentLogs = rewardLogs.slice(0, 5);

  return (
    <div className="space-y-8 pb-12">

      {/* Hero Banner */}
      <HeroBanner onOpenHabitModal={() => setIsHabitModalOpen(true)} />

      {/* Level Progress */}
      <div className="px-1">
        <LevelProgressBar />
      </div>

      {/* Character Multi-Stat RPG Progression */}
      <div className="px-1">
        <CharacterStatsCard />
      </div>

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
                    className="font-outfit font-extrabold text-sm px-2.5 py-1 rounded-lg"
                    style={{
                      color: 'var(--text-accent)',
                      background: 'var(--pill-badge-bg)',
                      border: '1px solid var(--pill-badge-border)',
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>+{log.rewardEarned}</span>
                      <CoinToken size={14} />
                    </div>
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
