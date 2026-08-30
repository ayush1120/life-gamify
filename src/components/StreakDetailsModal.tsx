import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { X, Flame, Shield, HelpCircle, ChevronRight } from 'lucide-react';
import { playSound } from '../services/sound';
import { getStreakCalendarData, evaluateHabitStreakAndFreezes } from '../utils/streakUtils';
import { getValidHabitLogs } from '../utils/habitAnalytics';

export const StreakDetailsModal: React.FC = () => {
  const { 
    isStreakDetailsModalOpen, 
    setIsStreakDetailsModalOpen, 
    setIsStreakFreezeModalOpen,
    setSelectedHabitForFreezeModal,
    stats, 
    habits, 
    rewardLogs, 
    settings 
  } = useApp();

  const freezeState = stats.streakFreezeState || {
    availableFreezes: 0,
    maxFreezes: 2,
    consecutiveDaysForRecovery: 3,
    consecutiveDaysCount: 0,
    frozenDates: [],
    pendingRepairDates: []
  };

  const calendarDays = useMemo(() => {
    return getStreakCalendarData(rewardLogs, freezeState.frozenDates, freezeState.pendingRepairDates || [], 28);
  }, [rewardLogs, freezeState.frozenDates, freezeState.pendingRepairDates]);

  // Compute streaks for individual active habits
  const habitStreaks = useMemo(() => {
    return habits
      .filter(h => h.active)
      .map(habit => {
        const validLogs = getValidHabitLogs(habit.id, rewardLogs);
        const hFreeze = stats.habitStreakFreezeStates?.[habit.id] || { availableFreezes: 0, maxFreezes: 2 };
        const evalResult = evaluateHabitStreakAndFreezes(habit, validLogs, hFreeze as any);
        const streak = evalResult.currentStreak;
        return {
          habit,
          streak,
          freezes: hFreeze.availableFreezes,
          maxFreezes: hFreeze.maxFreezes,
          logCount: validLogs.length
        };
      })
      .sort((a, b) => b.streak - a.streak);
  }, [habits, rewardLogs, stats.habitStreakFreezeStates]);

  if (!isStreakDetailsModalOpen) return null;

  const handleClose = () => {
    playSound.click(settings.soundEnabled);
    setIsStreakDetailsModalOpen(false);
  };

  const handleOpenFreezeInfo = () => {
    playSound.freezeChime(settings.soundEnabled);
    setIsStreakFreezeModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 text-white rounded-[32px] shadow-2xl border border-amber-500/30 overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          boxShadow: '0 25px 60px -15px rgba(245, 158, 11, 0.3)'
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            {/* Streak Freeze Pill Button */}
            <button
              onClick={handleOpenFreezeInfo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 hover:bg-sky-500/30 transition-all text-xs font-bold font-outfit cursor-pointer group"
              title="Streak Freeze Status"
            >
              <span className="text-base group-hover:scale-110 transition-transform">❄️</span>
              <span>{freezeState.availableFreezes}/{freezeState.maxFreezes}</span>
              <HelpCircle className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-6 py-4 space-y-6 no-scrollbar">
          {/* Big Streak Flame Banner */}
          <div className="text-center relative py-4">
            <div className="inline-flex items-center justify-center relative mb-2">
              <div className="absolute w-28 h-28 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative flex items-center justify-center">
                <Flame className="w-20 h-20 text-amber-500 fill-amber-500 animate-bounce" style={{ animationDuration: '2.5s' }} />
              </div>
            </div>
            
            <div className="font-outfit text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-orange-500 tracking-tight">
              {stats.currentStreak}
            </div>
            <p className="font-outfit text-sm sm:text-base font-bold uppercase tracking-widest text-amber-400/90 mt-1">
              Days Streak Active
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Personal Best: <span className="text-amber-300 font-bold">{stats.longestStreak} Days</span>
            </p>
          </div>

          {/* Streak Freeze Banner / Alert */}
          <div 
            onClick={handleOpenFreezeInfo}
            className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 to-blue-950/60 border border-sky-500/30 hover:border-sky-400/60 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                ❄️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-outfit font-bold text-sky-200 text-sm">
                    Streak Freeze Shield
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 text-[10px] font-bold">
                    {freezeState.availableFreezes} of {freezeState.maxFreezes} Ready
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {freezeState.availableFreezes > 0 
                    ? 'Protects your streak automatically if you miss a day.' 
                    : `${freezeState.consecutiveDaysCount}/${freezeState.consecutiveDaysForRecovery} active days to regain 1 freeze.`}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-sky-400 group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Calendar Heatmap Section */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-outfit text-sm font-bold text-slate-200 flex items-center gap-2">
                <span>Recent Streak Activity</span>
              </h3>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> Active
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-sky-400 inline-block" /> Frozen ❄️
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-700 inline-block" /> Missed
                </span>
              </div>
            </div>

            {/* 4-Week Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 pt-2 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div key={idx} className="text-[11px] font-bold text-slate-400 uppercase">
                  {day}
                </div>
              ))}
              {calendarDays.map((day) => {
                const isCompleted = day.status === 'completed';
                const isFrozen = day.status === 'frozen';
                const isTodayPending = day.status === 'today-pending';

                return (
                  <div
                    key={day.dateStr}
                    title={`${day.dateStr}: ${day.status}`}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all relative ${
                      isCompleted
                        ? 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-md shadow-amber-500/20'
                        : isFrozen
                        ? 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30'
                        : isTodayPending
                        ? 'bg-slate-800 text-amber-400 border border-dashed border-amber-400/50'
                        : 'bg-slate-800/60 text-slate-500'
                    }`}
                  >
                    <span>{day.dayNumber}</span>
                    {isFrozen && (
                      <span className="text-[9px] leading-none absolute -bottom-1 text-sky-200">❄️</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Habit-by-Habit Streak Breakdown */}
          <div className="space-y-3">
            <h3 className="font-outfit text-sm font-bold text-slate-200">
              Habit Streaks Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {habitStreaks.slice(0, 6).map(({ habit, streak, freezes, maxFreezes }) => (
                <div
                  key={habit.id}
                  onClick={() => {
                    setSelectedHabitForFreezeModal(habit);
                    setIsStreakFreezeModalOpen(true);
                  }}
                  className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-500/80 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="text-xl shrink-0">{habit.icon}</span>
                    <div className="truncate">
                      <p className="font-outfit text-xs font-bold text-white truncate">
                        {habit.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400">
                          {habit.category || 'Habit'}
                        </span>
                        <span className="text-[10px] text-sky-400 font-bold">
                          ❄️ {freezes}/{maxFreezes}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-outfit text-sm font-extrabold text-amber-400">
                      {streak}d
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800/60 flex items-center justify-between">
          <button
            onClick={handleOpenFreezeInfo}
            className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            <span>Streak Freeze Rules</span>
          </button>
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-outfit text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
