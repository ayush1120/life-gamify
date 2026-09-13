import React, { useState, useMemo, useCallback } from 'react';
import { Habit, RewardLog, StreakFreezeState } from '../types';
import { 
  buildUnifiedMonthCalendar, 
  getPreviousMonth, 
  getNextMonth, 
  UnifiedCalendarDay
} from '../utils/calendarStreakEngine';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Trophy, 
  RotateCcw, 
  Coins, 
  Calendar as CalendarIcon,
  CheckCircle2,
  X
} from 'lucide-react';
import { playSound } from '../services/sound';
import { useApp } from '../context/AppContext';

export interface UnifiedActivityCalendarProps {
  mode: 'global' | 'habit';
  habit?: Habit;
  rewardLogs: RewardLog[];
  streakFreezeState?: StreakFreezeState;
  currentStreak: number;
  longestStreak: number;
  accentColor?: string;
  className?: string;
  showStatsHeader?: boolean;
}

export const UnifiedActivityCalendar: React.FC<UnifiedActivityCalendarProps> = ({
  mode,
  habit,
  rewardLogs,
  streakFreezeState,
  currentStreak,
  longestStreak,
  accentColor,
  className = '',
  showStatsHeader = true
}) => {
  const { settings } = useApp();
  const now = useMemo(() => new Date(), []);
  
  // Navigation state for month & year
  const [navYear, setNavYear] = useState<number>(now.getFullYear());
  const [navMonth, setNavMonth] = useState<number>(now.getMonth());
  
  // Selected day for inspection
  const [selectedDay, setSelectedDay] = useState<UnifiedCalendarDay | null>(null);

  const themeColor = accentColor || habit?.color || '#f59e0b'; // Amber default

  // Build calendar month data using the centralized engine
  const calendarData = useMemo(() => {
    return buildUnifiedMonthCalendar(navYear, navMonth, {
      mode,
      habit,
      rewardLogs,
      streakFreezeState,
      targetDate: now
    });
  }, [navYear, navMonth, mode, habit, rewardLogs, streakFreezeState, now]);

  const isCurrentMonthView = calendarData.isCurrentMonth;

  const handlePrevMonth = useCallback(() => {
    playSound.click(settings.soundEnabled);
    const prev = getPreviousMonth(navYear, navMonth);
    setNavYear(prev.year);
    setNavMonth(prev.month);
    setSelectedDay(null);
  }, [navYear, navMonth, settings.soundEnabled]);

  const handleNextMonth = useCallback(() => {
    playSound.click(settings.soundEnabled);
    const next = getNextMonth(navYear, navMonth);
    setNavYear(next.year);
    setNavMonth(next.month);
    setSelectedDay(null);
  }, [navYear, navMonth, settings.soundEnabled]);

  const handleJumpToCurrent = useCallback(() => {
    playSound.click(settings.soundEnabled);
    setNavYear(now.getFullYear());
    setNavMonth(now.getMonth());
    setSelectedDay(null);
  }, [now, settings.soundEnabled]);

  const handleDayClick = (day: UnifiedCalendarDay) => {
    if (day.isPadding || day.isFuture) return;
    playSound.click(settings.soundEnabled);
    if (selectedDay?.dateStr === day.dateStr) {
      setSelectedDay(null);
    } else {
      setSelectedDay(day);
    }
  };

  const getDayStatusStyle = (day: UnifiedCalendarDay) => {
    if (day.isPadding) {
      return 'opacity-25 pointer-events-none text-[var(--text-muted)] bg-transparent';
    }
    if (day.isFuture) {
      return 'opacity-35 text-[var(--text-muted)] bg-[var(--glass-bg)] border border-[var(--glass-border)] cursor-default';
    }

    const isSelected = selectedDay?.dateStr === day.dateStr;
    const selectedRing = isSelected ? 'ring-2 ring-[var(--text-primary)] scale-105 z-10 shadow-lg' : '';

    switch (day.status) {
      case 'completed':
        return `text-white shadow-md font-extrabold cursor-pointer transition-transform hover:scale-105 ${selectedRing}`;
      case 'frozen':
        return `bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30 font-extrabold cursor-pointer transition-transform hover:scale-105 ${selectedRing}`;
      case 'repair-available':
        return `bg-amber-500/15 border border-amber-400 text-amber-300 animate-pulse font-bold cursor-pointer transition-transform hover:scale-105 ${selectedRing}`;
      case 'today-pending':
        return `bg-[var(--glass-bg)] text-amber-400 border-2 border-dashed border-amber-400/70 font-bold cursor-pointer transition-transform hover:scale-105 ${selectedRing}`;
      case 'missed':
      default:
        return `bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:brightness-95 cursor-pointer transition-transform hover:scale-105 ${selectedRing}`;
    }
  };

  return (
    <div className={`glass-panel p-5 sm:p-6 rounded-3xl border border-[var(--glass-border)] space-y-4 select-none ${className}`}>
      {/* 1. Context Stats Header */}
      {showStatsHeader && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pb-2">
          {/* Current Streak */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Flame className="w-4 h-4 fill-amber-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block truncate">
                {mode === 'habit' ? 'Habit Streak' : 'Daily Streak'}
              </span>
              <span className="text-base sm:text-lg font-extrabold font-outfit text-[var(--text-primary)]">
                {currentStreak}d
              </span>
            </div>
          </div>

          {/* Longest Streak */}
          <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-300 block truncate">
                Best Streak
              </span>
              <span className="text-base sm:text-lg font-extrabold font-outfit text-[var(--text-primary)]">
                {longestStreak}d
              </span>
            </div>
          </div>

          {/* Month Activity */}
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block truncate">
                Active Days
              </span>
              <span className="text-base sm:text-lg font-extrabold font-outfit text-[var(--text-primary)]">
                {calendarData.stats.activeDays}/{calendarData.stats.daysElapsed || calendarData.stats.totalDaysInMonth}
              </span>
            </div>
          </div>

          {/* Month Rate / Coins */}
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              {mode === 'habit' ? <CheckCircle2 className="w-4 h-4" /> : <Coins className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block truncate">
                {mode === 'habit' ? 'Consistency' : 'Month Earned'}
              </span>
              <span className="text-base sm:text-lg font-extrabold font-outfit text-[var(--text-primary)]">
                {mode === 'habit' ? `${calendarData.stats.completionRate}%` : `+${calendarData.stats.totalCoinsEarned}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Month Navigation Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            aria-label="Previous Month"
            className="w-8 h-8 rounded-xl bg-[var(--glass-bg)] hover:brightness-95 text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer border border-[var(--glass-border)] active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <h3 className="font-outfit font-extrabold text-base sm:text-lg text-[var(--text-primary)] tracking-wide">
            {calendarData.monthLabel}
          </h3>

          <button
            onClick={handleNextMonth}
            aria-label="Next Month"
            className="w-8 h-8 rounded-xl bg-[var(--glass-bg)] hover:brightness-95 text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer border border-[var(--glass-border)] active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick jump to current month */}
        {!isCurrentMonthView && (
          <button
            onClick={handleJumpToCurrent}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer font-outfit"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Today</span>
          </button>
        )}
      </div>

      {/* 3. Weekday Labels */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center pt-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
          <div key={i} className="text-[10px] sm:text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* 4. Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {calendarData.days.map((day, idx) => {
          const statusClass = getDayStatusStyle(day);
          const isCustomColored = day.status === 'completed' && !day.isPadding;

          return (
            <div
              key={`${day.dateStr}-${idx}`}
              onClick={() => handleDayClick(day)}
              className={`aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center relative text-xs sm:text-sm font-outfit select-none ${statusClass}`}
              style={isCustomColored ? {
                background: `linear-gradient(135deg, ${themeColor}, color-mix(in srgb, ${themeColor} 70%, #000))`,
                boxShadow: `0 4px 12px color-mix(in srgb, ${themeColor} 30%, transparent)`
              } : undefined}
            >
              {/* Day Number */}
              <span>{day.dayNumber}</span>

              {/* Status Micro-Badges */}
              {day.status === 'frozen' && (
                <span className="text-[9px] leading-none absolute bottom-1">❄️</span>
              )}

              {day.status === 'completed' && (
                <span className="text-[8px] leading-none absolute bottom-1 opacity-90">
                  {mode === 'habit' && habit?.icon ? habit.icon : (day.completionsCount > 1 ? `•${day.completionsCount}` : '✓')}
                </span>
              )}

              {day.status === 'today-pending' && (
                <span className="w-1 h-1 rounded-full bg-amber-400 absolute bottom-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* 5. Interactive Day Detail Card */}
      {selectedDay && (
        <div className="p-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-outfit font-extrabold text-sm text-[var(--text-primary)]">
                {selectedDay.date.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span 
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                  selectedDay.status === 'completed' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : selectedDay.status === 'frozen'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : selectedDay.status === 'today-pending'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-[var(--glass-bg)] text-[var(--text-primary)] border border-[var(--glass-border)]'
                }`}
              >
                {selectedDay.status.replace('-', ' ')}
              </span>
            </div>

            <button
              onClick={() => setSelectedDay(null)}
              className="w-6 h-6 rounded-full hover:brightness-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Logs List */}
          {selectedDay.logs.length > 0 ? (
            <div className="space-y-1.5 pt-1 max-h-32 overflow-y-auto no-scrollbar">
              {selectedDay.logs.map(log => (
                <div 
                  key={log.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span>{log.icon || '✓'}</span>
                    <span className="font-semibold text-[var(--text-primary)]">{log.habitName}</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="font-bold font-outfit text-emerald-400">
                    +{log.rewardEarned} coins
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-secondary)] pt-1">
              {selectedDay.status === 'frozen'
                ? '❄️ Streak freeze was active to protect your streak on this day.'
                : selectedDay.status === 'today-pending'
                ? 'Complete your habits today to keep your streak burning!'
                : 'No completions recorded on this day.'}
            </p>
          )}
        </div>
      )}

      {/* 6. Visual Legend */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 text-[10px] sm:text-[11px] text-[var(--text-secondary)] border-t border-[var(--glass-border)]">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span 
              className="w-2.5 h-2.5 rounded-md inline-block shadow-sm"
              style={{ backgroundColor: themeColor }}
            /> 
            Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-sky-400 inline-block" /> 
            Frozen ❄️
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)] inline-block" /> 
            Missed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md border-2 border-dashed border-amber-400 inline-block" /> 
            Today
          </span>
        </div>

        <span className="text-[10px] text-[var(--text-muted)] italic">
          Tap any day to inspect
        </span>
      </div>
    </div>
  );
};
