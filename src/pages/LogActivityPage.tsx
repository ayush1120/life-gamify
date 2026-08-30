import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { HabitFrequency } from '../types';
import { CoinToken } from '../components/CoinToken';
import { isHabitDueInPeriod, getPeriodProgress, getPeriodLabel } from '../utils/frequencyUtils';
import { Zap, Search, Star, CheckCircle2, Filter, Sparkles, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRESET_TAGS = ['All', '⭐️ Quick Habits', 'Work', 'Health', 'Career', 'Music', 'Fitness', 'Learning', 'Personal'];

export const LogActivityPage: React.FC = () => {
  const { habits, rewardLogs, logHabit, toggleQuickHabit, settings, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedFrequency, setSelectedFrequency] = useState<'all' | HabitFrequency>('all');

  const activeHabits = useMemo(() => habits.filter(h => h.active), [habits]);

  // Extract all unique custom tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    activeHabits.forEach(h => {
      if (h.category) tagsSet.add(h.category);
      if (h.tags) h.tags.forEach(t => tagsSet.add(t));
    });
    const custom = Array.from(tagsSet).filter(t => !PRESET_TAGS.includes(t));
    return [...PRESET_TAGS, ...custom];
  }, [activeHabits]);

  // Quick Habits (Favorites)
  const quickHabits = useMemo(() => {
    return activeHabits.filter(h => h.isQuickHabit);
  }, [activeHabits]);

  // Filtered Habits based on Search, Tag, and Frequency
  const filteredHabits = useMemo(() => {
    return activeHabits.filter(h => {
      // Search Filter
      const matchesSearch = searchQuery === '' || 
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Frequency Filter
      const matchesFrequency = selectedFrequency === 'all' || h.frequency === selectedFrequency;

      // Tag Filter
      let matchesTag = true;
      if (selectedTag === '⭐️ Quick Habits') {
        matchesTag = Boolean(h.isQuickHabit);
      } else if (selectedTag !== 'All') {
        const inCategory = h.category?.toLowerCase() === selectedTag.toLowerCase();
        const inTags = h.tags?.some(t => t.toLowerCase() === selectedTag.toLowerCase());
        matchesTag = Boolean(inCategory || inTags);
      }

      return matchesSearch && matchesFrequency && matchesTag;
    });
  }, [activeHabits, searchQuery, selectedTag, selectedFrequency]);

  // Due pending habits
  const duePendingHabits = useMemo(() => {
    return activeHabits.filter(h => isHabitDueInPeriod(h, rewardLogs));
  }, [activeHabits, rewardLogs]);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Banner & Search / Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-outfit text-3xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Zap className="w-7 h-7 text-amber-500 fill-amber-500 animate-pulse" />
              <span>Log Activity</span>
            </h1>
            <p className="text-sm font-medium flex items-center space-x-1" style={{ color: 'var(--text-secondary)' }}>
              <span>1-Tap instant habit completion • Earn</span>
              <CoinToken size={16} />
              <span>{settings.currencyName}</span>
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center space-x-2 p-2 rounded-2xl glass-panel self-start sm:self-auto border border-amber-500/30">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              {duePendingHabits.length} Habits Pending
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search habits by name or description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm font-medium focus:outline-none transition-all"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Frequency Filter Selector */}
          <div className="md:col-span-6 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            {(['all', 'daily', 'weekly', 'monthly'] as const).map(freq => (
              <button
                key={freq}
                onClick={() => setSelectedFrequency(freq)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap"
                style={{
                  background: selectedFrequency === freq ? 'var(--btn-hero-bg)' : 'var(--glass-bg)',
                  color: selectedFrequency === freq ? '#ffffff' : 'var(--text-secondary)',
                  border: selectedFrequency === freq ? '1px solid var(--pill-badge-border)' : '1px solid var(--glass-border)',
                }}
              >
                {freq === 'all' ? 'All Schedules' : `${freq}`}
              </button>
            ))}
          </div>
        </div>

        {/* Category & Tag Filter Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto py-1 no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          {allTags.map(tag => {
            const isActive = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1"
                style={{
                  background: isActive ? 'var(--pill-badge-bg)' : 'var(--glass-bg)',
                  color: isActive ? 'var(--pill-badge-text)' : 'var(--text-muted)',
                  border: isActive ? '1px solid var(--pill-badge-border)' : '1px solid var(--glass-border)',
                }}
              >
                <span>{tag}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: Quick Habits (Favorites ⭐️) Grid */}
      {quickHabits.length > 0 && (selectedTag === 'All' || selectedTag === '⭐️ Quick Habits') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-outfit text-lg font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span>Quick Habits (Favorites)</span>
            </h2>
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              1-Tap Logging
            </span>
          </div>

          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
            {quickHabits.map(habit => {
              const progress = getPeriodProgress(habit, rewardLogs);

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={habit.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative rounded-2xl glass-panel border transition-colors flex flex-col justify-between overflow-hidden ${
                    progress.isComplete ? 'opacity-70 bg-emerald-500/5 border-emerald-500/30' : 'border-amber-400/40 shadow-lg shadow-amber-500/10'
                  }`}
                >
                  <div 
                    onClick={() => setActiveTab(`habits/${habit.id}`)}
                    className="cursor-pointer p-3 sm:p-4 flex-1 flex flex-col justify-between"
                  >
                    {/* Top Bar */}
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-2xl">{habit.icon}</span>
                      <div>
                        <h3 className="font-outfit font-extrabold text-base leading-snug" style={{ color: 'var(--text-primary)' }}>
                          {habit.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-0.5 text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                          <span className="capitalize px-1.5 py-0.5 rounded bg-zinc-500/10 border border-zinc-500/20">
                            {habit.frequency || 'daily'}
                          </span>
                          <span>•</span>
                          <span>{progress.count}/{progress.max === 0 ? '∞' : progress.max} {getPeriodLabel(habit.frequency || 'daily')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Star Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        toggleQuickHabit(habit.id);
                      }}
                      className="p-1.5 rounded-full hover:bg-amber-500/20 cursor-pointer relative z-10"
                      title="Unmark Quick Habit"
                    >
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </button>
                  </div>

                  {/* Period Progress Bar */}
                  <div className="w-full bg-zinc-700/30 h-1.5 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>

                  </div>

                  {/* 1-Tap Log Action Button */}
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        logHabit(habit.id, e);
                      }}
                    disabled={progress.isComplete && progress.max > 0}
                    className={`w-full py-2.5 px-4 rounded-xl font-outfit text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      progress.isComplete && progress.max > 0
                        ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                        : 'btn-gradient-hero text-amber-950 shadow-md hover:brightness-110'
                    }`}
                  >
                    {progress.isComplete && progress.max > 0 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Completed {getPeriodLabel(habit.frequency || 'daily')}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-amber-950" />
                        <span>Tap to Log (+{habit.rewardValue})</span>
                        <CoinToken size={16} />
                      </>
                    )}
                  </button>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* SECTION 2: All Filtered Habits List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-outfit text-xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Sparkles className="w-5 h-5" style={{ color: 'var(--text-accent)' }} />
            <span>Habits Directory ({filteredHabits.length})</span>
          </h2>

          {selectedTag !== 'All' && (
            <button
              onClick={() => { setSelectedTag('All'); setSelectedFrequency('all'); setSearchQuery(''); }}
              className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        {filteredHabits.length === 0 ? (
          <div className="p-12 text-center rounded-3xl glass-panel space-y-3" style={{ border: '1px solid var(--glass-border)' }}>
            <div className="text-4xl">🔍</div>
            <h3 className="font-outfit text-lg font-bold" style={{ color: 'var(--text-primary)' }}>No matching habits found</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Try adjusting your search keywords, category tags, or schedule frequency filters.
            </p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
            {filteredHabits.map(habit => {
              const progress = getPeriodProgress(habit, rewardLogs);

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={habit.id}
                  whileHover={{ y: -2 }}
                  className="rounded-2xl glass-panel border transition-colors flex flex-col justify-between overflow-hidden"
                  style={{ border: '1px solid var(--glass-border)' }}
                >
                  <div
                    onClick={() => setActiveTab(`habits/${habit.id}`)}
                    className="cursor-pointer p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3"
                  >
                    {/* Top Bar */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-2xl">{habit.icon}</span>
                      <div>
                        <h3 className="font-outfit font-extrabold text-base" style={{ color: 'var(--text-primary)' }}>
                          {habit.name}
                        </h3>
                        {habit.description && (
                          <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {habit.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Star Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        toggleQuickHabit(habit.id);
                      }}
                      className="p-1 rounded-full hover:bg-amber-500/20 cursor-pointer relative z-10"
                      title={habit.isQuickHabit ? "Unmark Quick Habit" : "Mark as Quick Habit"}
                    >
                      <Star className={`w-4 h-4 ${habit.isQuickHabit ? 'text-amber-400 fill-amber-400' : 'text-zinc-500'}`} />
                    </button>
                  </div>

                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded-full capitalize bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      📅 {habit.frequency || 'daily'}
                    </span>
                    {habit.category && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        🏷️ {habit.category}
                      </span>
                    )}
                  </div>

                  {/* Period Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>
                      <span>Progress ({getPeriodLabel(habit.frequency || 'daily')})</span>
                      <span>{progress.count}/{progress.max === 0 ? '∞' : progress.max}</span>
                    </div>
                    <div className="w-full bg-zinc-700/30 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>

                  </div>

                  {/* Log Action Button */}
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 mt-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        logHabit(habit.id, e);
                      }}
                    disabled={progress.isComplete && progress.max > 0}
                    className={`w-full py-2.5 px-4 rounded-xl font-outfit text-xs font-extrabold flex items-center justify-center space-x-1.5 cursor-pointer ${
                      progress.isComplete && progress.max > 0
                        ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-zinc-950 font-bold hover:scale-[1.01]'
                    }`}
                  >
                    {progress.isComplete && progress.max > 0 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Completed {getPeriodLabel(habit.frequency || 'daily')}</span>
                      </>
                    ) : (
                      <>
                        <span>+ {habit.rewardValue}</span>
                        <CoinToken size={16} />
                        <span>Log Habit</span>
                      </>
                    )}
                  </button>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};
