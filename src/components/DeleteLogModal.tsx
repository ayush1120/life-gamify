import React from 'react';
import { RewardLog } from '../types';
import { calculateMistakeFee, calculateKarmaSurcharge, isGracePeriod } from '../services/ledger';
import { AlertTriangle, Trash2, ShieldAlert, Sparkles, X, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CoinToken } from './CoinToken';

interface DeleteLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (log: RewardLog, isDeficit: boolean, fee: number) => void;
  log: RewardLog | null;
}

export const DeleteLogModal: React.FC<DeleteLogModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  log
}) => {
  const { stats } = useApp();

  if (!isOpen || !log) return null;

  const currentBalance = stats.coinBalance;
  const totalEarned = stats.totalCoinsEarned;
  const totalSpent = stats.totalCoinsSpent;

  // Determine if deleting this log creates/adds to a ledger deficit
  const isDeficit = (totalEarned - log.rewardEarned) < totalSpent;

  const isFreeGrace = isGracePeriod(log.timestamp);
  const mistakeFee = isFreeGrace ? 0 : calculateMistakeFee(currentBalance);
  const karmaFee = calculateKarmaSurcharge(currentBalance);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5"
        style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-outfit text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            {isDeficit ? (
              <>
                <AlertTriangle className="w-6 h-6 text-amber-500 animate-pulse" />
                <span>Karma Ledger Warning</span>
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5 text-rose-400" />
                <span>Delete Activity Log</span>
              </>
            )}
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
        {isDeficit ? (
          /* Deficit / Karma Delete View */
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-amber-400 text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" /> Spent Coins Deficit
              </p>
              <p className="text-xs leading-relaxed flex items-center flex-wrap gap-1" style={{ color: 'var(--text-primary)' }}>
                <span>You have already spent the</span>
                <span className="font-bold">+{log.rewardEarned}</span>
                <CoinToken size={14} />
                <span>earned from this habit on Store Rewards!</span>
              </p>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Deleting this entry will mark it as a <strong style={{ color: 'var(--text-accent)' }}>[👻 Retracted Log]</strong> in your history and apply a 2% Karma Surcharge, creating a Phantom Debt banner until you complete new habits.
            </p>

            <div className="p-3 rounded-xl space-y-1.5 text-xs font-mono" style={{ background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)' }}>
              <div className="flex justify-between items-center" style={{ color: 'var(--text-secondary)' }}>
                <span>Unearned Deficit:</span>
                <span className="font-bold text-amber-400 flex items-center space-x-1">
                  <span>-{log.rewardEarned}</span>
                  <CoinToken size={12} />
                </span>
              </div>
              <div className="flex justify-between items-center" style={{ color: 'var(--text-secondary)' }}>
                <span>Karma Surcharge (2% Vault):</span>
                <span className="font-bold text-amber-400 flex items-center space-x-1">
                  <span>-{karmaFee}</span>
                  <CoinToken size={12} />
                </span>
              </div>
            </div>
          </div>
        ) : isFreeGrace ? (
          /* 1-Hour Grace Period (Free Delete) View */
          <div className="space-y-4 text-sm">
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs space-y-1">
              <p className="font-bold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> 1-Hour Grace Period (Free Delete)
              </p>
              <p style={{ color: 'var(--text-primary)' }}>
                This habit was logged within the last 60 minutes. Deleting now is <strong>100% free with 0% fee</strong>!
              </p>
            </div>

            <div className="p-3.5 rounded-xl space-y-2 text-xs font-mono" style={{ background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)' }}>
              <div className="flex justify-between items-center" style={{ color: 'var(--text-secondary)' }}>
                <span>Log Coins Removed:</span>
                <span className="font-bold text-rose-400 flex items-center space-x-1">
                  <span>-{log.rewardEarned}</span>
                  <CoinToken size={12} />
                </span>
              </div>
              <div className="flex justify-between items-center" style={{ color: 'var(--text-secondary)' }}>
                <span>Mistake Fee (Grace Period):</span>
                <span className="font-bold text-emerald-400">0 (Free)</span>
              </div>
              <div className="pt-2 border-t flex justify-between items-center font-bold" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}>
                <span>Net Deducted:</span>
                <span className="text-rose-400 flex items-center space-x-1">
                  <span>-{log.rewardEarned}</span>
                  <CoinToken size={12} />
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Late Delete View (1% Fee Applied) */
          <div className="space-y-4 text-sm">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs space-y-1">
              <p className="font-bold text-amber-400 flex items-center gap-1">
                <Clock className="w-4 h-4" /> Late Delete Notice (1% Mistake Fee)
              </p>
              <p style={{ color: 'var(--text-primary)' }}>
                This log is over 1 hour old. Proceeding will remove the entry and deduct a <strong>1% Mistake Fee</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl space-y-2 text-xs font-mono" style={{ background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)' }}>
              <div className="flex justify-between items-center" style={{ color: 'var(--text-secondary)' }}>
                <span>Log Coins Removed:</span>
                <span className="font-bold text-rose-400 flex items-center space-x-1">
                  <span>-{log.rewardEarned}</span>
                  <CoinToken size={12} />
                </span>
              </div>
              <div className="flex justify-between items-center" style={{ color: 'var(--text-secondary)' }}>
                <span>Mistake Fee (1% Vault):</span>
                <span className="font-bold text-rose-400 flex items-center space-x-1">
                  <span>-{mistakeFee}</span>
                  <CoinToken size={12} />
                </span>
              </div>
              <div className="pt-2 border-t flex justify-between items-center font-bold" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}>
                <span>Total Deducted:</span>
                <span className="text-rose-400 flex items-center space-x-1">
                  <span>-{log.rewardEarned + mistakeFee}</span>
                  <CoinToken size={12} />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 rounded-xl font-bold cursor-pointer text-xs"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}
          >
            Keep Log
          </button>

          <button
            type="button"
            onClick={() => onConfirm(log, isDeficit, isDeficit ? karmaFee : mistakeFee)}
            className={`flex-1 py-2.5 rounded-xl font-outfit text-xs font-bold flex items-center justify-center space-x-2 shadow-lg cursor-pointer ${
              isDeficit
                ? 'bg-amber-500 text-amber-950 hover:bg-amber-400'
                : 'bg-rose-500 text-white hover:bg-rose-600'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="flex items-center space-x-1">
              <span>{isDeficit ? 'Proceed & Retract Log' : isFreeGrace ? `Delete Log (-${log.rewardEarned}` : `Delete Log (-${log.rewardEarned + mistakeFee}`}</span>
              <CoinToken size={14} />
              <span>)</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
