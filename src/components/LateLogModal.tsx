import React from 'react';
import { X, CheckCircle2, Zap } from 'lucide-react';


import { getPeriodProgress, getPeriodLabel } from '../utils/frequencyUtils';
import { useApp } from '../context/AppContext';

interface LateLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
}

export const LateLogModal: React.FC<LateLogModalProps> = ({ isOpen, onClose, selectedDate }) => {
  const { habits, rewardLogs, logHabit } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 pb-20 sm:pb-4 pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md max-h-[80vh] flex flex-col rounded-3xl pointer-events-auto overflow-hidden" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--glass-border)' }}>
          <div>
            <h3 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Late Log</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Logging activity for {selectedDate.toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full cursor-pointer hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3">
          {habits.filter(h => h.active).map(habit => {
            const progress = getPeriodProgress(habit, rewardLogs, selectedDate);
            return (
              <div key={habit.id} className="p-3 rounded-2xl flex items-center justify-between border" style={{ borderColor: 'var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{habit.icon}</span>
                  <div>
                    <h4 className="font-outfit font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{habit.name}</h4>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {progress.count}/{progress.max === 0 ? '∞' : progress.max} {getPeriodLabel(habit.frequency || 'daily')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    const logDate = new Date(selectedDate);
                    logDate.setHours(23, 59, 59, 999);
                    logHabit(habit.id, e, logDate);
                    onClose();
                  }}
                  disabled={progress.isComplete && progress.max > 0}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1 ${
                    progress.isComplete && progress.max > 0
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-amber-500 text-amber-950 cursor-pointer'
                  }`}
                >
                  {progress.isComplete && progress.max > 0 ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Done</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 fill-amber-950" />
                      <span>Log</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
