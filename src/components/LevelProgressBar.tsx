import React from 'react';
import { useApp } from '../context/AppContext';
import { Flame, Shield, Swords } from 'lucide-react';
import { motion } from 'framer-motion';

export const LevelProgressBar: React.FC = () => {
  const { stats } = useApp();

  const getLevelIcon = (level: number) => {
    if (level >= 50) return <Shield className="w-5 h-5 text-purple-400" />;
    if (level >= 20) return <Swords className="w-5 h-5 text-red-400" />;
    return <Flame className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="glass-panel p-4 rounded-2xl w-full border border-amber-500/20 shadow-lg shadow-amber-500/5 relative overflow-hidden">
      {/* Background glow for high levels */}
      {stats.level >= 20 && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />
      )}

      <div className="flex justify-between items-end mb-2 relative z-10">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/30 shadow-inner">
            {getLevelIcon(stats.level)}
          </div>
          <div>
            <h2 className="font-outfit text-sm font-extrabold" style={{ color: 'var(--text-secondary)' }}>
              LEVEL
            </h2>
            <div className="font-outfit text-2xl font-black leading-none bg-clip-text text-transparent bg-gradient-to-br from-amber-400 to-amber-600">
              {stats.level}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>
            Next Level
          </div>
          <div className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {stats.xpToNextLevel} XP
          </div>
        </div>
      </div>

      <div className="relative w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50 mt-3 z-10 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${stats.levelProgress}%` }}
          transition={{ duration: 1, type: "spring", bounce: 0 }}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]" />
        </motion.div>
      </div>
      
      <div className="flex justify-between items-center mt-1.5 text-[10px] font-extrabold text-zinc-500 relative z-10">
        <span>{stats.totalXp} Total XP</span>
        <span>{stats.levelProgress}%</span>
      </div>
    </div>
  );
};
