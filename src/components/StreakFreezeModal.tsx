import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Sparkles, ShieldCheck, CheckCircle2, Circle, Clock } from 'lucide-react';
import { playSound } from '../services/sound';
import { DEFAULT_STREAK_FREEZE_STATE } from '../utils/streakUtils';

export const StreakFreezeModal: React.FC = () => {
  const { 
    isStreakFreezeModalOpen, 
    setIsStreakFreezeModalOpen, 
    selectedHabitForFreezeModal,
    setSelectedHabitForFreezeModal,
    stats, 
    settings,
    repairAppStreak,
    repairHabitStreak
  } = useApp();

  if (!isStreakFreezeModalOpen) return null;

  const isHabitScope = !!selectedHabitForFreezeModal;
  const freezeState = isHabitScope
    ? (stats.habitStreakFreezeStates?.[selectedHabitForFreezeModal.id] || DEFAULT_STREAK_FREEZE_STATE)
    : (stats.streakFreezeState || DEFAULT_STREAK_FREEZE_STATE);

  const { availableFreezes, maxFreezes, consecutiveDaysForRecovery, consecutiveDaysCount, pendingRepairDates } = freezeState;
  const pendingRepairs = pendingRepairDates || [];
  const canRepair = pendingRepairs.length > 0 && availableFreezes > 0;

  const handleClose = () => {
    playSound.click(settings.soundEnabled);
    setSelectedHabitForFreezeModal(null);
    setIsStreakFreezeModalOpen(false);
  };

  const handleRepair = (dateStr: string) => {
    if (isHabitScope && selectedHabitForFreezeModal) {
      repairHabitStreak(selectedHabitForFreezeModal.id, dateStr);
    } else {
      repairAppStreak(dateStr);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-sky-100 dark:border-sky-950/60 overflow-hidden text-slate-900 dark:text-slate-100 transition-all transform scale-100 p-6 sm:p-8 max-h-[90vh] overflow-y-auto no-scrollbar"
        style={{
          boxShadow: '0 25px 50px -12px rgba(14, 165, 233, 0.25)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Mascot / Crystalline Ice Droplet Icon */}
        <div className="flex flex-col items-center justify-center pt-2 pb-4">
          <div className="relative flex items-center justify-center mb-3">
            <div className="absolute w-24 h-24 bg-sky-400/30 rounded-full blur-xl animate-pulse" />
            
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-400 via-blue-400 to-cyan-300 flex items-center justify-center shadow-lg shadow-sky-500/40 border-2 border-white/80 dark:border-sky-200/40">
              <svg 
                viewBox="0 0 64 64" 
                className="w-14 h-14 text-white drop-shadow-md"
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M32 6C32 6 14 26 14 39C14 49 22 58 32 58C42 58 50 49 50 39C50 26 32 6 32 6Z" 
                  fill="white" 
                  fillOpacity="0.85" 
                />
                <path 
                  d="M32 10C32 10 17 28 17 40C17 48.5 23.8 55 32 55C40.2 55 47 48.5 47 40C47 28 32 10 32 10Z" 
                  fill="url(#iceGradModal)" 
                />
                <ellipse cx="26" cy="38" rx="3" ry="3.5" fill="#0369a1" />
                <ellipse cx="38" cy="38" rx="3" ry="3.5" fill="#0369a1" />
                <circle cx="27" cy="37" r="1" fill="white" />
                <circle cx="39" cy="37" r="1" fill="white" />
                <path d="M22 24L24 20L26 24L30 26L26 28L24 32L22 28L18 26L22 24Z" fill="white" fillOpacity="0.9" />
                <defs>
                  <linearGradient id="iceGradModal" x1="17" y1="10" x2="47" y2="55" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#bae6fd" />
                    <stop offset="0.5" stopColor="#7dd3fc" />
                    <stop offset="1" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <Sparkles className="absolute -top-1 -right-2 w-5 h-5 text-sky-400 animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          <h2 className="font-outfit text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white text-center">
            {isHabitScope ? `${selectedHabitForFreezeModal.name} Freeze` : 'Streak Freeze'}
          </h2>

          {/* Current Inventory Capacity Pill */}
          <div className="mt-2 flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/80 text-sky-700 dark:text-sky-300 text-xs font-bold font-outfit">
            <span>{isHabitScope ? 'Habit Freezes:' : 'App Freezes:'}</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: maxFreezes }).map((_, idx) => {
                const isFilled = idx < availableFreezes;
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs transition-all ${
                      isFilled
                        ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm shadow-sky-500/50 scale-110'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 opacity-60'
                    }`}
                  >
                    ❄️
                  </span>
                );
              })}
            </div>
            <span className="ml-1 text-[11px] font-semibold opacity-90">({availableFreezes}/{maxFreezes})</span>
          </div>
        </div>

        {/* 2-Day Streak Repair Action Section */}
        {pendingRepairs.length > 0 && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400 font-outfit text-xs font-bold">
              <Clock className="w-4 h-4 shrink-0" />
              <span>2-Day Streak Repair Window Active</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              You missed a day recently. You can use 1 freeze to restore your streak before the window closes!
            </p>
            <div className="space-y-1.5 pt-1">
              {pendingRepairs.map((repair) => (
                <div key={repair.dateStr} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-400/30">
                  <div className="text-xs">
                    <span className="font-bold">{repair.dateStr}</span>
                    <span className="text-amber-500 text-[11px] ml-2 font-semibold">
                      ({repair.daysRemaining} {repair.daysRemaining === 1 ? 'day' : 'days'} left)
                    </span>
                  </div>
                  {canRepair ? (
                    <button
                      onClick={() => handleRepair(repair.dateStr)}
                      className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow cursor-pointer transition-all hover:scale-105"
                    >
                      Repair ❄️
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Need 1 freeze to repair
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Sections matching the mockup */}
        <div className="space-y-4 text-sm sm:text-base">
          {/* Section 1: What it's for */}
          <div className="space-y-1">
            <h3 className="font-outfit text-base font-bold text-slate-900 dark:text-white">
              What it's for
            </h3>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300 pl-4 list-disc marker:text-sky-500 text-xs sm:text-sm">
              <li>Take a rest day or repair a missed day without breaking your streak.</li>
            </ul>
          </div>

          {/* Section 2: How to get */}
          <div className="space-y-2">
            <h3 className="font-outfit text-base font-bold text-slate-900 dark:text-white">
              How to get
            </h3>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300 pl-4 list-disc marker:text-sky-500 text-xs sm:text-sm">
              <li>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {isHabitScope ? `Complete "${selectedHabitForFreezeModal.name}" for 3 consecutive days` : 'Complete habits for 3 consecutive days'}
                </span>{' '}
                to earn 1 streak freeze.
              </li>
              <li>Store up to {maxFreezes} streak freezes per habit.</li>
            </ul>

            {/* 3-Day Recovery Progress Card */}
            <div className="mt-2 p-3.5 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-sky-800 dark:text-sky-200">
                <span className="flex items-center gap-1.5 font-outfit">
                  <ShieldCheck className="w-4 h-4 text-sky-500" />
                  <span>Freeze Recovery Progress</span>
                </span>
                <span className="font-outfit text-[11px]">
                  {availableFreezes >= maxFreezes 
                    ? 'Max Capacity (2/2)' 
                    : `${consecutiveDaysCount} / ${consecutiveDaysForRecovery} Days Active`}
                </span>
              </div>

              {/* 3 Step Visual Tracker */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {Array.from({ length: consecutiveDaysForRecovery }).map((_, stepIdx) => {
                  const isDone = consecutiveDaysCount > stepIdx;
                  const isCurrent = consecutiveDaysCount === stepIdx && availableFreezes < maxFreezes;
                  return (
                    <div 
                      key={stepIdx} 
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                        isDone 
                          ? 'bg-sky-500/15 border-sky-400/50 text-sky-700 dark:text-sky-300 font-bold' 
                          : isCurrent
                          ? 'bg-white dark:bg-slate-800 border-sky-400 text-sky-600 dark:text-sky-400 font-bold ring-2 ring-sky-400/20'
                          : 'bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-0.5">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-sky-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                        )}
                      </div>
                      <span className="text-[11px] font-outfit">
                        {stepIdx === 2 ? '+1 ❄️ Freeze' : `Day ${stepIdx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: How it works */}
          <div className="space-y-1">
            <h3 className="font-outfit text-base font-bold text-slate-900 dark:text-white">
              How it works
            </h3>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300 pl-4 list-disc marker:text-sky-500 text-xs sm:text-sm">
              <li>If you miss a day, use a Streak Freeze within 2 days to repair and restore your streak.</li>
            </ul>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-5">
          <button
            onClick={handleClose}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-sky-600 text-white font-outfit font-bold text-sm shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
