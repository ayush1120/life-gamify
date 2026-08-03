import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlyingRewardProps {
  reward: {
    habitName: string;
    icon: string;
    amount: number;
    x: number;
    y: number;
  } | null;
  onComplete: () => void;
}

export const FlyingReward: React.FC<FlyingRewardProps> = ({ reward, onComplete }) => {
  useEffect(() => {
    if (reward) {
      const timer = setTimeout(() => {
        onComplete();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [reward, onComplete]);

  return (
    <AnimatePresence>
      {reward && (
        <motion.div
          key={`fly-${reward.x}-${reward.y}`}
          initial={{
            opacity: 1,
            scale: 0.6,
            x: reward.x - 40,
            y: reward.y - 20
          }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0.6, 1.3, 0.9],
            y: [reward.y - 20, reward.y - 120, reward.y - 180],
          }}
          transition={{ duration: 0.85, ease: 'easeOut' }}
          className="fixed z-50 pointer-events-none flex items-center space-x-2 bg-amber-500/90 text-amber-950 px-3 py-1.5 rounded-full shadow-2xl font-bold font-outfit border border-amber-300 backdrop-blur-md"
        >
          <span className="text-xl">{reward.icon}</span>
          <span className="text-lg">+{reward.amount}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
