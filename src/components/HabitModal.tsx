import React, { useState, useEffect } from 'react';
import { Habit, HabitFrequency } from '../types';
import { useApp } from '../context/AppContext';
import { sanitizeTag } from '../utils/frequencyUtils';
import { X, Sparkles, Plus, Save, Star } from 'lucide-react';
import { playSound } from '../services/sound';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitToEdit?: Habit | null;
}

const PRESET_ICONS = ['🏃', '🏋️', '⏳', '🏡', '📚', '🧘', '💧', '🥗', '💻', '🎸', '🛌', '🎨'];
const PRESET_COLORS = ['#e7bc98', '#ce7647', '#c05c3b', '#a04733', '#823b2e', '#f59e0b', '#10b981', '#6366f1', '#ec4899'];
const PRESET_CATEGORIES = ['Health', 'Work', 'Career', 'Music', 'Fitness', 'Learning', 'Personal'];

export const HabitModal: React.FC<HabitModalProps> = ({ isOpen, onClose, habitToEdit }) => {
  const { addHabit, updateHabit, settings } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🏃');
  const [rewardValue, setRewardValue] = useState(2);
  const [maxPerPeriod, setMaxPerPeriod] = useState(1);
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [isQuickHabit, setIsQuickHabit] = useState(false);
  const [category, setCategory] = useState('Personal');
  const [customTagInput, setCustomTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Personal']);
  const [color, setColor] = useState('#ce7647');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      setDescription(habitToEdit.description || '');
      setIcon(habitToEdit.icon);
      setRewardValue(habitToEdit.rewardValue);
      setMaxPerPeriod(habitToEdit.maxPerPeriod ?? habitToEdit.maxPerDay ?? 1);
      setFrequency(habitToEdit.frequency || 'daily');
      setIsQuickHabit(Boolean(habitToEdit.isQuickHabit));
      setCategory(habitToEdit.category || 'Personal');
      setTags(habitToEdit.tags && habitToEdit.tags.length > 0 ? habitToEdit.tags : [habitToEdit.category || 'Personal']);
      setColor(habitToEdit.color);
      setActive(habitToEdit.active);
    } else {
      setName('');
      setDescription('');
      setIcon('🏃');
      setRewardValue(2);
      setMaxPerPeriod(1);
      setFrequency('daily');
      setIsQuickHabit(false);
      setCategory('Personal');
      setCustomTagInput('');
      setTags(['Personal']);
      setColor('#ce7647');
      setActive(true);
    }
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const sanitized = sanitizeTag(customTagInput);
    if (sanitized && !tags.includes(sanitized) && tags.length < 10) {
      setTags([...tags, sanitized]);
      setCustomTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalTags = Array.from(new Set([category, ...tags].map(sanitizeTag))).filter(Boolean);

    if (habitToEdit) {
      updateHabit({
        ...habitToEdit,
        name: name.trim(),
        description: description.trim(),
        icon,
        rewardValue: Number(rewardValue) || 1,
        maxPerPeriod: Number(maxPerPeriod) >= 0 ? Number(maxPerPeriod) : 1,
        maxPerDay: Number(maxPerPeriod) >= 0 ? Number(maxPerPeriod) : 1,
        frequency,
        isQuickHabit,
        category,
        tags: finalTags,
        color,
        active
      });
    } else {
      addHabit({
        name: name.trim(),
        description: description.trim(),
        icon,
        rewardValue: Number(rewardValue) || 1,
        maxPerPeriod: Number(maxPerPeriod) >= 0 ? Number(maxPerPeriod) : 1,
        maxPerDay: Number(maxPerPeriod) >= 0 ? Number(maxPerPeriod) : 1,
        frequency,
        isQuickHabit,
        category,
        tags: finalTags,
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
              placeholder="e.g., Run 5km, Practice Piano..."
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
              placeholder="Target details or notes..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Frequency & Quick Habit Star Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Frequency Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Schedule Frequency *</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as HabitFrequency)}
                className="w-full px-3 py-2.5 rounded-xl font-bold text-xs focus:outline-none capitalize cursor-pointer"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
              >
                <option value="daily" className="bg-zinc-900 text-white">Daily</option>
                <option value="weekly" className="bg-zinc-900 text-white">Weekly</option>
                <option value="monthly" className="bg-zinc-900 text-white">Monthly</option>
              </select>
            </div>

            {/* Quick Habit Checkbox */}
            <div className="space-y-1 flex flex-col justify-end">
              <label
                onClick={() => setIsQuickHabit(!isQuickHabit)}
                className="px-3 py-2.5 rounded-xl border flex items-center justify-between cursor-pointer select-none"
                style={{
                  background: isQuickHabit ? 'var(--pill-badge-bg)' : 'var(--glass-bg)',
                  borderColor: isQuickHabit ? 'var(--pill-badge-border)' : 'var(--glass-border)'
                }}
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  <Star className={`w-4 h-4 ${isQuickHabit ? 'text-amber-400 fill-amber-400' : 'text-zinc-500'}`} />
                  <span>Quick Habit ⭐️</span>
                </div>
                <input
                  type="checkbox"
                  checked={isQuickHabit}
                  onChange={e => setIsQuickHabit(e.target.checked)}
                  className="rounded accent-amber-500"
                />
              </label>
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Category / Tag</label>
            <select
              value={category}
              onChange={e => {
                setCategory(e.target.value);
                if (!tags.includes(e.target.value)) setTags([...tags, e.target.value]);
              }}
              className="w-full px-3 py-2.5 rounded-xl font-bold text-xs focus:outline-none cursor-pointer"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
            >
              {PRESET_CATEGORIES.map(cat => (
                <option key={cat} value={cat} className="bg-zinc-900 text-white">{cat}</option>
              ))}
            </select>
          </div>

          {/* Custom Tags Input & Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Custom Tags</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Add custom tag (e.g. Piano)..."
                value={customTagInput}
                onChange={e => setCustomTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                className="flex-1 px-3 py-2 rounded-xl text-xs focus:outline-none"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Render Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center space-x-1"
                >
                  <span>{tag}</span>
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-rose-400 ml-1">×</button>
                </span>
              ))}
            </div>
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

          {/* Reward Value & Max Per Period Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Reward Coins ({settings.currencySymbol || '🪙'}) *
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={rewardValue}
                onChange={e => setRewardValue(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl font-bold text-sm focus:outline-none"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Max Per {frequency === 'weekly' ? 'Week' : frequency === 'monthly' ? 'Month' : 'Day'} *
              </label>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={maxPerPeriod}
                onChange={e => setMaxPerPeriod(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl font-bold text-sm focus:outline-none"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
              />
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
