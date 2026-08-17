import React from 'react';
import { BossDefinition } from '../types';
import { computeBossState } from '../utils/adventureUtils';
import { useApp } from '../context/AppContext';
import { Flame, Trophy, Clock, Archive, Swords } from 'lucide-react';

import { STAT_DEFINITIONS } from '../utils/progressionUtils';
import { playSound } from '../services/sound';
import { triggerCelebration } from '../services/celebration';

interface BossCardProps {
  boss: BossDefinition;
}

export const BossCard: React.FC<BossCardProps> = ({ boss }) => {
  const { rewardLogs, habits, activityMappings, updateBoss, archiveBoss, showToast, settings } = useApp();
  const bossState = computeBossState(boss, rewardLogs, habits, activityMappings);

  const handleClaimVictory = () => {
    const updated: BossDefinition = {
      ...boss,
      status: 'defeated',
      defeatedAt: new Date().toISOString()
    };
    updateBoss(updated);
    playSound.fanfare(settings.soundEnabled);
    triggerCelebration('fireworks');
    showToast(`👑 BOSS DEFEATED! You triumphed over "${boss.name}" (+${boss.xpReward} XP & +${boss.coinReward} Coins)!`);
  };

  return (
    <div 
      className={`glass-panel rounded-3xl p-6 space-y-5 relative overflow-hidden transition-all duration-300 ${
        bossState.isDefeated ? 'border-amber-500/50 shadow-amber-500/10' : 'border-red-500/30'
      }`}
      style={{
        boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Dynamic Background Glow */}
      <div 
        className="absolute -top-12 -right-12 w-64 h-64 rounded-full pointer-events-none opacity-20 blur-3xl"
        style={{ background: bossState.isDefeated ? '#f59e0b' : '#ef4444' }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center space-x-3.5">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0"
            style={{
              background: bossState.isDefeated 
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(236, 72, 153, 0.3))'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(185, 28, 28, 0.3))',
              border: `1px solid ${bossState.isDefeated ? 'rgba(245, 158, 11, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
            }}
          >
            {bossState.isDefeated ? '👑' : '🐉'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-500/15 px-2 py-0.5 rounded-md border border-red-500/30">
                World Boss
              </span>
              <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                {boss.theme}
              </span>
            </div>
            <h3 className="font-outfit text-xl font-extrabold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {boss.name}
            </h3>
          </div>
        </div>

        <button
          onClick={() => archiveBoss(boss.id)}
          title="Archive Boss Encounter"
          className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-amber-400 transition-colors cursor-pointer"
        >
          <Archive className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs leading-relaxed relative z-10" style={{ color: 'var(--text-secondary)' }}>
        {boss.description}
      </p>

      {/* Relevant Stats Vulnerabilities */}
      <div className="space-y-1.5 relative z-10">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
          <Swords className="w-3 h-3 text-red-400" />
          <span>Boss Weaknesses (Damage Multipliers)</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {boss.relevantStats.map((statId) => {
            const def = STAT_DEFINITIONS[statId];
            if (!def) return null;
            return (
              <span
                key={statId}
                className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5"
                style={{
                  background: `${def.color}20`,
                  color: def.color,
                  border: `1px solid ${def.color}40`
                }}
              >
                <span>{def.icon}</span>
                <span>{def.name}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Boss Health Bar */}
      <div className="space-y-2 relative z-10">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="flex items-center gap-1.5" style={{ color: bossState.isDefeated ? '#10b981' : '#ef4444' }}>
            <Flame className="w-4 h-4" />
            <span>Boss HP: {bossState.currentHp} / {boss.maxHp}</span>
          </span>
          <span className="text-gray-400 flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3" />
            <span>{bossState.daysRemaining} days remaining</span>
          </span>
        </div>

        <div className="h-4 w-full rounded-full overflow-hidden bg-black/40 p-0.5 border border-red-500/20">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${bossState.percentage}%`,
              background: bossState.isDefeated 
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : 'linear-gradient(90deg, #ef4444, #f97316)',
              boxShadow: bossState.isDefeated ? '0 0 15px rgba(16, 185, 129, 0.6)' : '0 0 15px rgba(239, 68, 68, 0.6)'
            }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>Dealt {bossState.damageDealt} Total Damage</span>
          <div className="flex items-center space-x-2 font-bold text-amber-400">
            <span>Bounty: +{boss.xpReward} XP</span>
            <span>+{boss.coinReward} Coins</span>
          </div>
        </div>
      </div>

      {/* Victory Action */}
      {bossState.isDefeated && boss.status === 'active' && (
        <button
          onClick={handleClaimVictory}
          className="w-full py-3.5 rounded-2xl font-outfit font-black text-sm flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-xl shadow-amber-500/25 hover:opacity-90 active:scale-95 transition-all cursor-pointer relative z-10"
        >
          <Trophy className="w-5 h-5" />
          <span>Claim Epic Boss Victory Bounty (+{boss.xpReward} XP / +{boss.coinReward} Coins)!</span>
        </button>
      )}
    </div>
  );
};
