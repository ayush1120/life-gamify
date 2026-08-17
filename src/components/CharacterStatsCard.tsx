import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ALL_STAT_IDS } from '../utils/progressionUtils';
import { Shield, ChevronDown, ChevronUp, Sparkles, TrendingUp } from 'lucide-react';

export const CharacterStatsCard: React.FC = () => {
  const { stats } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  const breakdown = stats.statsBreakdown;
  if (!breakdown) return null;

  // Find top stat
  const topStat = ALL_STAT_IDS.reduce((highest, current) => {
    return breakdown[current].xp > breakdown[highest].xp ? current : highest;
  }, ALL_STAT_IDS[0]);

  const topStatData = breakdown[topStat];

  return (
    <div 
      className="glass-panel rounded-2xl p-5 sm:p-6 transition-all duration-300 relative overflow-hidden"
      style={{
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)'
      }}
    >
      {/* Background glow effects */}
      <div 
        className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-10 blur-3xl"
        style={{ background: topStatData.color }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(236, 72, 153, 0.2))',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}
          >
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-outfit text-lg font-extrabold tracking-wide" style={{ color: 'var(--text-primary)' }}>
                Life Attributes & Stats
              </h3>
              <span 
                className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                style={{ 
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--text-accent)',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}
              >
                RPG Engine
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Deterministic mastery derived from your logged activities
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
          style={{ color: 'var(--text-muted)' }}
          title={isExpanded ? 'Collapse stats' : 'Expand all 7 stats'}
        >
          <span className="hidden sm:inline">{isExpanded ? 'Less' : 'View All'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Primary Focus Badge */}
      <div 
        className="flex items-center justify-between p-3 rounded-xl mb-4 text-xs font-medium"
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)'
        }}
      >
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span style={{ color: 'var(--text-secondary)' }}>Dominant Attribute:</span>
          <span className="font-bold flex items-center gap-1.5" style={{ color: topStatData.color }}>
            <span>{topStatData.icon}</span>
            <span>{topStatData.name} (Lv. {topStatData.level})</span>
          </span>
        </div>
        <div className="flex items-center space-x-1 font-bold text-amber-400">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{topStatData.xp} XP</span>
        </div>
      </div>

      {/* Grid of 7 Stats */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 transition-all duration-300 ${!isExpanded ? 'max-h-[220px] overflow-hidden' : ''}`}>
        {ALL_STAT_IDS.map((statId) => {
          const item = breakdown[statId];
          return (
            <div
              key={statId}
              className="p-3.5 rounded-xl transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl drop-shadow-sm">{item.icon}</span>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {item.xp} XP total
                    </span>
                  </div>
                </div>

                <div 
                  className="px-2 py-0.5 rounded-lg text-xs font-black"
                  style={{
                    background: `${item.color}20`,
                    color: item.color,
                    border: `1px solid ${item.color}40`
                  }}
                >
                  Lv. {item.level}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div 
                  className="h-2 w-full rounded-full overflow-hidden"
                  style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.levelProgress}%`,
                      background: `linear-gradient(90deg, ${item.color}bb, ${item.color})`,
                      boxShadow: `0 0 8px ${item.color}66`
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <span>{item.levelProgress}% to Lv. {item.level + 1}</span>
                  <span>{item.xpToNextLevel} XP left</span>
                </div>
              </div>

              {/* Description preview in expanded mode */}
              {isExpanded && (
                <p className="mt-2 text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {item.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Expand trigger button footer */}
      {!isExpanded && (
        <div className="pt-3 text-center">
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <span>Show all 7 attributes</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
