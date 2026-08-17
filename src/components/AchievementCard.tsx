import React from 'react';
import { AchievementDefinition } from '../types';
import { checkAchievementUnlock } from '../utils/adventureUtils';
import { useApp } from '../context/AppContext';
import { Lock, CheckCircle2, Sparkles } from 'lucide-react';

import { playSound } from '../services/sound';
import { triggerCelebration } from '../services/celebration';

interface AchievementCardProps {
  achievement: AchievementDefinition;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const { stats, rewardLogs, updateAchievement, showToast, settings } = useApp();
  const canUnlock = checkAchievementUnlock(achievement, stats, rewardLogs);
  const isUnlocked = achievement.status === 'unlocked';

  const handleUnlock = () => {
    const updated: AchievementDefinition = {
      ...achievement,
      status: 'unlocked',
      unlockedAt: new Date().toISOString()
    };
    updateAchievement(updated);
    playSound.fanfare(settings.soundEnabled);
    triggerCelebration(settings.celebrationStyle);
    showToast(`🏆 Achievement Unlocked: "${achievement.name}" (+${achievement.xpReward} XP / +${achievement.coinReward} Coins)!`);
  };

  return (
    <div
      className={`glass-panel rounded-2xl p-4 space-y-3 transition-all duration-300 relative overflow-hidden ${
        isUnlocked 
          ? 'border-amber-500/40 bg-amber-500/5 shadow-amber-500/10' 
          : 'opacity-80 hover:opacity-100'
      }`}
      style={{
        border: '1px solid var(--glass-border)',
        boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.2)'
      }}
    >
      <div className="flex items-start space-x-3.5">
        <div 
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-md flex-shrink-0"
          style={{
            background: isUnlocked 
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(236, 72, 153, 0.3))'
              : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isUnlocked ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`
          }}
        >
          {achievement.icon || '🏆'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-outfit text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {achievement.name}
            </h4>
            {isUnlocked ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                <span>Unlocked</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                <Lock className="w-3 h-3" />
                <span>Locked</span>
              </span>
            )}
          </div>

          <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
            {achievement.description}
          </p>

          <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 mt-2">
            <span>+{achievement.xpReward} XP • +{achievement.coinReward} Coins</span>
            {achievement.category && (
              <span className="text-gray-400 font-normal">{achievement.category}</span>
            )}
          </div>
        </div>
      </div>

      {/* Unlock Action Trigger */}
      {canUnlock && !isUnlocked && (
        <button
          onClick={handleUnlock}
          className="w-full py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-amber-950 shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Claim Milestone (+{achievement.xpReward} XP)</span>
        </button>
      )}
    </div>
  );
};
