import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar as CalendarIcon } from 'lucide-react';
import { toLocalDateString } from '../utils/dateUtils';

export const ActivityHeatmap: React.FC = () => {
  const { rewardLogs } = useApp();

  const heatmapDays = useMemo(() => {
    const days: { dateStr: string; dayName: string; monthDay: string; count: number; rewards: number }[] = [];
    const today = new Date();

    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = toLocalDateString(d);
      const dayLogs = rewardLogs.filter(l => toLocalDateString(l.timestamp) === dateStr);
      const rewards = dayLogs.reduce((sum, l) => sum + l.rewardEarned, 0);

      days.push({
        dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        monthDay: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: dayLogs.length,
        rewards
      });
    }
    return days;
  }, [rewardLogs]);

  const getIntensityStyle = (rewards: number) => {
    if (rewards === 0) return { background: 'var(--pill-badge-bg)', borderColor: 'var(--glass-border)' };
    if (rewards <= 3) return { background: '#f59e0b50', borderColor: '#f59e0b80' };
    if (rewards <= 6) return { background: '#f59e0b80', borderColor: '#f59e0b' };
    if (rewards <= 10) return { background: '#f59e0b', borderColor: '#fbbf24' };
    return { background: '#fbbf24', borderColor: '#ffffff' };
  };

  return (
    <div className="glass-panel rounded-3xl p-6 space-y-4" style={{ border: '1px solid var(--glass-border)' }}>
      <div className="flex items-center justify-between">
        <h3 className="font-outfit text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <CalendarIcon className="w-5 h-5" style={{ color: 'var(--text-accent)' }} />
          <span>Activity Heatmap (Last 90 Days)</span>
        </h3>

        <div className="flex items-center space-x-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Less</span>
          <div className="w-3 h-3 rounded" style={{ background: 'var(--pill-badge-bg)', border: '1px solid var(--glass-border)' }} />
          <div className="w-3 h-3 rounded" style={{ background: '#f59e0b50' }} />
          <div className="w-3 h-3 rounded" style={{ background: '#f59e0b80' }} />
          <div className="w-3 h-3 rounded" style={{ background: '#f59e0b' }} />
          <div className="w-3 h-3 rounded" style={{ background: '#fbbf24' }} />
          <span>More</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2 no-scrollbar">
        <div className="grid grid-rows-7 grid-flow-col gap-1.5 min-w-[640px]">
          {heatmapDays.map((day) => (
            <div
              key={day.dateStr}
              title={`${day.monthDay}: ${day.count} habits logged (${day.rewards} rewards)`}
              className="w-4 h-4 rounded-md border transition-transform hover:scale-125 cursor-pointer"
              style={getIntensityStyle(day.rewards)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
