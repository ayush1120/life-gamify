import React from 'react';
import { useApp } from '../context/AppContext';
import { CoinToken } from './CoinToken';
import { Plus, Sparkles } from 'lucide-react';
import { playSound } from '../services/sound';
import { getAssetUrl } from '../utils/assets';

interface HeroBannerProps {
  onOpenHabitModal: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onOpenHabitModal }) => {
  const { stats, settings, user } = useApp();
  const playerName = settings.playerName || user?.displayName;

  return (
    <div className="relative hero-card rounded-2xl overflow-hidden sparkle-decoration">
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center p-6 sm:p-10 gap-6">

        {/* Text Content Container */}
        <div className="flex-1 min-w-0 w-full flex flex-col space-y-4">
          
          {/* Top Row on Mobile: Pill + Title (Left), Chest (Right) */}
          <div className="flex flex-row items-center justify-between w-full gap-2">
            <div className="space-y-3 sm:space-y-4 flex-1 min-w-0">
              {/* Pill Badge */}
              <div className="pill-badge">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{playerName ? `${playerName}'s Quest Economy` : 'Habit Gamified Economy'}</span>
              </div>


              <h1 className="font-outfit text-3xl sm:text-[44px] font-extrabold tracking-tight leading-tight flex flex-wrap items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span>Build Habits,</span>
                <span style={{ color: 'var(--text-accent)' }}>Earn</span>
                <CoinToken size={40} />
              </h1>
            </div>

            {/* Mobile Treasure Chest - Hidden on Desktop */}
            <div className="md:hidden flex-shrink-0 w-28 h-28 sm:w-32 sm:h-32 relative">
              <img
                src={getAssetUrl(settings.theme === 'dark' ? '/assets/chest_dark_transparent.png' : '/assets/chest_light_transparent.png')}
                alt="Treasure Chest"
                className="w-full h-full object-contain select-none drop-shadow-2xl"
                draggable={false}
              />
            </div>
          </div>

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

        {/* Desktop Treasure Chest - Hidden on Mobile */}
        <div className="hidden md:flex flex-shrink-0 w-[320px] h-[240px] relative items-center justify-center">
          <img
            src={getAssetUrl(settings.theme === 'dark' ? '/assets/chest_dark_transparent.png' : '/assets/chest_light_transparent.png')}
            alt="Treasure Chest"
            className="w-full h-full object-contain select-none drop-shadow-2xl"
            draggable={false}
          />
        </div>

        {/* Right: New Habit CTA Button (vertically centred on desktop, full width on mobile) */}
        <div className="flex-shrink-0 w-full md:w-auto">
          <button
            onClick={() => {
              playSound.click(settings.soundEnabled);
              onOpenHabitModal();
            }}
            className="btn-gradient-hero w-full md:w-auto justify-center px-6 py-3.5 rounded-xl font-outfit text-sm font-extrabold flex items-center space-x-2 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>New Habit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
