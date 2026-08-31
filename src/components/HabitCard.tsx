import React from 'react';
import { Habit } from '../types';
import { useApp } from '../context/AppContext';
import { CoinToken } from './CoinToken';
import { getPeriodProgress, getPeriodLabel } from '../utils/frequencyUtils';
import { getValidHabitLogs } from '../utils/habitAnalytics';
import { DEFAULT_STREAK_FREEZE_STATE, evaluateHabitStreakAndFreezes } from '../utils/streakUtils';
import { motion } from 'framer-motion';
import { PlusCircle, Check, Star, Flame, Sparkles } from 'lucide-react';
import { playSound } from '../services/sound';

interface HabitCardProps {
  habit: Habit;
  todayCount?: number;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit }) => {
  const { 
    logHabit, 
    rewardLogs, 
    toggleQuickHabit, 
    setActiveTab, 
    stats, 
    settings,
    setSelectedHabitForFreezeModal, 
    setIsStreakFreezeModalOpen,
    repairHabitStreak
  } = useApp();

  const progress = getPeriodProgress(habit, rewardLogs);
  const isMaxReached = progress.isComplete;

  const validLogs = getValidHabitLogs(habit.id, rewardLogs);
  const habitFreezeState = stats.habitStreakFreezeStates?.[habit.id] || DEFAULT_STREAK_FREEZE_STATE;
  const habitStreak = evaluateHabitStreakAndFreezes(habit, validLogs, habitFreezeState).currentStreak;
  const pendingRepairs = habitFreezeState.pendingRepairDates || [];
  const canRepair = pendingRepairs.length > 0 && habitFreezeState.availableFreezes > 0;
  const primaryPendingRepair = pendingRepairs[0];

  const handleOpenFreezeModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound.freezeChime(settings.soundEnabled);
    setSelectedHabitForFreezeModal(habit);
    setIsStreakFreezeModalOpen(true);
  };

  const handleRepairClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (primaryPendingRepair) {
      repairHabitStreak(habit.id, primaryPendingRepair.dateStr);
    }
  };

  return (
    <motion.div
      whileHover={{ y: isMaxReached ? 0 : -3, scale: isMaxReached ? 1 : 1.01 }}
      whileTap={{ scale: 0.97 }}
      className={`group relative glass-panel glass-panel-hover rounded-2xl flex flex-col justify-between select-none overflow-hidden transition-all ${
        isMaxReached ? 'opacity-85 ring-1 ring-emerald-500/50' : ''
      }`}
      style={{
        backgroundColor: isMaxReached
          ? `color-mix(in srgb, #10b981 8%, var(--glass-bg))`
          : `color-mix(in srgb, ${habit.color || '#f59e0b'} 4%, var(--glass-bg))`,
      }}
    >
      {/* Clickable Card Body Area */}
      <div 
        onClick={() => setActiveTab(`habits/${habit.id}`)}
        className="p-3 sm:p-4 flex-1 cursor-pointer flex flex-col justify-center"
      >
        {/* Left Colour Accent Bar */}
        <div
          className="absolute top-0 left-0 w-[3px] h-full"
          style={{ backgroundColor: isMaxReached ? '#10b981' : (habit.color || '#f59e0b') }}
        />

        <div className="flex items-start justify-between space-x-3 pl-2">
          <div className="flex items-center space-x-3">
            {/* Icon Badge */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl relative shrink-0"
              style={{ backgroundColor: `${isMaxReached ? '#10b981' : habit.color}20`, border: `1px solid ${isMaxReached ? '#10b981' : habit.color}30` }}
            >
              {habit.icon}
              {isMaxReached && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-extrabold shadow-sm">
                  ✓
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-outfit text-[15px] font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                  {habit.name}
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    toggleQuickHabit(habit.id);
                  }}
                  className="p-1 rounded-full hover:bg-amber-500/20 cursor-pointer relative z-10"
                  title={habit.isQuickHabit ? "Unmark Quick Habit" : "Mark as Quick Habit"}
                >
                  <Star className={`w-3.5 h-3.5 ${habit.isQuickHabit ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
                </button>
              </div>

              {habit.description && (
                <p className="text-xs line-clamp-1 mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                  {habit.description}
                </p>
              )}

              {/* Frequency, Category & Streak Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] font-bold">
                <span className="px-2 py-0.5 rounded-full capitalize bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {habit.frequency || 'daily'}
                </span>
                
                {/* Habit Streak Badge */}
                {habitStreak > 0 && (
                  <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                    <Flame className="w-3 h-3 fill-orange-400" />
                    <span>{habitStreak}d</span>
                  </span>
                )}

                {/* Per-Habit Freeze Pill */}
                <button
                  type="button"
                  onClick={handleOpenFreezeModal}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-400/30 hover:bg-sky-500/25 transition-colors cursor-pointer"
                  title={`Streak Freeze: ${habitFreezeState.availableFreezes}/${habitFreezeState.maxFreezes} (Click for freeze rules)`}
                >
                  <span className="text-[10px]">❄️</span>
                  <span>{habitFreezeState.availableFreezes}/{habitFreezeState.maxFreezes}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reward Pill & Period Progress */}
          <div className="flex flex-col items-end space-y-1 shrink-0 relative z-10">
            <span
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-extrabold font-outfit transition-colors"
              style={{
                background: 'var(--pill-badge-bg)',
                border: '1px solid var(--pill-badge-border)',
                color: 'var(--pill-badge-text)',
              }}
            >
              <span>+{habit.rewardValue}</span>
              <CoinToken size={16} />
            </span>

            <span className={`text-[10px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-colors ${
              isMaxReached
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : progress.count > 0
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-zinc-400'
            }`}>
              {progress.count > 0 && <Check className="w-3 h-3" />}
              {progress.max === 0 ? `${progress.count}x (Unlimited)` : `${progress.count}/${progress.max} ${getPeriodLabel(habit.frequency || 'daily')}`}
            </span>
          </div>
        </div>

        {/* 2-Day Streak Repair Notice Banner */}
        {canRepair && (
          <div className="mt-3 mx-2 p-2 rounded-xl bg-gradient-to-r from-sky-950/80 to-blue-950/80 border border-sky-400/50 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-1.5 text-xs text-sky-300 font-bold font-outfit">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Missed {primaryPendingRepair.dateStr}! ({primaryPendingRepair.daysRemaining}d left to repair)</span>
            </div>
            <button
              onClick={handleRepairClick}
              className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-[11px] font-extrabold font-outfit shadow-sm cursor-pointer transition-all hover:scale-105"
            >
              Repair ❄️
            </button>
          </div>
        )}
      </div>

      {/* Footer Progress / Log Action (Sibling, not nested) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          logHabit(habit.id, e);
        }}
        disabled={isMaxReached}
        className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 flex items-center justify-between text-xs font-bold transition-colors w-full cursor-pointer disabled:cursor-not-allowed border-t relative z-10"
        style={{ borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }}
      >
        <span className={`flex items-center space-x-1 pl-2 ${isMaxReached ? 'text-emerald-400' : 'group-hover:text-amber-500'} transition-colors`}>
          <PlusCircle className={`w-3.5 h-3.5 ${isMaxReached ? 'text-emerald-400' : 'text-amber-500 group-hover:rotate-90'} transition-transform duration-300`} />
          <span>{isMaxReached ? `Completed ${getPeriodLabel(habit.frequency || 'daily')}` : 'Tap to Earn'}</span>
        </span>
        <span className="text-[11px] font-mono pr-2 shrink-0">{progress.max === 0 ? 'Unlimited' : `${progress.max}x/${habit.frequency || 'daily'}`}</span>
      </button>
    </motion.div>
  );
};
