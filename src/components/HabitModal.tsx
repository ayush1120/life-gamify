import React, { useState, useEffect } from 'react';
import { Habit } from '../types';
import { useApp } from '../context/AppContext';
import { X, Sparkles, Plus, Save } from 'lucide-react';
import { playSound } from '../services/sound';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitToEdit?: Habit | null;
}

const PRESET_ICONS = ['🏃', '🏋️', '⏳', '🏡', '📚', '🧘', '💧', '🥗', '💻', '🎸', '🛌', '🎨'];
const PRESET_COLORS = ['#e7bc98', '#ce7647', '#c05c3b', '#a04733', '#823b2e', '#f59e0b', '#10b981', '#6366f1', '#ec4899'];

export const HabitModal: React.FC<HabitModalProps> = ({ isOpen, onClose, habitToEdit }) => {
  const { addHabit, updateHabit, settings } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🏃');
  const [rewardValue, setRewardValue] = useState(2);
  const [maxPerDay, setMaxPerDay] = useState(1);
  const [color, setColor] = useState('#ce7647');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      setDescription(habitToEdit.description || '');
      setIcon(habitToEdit.icon);
      setRewardValue(habitToEdit.rewardValue);
      setMaxPerDay(habitToEdit.maxPerDay !== undefined ? habitToEdit.maxPerDay : 1);
      setColor(habitToEdit.color);
      setActive(habitToEdit.active);
    } else {
      setName('');
      setDescription('');
      setIcon('🏃');
      setRewardValue(2);
      setMaxPerDay(1);
      setColor('#ce7647');
      setActive(true);
    }
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (habitToEdit) {
      updateHabit({
        ...habitToEdit,
        name: name.trim(),
        description: description.trim(),
        icon,
        rewardValue: Number(rewardValue) || 1,
        maxPerDay: Number(maxPerDay) >= 0 ? Number(maxPerDay) : 1,
        color,
        active
      });
    } else {
      addHabit({
        name: name.trim(),
        description: description.trim(),
        icon,
        rewardValue: Number(rewardValue) || 1,
        maxPerDay: Number(maxPerDay) >= 0 ? Number(maxPerDay) : 1,
        color,
        active,
        order: 99
      });
    }

    playSound.click(settings.soundEnabled);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-outfit text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Sparkles className="w-5 h-5" style={{ color: 'var(--text-accent)' }} />
            <span>{habitToEdit ? 'Edit Habit' : 'Create New Habit'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full cursor-pointer hover:opacity-80"
            style={{ background: 'var(--pill-badge-bg)', color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          
          {/* Habit Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Habit Name *</label>
            <input
              type="text"
              required
              placeholder="e.g., Run 5km, Read 15 mins..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Description (Optional)</label>
            <input
              type="text"
              placeholder="Brief target notes..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Choose Icon / Emoji</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer"
                  style={{
                    background: icon === ic ? 'var(--pill-badge-bg)' : 'var(--glass-bg)',
                    border: icon === ic ? '1px solid var(--pill-badge-border)' : '1px solid var(--glass-border)',
                  }}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Reward Value & Max Per Day Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Reward Coins ({settings.currencySymbol || '🪙'}) *
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={rewardValue}
                onChange={e => setRewardValue(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl font-bold text-sm focus:outline-none"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Max Completions / Day *
              </label>
              <input
                type="number"
                min={0}
                max={50}
                required
                value={maxPerDay}
                onChange={e => setMaxPerDay(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl font-bold text-sm focus:outline-none"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Max Per Day Presets */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium block" style={{ color: 'var(--text-muted)' }}>Quick presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '1x / day', val: 1 },
                { label: '2x / day', val: 2 },
                { label: '3x / day', val: 3 },
                { label: '5x / day', val: 5 },
                { label: 'Unlimited (0)', val: 0 }
              ].map(p => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setMaxPerDay(p.val)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  style={{
                    background: maxPerDay === p.val ? 'var(--pill-badge-bg)' : 'var(--glass-bg)',
                    border: maxPerDay === p.val ? '1px solid var(--pill-badge-border)' : '1px solid var(--glass-border)',
                    color: maxPerDay === p.val ? 'var(--pill-badge-text)' : 'var(--text-muted)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Accent Color</label>
            <div className="flex items-center space-x-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${color === c ? 'scale-125 ring-2 ring-amber-400' : 'opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl font-bold cursor-pointer"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-gradient-hero flex-1 py-2.5 rounded-xl font-outfit font-bold flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
            >
              {habitToEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{habitToEdit ? 'Save Changes' : 'Create Habit'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
