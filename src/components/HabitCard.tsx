import React from 'react';
import { Habit } from '../types';
import { useApp } from '../context/AppContext';
import { CoinToken } from './CoinToken';
import { motion } from 'framer-motion';
import { PlusCircle, Check } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  todayCount?: number;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, todayCount = 0 }) => {
  const { logHabit } = useApp();
  const maxPerDay = habit.maxPerDay !== undefined ? habit.maxPerDay : 1;
  const isMaxReached = maxPerDay > 0 && todayCount >= maxPerDay;

  return (
    <motion.div
      whileHover={{ y: isMaxReached ? 0 : -3, scale: isMaxReached ? 1 : 1.01 }}
      whileTap={{ scale: 0.97 }}
      onClick={(e) => logHabit(habit.id, e)}
      className={`group relative glass-panel glass-panel-hover rounded-xl p-5 cursor-pointer flex flex-col justify-between select-none overflow-hidden transition-all ${
        isMaxReached ? 'opacity-85 ring-1 ring-emerald-500/50' : ''
      }`}
      style={{
        /* Subtle per-card colour tint */
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
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl relative"
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
            <h3 className="font-outfit text-[15px] font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
              {habit.name}
            </h3>
            {habit.description && (
              <p className="text-xs line-clamp-1 mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                {habit.description}
              </p>
            )}
          </div>
        </div>

        {/* Reward Pill & Today Progress */}
        <div className="flex flex-col items-end space-y-1">
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
              : todayCount > 0
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-zinc-400'
          }`}>
            {todayCount > 0 && <Check className="w-3 h-3" />}
            {maxPerDay === 0 ? `${todayCount}x today (Unlimited)` : `${todayCount}/${maxPerDay} today`}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        className="mt-4 pt-3 flex items-center justify-between pl-2 text-xs font-bold transition-colors"
        style={{ borderTop: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}
      >
        <span className={`flex items-center space-x-1 ${isMaxReached ? 'text-emerald-400' : 'group-hover:text-amber-500'} transition-colors`}>
          <PlusCircle className={`w-3.5 h-3.5 ${isMaxReached ? 'text-emerald-400' : 'text-amber-500 group-hover:rotate-90'} transition-transform duration-300`} />
          <span>{isMaxReached ? 'Goal Reached Today' : 'Tap to Earn'}</span>
        </span>
        <span className="text-[11px] font-mono">{maxPerDay === 0 ? 'Unlimited' : `${maxPerDay}x/day`}</span>
      </div>
    </motion.div>
  );
};
