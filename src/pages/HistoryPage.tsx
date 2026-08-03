import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RewardLog, RewardRedemption } from '../types';
import { DeleteLogModal } from '../components/DeleteLogModal';
import { DeleteRedemptionModal } from '../components/DeleteRedemptionModal';
import { History, Trash2, Search, RefreshCw, AlertCircle } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { rewardLogs, redemptions, deleteLog, deleteRedemption, settings } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewTab, setViewTab] = useState<'logs' | 'redemptions'>('logs');

  // Modal States
  const [logToDelete, setLogToDelete] = useState<RewardLog | null>(null);
  const [redemptionToDelete, setRedemptionToDelete] = useState<RewardRedemption | null>(null);

  const filteredLogs = rewardLogs.filter(l => 
    l.habitName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-outfit text-3xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <History className="w-6 h-6" style={{ color: 'var(--text-accent)' }} />
            <span>Activity & Redemption History</span>
          </h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Review past habit completions and store purchase milestones
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 rounded-2xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          <button
            onClick={() => setViewTab('logs')}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            style={{
              background: viewTab === 'logs' ? 'var(--pill-badge-bg)' : 'transparent',
              border: viewTab === 'logs' ? '1px solid var(--pill-badge-border)' : '1px solid transparent',
              color: viewTab === 'logs' ? 'var(--pill-badge-text)' : 'var(--text-muted)',
            }}
          >
            Habit Logs ({rewardLogs.length})
          </button>
          <button
            onClick={() => setViewTab('redemptions')}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            style={{
              background: viewTab === 'redemptions' ? 'var(--pill-badge-bg)' : 'transparent',
              border: viewTab === 'redemptions' ? '1px solid var(--pill-badge-border)' : '1px solid transparent',
              color: viewTab === 'redemptions' ? 'var(--pill-badge-text)' : 'var(--text-muted)',
            }}
          >
            Store Purchases ({redemptions.length})
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

          {/* Table Container */}
          <div className="glass-panel rounded-3xl overflow-hidden shadow-xl" style={{ border: '1px solid var(--glass-border)' }}>
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
                No logs found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="font-outfit text-xs uppercase tracking-wider" style={{ background: 'var(--glass-bg)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                    <tr>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Habit Activity</th>
                      <th className="p-4">Coins Earned</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--glass-border)' }}>
                    {filteredLogs.map(log => {
                      const d = new Date(log.timestamp);
                      const dateStr = d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
                      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const isRetracted = Boolean(log.isRetracted);

                      return (
                        <tr key={log.id} className={`transition-colors ${isRetracted ? 'opacity-55 bg-amber-500/5' : 'hover:opacity-90'}`}>
                          <td className="p-4 font-mono text-xs">
                            <div style={{ color: 'var(--text-primary)' }}>{dateStr}</div>
                            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{timeStr}</div>
                          </td>
                          <td className="p-4 font-bold" style={{ color: 'var(--text-primary)' }}>
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">{log.icon}</span>
                              <span className={isRetracted ? 'line-through text-zinc-400' : ''}>
                                {log.habitName}
                              </span>
                              {isRetracted && (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> 👻 Retracted Log
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-outfit font-extrabold" style={{ color: isRetracted ? 'var(--text-muted)' : 'var(--text-accent)' }}>
                            {isRetracted ? `0 ${settings.currencySymbol || '🪙'} (Retracted)` : `+${log.rewardEarned} ${settings.currencySymbol || '🪙'}`}
                          </td>
                          <td className="p-4 text-right">
                            {isRetracted ? (
                              <span className="text-[11px] font-mono text-amber-400/70 font-semibold">Read-Only</span>
                            ) : (
                              <button
                                onClick={() => setLogToDelete(log)}
                                className="p-1.5 rounded-lg bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 border border-rose-500/30 cursor-pointer"
                                title="Delete log"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
            redemptions.map(r => {
              const d = new Date(r.timestamp);
              const dateStr = d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

              return (
                <div key={r.id} className="glass-panel rounded-2xl p-5 flex items-center justify-between" style={{ border: '1px solid var(--glass-border)' }}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl overflow-hidden" style={{ background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)' }}>
                      {r.image ? (
                        <img src={r.image} alt={r.rewardName} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <span>{r.icon || '🎁'}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-outfit text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                        {r.rewardName}
                      </h3>
                      <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{dateStr}</p>
                      {r.note && <p className="text-xs italic mt-0.5" style={{ color: 'var(--text-secondary)' }}>"{r.note}"</p>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className="font-outfit font-extrabold text-sm px-3 py-1.5 rounded-xl"
                      style={{ background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)', color: 'var(--pill-badge-text)' }}
                    >
                      -{r.coinsSpent} {settings.currencySymbol || '🪙'}
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
