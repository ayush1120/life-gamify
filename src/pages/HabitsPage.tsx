import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Habit, HabitFrequency } from '../types';
import { HabitModal } from '../components/HabitModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Sparkles, Search, Star, Filter } from 'lucide-react';
import { playSound } from '../services/sound';

const PRESET_TAGS = ['All', '⭐️ Quick Habits', 'Work', 'Health', 'Career', 'Music', 'Fitness', 'Learning', 'Personal'];

export const HabitsPage: React.FC = () => {
  const { habits, deleteHabit, toggleHabitActive, reorderHabits, toggleQuickHabit, settings, setActiveTab } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedFrequency, setSelectedFrequency] = useState<'all' | HabitFrequency>('all');

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    habits.forEach(h => {
      if (h.category) tagsSet.add(h.category);
      if (h.tags) h.tags.forEach(t => tagsSet.add(t));
    });
    const custom = Array.from(tagsSet).filter(t => !PRESET_TAGS.includes(t));
    return [...PRESET_TAGS, ...custom];
  }, [habits]);

  const filteredHabits = useMemo(() => {
    return habits.filter(h => {
      const matchesSearch = searchQuery === '' || 
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFrequency = selectedFrequency === 'all' || h.frequency === selectedFrequency;

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
  }, [habits, searchQuery, selectedTag, selectedFrequency]);

  const handleEdit = (habit: Habit) => {
    playSound.click(settings.soundEnabled);
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    playSound.click(settings.soundEnabled);
    setEditingHabit(null);
    setIsModalOpen(true);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === habits.length - 1)) return;
    const newHabits = [...habits];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newHabits[index];
    newHabits[index] = newHabits[targetIdx];
    newHabits[targetIdx] = temp;
    reorderHabits(newHabits);
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-outfit text-3xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Sparkles className="w-6 h-6" style={{ color: 'var(--text-accent)' }} />
            <span>Habit Manager</span>
          </h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Customize habit schedules, tags, quick habit favorites, and reward values
          </p>
        </div>

        <button
          id="btn-add-habit"
          onClick={handleCreate}
          className="btn-gradient-hero px-5 py-3 rounded-2xl font-outfit text-sm font-extrabold flex items-center space-x-2 shadow-lg cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Habit</span>
        </button>
      </div>

      {/* Search Bar & Frequency Selector */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search habits by name or description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm font-medium focus:outline-none"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
          />
        </div>

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

      {/* Tag Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto py-1 no-scrollbar">
        <Filter className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        {allTags.map(tag => {
          const isActive = selectedTag === tag;
          return (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
              style={{
                background: isActive ? 'var(--pill-badge-bg)' : 'var(--glass-bg)',
                color: isActive ? 'var(--pill-badge-text)' : 'var(--text-muted)',
                border: isActive ? '1px solid var(--pill-badge-border)' : '1px solid var(--glass-border)',
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Habit List */}
      <motion.div layout className="space-y-3">
        {filteredHabits.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center space-y-2" style={{ color: 'var(--text-muted)' }}>
            <div className="text-3xl">🔍</div>
            <h3 className="font-outfit font-bold text-base" style={{ color: 'var(--text-primary)' }}>No habits found</h3>
            <p className="text-xs">Try clearing your search query or selecting a different tag filter.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
          {filteredHabits.map((habit, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={habit.id}
              className={`glass-panel rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-colors ${
                habit.active ? 'opacity-100' : 'opacity-50'
              }`}
              style={{
                background: 'var(--glass-bg)',
                borderColor: 'var(--glass-border)',
              }}
            >
              <div className="flex items-center space-x-4">
                {/* Reorder Buttons */}
                <div className="flex flex-col space-y-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1 rounded cursor-pointer disabled:opacity-30"
                    style={{ background: 'var(--pill-badge-bg)', color: 'var(--text-accent)' }}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === habits.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1 rounded cursor-pointer disabled:opacity-30"
                    style={{ background: 'var(--pill-badge-bg)', color: 'var(--text-accent)' }}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Habit Icon */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0"
                  style={{ backgroundColor: `${habit.color}25`, border: `1px solid ${habit.color}40` }}
                >
                  {habit.icon}
                </div>

                {/* Info & Badges */}
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-outfit text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <span>{habit.name}</span>
                      {!habit.active && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded" style={{ background: 'var(--pill-badge-bg)', color: 'var(--text-muted)', border: '1px solid var(--pill-badge-border)' }}>
                          Inactive
                        </span>
                      )}
                    </h3>
                    <button
                      onClick={() => toggleQuickHabit(habit.id)}
                      className="p-1 rounded-full hover:bg-amber-500/20 cursor-pointer"
                      title={habit.isQuickHabit ? "Unmark Quick Habit" : "Mark as Quick Habit"}
                    >
                      <Star className={`w-4 h-4 ${habit.isQuickHabit ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
                    </button>
                  </div>

                  {habit.description && (
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{habit.description}</p>
                  )}

                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded-full capitalize bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      📅 {habit.frequency || 'daily'}
                    </span>
                    {habit.category && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        🏷️ {habit.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions & Reward Pill */}
              <div className="flex items-center justify-between sm:justify-end space-x-3 border-t sm:border-t-0 pt-3 sm:pt-0" style={{ borderColor: 'var(--glass-border)' }}>
                <span
                  className="px-3 py-1 rounded-full font-outfit text-xs font-extrabold"
                  style={{ background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)', color: 'var(--pill-badge-text)' }}
                >
                  +{habit.rewardValue} {settings.currencySymbol || '🪙'}
                </span>

                <span
                  className="px-2.5 py-1 rounded-full font-mono text-[11px] font-bold"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}
                >
                  {(habit.maxPerPeriod ?? habit.maxPerDay) === 0 ? 'Unlimited' : `${habit.maxPerPeriod ?? habit.maxPerDay ?? 1}x / ${habit.frequency || 'daily'}`}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab(`habits/${habit.id}`)}
                    title="View Details"
                    className="p-2 rounded-xl cursor-pointer"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-accent)' }}
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => toggleHabitActive(habit.id)}
                    title={habit.active ? 'Disable Habit' : 'Enable Habit'}
                    className="p-2 rounded-xl cursor-pointer"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}
                  >
                    {habit.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 opacity-50" />}
                  </button>

                  <button
                    onClick={() => handleEdit(habit)}
                    title="Edit Habit"
                    className="p-2 rounded-xl cursor-pointer"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-accent)' }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${habit.name}"?`)) {
                        deleteHabit(habit.id);
                      }
                    }}
                    title="Delete Habit"
                    className="p-2 rounded-xl bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 border border-rose-500/30 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        )}
      </motion.div>

      <HabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        habitToEdit={editingHabit}
      />
    </div>
  );
};
