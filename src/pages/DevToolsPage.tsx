import React, { useState } from 'react';
import { Settings, Database, Play, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DevToolsPage: React.FC = () => {
  const { setActiveTab } = useApp();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const populateDummyHistory = () => {
    const dummyLogs: any[] = [];
    const habits = [
      { name: 'Morning Run', icon: '🏃' },
      { name: 'Read 10 Pages', icon: '📚' },
      { name: 'Meditate', icon: '🧘' },
      { name: 'Drink Water', icon: '💧' },
      { name: 'Code for 1 Hour', icon: '💻' }
    ];

    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const logsCount = Math.floor(Math.random() * 4) + 1;
      
      for (let j = 0; j < logsCount; j++) {
        const habit = habits[Math.floor(Math.random() * habits.length)];
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        
        d.setHours(Math.floor(Math.random() * 12) + 8); 
        d.setMinutes(Math.floor(Math.random() * 60));
        
        dummyLogs.push({
          id: crypto.randomUUID(),
          activityId: 'dummy-activity-' + Math.random(),
          habitName: habit.name,
          icon: habit.icon,
          timestamp: d.toISOString(),
          rewardEarned: Math.floor(Math.random() * 15) + 5,
          unit: 'count',
          isRetracted: Math.random() > 0.9 
        });
      }
    }

    const existing = JSON.parse(localStorage.getItem('life_gamify_reward_logs_v2') || '[]');
    localStorage.setItem('life_gamify_reward_logs_v2', JSON.stringify([...existing, ...dummyLogs]));
    
    setStatusMessage(`Added ${dummyLogs.length} dummy logs. Refresh the page to see them in the History tab!`);
    
    // Clear message after 5 seconds
    setTimeout(() => setStatusMessage(null), 5000);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setActiveTab('settings')}
          className="p-2 rounded-full transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-outfit text-3xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Settings className="w-6 h-6" style={{ color: 'var(--text-accent)' }} />
            <span>Developer Tools</span>
          </h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Local development utilities and data populators
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6" style={{ border: '1px solid var(--glass-border)' }}>
        <h2 className="font-outfit text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Database className="w-5 h-5" style={{ color: 'var(--text-accent)' }} />
          Data Population
        </h2>
        
        <div className="space-y-4">
          <div className="p-4 rounded-2xl flex items-center justify-between" style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)' }}>
            <div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Populate Dummy History</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Generates ~90 random habit logs over the last 30 days and saves them to local storage. 
                Useful for testing the History calendar view.
              </p>
            </div>
            <button 
              onClick={populateDummyHistory}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--pill-badge-bg)', color: 'var(--pill-badge-text)', border: '1px solid var(--pill-badge-border)' }}
            >
              <Play className="w-4 h-4" />
              Run Script
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-6 p-4 rounded-xl flex items-start gap-3 bg-green-500/10 border border-green-500/20 text-green-500">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{statusMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};
