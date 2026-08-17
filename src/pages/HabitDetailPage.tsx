import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Target, Flame, Trophy, Calendar, Coins, Compass } from 'lucide-react';
import { getPeriodProgress, getPeriodLabel } from '../utils/frequencyUtils';
import { 
  getValidHabitLogs, 
  getHabitLifetimeStats, 
  getHabitCurrentStreak, 
  getHabitLongestStreak,
  getHabitTimeline
} from '../utils/habitAnalytics';
import { STAT_DEFINITIONS, getDefaultHabitMapping } from '../utils/progressionUtils';

interface HabitDetailPageProps {
  habitId: string;
}

export const HabitDetailPage: React.FC<HabitDetailPageProps> = ({ habitId }) => {
  const { habits, rewardLogs, rewards, logHabit, stats, setActiveTab, settings, activityMappings } = useApp();


  const habit = useMemo(() => habits.find(h => h.id === habitId), [habits, habitId]);

  const validLogs = useMemo(() => habit ? getValidHabitLogs(habit.id, rewardLogs) : [], [habit, rewardLogs]);
  const progress = useMemo(() => habit ? getPeriodProgress(habit, rewardLogs) : { count: 0, max: 1, percentage: 0, isComplete: false }, [habit, rewardLogs]);
  const lifetimeStats = useMemo(() => getHabitLifetimeStats(validLogs), [validLogs]);
  const currentStreak = useMemo(() => habit ? getHabitCurrentStreak(habit, validLogs) : 0, [habit, validLogs]);
  const bestStreak = useMemo(() => habit ? getHabitLongestStreak(habit, validLogs) : 0, [habit, validLogs]);
  const timelineLogs = useMemo(() => getHabitTimeline(validLogs, 5), [validLogs]);
  
  // Reward Compass
  const activeRewards = useMemo(() => rewards.filter(r => r.active).sort((a, b) => a.cost - b.cost), [rewards]);
  const nearestAffordable = activeRewards.find(r => r.cost <= stats.coinBalance);
  const lowestGap = activeRewards.find(r => r.cost > stats.coinBalance);
  const compassReward = nearestAffordable || lowestGap;

  if (!habit) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
          <Target className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-outfit" style={{ color: 'var(--text-primary)' }}>Habit Not Found</h2>
          <p style={{ color: 'var(--text-secondary)' }}>This habit may have been deleted or the link is invalid.</p>
        </div>
        <button
          onClick={() => setActiveTab('habits')}
          className="px-6 py-3 rounded-xl bg-amber-500/10 text-amber-500 font-bold hover:bg-amber-500/20 transition-colors"
        >
          Back to Habits
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-full hover:bg-amber-500/10 transition-colors text-amber-500"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-extrabold font-outfit" style={{ color: 'var(--text-primary)' }}>
          Habit Details
        </h1>
      </div>

      {/* Hero Section */}
      <div className="glass-panel p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row gap-6 relative overflow-hidden"
           style={{ borderColor: habit.color ? `${habit.color}40` : 'var(--glass-border)' }}>
        
        {/* Decorative background glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 blur-3xl opacity-20" style={{ backgroundColor: habit.color || '#f59e0b' }} />

        <div className="flex-shrink-0 w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-inner z-10"
             style={{ backgroundColor: `${habit.color || '#f59e0b'}20`, border: `1px solid ${habit.color || '#f59e0b'}40` }}>
          {habit.icon}
        </div>

        <div className="flex-1 space-y-3 z-10">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h2 className="text-2xl font-bold font-outfit" style={{ color: 'var(--text-primary)' }}>{habit.name}</h2>
              {!habit.active && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                  Paused
                </span>
              )}
            </div>
            {habit.description && (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {habit.description}
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{habit.frequency === 'daily' ? 'Daily' : habit.frequency === 'weekly' ? 'Weekly' : 'Monthly'}</span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center space-x-1">
              <Coins className="w-3.5 h-3.5" />
              <span>+{habit.rewardValue} {settings.currencySymbol} (+{habit.rewardValue * 5} XP)</span>
            </span>
            {habit.category && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                {habit.category}
              </span>
            )}
            {habit.tags?.map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                #{tag}
              </span>
            ))}
          </div>

          {/* RPG Stat Attribution */}
          <div className="pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400/80 mb-1.5 flex items-center gap-1">
              <span>RPG Stat Growth</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const mapping = activityMappings[habit.id] || getDefaultHabitMapping(habit);
                const totalLogXp = habit.rewardValue * 5;
                return mapping.stats.map(sw => {
                  const def = STAT_DEFINITIONS[sw.stat];
                  const earnedXp = Math.round(totalLogXp * sw.weight);
                  return (
                    <div
                      key={sw.stat}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                      style={{
                        background: `${def.color}15`,
                        border: `1px solid ${def.color}35`,
                        color: def.color
                      }}
                    >
                      <span>{def.icon}</span>
                      <span>{def.name} {Math.round(sw.weight * 100)}%</span>
                      <span className="opacity-80 text-[10px]">({earnedXp} XP)</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>


      {/* Action & Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 shadow-lg flex flex-col justify-center items-center text-center space-y-4">
          <h3 className="font-outfit font-bold" style={{ color: 'var(--text-secondary)' }}>Log Completion</h3>
          
          <button
            onClick={(e) => logHabit(habit.id, e)}
            disabled={!habit.active || progress.isComplete}
            className={`
              w-full py-4 rounded-2xl font-outfit font-extrabold text-lg flex items-center justify-center space-x-2 shadow-lg transition-all
              ${!habit.active ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' : 
                progress.isComplete ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 cursor-not-allowed' :
                'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 hover:shadow-amber-500/25 active:scale-[0.98]'
              }
            `}
          >
            {progress.isComplete ? (
              <>
                <Target className="w-5 h-5" />
                <span>Period Complete</span>
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                <span>Log +{habit.rewardValue}</span>
              </>
            )}
          </button>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-[var(--glass-border)] shadow-lg space-y-4">
          <div className="flex justify-between items-end mb-2">
            <h3 className="font-outfit font-bold" style={{ color: 'var(--text-primary)' }}>
              {getPeriodLabel(habit.frequency || 'daily')} Progress
            </h3>
            <span className="text-sm font-bold" style={{ color: 'var(--text-accent)' }}>
              {progress.count} / {progress.max === 0 ? '∞' : progress.max}
            </span>
          </div>

          <div className="relative w-full h-4 rounded-full overflow-hidden bg-black/20 inset-shadow">
            <div 
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${progress.percentage}%`,
                backgroundColor: habit.color || '#f59e0b',
                boxShadow: `0 0 10px ${habit.color || '#f59e0b'}80`
              }}
            />
          </div>
          
          <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            <span>0%</span>
            <span>{progress.percentage}%</span>
          </div>
        </div>
      </div>

      {/* Derived Momentum */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-[var(--glass-border)] text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2">
            <Flame className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Current Streak</p>
          <p className="text-2xl font-extrabold font-outfit" style={{ color: 'var(--text-primary)' }}>{currentStreak}</p>
        </div>
        
        <div className="glass-panel p-5 rounded-3xl border border-[var(--glass-border)] text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 mb-2">
            <Trophy className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Best Streak</p>
          <p className="text-2xl font-extrabold font-outfit" style={{ color: 'var(--text-primary)' }}>{bestStreak}</p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-[var(--glass-border)] text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2">
            <Target className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Completions</p>
          <p className="text-2xl font-extrabold font-outfit" style={{ color: 'var(--text-primary)' }}>{lifetimeStats.completionCount}</p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-[var(--glass-border)] text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
            <Coins className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Lifetime Earned</p>
          <p className="text-2xl font-extrabold font-outfit" style={{ color: 'var(--text-primary)' }}>{lifetimeStats.lifetimeCoins}</p>
        </div>
      </div>

      {/* Quest Trail & Reward Compass grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quest Trail */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-[var(--glass-border)]">
          <h3 className="text-lg font-bold font-outfit mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
          
          {timelineLogs.length === 0 ? (
            <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
              <p>No completions recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timelineLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-2xl bg-black/10 border border-white/5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-lg">
                      {log.icon}
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{log.habitName}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="font-bold text-emerald-400">
                    +{log.rewardEarned}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reward Compass */}
        {compassReward && (
          <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent flex flex-col items-center text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-amber-500 mb-2">
              <Compass className="w-5 h-5" />
              <h3 className="font-outfit font-bold">Reward Compass</h3>
            </div>
            
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl overflow-hidden shadow-inner">
              {compassReward.image ? (
                <img src={compassReward.image} alt={compassReward.name} className="w-full h-full object-cover" />
              ) : (
                <span>{compassReward.icon || '🎁'}</span>
              )}
            </div>
            
            <div>
              <p className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>{compassReward.name}</p>
              <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
                Cost: {compassReward.cost} {settings.currencySymbol}
              </p>
            </div>

            {stats.coinBalance >= compassReward.cost ? (
              <div className="w-full py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-bold border border-emerald-500/30">
                Ready to Claim!
              </div>
            ) : (
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                  <span className="text-amber-500">{stats.coinBalance} / {compassReward.cost}</span>
                </div>
                <div className="relative w-full h-2 rounded-full overflow-hidden bg-black/20">
                  <div 
                    className="absolute top-0 left-0 h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((stats.coinBalance / compassReward.cost) * 100))}%` }}
                  />
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Just {compassReward.cost - stats.coinBalance} more coins!
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
