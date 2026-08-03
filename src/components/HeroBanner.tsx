import React from 'react';
import { useApp } from '../context/AppContext';
import { CoinToken } from './CoinToken';
import { Plus, Sparkles } from 'lucide-react';
import { playSound } from '../services/sound';

interface HeroBannerProps {
  onOpenHabitModal: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onOpenHabitModal }) => {
  const { stats, settings } = useApp();

  return (
    <div className="relative hero-card rounded-2xl overflow-hidden sparkle-decoration">
      <div className="relative z-10 flex items-center p-8 sm:p-10 gap-6">

        {/* Left: Text Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Pill Badge — amber toned, not purple */}
          <div className="pill-badge">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Habit Gamified Economy</span>
          </div>

          <h1 className="font-outfit text-3xl sm:text-[44px] font-extrabold tracking-tight leading-tight flex flex-wrap items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span>Build Habits,</span>
            <span style={{ color: 'var(--text-accent)' }}>Earn</span>
            <CoinToken size={40} />
          </h1>

          {stats.phantomDebt > 0 ? (
            <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 space-y-1">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                <span className="text-base">👻</span>
                <span>Phantom Debt Quest: -{stats.phantomDebt} {settings.currencySymbol}</span>
              </div>
              <p className="text-xs text-amber-200/90 font-medium">
                Complete new habits to earn +{stats.phantomDebt} {settings.currencySymbol} and restore your Vault Honor status!
              </p>
            </div>
          ) : (
            <p className="text-sm sm:text-base max-w-md font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Tap any activity to earn coins and unlock amazing treats in your Reward Store!
            </p>
          )}
        </div>

        {/* Centre: Treasure Chest Artwork (themed per mode) */}
        <div className="hidden md:flex items-center justify-center flex-shrink-0 w-[320px] h-[240px] relative">
          <img
            src={settings.theme === 'dark' ? '/assets/chest_dark_transparent.png' : '/assets/chest_light_transparent.png'}
            alt="Treasure Chest"
            className="w-full h-full object-contain select-none pointer-events-none drop-shadow-2xl"
            draggable={false}
          />
        </div>

        {/* Right: New Habit CTA Button (vertically centred) */}
        <div className="flex-shrink-0">
          <button
            onClick={() => {
              playSound.click(settings.soundEnabled);
              onOpenHabitModal();
            }}
            className="btn-gradient-hero px-6 py-3.5 rounded-xl font-outfit text-sm font-extrabold flex items-center space-x-2 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>New Habit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
