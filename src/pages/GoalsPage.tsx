import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Goal, GoalStatus } from '../types';
import { GoalModal } from '../components/GoalModal';
import { 
  calculateGoalProgress, 
  evaluateGoalDeadline, 
  getMilestonesSummary 
} from '../utils/goalUtils';
import { 
  Plus, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  Search, 
  CheckSquare,
  AlertCircle
} from 'lucide-react';

import { playSound } from '../services/sound';
import { triggerCelebration } from '../services/celebration';

export const GoalsPage: React.FC = () => {
  const { 
    goals, 
    updateGoalProgress, 
    setGoalStatus, 
    setActiveTab, 
    settings 
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedStatusTab, setSelectedStatusTab] = useState<GoalStatus>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const counts = useMemo(() => {
    return {
      active: goals.filter(g => g.status === 'active').length,
      completed: goals.filter(g => g.status === 'completed').length,
      archived: goals.filter(g => g.status === 'archived').length
    };
  }, [goals]);

  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      const matchesStatus = g.status === selectedStatusTab;
      const matchesSearch = searchQuery === '' || 
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [goals, selectedStatusTab, searchQuery]);

  const handleCreate = () => {
    playSound.click(settings.soundEnabled);
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const handleCardClick = (goalId: string) => {
    playSound.click(settings.soundEnabled);
    setActiveTab(`goals/${goalId}`);
  };

  const handleQuickIncrement = (e: React.MouseEvent, goal: Goal) => {
    e.stopPropagation();
    playSound.crunch(settings.soundEnabled);
    if (!goal.progressConfig) return;

    if (goal.progressConfig.type === 'frequency') {
      const { periodKey } = calculateGoalProgress(goal);
      updateGoalProgress(goal.id, { amount: 1, isDelta: true, periodKey });
    } else {
      updateGoalProgress(goal.id, { amount: 1, isDelta: true });
    }
  };

  const handleToggleComplete = (e: React.MouseEvent, goal: Goal) => {
    e.stopPropagation();
    if (goal.status === 'completed') {
      playSound.click(settings.soundEnabled);
      setGoalStatus(goal.id, 'active');
    } else {
      playSound.fanfare(settings.soundEnabled);
      triggerCelebration(settings.celebrationStyle);
      setGoalStatus(goal.id, 'completed');
    }
  };

  return (
    <div className="space-y-6 pb-32 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-outfit text-3xl font-extrabold flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow-md">
              🎯
            </div>
            <span>Goals</span>
          </h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
            Outcomes and achievements you want to conquer
          </p>
        </div>

        <button
          id="btn-add-goal"
          onClick={handleCreate}
          className="btn-gradient-hero px-5 py-3 rounded-2xl font-outfit text-sm font-extrabold flex items-center space-x-2 shadow-lg cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Create Goal</span>
        </button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
          {[
            { id: 'active', label: 'Active', count: counts.active },
            { id: 'completed', label: 'Completed', count: counts.completed },
            { id: 'archived', label: 'Archived', count: counts.archived }
          ].map(tab => {
            const isActive = selectedStatusTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playSound.click(settings.soundEnabled);
                  setSelectedStatusTab(tab.id as GoalStatus);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-amber-400 text-amber-950 font-extrabold' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search goals..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs font-medium outline-none focus:border-amber-400 transition-colors placeholder:text-zinc-500"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Goals Grid / Empty State */}
      {filteredGoals.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center space-y-4 border border-zinc-800/80">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto shadow-inner">
            {selectedStatusTab === 'active' ? '🎯' : selectedStatusTab === 'completed' ? '🏆' : '📦'}
          </div>
          <div className="space-y-1">
            <h3 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {selectedStatusTab === 'active' 
                ? 'No Active Goals Yet' 
                : selectedStatusTab === 'completed' 
                  ? 'No Completed Goals' 
                  : 'No Archived Goals'}
            </h3>
            <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
              {selectedStatusTab === 'active'
                ? 'A goal can be as simple as a title, or tracked with milestones and progress targets.'
                : selectedStatusTab === 'completed'
                  ? 'When you accomplish an outcome, mark it complete to celebrate your victory here.'
                  : 'Goals you archive will be kept safe here without cluttering your active dashboard.'}
            </p>
          </div>
          {selectedStatusTab === 'active' && (
            <button
              onClick={handleCreate}
              className="btn-gradient-hero px-5 py-2.5 rounded-2xl font-outfit text-xs font-extrabold shadow-lg cursor-pointer inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Goal</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const progress = calculateGoalProgress(goal);
            const deadlineEval = evaluateGoalDeadline(goal);
            const milestoneSummary = getMilestonesSummary(goal.milestones || []);
            const accentColor = goal.color || '#f59e0b';

            return (
              <div
                key={goal.id}
                onClick={() => handleCardClick(goal.id)}
                className="glass-panel rounded-3xl p-5 border transition-all hover:scale-[1.01] hover:shadow-xl cursor-pointer flex flex-col justify-between space-y-4 relative group"
                style={{ borderColor: `${accentColor}30` }}
              >
                {/* Top Section */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md border shrink-0 group-hover:scale-105 transition-transform"
                        style={{ background: `${accentColor}20`, borderColor: `${accentColor}50` }}
                      >
                        {goal.icon || '🎯'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-outfit font-extrabold text-base sm:text-lg truncate tracking-tight" style={{ color: 'var(--text-primary)' }}>
                          {goal.title}
                        </h3>
                        {goal.description && (
                          <p className="text-xs truncate font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {goal.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Deadline Badge */}
                    {deadlineEval.hasDeadline && (
                      <div 
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight shrink-0 flex items-center gap-1 border ${
                          deadlineEval.isOverdue
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : goal.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : deadlineEval.daysRemaining === 0
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60'
                        }`}
                      >
                        {deadlineEval.isOverdue ? (
                          <AlertCircle className="w-3 h-3 text-rose-400" />
                        ) : (
                          <Calendar className="w-3 h-3" />
                        )}
                        <span>{deadlineEval.badgeText}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Tracking Section (if configured) */}
                  {progress.hasProgress && (
                    <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold font-outfit" style={{ color: 'var(--text-secondary)' }}>
                          {goal.progressConfig?.label || 'Progress'}
                          {progress.periodLabel && (
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                              {progress.periodLabel}
                            </span>
                          )}
                        </span>
                        <div className="font-mono font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                          <span>{progress.formattedCurrent}</span>
                          {progress.formattedTarget && (
                            <>
                              <span className="text-zinc-500">/</span>
                              <span className="text-zinc-400">{progress.formattedTarget}</span>
                            </>
                          )}
                          {progress.percentage !== undefined && (
                            <span className="text-amber-400 text-[11px] ml-1">
                              ({progress.percentage}%)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar (capped at 100% visual) */}
                      {progress.visualPercentage !== undefined && (
                        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${progress.visualPercentage}%`,
                              background: progress.isTargetMet 
                                ? 'linear-gradient(to r, #10b981, #059669)' 
                                : `linear-gradient(to r, ${accentColor}, #d97706)`
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Milestones Summary (if present) */}
                  {milestoneSummary.total > 0 && (
                    <div className="flex items-center justify-between text-xs px-1">
                      <div className="flex items-center space-x-1.5 text-zinc-400">
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>{milestoneSummary.summaryText}</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-zinc-400">
                        {milestoneSummary.percentage}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {/* Status Toggle Button */}
                    <button
                      onClick={(e) => handleToggleComplete(e, goal)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer border ${
                        goal.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-zinc-800/60 text-zinc-300 border-zinc-700/60 hover:bg-zinc-700/60'
                      }`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${goal.status === 'completed' ? 'text-emerald-400' : 'text-zinc-400'}`} />
                      <span>{goal.status === 'completed' ? 'Completed' : 'Mark Done'}</span>
                    </button>

                    {/* Quick +1 Progress action if tracking is enabled */}
                    {progress.hasProgress && goal.status === 'active' && (
                      <button
                        onClick={(e) => handleQuickIncrement(e, goal)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition-colors cursor-pointer flex items-center space-x-1"
                        title="Quick Log +1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>1</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 text-xs text-zinc-400 group-hover:text-amber-400 transition-colors">
                    <span className="font-semibold text-[11px]">View Details</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Modal */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        goal={editingGoal}
      />
    </div>
  );
};
