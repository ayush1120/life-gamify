import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { BarChart3, Flame, Award, TrendingUp, Sparkles, ShoppingBag } from 'lucide-react';
import { CoinToken } from '../components/CoinToken';

export const AnalyticsPage: React.FC = () => {
  const { stats, rewardLogs, settings } = useApp();

  const habitStats = useMemo(() => {
    const counts: Record<string, { name: string; icon: string; count: number; totalEarned: number }> = {};

    rewardLogs.forEach(log => {
      if (!counts[log.activityId]) {
        counts[log.activityId] = {
          name: log.habitName,
          icon: log.icon,
          count: 0,
          totalEarned: 0
        };
      }
      counts[log.activityId].count += 1;
      counts[log.activityId].totalEarned += log.rewardEarned;
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [rewardLogs]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-outfit text-3xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <BarChart3 className="w-6 h-6" style={{ color: 'var(--text-accent)' }} />
          <span>Analytics & Achievements</span>
        </h1>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Track long-term consistency, streaks, and coin earnings
        </p>
      </div>

      {/* Top Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Earned */}
        <div className="glass-panel rounded-3xl p-5 space-y-1" style={{ border: '1px solid var(--glass-border)' }}>
          <div className="flex items-center justify-between text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            <span>Total {settings.currencyName} Earned</span>
            <Sparkles className="w-4 h-4" style={{ color: 'var(--text-accent)' }} />
          </div>
          <p className="font-outfit text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {stats.totalCoinsEarned} <CoinToken size={20} />
          </p>
        </div>

        {/* Total Coins Spent */}
        <div className="glass-panel rounded-3xl p-5 space-y-1" style={{ border: '1px solid var(--glass-border)' }}>
          <div className="flex items-center justify-between text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            <span>Total Spent</span>
            <ShoppingBag className="w-4 h-4" style={{ color: 'var(--text-accent)' }} />
          </div>
          <p className="font-outfit text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--text-accent)' }}>
            {stats.totalCoinsSpent} <CoinToken size={16} />
          </p>
        </div>

        {/* Streak */}
        <div className="glass-panel rounded-3xl p-5 space-y-1" style={{ border: '1px solid var(--glass-border)' }}>
          <div className="flex items-center justify-between text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            <span>Current / Best Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="font-outfit text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {stats.currentStreak}d <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/ {stats.longestStreak}d</span>
          </p>
        </div>

        {/* Daily Average */}
        <div className="glass-panel rounded-3xl p-5 space-y-1" style={{ border: '1px solid var(--glass-border)' }}>
          <div className="flex items-center justify-between text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            <span>Avg {settings.currencyName}/Day</span>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--text-accent)' }} />
          </div>
          <p className="font-outfit text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {stats.averagePerDay}
          </p>
        </div>

      </div>

      {/* GitHub-style Heatmap */}
      <ActivityHeatmap />

      {/* Habit Completion Leaderboard */}
      <div className="glass-panel rounded-3xl p-6 space-y-4" style={{ border: '1px solid var(--glass-border)' }}>
        <h3 className="font-outfit text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Award className="w-5 h-5" style={{ color: 'var(--text-accent)' }} />
          <span>Most Rewarding Habits</span>
        </h3>

        {habitStats.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>
            No habits logged yet.
          </p>
        ) : (
          <div className="space-y-3">
            {habitStats.map((item, idx) => {
              const maxCount = habitStats[0].count || 1;
              const percent = Math.round((item.count / maxCount) * 100);

              return (
                <div key={item.name} className="space-y-1.5 p-3 rounded-2xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                  <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{item.icon}</span>
                      <span>#{idx + 1} {item.name}</span>
                    </div>
                    <div className="text-right">
                      <span style={{ color: 'var(--text-accent)' }}>{item.count} completions</span>
                      <span className="ml-2 font-normal flex items-center space-x-1" style={{ color: 'var(--text-muted)' }}>
                        <span>({item.totalEarned}</span>
                        <CoinToken size={14} />
                        <span>)</span>
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)' }}>
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
