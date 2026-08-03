import React from 'react';
import { useApp } from '../context/AppContext';
import { CoinToken } from './CoinToken';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Trophy } from 'lucide-react';
import { playSound } from '../services/sound';
import { getAssetUrl } from '../utils/assets';

export const EMPTY_VAULT_IMAGE_PATH = '/assets/empty_vault.png';
export const FILLED_VAULT_IMAGE_PATH = '/assets/vault_filled.png';

export const CoinVault: React.FC = () => {
  const { stats, settings, rewards, setActiveTab } = useApp();
  const balance = stats.coinBalance;
  const vaultImage = balance > 0 ? FILLED_VAULT_IMAGE_PATH : EMPTY_VAULT_IMAGE_PATH;

  const affordableRewards = rewards.filter(r => r.active && r.cost <= balance);
  const nextTarget = rewards
    .filter(r => r.active && r.cost > balance)
    .sort((a, b) => a.cost - b.cost)[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">

      {/* Left: Glass Dome Vault Card */}
      <div
        className="md:col-span-4 rounded-2xl p-6 flex flex-col items-center justify-between text-center relative overflow-hidden vault-card"
      >
        {/* Title Badge */}
        <div className="pill-badge">
          <span>🏺</span>
          <span>COIN VAULT</span>
        </div>

        {/* Glass Dome Artwork — Dynamic empty vs filled vault */}
        <div className="relative w-52 h-60 sm:w-60 sm:h-72 my-3">
          <img
            key={vaultImage}
            src={getAssetUrl(vaultImage)}
            alt={balance > 0 ? "Filled Coin Vault" : "Empty Coin Vault"}
            className="w-full h-full object-contain select-none pointer-events-none drop-shadow-2xl transition-opacity duration-300"
            draggable={false}
          />

          {/* Balance Overlay — positioned inside the dome, ~40% from top */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: '15%' }}>
            <span className="font-outfit text-5xl sm:text-6xl font-extrabold drop-shadow-lg" style={{ color: 'var(--text-primary)' }}>
              {balance}
            </span>
            <span className="text-xs font-extrabold uppercase tracking-widest drop-shadow-sm flex items-center gap-1" style={{ color: 'var(--text-accent)' }}>
              <span>Coins</span>
            </span>
          </div>
        </div>

        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Keep building habits to fill your vault!
        </p>
      </div>

      {/* Right: Treasury Coin Balance Card */}
      <div className="md:col-span-8 glass-panel rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-5">

        {/* Header */}
        <div className="space-y-3">
          <div className="pill-badge">
            <span>✨</span>
            <span>TREASURY COIN BALANCE</span>
          </div>

          <div className="flex items-center space-x-3">
            <h2 className="font-outfit text-5xl sm:text-6xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {balance}
            </h2>
            <CoinToken size={40} />
            <span className="text-base sm:text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>Coins</span>
          </div>

          <p className="text-sm sm:text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
            {nextTarget ? (
              <>
                Earn <strong style={{ color: 'var(--text-accent)' }}>{nextTarget.cost - balance} more coins</strong> to unlock <strong style={{ color: 'var(--text-accent)' }}>"{nextTarget.name}"</strong> !
              </>
            ) : affordableRewards.length > 0 ? (
              <span className="text-emerald-500 font-bold">
                🎉 You can redeem rewards in your store right now!
              </span>
            ) : (
              'Complete daily activities to accumulate coins!'
            )}
          </p>
        </div>

        {/* 3 Stat Boxes with coloured top accent bars */}
        <div className="grid grid-cols-3 gap-3">
          <div className="stat-box stat-box-earned">
            <span className="text-xs block mb-1 font-bold">Total Earned</span>
            <span className="font-outfit text-xl sm:text-2xl font-extrabold flex items-center justify-center gap-1.5">
              <CoinToken size={22} />
              <span>{stats.totalCoinsEarned}</span>
            </span>
          </div>

          <div className="stat-box stat-box-spent">
            <span className="text-xs block mb-1 font-bold">Total Spent</span>
            <span className="font-outfit text-xl sm:text-2xl font-extrabold flex items-center justify-center gap-1.5">
              <ShoppingBag className="w-5 h-5" />
              <span>{stats.totalCoinsSpent}</span>
            </span>
          </div>

          <div className="stat-box stat-box-streak">
            <span className="text-xs block mb-1 font-bold">Current Streak</span>
            <span className="font-outfit text-xl sm:text-2xl font-extrabold flex items-center justify-center gap-1.5">
              <Trophy className="w-5 h-5" />
              <span>{stats.currentStreak}d</span>
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            playSound.click(settings.soundEnabled);
            setActiveTab('store');
          }}
          className="btn-gradient-store w-full py-4 px-6 rounded-xl font-outfit text-base font-extrabold flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5" />
            <span>Open Reward Store</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-black/25 backdrop-blur-sm text-xs font-bold border border-white/15 text-white/90">
              {affordableRewards.length} Affordable
            </span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </motion.button>
      </div>
    </div>
  );
};
