import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, ShoppingBag, CheckSquare, Zap, Menu, History, BarChart2, Settings, Compass } from 'lucide-react';
import { playSound } from '../services/sound';
import { motion, AnimatePresence } from 'framer-motion';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, settings } = useApp();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleTabClick = (tabId: string) => {
    playSound.click(settings.soundEnabled);
    if (tabId === 'more') {
      setIsMoreOpen(!isMoreOpen);
    } else {
      setActiveTab(tabId);
      setIsMoreOpen(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'adventure', label: 'Adventure', icon: Compass },
    { id: 'log-activity', label: 'Log', icon: Zap },
    { id: 'store', label: 'Store', icon: ShoppingBag },
    { id: 'habits', label: 'Habits', icon: CheckSquare },
    { id: 'more', label: 'More', icon: Menu },
  ];

  return (
    <>
      {/* More Menu Popup */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed right-4 z-40 w-48 rounded-2xl p-2 shadow-2xl origin-bottom-right"
              style={{ 
                bottom: 'calc(var(--bottom-nav-total) + 10px)',
                background: 'var(--glass-bg)', 
                border: '1px solid var(--glass-border)'
              }}
            >
              <div className="flex flex-col space-y-1">
                {[
                  { id: 'history', label: 'History Ledger', icon: History },
                  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
                  { id: 'settings', label: 'Settings', icon: Settings }
                ].map(item => {

                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className="flex items-center space-x-3 w-full p-3 rounded-xl transition-colors cursor-pointer select-none"
                      style={{
                        background: isActive ? 'var(--pill-badge-bg)' : 'transparent',
                        color: isActive ? 'var(--pill-badge-text)' : 'var(--text-primary)'
                      }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-bold text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div 
        className="md:hidden fixed inset-x-0 bottom-0 z-40 pointer-events-none px-3"
        style={{ paddingBottom: 'calc(var(--safe-area-bottom) + 2px)' }}
      >
        <nav 
          className="max-w-md mx-auto rounded-full backdrop-blur-2xl shadow-2xl select-none pointer-events-auto"
          style={{ 
            background: 'var(--glass-bg)', 
            border: '1px solid var(--glass-border)',
            boxShadow: '0 16px 36px -6px rgba(0, 0, 0, 0.75), 0 0 20px rgba(245, 158, 11, 0.12)'
          }}
        >
          <div className="flex justify-around items-center h-[58px] px-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'habits' && activeTab.startsWith('habits/')) || (item.id === 'more' && ['history', 'analytics', 'settings'].includes(activeTab)) || (item.id === 'more' && isMoreOpen);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex flex-col items-center justify-center py-1 px-1 sm:px-2 rounded-full transition-all duration-300 relative cursor-pointer ${
                    isActive ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner' : 'hover:opacity-80'
                  }`}
                >
                  <div 
                    className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}
                    style={{ 
                      color: isActive ? 'var(--text-accent)' : 'var(--text-muted)' 
                    }}
                  >
                    <Icon className={`w-4 sm:w-5 h-4 sm:h-5 ${isActive && item.id === 'log-activity' ? 'fill-amber-400 text-amber-500 animate-pulse' : ''}`} />
                  </div>
                  <span 
                    className="text-[9px] sm:text-[10px] font-bold mt-0.5 tracking-tight truncate max-w-[50px]"
                    style={{ color: isActive ? 'var(--text-accent)' : 'var(--text-muted)' }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};
