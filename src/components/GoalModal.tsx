import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Goal, GoalMetricType, GoalFrequencyPeriod, GoalMilestone } from '../types';
import { X, Target, Plus, Trash2, Calendar, BarChart2, AlertCircle } from 'lucide-react';

import { playSound } from '../services/sound';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal | null;
}

const PRESET_ICONS = ['🎯', '📚', '💻', '🏃', '🏋️', '🎨', '🎵', '💰', '🧘', '🚀', '🔬', '🏆'];
const PRESET_COLORS = [
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#f97316', // Orange
  '#ef4444'  // Rose
];

export const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, goal }) => {
  const { addGoal, updateGoal, settings } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('#f59e0b');

  // Progress Config State
  const [enableProgress, setEnableProgress] = useState(false);
  const [metricType, setMetricType] = useState<GoalMetricType>('count');
  const [metricLabel, setMetricLabel] = useState('');
  const [metricUnit, setMetricUnit] = useState('');
  const [targetValue, setTargetValue] = useState<string>('');
  const [frequencyPeriod, setFrequencyPeriod] = useState<GoalFrequencyPeriod>('weekly');
  const [initialProgress, setInitialProgress] = useState<string>('0');
  // For duration input helper (hours vs minutes)
  const [durationUnit, setDurationUnit] = useState<'hours' | 'minutes'>('hours');

  // Milestones State
  const [milestones, setMilestones] = useState<Array<{ id: string; title: string; description?: string; isCompleted: boolean; order: number; createdAt: string; updatedAt: string; completedAt?: string }>>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  // Validation State
  const [titleError, setTitleError] = useState<string | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [metricTypeWarn, setMetricTypeWarn] = useState(false);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title || '');
      setDescription(goal.description || '');
      setStartDate(goal.startDate ? goal.startDate.split('T')[0] : '');
      setDeadline(goal.deadline ? goal.deadline.split('T')[0] : '');
      setIcon(goal.icon || '🎯');
      setColor(goal.color || '#f59e0b');
      setMilestones(goal.milestones || []);

      if (goal.progressConfig) {
        setEnableProgress(true);
        setMetricType(goal.progressConfig.type);
        setMetricLabel(goal.progressConfig.label || '');
        setMetricUnit(goal.progressConfig.unit || '');
        setFrequencyPeriod(goal.progressConfig.period || 'weekly');

        if (goal.progressConfig.type === 'duration') {
          // Canonical stored in seconds. If divisible by 3600, display hours
          const rawTarget = goal.progressConfig.targetValue || 0;
          if (rawTarget > 0) {
            if (rawTarget % 3600 === 0) {
              setDurationUnit('hours');
              setTargetValue(String(rawTarget / 3600));
            } else {
              setDurationUnit('minutes');
              setTargetValue(String(Math.round(rawTarget / 60)));
            }
          } else {
            setTargetValue('');
          }

          const rawCur = goal.currentProgress || 0;
          if (rawCur > 0) {
            setInitialProgress(rawCur % 3600 === 0 ? String(rawCur / 3600) : String((rawCur / 3600).toFixed(1)));
          } else {
            setInitialProgress('0');
          }
        } else {
          setTargetValue(goal.progressConfig.targetValue !== undefined ? String(goal.progressConfig.targetValue) : '');
          setInitialProgress(goal.currentProgress !== undefined ? String(goal.currentProgress) : '0');
        }
      } else {
        setEnableProgress(false);
        setMetricType('count');
        setMetricLabel('');
        setMetricUnit('');
        setTargetValue('');
        setInitialProgress('0');
      }
    } else {
      // Defaults for create mode
      setTitle('');
      setDescription('');
      setStartDate('');
      setDeadline('');
      setIcon('🎯');
      setColor('#f59e0b');
      setEnableProgress(false);
      setMetricType('count');
      setMetricLabel('');
      setMetricUnit('');
      setTargetValue('');
      setFrequencyPeriod('weekly');
      setInitialProgress('0');
      setDurationUnit('hours');
      setMilestones([]);
    }
    setTitleError(null);
    setProgressError(null);
    setMetricTypeWarn(false);
    setNewMilestoneTitle('');
  }, [goal, isOpen]);

  if (!isOpen) return null;

  const handleAddMilestone = () => {
    const trimmed = newMilestoneTitle.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    const newMs: GoalMilestone = {
      id: `ms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: trimmed,
      isCompleted: false,
      order: milestones.length,
      createdAt: now,
      updatedAt: now
    };
    setMilestones([...milestones, newMs]);
    setNewMilestoneTitle('');
    playSound.click(settings.soundEnabled);
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id).map((m, idx) => ({ ...m, order: idx })));
    playSound.click(settings.soundEnabled);
  };

  const handleMetricTypeChange = (newType: GoalMetricType) => {
    if (goal?.progressConfig && goal.progressConfig.type !== newType) {
      setMetricTypeWarn(true);
    }
    setMetricType(newType);
    if (newType === 'count') {
      if (!metricLabel || metricLabel === 'Study hours' || metricLabel === 'Sessions') setMetricLabel('Books read');
      if (!metricUnit) setMetricUnit('books');
    } else if (newType === 'duration') {
      if (!metricLabel || metricLabel === 'Books read' || metricLabel === 'Sessions') setMetricLabel('Study hours');
      setMetricUnit('hours');
    } else if (newType === 'frequency') {
      if (!metricLabel || metricLabel === 'Books read' || metricLabel === 'Study hours') setMetricLabel('Sessions');
      if (!metricUnit) setMetricUnit('sessions');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setTitleError('Please enter a goal title.');
      return;
    }
    if (cleanTitle.length > 150) {
      setTitleError('Title cannot exceed 150 characters.');
      return;
    }

    let progressConfig = undefined;
    let currentProgress = undefined;

    if (enableProgress) {
      const cleanLabel = metricLabel.trim();
      if (!cleanLabel) {
        setProgressError('Please provide a metric label (e.g. "Books read" or "Study time").');
        return;
      }

      let parsedTarget: number | undefined = undefined;
      if (targetValue.trim() !== '') {
        const num = parseFloat(targetValue);
        if (isNaN(num) || num <= 0) {
          setProgressError('Target value must be a positive number greater than 0.');
          return;
        }

        if (metricType === 'duration') {
          // Convert hours or minutes to canonical seconds
          parsedTarget = durationUnit === 'hours' ? Math.round(num * 3600) : Math.round(num * 60);
        } else {
          parsedTarget = num;
        }
      }

      progressConfig = {
        type: metricType,
        label: cleanLabel,
        unit: metricUnit.trim() || undefined,
        targetValue: parsedTarget,
        period: metricType === 'frequency' ? frequencyPeriod : undefined
      };

      const parsedInit = parseFloat(initialProgress);
      if (metricType === 'duration') {
        const durVal = isNaN(parsedInit) || parsedInit < 0 ? 0 : parsedInit;
        currentProgress = durationUnit === 'hours' ? Math.round(durVal * 3600) : Math.round(durVal * 60);
      } else {
        currentProgress = isNaN(parsedInit) || parsedInit < 0 ? 0 : parsedInit;
      }
    }

    if (goal) {
      updateGoal({
        ...goal,
        title: cleanTitle,
        description: description.trim() || undefined,
        startDate: startDate ? startDate : undefined,
        deadline: deadline ? deadline : undefined,
        icon,
        color,
        progressConfig,
        currentProgress: enableProgress ? currentProgress : undefined,
        milestones
      });
    } else {
      addGoal({
        title: cleanTitle,
        description: description.trim() || undefined,
        startDate: startDate ? startDate : undefined,
        deadline: deadline ? deadline : undefined,
        icon,
        color,
        progressConfig,
        currentProgress: enableProgress ? currentProgress : undefined,
        milestones
      });
    }

    playSound.crunch(settings.soundEnabled);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative border"
        style={{ borderColor: `${color}40` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md border"
              style={{ background: `${color}20`, borderColor: `${color}50` }}
            >
              {icon}
            </div>
            <div>
              <h2 className="font-outfit text-xl sm:text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                {goal ? 'Edit Goal' : 'Create New Goal'}
              </h2>
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {goal ? 'Update your target outcome & progress' : 'A title is enough — everything else is optional'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title (Required) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Goal Title <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(null);
              }}
              placeholder="e.g. Read 20 books, Learn piano, Run a 10K"
              className="w-full px-4 py-3 rounded-2xl bg-zinc-900/60 border border-zinc-700/60 focus:border-amber-400 text-sm font-semibold outline-none transition-all placeholder:text-zinc-500"
              style={{ color: 'var(--text-primary)' }}
              autoFocus
            />
            {titleError && (
              <p className="text-xs text-rose-400 font-semibold flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{titleError}</span>
              </p>
            )}
          </div>

          {/* Description (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Description <span className="text-zinc-500 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does success look like? Any specific definition or motivation..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-700/60 focus:border-amber-400 text-sm outline-none transition-all placeholder:text-zinc-500"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          {/* Icon & Color Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Icon
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                {PRESET_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-transform cursor-pointer ${
                      icon === emoji ? 'bg-amber-500/30 border border-amber-400 scale-110 shadow-sm' : 'hover:scale-105 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                Accent Color
              </label>
              <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-zinc-900/40 border border-zinc-800 items-center">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-xl transition-all cursor-pointer ${
                      color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Deadline (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Calendar className="w-3.5 h-3.5" />
                <span>Deadline <span className="text-zinc-500 font-normal lowercase">(optional)</span></span>
              </label>
              {deadline && (
                <button
                  type="button"
                  onClick={() => setDeadline('')}
                  className="text-xs text-rose-400 hover:underline cursor-pointer"
                >
                  Clear deadline
                </button>
              )}
            </div>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-700/60 focus:border-amber-400 text-sm font-semibold outline-none transition-all"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          {/* Progress Tracking Section */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                <span className="font-outfit font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Measure Progress
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEnableProgress(!enableProgress)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  enableProgress ? 'bg-amber-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enableProgress ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {enableProgress && (
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4 animate-fade-in">
                {metricTypeWarn && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Switching metric type will reset or reconfigure progress units.</span>
                  </div>
                )}

                {/* Metric Type Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Metric Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'count', label: 'Count', desc: 'Quantity (books, pages, songs)' },
                      { id: 'duration', label: 'Duration', desc: 'Time (hours, minutes)' },
                      { id: 'frequency', label: 'Frequency', desc: 'Times per period' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleMetricTypeChange(t.id as GoalMetricType)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          metricType === t.id
                            ? 'bg-amber-500/20 border-amber-400 text-amber-400 font-bold'
                            : 'bg-zinc-800/40 border-zinc-700/60 text-zinc-400 hover:border-zinc-500'
                        }`}
                      >
                        <div className="font-outfit text-xs font-bold">{t.label}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5 truncate">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metric Label & Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Metric Label <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={metricLabel}
                      onChange={(e) => {
                        setMetricLabel(e.target.value);
                        if (progressError) setProgressError(null);
                      }}
                      placeholder={metricType === 'count' ? 'e.g. Books read' : metricType === 'duration' ? 'e.g. Piano practice' : 'e.g. Gym sessions'}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs font-medium outline-none focus:border-amber-400"
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Display Unit <span className="text-zinc-500 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={metricUnit}
                      onChange={(e) => setMetricUnit(e.target.value)}
                      placeholder={metricType === 'count' ? 'books' : metricType === 'duration' ? 'hours' : 'sessions'}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs font-medium outline-none focus:border-amber-400"
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                {/* Frequency Period Selector (if frequency) */}
                {metricType === 'frequency' && (
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Occurrence Period
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'daily', label: 'Daily' },
                        { id: 'weekly', label: 'Weekly' },
                        { id: 'monthly', label: 'Monthly' }
                      ].map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFrequencyPeriod(p.id as GoalFrequencyPeriod)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            frequencyPeriod === p.id 
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                              : 'bg-zinc-800/40 border-zinc-700 text-zinc-400'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Target Value & Initial Progress */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Target Value <span className="text-zinc-500 font-normal">(optional)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={targetValue}
                        onChange={(e) => {
                          setTargetValue(e.target.value);
                          if (progressError) setProgressError(null);
                        }}
                        placeholder="No target"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs font-medium outline-none focus:border-amber-400"
                        style={{ color: 'var(--text-primary)' }}
                      />
                      {metricType === 'duration' && (
                        <select
                          value={durationUnit}
                          onChange={(e) => setDurationUnit(e.target.value as 'hours' | 'minutes')}
                          className="px-2 py-1 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-300"
                        >
                          <option value="hours">Hours</option>
                          <option value="minutes">Mins</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Initial / Current Value
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={initialProgress}
                      onChange={(e) => setInitialProgress(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs font-medium outline-none focus:border-amber-400"
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                {progressError && (
                  <p className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{progressError}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Milestones Section */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Milestones <span className="text-zinc-500 font-normal lowercase">(optional checkpoints)</span>
            </label>

            {milestones.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {milestones.map((ms, idx) => (
                  <div 
                    key={ms.id} 
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center font-mono font-bold text-[10px] text-zinc-400 shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {ms.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(ms.id)}
                      className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMilestone();
                  }
                }}
                placeholder="Add a milestone (e.g. Finish Part 1)..."
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-700/60 text-xs font-medium outline-none focus:border-amber-400"
                style={{ color: 'var(--text-primary)' }}
              />
              <button
                type="button"
                onClick={handleAddMilestone}
                disabled={!newMilestoneTitle.trim()}
                className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-zinc-700/60 text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-gradient-hero px-6 py-2.5 rounded-2xl font-outfit text-xs sm:text-sm font-extrabold shadow-lg cursor-pointer flex items-center space-x-1.5"
            >
              <Target className="w-4 h-4" />
              <span>{goal ? 'Save Changes' : 'Create Goal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
