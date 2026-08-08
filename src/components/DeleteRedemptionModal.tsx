import React from 'react';
import { RewardRedemption } from '../types';
import { calculateRestockingFee, isGracePeriod } from '../services/ledger';
import { ShoppingBag, Sparkles, RefreshCw, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CoinToken } from './CoinToken';

interface DeleteRedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (redemption: RewardRedemption, netRefund: number, fee: number) => void;
  redemption: RewardRedemption | null;
}

export const DeleteRedemptionModal: React.FC<DeleteRedemptionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  redemption
}) => {
  const { stats } = useApp();

  if (!isOpen || !redemption) return null;

  const isFreeGrace = isGracePeriod(redemption.timestamp);
  const restockingFee = isFreeGrace ? 0 : calculateRestockingFee(redemption.coinsSpent);
  const netRefund = Math.max(0, redemption.coinsSpent - restockingFee);
  const activeDebt = stats.phantomDebt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5"
        style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-outfit text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ShoppingBag className="w-5 h-5" style={{ color: 'var(--text-accent)' }} />
            <span>Cancel Reward Redemption</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full cursor-pointer hover:opacity-80"
            style={{ background: 'var(--pill-badge-bg)', color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm">
          <div className="flex items-center space-x-3 p-3 rounded-2xl" style={{ background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)' }}>
            <span className="text-3xl">{redemption.icon || '🛍️'}</span>
            <div>
              <h4 className="font-outfit font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{redemption.rewardName}</h4>
              <p className="text-xs flex items-center space-x-1" style={{ color: 'var(--text-muted)' }}>
                <span>Originally spent {redemption.coinsSpent}</span>
                <CoinToken size={14} />
              </p>
            </div>
          </div>

          {isFreeGrace ? (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs space-y-1">
              <p className="font-bold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> 1-Hour Grace Period (Free Refund)
              </p>
              <p style={{ color: 'var(--text-primary)' }}>
                This purchase was made within the last 60 minutes. Refunding now is 100% free!
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs space-y-1">
              <p className="font-bold text-amber-400 flex items-center gap-1">
                <RefreshCw className="w-4 h-4" /> Late Refund Notice (15% Restocking Fee)
              </p>
              <p style={{ color: 'var(--text-primary)' }}>
                This purchase was made over 1 hour ago. Refunding incurs a 15% restocking fee.
              </p>
            </div>
          )}

          {/* Refund Breakdown */}
          <div className="p-3.5 rounded-xl space-y-2 text-xs font-mono" style={{ background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)' }}>
            <div className="flex justify-between items-center" style={{ color: 'var(--text-secondary)' }}>
              <span>Original Spent:</span>
              <span className="font-bold text-emerald-400 flex items-center space-x-1">
                <span>+{redemption.coinsSpent}</span>
                <CoinToken size={12} />
              </span>
            </div>
            {!isFreeGrace && (
              <div className="flex justify-between items-center" style={{ color: 'var(--text-secondary)' }}>
                <span>Restocking Fee (15%):</span>
                <span className="font-bold text-rose-400 flex items-center space-x-1">
                  <span>-{restockingFee}</span>
                  <CoinToken size={12} />
                </span>
              </div>
            )}
            <div className="pt-2 border-t flex justify-between items-center font-bold" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}>
              <span>Net Refund:</span>
              <span className="text-emerald-400 flex items-center space-x-1">
                <span>+{netRefund}</span>
                <CoinToken size={12} />
              </span>
            </div>
          </div>

          {activeDebt > 0 && (
            <p className="text-xs font-bold text-amber-400 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center flex-wrap gap-1">
              <span>💡 Note: Your +{netRefund} refund will automatically pay off your active Phantom Debt (-{activeDebt} coins) first!</span>
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 rounded-xl font-bold cursor-pointer text-xs"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}
          >
            Keep Purchase
          </button>

          <button
            type="button"
            onClick={() => onConfirm(redemption, netRefund, restockingFee)}
            className="btn-gradient-hero flex-1 py-2.5 rounded-xl font-outfit text-xs font-bold flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="flex items-center space-x-1">
              <span>Refund & Delete (+{netRefund}</span>
              <CoinToken size={14} />
              <span>)</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
