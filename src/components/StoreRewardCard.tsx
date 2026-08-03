import React from 'react';
import { StoreReward } from '../types';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { ShoppingBag, Lock } from 'lucide-react';
import { playSound } from '../services/sound';

interface StoreRewardCardProps {
  reward: StoreReward;
  onEdit?: (reward: StoreReward) => void;
}

export const StoreRewardCard: React.FC<StoreRewardCardProps> = ({ reward, onEdit }) => {
  const { stats, settings, purchaseReward } = useApp();
  const isAffordable = stats.coinBalance >= reward.cost;

  const handlePurchase = () => {
    playSound.click(settings.soundEnabled);
    purchaseReward(reward.id);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between overflow-hidden"
    >
      <div className="space-y-3">
        {/* Cover Image or Emoji Icon */}
        <div
          className="relative w-full h-36 rounded-xl overflow-hidden flex items-center justify-center"
          style={{ background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)' }}
        >
          {reward.image ? (
            <img
              src={reward.image}
              alt={reward.name}
              className="w-full h-full object-cover rounded-xl transition-transform hover:scale-105"
            />
          ) : (
            <span className="text-6xl filter drop-shadow-lg select-none">{reward.icon}</span>
          )}

          {/* Cost Badge */}
          <div
            className="absolute top-3 right-3 px-3 py-1 rounded-full backdrop-blur-md font-outfit font-extrabold text-sm shadow-lg flex items-center space-x-1"
            style={{
              background: 'rgba(0,0,0,0.65)',
              border: '1px solid var(--pill-badge-border)',
              color: 'var(--pill-badge-text)',
            }}
          >
            <span>{reward.cost}</span>
            <span>{settings.currencySymbol}</span>
          </div>

          {/* Category Tag */}
          <div
            className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-md backdrop-blur-md font-mono text-[10px]"
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-muted)',
            }}
          >
            {reward.category}
          </div>
        </div>

        {/* Info */}
        <div>
          <h3 className="font-outfit text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            {reward.name}
          </h3>
          {reward.description && (
            <p className="text-xs line-clamp-2 mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>
              {reward.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 flex items-center space-x-2" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <button
          onClick={handlePurchase}
          disabled={!isAffordable}
          className={`flex-1 py-2.5 px-4 rounded-xl font-outfit text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            isAffordable
              ? 'bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-600/25 border border-amber-400/50 hover:scale-[1.02]'
              : 'opacity-50 cursor-not-allowed'
          }`}
          style={!isAffordable ? { background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' } : {}}
        >
          {isAffordable ? <ShoppingBag className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span>{isAffordable ? 'Redeem Reward' : `Need ${reward.cost - stats.coinBalance} More`}</span>
        </button>

        {onEdit && (
          <button
            onClick={() => onEdit(reward)}
            className="p-2.5 rounded-xl text-xs font-bold cursor-pointer"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-accent)' }}
            title="Edit Store Item"
          >
            Edit
          </button>
        )}
      </div>
    </motion.div>
  );
};
