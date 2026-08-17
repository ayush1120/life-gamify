import React from 'react';
import { QuestDefinition } from '../types';
import { computeQuestProgress } from '../utils/adventureUtils';
import { useApp } from '../context/AppContext';
import { Sword, CheckCircle, Archive, Trash2, Sparkles, Target } from 'lucide-react';

import { triggerCelebration } from '../services/celebration';
import { playSound } from '../services/sound';

interface QuestCardProps {
  quest: QuestDefinition;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest }) => {
  const { rewardLogs, updateQuest, archiveQuest, deleteQuest, showToast, settings } = useApp();
  const progress = computeQuestProgress(quest, rewardLogs);

  const handleClaimReward = () => {
    const updated: QuestDefinition = {
      ...quest,
      status: 'completed',
      completedAt: new Date().toISOString()
    };
    updateQuest(updated);
    playSound.fanfare(settings.soundEnabled);
    triggerCelebration(settings.celebrationStyle);
    showToast(`🎉 Quest Complete! +${quest.xpReward} XP & +${quest.coinReward} Coins earned!`);
  };

  const difficultyColors: Record<string, { bg: string; text: string; border: string }> = {
    easy: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
    medium: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
    hard: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' }
  };

  const diffStyle = difficultyColors[quest.difficulty] || difficultyColors.medium;

  return (
    <div 
      className={`glass-panel rounded-2xl p-5 space-y-4 relative overflow-hidden transition-all duration-300 ${
        quest.status === 'completed' ? 'opacity-75 border-emerald-500/40' : 'hover:scale-[1.01]'
      }`}
      style={{
        border: '1px solid var(--glass-border)',
        boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
            style={{ 
              background: quest.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              border: `1px solid ${quest.status === 'completed' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
            }}
          >
            {quest.status === 'completed' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <Sword className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-outfit text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {quest.title}
              </h4>
              <span 
                className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                style={{ 
                  background: diffStyle.bg, 
                  color: diffStyle.text, 
                  border: `1px solid ${diffStyle.border}` 
                }}
              >
                {quest.difficulty}
              </span>
              <span 
                className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/5 text-gray-400 border border-white/10"
              >
                {quest.type}
              </span>
            </div>
            <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
              {quest.description}
            </p>
          </div>
        </div>

        {/* Action Controls Menu */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            onClick={() => archiveQuest(quest.id)}
            title="Archive Quest"
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-amber-400 transition-colors cursor-pointer"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteQuest(quest.id)}
            title="Delete Quest"
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Requirements Progress List */}
      <div className="space-y-2 pt-1">
        {progress.requirements.map((req, idx) => (
          <div 
            key={idx} 
            className="p-2.5 rounded-xl flex items-center justify-between text-xs"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <div className="flex items-center space-x-2">
              <Target className={`w-3.5 h-3.5 ${req.completed ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {req.habitName || 'Habit activity'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold font-mono" style={{ color: req.completed ? '#10b981' : 'var(--text-primary)' }}>
                {req.currentCount} / {req.targetCount}
              </span>
              {req.completed && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-2 w-full rounded-full overflow-hidden bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress.percentage}%`,
              background: progress.isComplete 
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              boxShadow: progress.isComplete ? '0 0 10px rgba(16, 185, 129, 0.5)' : '0 0 10px rgba(245, 158, 11, 0.4)'
            }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>{progress.percentage}% Completed</span>
          <div className="flex items-center space-x-2 font-bold text-amber-400">
            <span>+{quest.xpReward} XP</span>
            <span>+{quest.coinReward} Coins</span>
          </div>
        </div>
      </div>

      {/* Completion Claim Button */}
      {progress.isComplete && quest.status === 'active' && (
        <button
          onClick={handleClaimReward}
          className="w-full py-2.5 rounded-xl font-outfit font-extrabold text-xs flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Claim Quest Rewards (+{quest.xpReward} XP / +{quest.coinReward} Coins)</span>
        </button>
      )}
    </div>
  );
};
