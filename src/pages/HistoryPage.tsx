import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RewardLog, RewardRedemption } from '../types';
import { DeleteLogModal } from '../components/DeleteLogModal';
import { DeleteRedemptionModal } from '../components/DeleteRedemptionModal';
import { Trash2, Search, RefreshCw, AlertCircle, ArrowLeft, ChevronDown, Plus, Clock } from 'lucide-react';
import { CoinToken } from '../components/CoinToken';
import { formatContextDate, formatTime, getWeekDays, isSameDay } from '../utils/dateUtils';

export const HistoryPage: React.FC = () => {
  const { 
    rewardLogs, redemptions, habits, stats, 
    deleteLog, deleteRedemption, setActiveTab
  } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeekOffset, setCurrentWeekOffset] = useState<number>(0);
  
  const getInitialViewTab = (): 'logs' | 'redemptions' => {
    return window.location.hash.includes('redemptions') ? 'redemptions' : 'logs';
  };

  const [viewTab, setViewTab] = useState<'logs' | 'redemptions'>(getInitialViewTab);

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash.includes('redemptions')) {
        setViewTab('redemptions');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Modal States
  const [logToDelete, setLogToDelete] = useState<RewardLog | null>(null);
  const [redemptionToDelete, setRedemptionToDelete] = useState<RewardRedemption | null>(null);

  // Combine actual logs with synthetic freeze logs
  const allLogs = React.useMemo(() => {
    const freezeLogs: RewardLog[] = [];
    Object.entries(stats.habitStreakFreezeStates || {}).forEach(([habitId, state]) => {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;
      state.frozenDates.forEach(dateStr => {
        freezeLogs.push({
          id: `freeze-${habitId}-${dateStr}`,
          activityId: habitId,
          habitName: `Streak Repaired: ${habit.name}`,
          icon: '❄️',
          timestamp: `${dateStr}T23:59:59.000Z`,
          rewardEarned: 0,
          unit: 'freeze'
        });
      });
    });
    if (stats.streakFreezeState?.frozenDates) {
      stats.streakFreezeState.frozenDates.forEach(dateStr => {
        freezeLogs.push({
          id: `freeze-app-${dateStr}`,
          activityId: 'app',
          habitName: `App Streak Repaired`,
          icon: '❄️',
          timestamp: `${dateStr}T23:59:59.000Z`,
          rewardEarned: 0,
          unit: 'freeze'
        });
      });
    }
    
    return [...rewardLogs, ...freezeLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [rewardLogs, habits, stats.habitStreakFreezeStates, stats.streakFreezeState]);

  const filteredLogs = allLogs.filter(l => {
    const logDate = new Date(l.timestamp);
    const matchesDate = isSameDay(logDate, selectedDate);
    const matchesSearch = l.habitName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesSearch;
  });

  const handleConfirmLogDelete = (log: RewardLog) => {
    deleteLog(log.id);
    setLogToDelete(null);
  };

  const handleConfirmRedemptionDelete = (redemption: RewardRedemption) => {
    deleteRedemption(redemption.id);
    setRedemptionToDelete(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-sm cursor-pointer shrink-0"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => {
              setCurrentWeekOffset(prev => prev - 1);
              setSelectedDate(prev => {
                const d = new Date(prev); d.setDate(d.getDate() - 7); return d;
              });
            }}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
          
          <div className="flex flex-col items-center relative">
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              {currentWeekOffset === 0 ? 'This week' : currentWeekOffset === -1 ? 'Last week' : `${currentWeekOffset > 0 ? 'Next' : 'Past'} ${Math.abs(currentWeekOffset)} weeks`}
            </span>
            <div className="relative flex justify-center">
              <button className="flex items-center gap-1 font-outfit text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                {formatContextDate(selectedDate)}
                <ChevronDown className="w-4 h-4 ml-1 opacity-60" />
              </button>
              <input 
                type="date"
                max={new Date().toISOString().split('T')[0]}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  if (!isNaN(newDate.getTime())) {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const selectedDay = new Date(newDate);
                    selectedDay.setHours(0,0,0,0);
                    if (selectedDay.getTime() > today.getTime()) return;

                    setSelectedDate(newDate);
                    
                    const selectedWeekStart = new Date(newDate);
                    selectedWeekStart.setDate(selectedWeekStart.getDate() - selectedWeekStart.getDay());
                    const todayWeekStart = new Date(today);
                    todayWeekStart.setDate(todayWeekStart.getDate() - todayWeekStart.getDay());
                    const diffTime = selectedWeekStart.getTime() - todayWeekStart.getTime();
                    const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
                    setCurrentWeekOffset(diffWeeks);
                  }
                }}
              />
            </div>
          </div>

          <button 
            onClick={() => {
              setCurrentWeekOffset(prev => prev + 1);
              setSelectedDate(prev => {
                const d = new Date(prev); d.setDate(d.getDate() + 7); return d;
              });
            }}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
            style={{ transform: 'rotate(180deg)' }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <button 
          onClick={() => setActiveTab('log-activity')}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-sm cursor-pointer" 
          style={{ background: 'var(--pill-badge-bg)', color: 'var(--pill-badge-text)', border: '1px solid var(--pill-badge-border)' }}
          title="Log Activity"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Week Strip */}
      <div className="flex justify-between items-center px-2 py-6 border-b border-dashed" style={{ borderColor: 'var(--glass-border)' }}>
        {(() => {
          const base = new Date();
          base.setDate(base.getDate() + (currentWeekOffset * 7));
          const weekDays = getWeekDays(base);
          
          return weekDays.map((day, idx) => {
              const isSelected = isSameDay(day, selectedDate);
              const isTodayStr = isSameDay(day, new Date());
              
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const dayStart = new Date(day);
              dayStart.setHours(0, 0, 0, 0);
              const isFuture = dayStart.getTime() > today.getTime();

              return (
                <div 
                  key={idx} 
                  onClick={() => {
                    if (!isFuture) setSelectedDate(day);
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${isFuture ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5'}`}
                  style={{
                    background: isSelected ? 'var(--text-primary)' : 'transparent',
                    color: isSelected ? 'var(--bg-primary)' : 'var(--text-secondary)'
                  }}
                >
                  <span className="text-xs font-bold mb-1 opacity-60">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="text-lg font-extrabold">
                    {day.getDate()}
                  </span>
                  {isTodayStr && !isSelected && (
                    <div className="w-1 h-1 rounded-full mt-1" style={{ background: 'var(--text-accent)' }} />
                  )}
                </div>
              );
            })
        })()}
      </div>

      <div className="flex items-center justify-between pt-2 pb-2">
        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 rounded-2xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          <button
            onClick={() => setViewTab('logs')}
            className="px-4 py-1.5 rounded-xl text-[11px] uppercase tracking-wide font-bold transition-all cursor-pointer"
            style={{
              background: viewTab === 'logs' ? 'var(--pill-badge-bg)' : 'transparent',
              border: viewTab === 'logs' ? '1px solid var(--pill-badge-border)' : '1px solid transparent',
              color: viewTab === 'logs' ? 'var(--pill-badge-text)' : 'var(--text-muted)',
            }}
          >
            Logs
          </button>
          <button
            onClick={() => setViewTab('redemptions')}
            className="px-4 py-1.5 rounded-xl text-[11px] uppercase tracking-wide font-bold transition-all cursor-pointer"
            style={{
              background: viewTab === 'redemptions' ? 'var(--pill-badge-bg)' : 'transparent',
              border: viewTab === 'redemptions' ? '1px solid var(--pill-badge-border)' : '1px solid transparent',
              color: viewTab === 'redemptions' ? 'var(--pill-badge-text)' : 'var(--text-muted)',
            }}
          >
            Purchases
          </button>
        </div>
      </div>

      {viewTab === 'logs' ? (
        <div className="space-y-4">
          {/* Search Filter Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-3.5" style={{ color: 'var(--text-accent)' }} />
            <input
              type="text"
              placeholder="Search by habit name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm focus:outline-none"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Cards Container (Timeline styling removed) */}
          <div className="mt-4 space-y-4 px-2">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
                No activity found for this day.
              </div>
            ) : (
              [...filteredLogs]
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .map(log => {
                  const logDate = new Date(log.timestamp);
                  const timeStr = formatTime(logDate);
                  const isRetracted = Boolean(log.isRetracted);

                  return (
                    <div key={log.id} className="relative group">
                      
                      {/* Card Content */}
                      <div className="w-full rounded-3xl p-4 transition-transform hover:-translate-y-1 shadow-sm" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', opacity: isRetracted ? 0.6 : 1 }}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)' }}>
                              {log.icon}
                            </div>
                            <div>
                              <h3 className={`font-outfit font-bold text-sm ${isRetracted ? 'line-through text-zinc-400' : ''}`} style={{ color: 'var(--text-primary)' }}>
                                {log.habitName}
                              </h3>
                              {isRetracted && (
                                <span className="text-[10px] mt-0.5 uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Retracted
                                </span>
                              )}
                            </div>
                          </div>
                          {isRetracted ? (
                            <span className="text-[10px] font-mono text-amber-400/70 font-semibold uppercase">Read-Only</span>
                          ) : log.unit === 'freeze' ? (
                            <span className="text-[10px] font-mono text-sky-400/70 font-semibold uppercase px-2 py-1 bg-sky-500/10 rounded-lg">Freeze</span>
                          ) : (
                            <button
                              onClick={() => setLogToDelete(log)}
                              className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all cursor-pointer"
                              title="Delete log"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{timeStr}</span>
                          </div>
                          <div className="font-outfit font-extrabold text-sm" style={{ color: isRetracted ? 'var(--text-muted)' : 'var(--text-accent)' }}>
                            {isRetracted ? (
                              <span>0</span>
                            ) : log.unit === 'freeze' ? (
                              <span className="text-sky-400">Repaired</span>
                            ) : (
                              <div className="flex items-center space-x-1 px-3 py-1 rounded-xl shadow-sm" style={{ background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)' }}>
                                <span>+{log.rewardEarned}</span>
                                <CoinToken size={14} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      ) : (
        /* Store Redemptions View */
        <div className="space-y-3">
          {redemptions.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center" style={{ color: 'var(--text-muted)' }}>
              No store redemptions logged yet. Complete habits to earn coins and purchase treats in your Reward Store!
            </div>
          ) : (
            [...redemptions]
              .filter(r => isSameDay(new Date(r.timestamp), selectedDate))
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map(r => {
                const d = new Date(r.timestamp);
                const dateStr = d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={r.id} className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ border: '1px solid var(--glass-border)' }}>
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <div className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-2xl overflow-hidden" style={{ background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)' }}>
                        {r.image ? (
                          <img src={r.image} alt={r.rewardName} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <span>{r.icon || '🎁'}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-outfit text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                          {r.rewardName}
                        </h3>
                        <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{dateStr}</p>
                        {r.note && <p className="text-xs italic mt-0.5" style={{ color: 'var(--text-secondary)' }}>"{r.note}"</p>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-auto">
                      <span
                        className="font-outfit font-extrabold text-sm px-3 py-1.5 rounded-xl flex items-center space-x-1"
                        style={{ background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)', color: 'var(--pill-badge-text)' }}
                      >
                        <span>-{r.coinsSpent}</span>
                        <CoinToken size={14} />
                      </span>

                      <button
                        onClick={() => setRedemptionToDelete(r)}
                        className="p-2 rounded-xl bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 cursor-pointer"
                        title="Refund / Delete Store Redemption"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Modals */}
      <DeleteLogModal
        isOpen={Boolean(logToDelete)}
        onClose={() => setLogToDelete(null)}
        onConfirm={handleConfirmLogDelete}
        log={logToDelete}
      />

      <DeleteRedemptionModal
        isOpen={Boolean(redemptionToDelete)}
        onClose={() => setRedemptionToDelete(null)}
        onConfirm={handleConfirmRedemptionDelete}
        redemption={redemptionToDelete}
      />
    </div>
  );
};
