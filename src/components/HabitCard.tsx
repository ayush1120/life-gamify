import React from 'react';
import { Habit } from '../types';
import { useApp } from '../context/AppContext';
import { CoinToken } from './CoinToken';
import { getPeriodProgress, getPeriodLabel } from '../utils/frequencyUtils';
import { motion } from 'framer-motion';
import { PlusCircle, Check, Star } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  todayCount?: number;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit }) => {
  const { logHabit, rewardLogs, toggleQuickHabit, setActiveTab } = useApp();
  const progress = getPeriodProgress(habit, rewardLogs);
  const isMaxReached = progress.isComplete;

  return (
    <motion.div
      whileHover={{ y: isMaxReached ? 0 : -3, scale: isMaxReached ? 1 : 1.01 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => setActiveTab(`habits/${habit.id}`)}
      className={`group relative glass-panel glass-panel-hover rounded-2xl p-3 sm:p-4 cursor-pointer flex flex-col justify-between select-none overflow-hidden transition-all ${
        isMaxReached ? 'opacity-85 ring-1 ring-emerald-500/50' : ''
      }`}
      style={{
        backgroundColor: isMaxReached
          ? `color-mix(in srgb, #10b981 8%, var(--glass-bg))`
          : `color-mix(in srgb, ${habit.color || '#f59e0b'} 4%, var(--glass-bg))`,
      }}
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
                  toggleQuickHabit(habit.id);
                }}
                className="p-1 rounded-full hover:bg-amber-500/20 cursor-pointer"
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

            {/* Frequency & Category Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded-full capitalize bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {habit.frequency || 'daily'}
              </span>
              {habit.category && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {habit.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Reward Pill & Period Progress */}
        <div className="flex flex-col items-end space-y-1 shrink-0">
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

      {/* Footer Progress / Log Action */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          logHabit(habit.id, e);
        }}
        disabled={isMaxReached}
        className={`mt-3 pt-3 flex items-center justify-between pl-2 text-xs font-bold transition-colors w-full cursor-pointer disabled:cursor-not-allowed`}
        style={{ borderTop: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}
      >
        <span className={`flex items-center space-x-1 ${isMaxReached ? 'text-emerald-400' : 'group-hover:text-amber-500'} transition-colors`}>
          <PlusCircle className={`w-3.5 h-3.5 ${isMaxReached ? 'text-emerald-400' : 'text-amber-500 group-hover:rotate-90'} transition-transform duration-300`} />
          <span>{isMaxReached ? `Completed ${getPeriodLabel(habit.frequency || 'daily')}` : 'Tap to Earn'}</span>
        </span>
        <span className="text-[11px] font-mono pr-2">{progress.max === 0 ? 'Unlimited' : `${progress.max}x/${habit.frequency || 'daily'}`}</span>
      </button>
    </motion.div>
  );
};
