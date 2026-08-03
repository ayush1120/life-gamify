import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Habit } from '../types';
import { HabitModal } from '../components/HabitModal';
import { Plus, Edit2, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { playSound } from '../services/sound';

export const HabitsPage: React.FC = () => {
  const { habits, deleteHabit, toggleHabitActive, reorderHabits, settings } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-outfit text-3xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Sparkles className="w-6 h-6" style={{ color: 'var(--text-accent)' }} />
            <span>Habit Manager</span>
          </h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Customize habit values, icons, active status, and display order
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="btn-gradient-hero px-5 py-3 rounded-2xl font-outfit text-sm font-extrabold flex items-center space-x-2 shadow-lg cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Habit</span>
        </button>
      </div>

      {/* Habit List */}
      <div className="space-y-3">
        {habits.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            No habits created yet. Click "Add New Habit" above!
          </div>
        ) : (
          habits.map((habit, idx) => (
            <div
              key={habit.id}
              className={`glass-panel rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-all ${
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
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                  style={{ backgroundColor: `${habit.color}25`, border: `1px solid ${habit.color}40` }}
                >
                  {habit.icon}
                </div>

                {/* Info */}
                <div>
                  <h3 className="font-outfit text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <span>{habit.name}</span>
                    {!habit.active && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded" style={{ background: 'var(--pill-badge-bg)', color: 'var(--text-muted)', border: '1px solid var(--pill-badge-border)' }}>
                        Inactive
                      </span>
                    )}
                  </h3>
                  {habit.description && (
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{habit.description}</p>
                  )}
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
                  {habit.maxPerDay === 0 ? 'Unlimited' : `${habit.maxPerDay ?? 1}x / day`}
                </span>

                <div className="flex items-center space-x-2">
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
            </div>
          ))
        )}
      </div>

      <HabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        habitToEdit={editingHabit}
      />
    </div>
  );
};
