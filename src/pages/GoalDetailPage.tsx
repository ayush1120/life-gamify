import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { GoalModal } from '../components/GoalModal';
import { 
  calculateGoalProgress, 
  evaluateGoalDeadline, 
  getMilestonesSummary
} from '../utils/goalUtils';
import { 
  ArrowLeft, 
  Target, 
  Calendar, 
  CheckCircle2, 
  RotateCcw, 
  Archive, 
  Trash2, 
  Edit2, 
  Plus, 
  CheckSquare, 
  ArrowUp, 
  ArrowDown, 
  BarChart2
} from 'lucide-react';
import { playSound } from '../services/sound';
import { triggerCelebration } from '../services/celebration';

interface GoalDetailPageProps {
  goalId: string;
}

export const GoalDetailPage: React.FC<GoalDetailPageProps> = ({ goalId }) => {
  const { 
    goals, 
    deleteGoal, 
    setGoalStatus, 
    addGoalMilestone, 
    toggleGoalMilestone, 
    deleteGoalMilestone, 

    reorderGoalMilestones, 
    updateGoalProgress, 
    setActiveTab, 
    settings 
  } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Manual Progress Value Input
  const [customValueInput, setCustomValueInput] = useState('');
  const [isCustomInputOpen, setIsCustomInputOpen] = useState(false);

  const goal = useMemo(() => goals.find(g => g.id === goalId), [goals, goalId]);

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center">
          <Target className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-outfit" style={{ color: 'var(--text-primary)' }}>
            Goal Not Found
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This goal may have been deleted or the link is invalid.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('goals')}
          className="px-6 py-3 rounded-2xl bg-amber-500/20 text-amber-400 font-bold hover:bg-amber-500/30 transition-colors cursor-pointer"
        >
          Back to Goals
        </button>
      </div>
    );
  }

  const progress = calculateGoalProgress(goal);
  const deadlineEval = evaluateGoalDeadline(goal);
  const milestones = goal.milestones || [];
  const milestoneSummary = getMilestonesSummary(milestones);
  const accentColor = goal.color || '#f59e0b';

  const handleToggleComplete = () => {
    if (goal.status === 'completed') {
      playSound.click(settings.soundEnabled);
      setGoalStatus(goal.id, 'active');
    } else {
      playSound.fanfare(settings.soundEnabled);
      triggerCelebration(settings.celebrationStyle);
      setGoalStatus(goal.id, 'completed');
    }
  };

  const handleToggleArchive = () => {
    playSound.click(settings.soundEnabled);
    if (goal.status === 'archived') {
      setGoalStatus(goal.id, 'active');
    } else {
      setGoalStatus(goal.id, 'archived');
    }
  };

  const handleDelete = () => {
    deleteGoal(goal.id);
    setActiveTab('goals');
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newMilestoneTitle.trim();
    if (!clean) return;
    addGoalMilestone(goal.id, clean);
    setNewMilestoneTitle('');
    playSound.click(settings.soundEnabled);
  };

  const handleMoveMilestone = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === milestones.length - 1)) return;
    const reordered = [...milestones];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    reorderGoalMilestones(goal.id, reordered);
    playSound.click(settings.soundEnabled);
  };

  const handleSetCustomProgress = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(customValueInput);
    if (isNaN(num) || num < 0) return;

    if (goal.progressConfig?.type === 'duration') {
      // User entered in hours or minutes, let's treat decimal hours
      const seconds = Math.round(num * 3600);
      updateGoalProgress(goal.id, { amount: seconds, isDelta: false });
    } else if (goal.progressConfig?.type === 'frequency') {
      updateGoalProgress(goal.id, { amount: Math.round(num), isDelta: false, periodKey: progress.periodKey });
    } else {
      updateGoalProgress(goal.id, { amount: num, isDelta: false });
    }

    setIsCustomInputOpen(false);
    setCustomValueInput('');
    playSound.crunch(settings.soundEnabled);
  };

  return (
    <div className="space-y-6 pb-32 animate-fade-in max-w-4xl mx-auto">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('goals')}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Goals</span>
        </button>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
            title="Edit Goal"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleArchive}
            className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
            title={goal.status === 'archived' ? 'Unarchive Goal' : 'Archive Goal'}
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsConfirmDeleteOpen(true)}
            className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
            title="Delete Goal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Goal Header Hero Card */}
      <div 
        className="glass-panel rounded-3xl p-6 sm:p-8 border shadow-xl relative overflow-hidden"
        style={{ borderColor: `${accentColor}40` }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-4 min-w-0">
            <div 
              className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-lg border shrink-0"
              style={{ background: `${accentColor}20`, borderColor: `${accentColor}50` }}
            >
              {goal.icon || '🎯'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    goal.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : goal.status === 'archived'
                        ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {goal.status}
                </span>
                {deadlineEval.hasDeadline && (
                  <span 
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                      deadlineEval.isOverdue
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : goal.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>{deadlineEval.badgeText}</span>
                  </span>
                )}
              </div>
              <h1 className="font-outfit text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {goal.title}
              </h1>
              {goal.description && (
                <p className="text-sm font-medium mt-1.5 max-w-2xl whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                  {goal.description}
                </p>
              )}
            </div>
          </div>

          {/* Complete / Reopen Action */}
          <button
            onClick={handleToggleComplete}
            className={`px-5 py-3 rounded-2xl font-outfit text-sm font-extrabold transition-all shadow-lg flex items-center space-x-2 shrink-0 cursor-pointer border ${
              goal.status === 'completed'
                ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                : 'btn-gradient-hero'
            }`}
          >
            {goal.status === 'completed' ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Reopen Goal</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Mark as Completed</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Tracking Section (if configured) */}
      {progress.hasProgress && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-zinc-800/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <BarChart2 className="w-5 h-5 text-amber-400" />
              <h2 className="font-outfit text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {goal.progressConfig?.label || 'Goal Progress'}
              </h2>
              {progress.periodLabel && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {progress.periodLabel}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <span className="font-mono text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                {progress.formattedCurrent}
              </span>
              {progress.formattedTarget && (
                <>
                  <span className="text-zinc-500">/</span>
                  <span className="font-mono text-xl font-bold text-zinc-400">{progress.formattedTarget}</span>
                </>
              )}
              {progress.percentage !== undefined && (
                <span className="text-amber-400 font-extrabold text-sm ml-1">
                  ({progress.percentage}%)
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar (capped at 100% visual) */}
          {progress.visualPercentage !== undefined && (
            <div className="space-y-1.5">
              <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden shadow-inner">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${progress.visualPercentage}%`,
                    background: progress.isTargetMet 
                      ? 'linear-gradient(to right, #10b981, #059669)' 
                      : `linear-gradient(to right, ${accentColor}, #d97706)`
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-zinc-500">
                <span>0</span>
                {progress.remaining !== undefined && progress.remaining > 0 ? (
                  <span className="text-amber-400">{progress.remaining} remaining to reach target</span>
                ) : progress.isTargetMet ? (
                  <span className="text-emerald-400">Target reached! 🎉</span>
                ) : null}
                {progress.formattedTarget && <span>{progress.formattedTarget}</span>}
              </div>
            </div>
          )}

          {/* Progress Actions */}
          <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
            {goal.progressConfig?.type === 'count' && (
              <>
                <button
                  onClick={() => updateGoalProgress(goal.id, { amount: 1, isDelta: true })}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add 1</span>
                </button>
                <button
                  onClick={() => updateGoalProgress(goal.id, { amount: 5, isDelta: true })}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  +5
                </button>
                <button
                  onClick={() => updateGoalProgress(goal.id, { amount: -1, isDelta: true })}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition-colors cursor-pointer"
                  title="Correction (-1)"
                >
                  -1
                </button>
              </>
            )}

            {goal.progressConfig?.type === 'duration' && (
              <>
                <button
                  onClick={() => updateGoalProgress(goal.id, { amount: 900, isDelta: true })}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition-colors cursor-pointer"
                >
                  +15m
                </button>
                <button
                  onClick={() => updateGoalProgress(goal.id, { amount: 1800, isDelta: true })}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition-colors cursor-pointer"
                >
                  +30m
                </button>
                <button
                  onClick={() => updateGoalProgress(goal.id, { amount: 3600, isDelta: true })}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition-colors cursor-pointer"
                >
                  +1h
                </button>
                <button
                  onClick={() => updateGoalProgress(goal.id, { amount: -900, isDelta: true })}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  -15m
                </button>
              </>
            )}

            {goal.progressConfig?.type === 'frequency' && (
              <button
                onClick={() => {
                  playSound.crunch(settings.soundEnabled);
                  updateGoalProgress(goal.id, { amount: 1, isDelta: true, periodKey: progress.periodKey });
                }}
                className="btn-gradient-hero px-5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Log Occurrence (+1)</span>
              </button>
            )}

            {/* Set Specific Value Toggle */}
            <button
              onClick={() => setIsCustomInputOpen(!isCustomInputOpen)}
              className="px-3.5 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700/60 text-zinc-400 text-xs font-semibold hover:text-zinc-200 transition-colors cursor-pointer ml-auto"
            >
              Set Exact Value...
            </button>
          </div>

          {/* Set Exact Value Inline Form */}
          {isCustomInputOpen && (
            <form onSubmit={handleSetCustomProgress} className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex gap-2 animate-fade-in">
              <input
                type="number"
                min="0"
                step="any"
                value={customValueInput}
                onChange={(e) => setCustomValueInput(e.target.value)}
                placeholder={goal.progressConfig?.type === 'duration' ? 'Hours (e.g. 12.5)' : 'New progress value...'}
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-medium outline-none focus:border-amber-400"
                style={{ color: 'var(--text-primary)' }}
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 text-amber-950 font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsCustomInputOpen(false)}
                className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      )}

      {/* Milestones Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-zinc-800/80 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CheckSquare className="w-5 h-5 text-amber-400" />
            <h2 className="font-outfit text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Milestones
            </h2>
          </div>
          {milestones.length > 0 && (
            <span className="text-xs font-bold text-zinc-400">
              {milestoneSummary.summaryText} ({milestoneSummary.percentage}%)
            </span>
          )}
        </div>

        {/* Milestone Progress Bar (if milestones exist) */}
        {milestones.length > 0 && (
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div 
              className="h-full rounded-full bg-amber-500 transition-all duration-300"
              style={{ width: `${milestoneSummary.percentage}%` }}
            />
          </div>
        )}

        {/* Milestones List */}
        {milestones.length > 0 ? (
          <div className="space-y-2">
            {milestones.map((ms, idx) => (
              <div
                key={ms.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  ms.isCompleted 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <button
                    onClick={() => {
                      playSound.crunch(settings.soundEnabled);
                      toggleGoalMilestone(goal.id, ms.id);
                    }}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      ms.isCompleted 
                        ? 'bg-emerald-500 text-emerald-950 font-bold' 
                        : 'border border-zinc-600 hover:border-amber-400'
                    }`}
                  >
                    {ms.isCompleted && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${
                      ms.isCompleted ? 'line-through text-zinc-500' : ''
                    }`} style={{ color: ms.isCompleted ? undefined : 'var(--text-primary)' }}>
                      {ms.title}
                    </p>
                    {ms.description && (
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {ms.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Milestone Operations */}
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => handleMoveMilestone(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-20 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveMilestone(idx, 'down')}
                    disabled={idx === milestones.length - 1}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-20 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      playSound.click(settings.soundEnabled);
                      deleteGoalMilestone(goal.id, ms.id);
                    }}
                    className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer ml-1"
                    title="Delete Milestone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic">
            No milestones added yet. Add checkpoints along the way to break down your goal.
          </p>
        )}

        {/* Add Milestone Form */}
        <form onSubmit={handleAddMilestone} className="flex gap-2 pt-2">
          <input
            type="text"
            value={newMilestoneTitle}
            onChange={(e) => setNewMilestoneTitle(e.target.value)}
            placeholder="Add new milestone..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-700/60 text-xs font-semibold outline-none focus:border-amber-400"
            style={{ color: 'var(--text-primary)' }}
          />
          <button
            type="submit"
            disabled={!newMilestoneTitle.trim()}
            className="btn-gradient-hero px-4 py-2.5 rounded-2xl text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Milestone</span>
          </button>
        </form>
      </div>

      {/* Edit Modal */}
      <GoalModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        goal={goal}
      />

      {/* Delete Confirmation Modal */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel max-w-sm w-full rounded-3xl p-6 text-center space-y-4 border border-rose-500/30">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Delete Goal?
            </h3>
            <p className="text-xs text-zinc-400">
              Are you sure you want to permanently delete <strong>{goal.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-xs font-bold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
