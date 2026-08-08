import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, ShoppingBag, CheckSquare, Zap, Menu, History, BarChart2, Settings } from 'lucide-react';
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

      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl select-none"
        style={{ 
          background: 'var(--nav-bg)', 
          borderTop: '1px solid var(--nav-border)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)'
        }}
      >
        <div className="flex justify-around items-center h-[68px] px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'more' && ['history', 'analytics', 'settings'].includes(activeTab)) || (item.id === 'more' && isMoreOpen);
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative cursor-pointer"
              >
                <div 
                  className={`p-1 rounded-full transition-all duration-300 ${isActive ? 'scale-110' : ''}`}
                  style={{ 
                    color: isActive ? 'var(--nav-active-text)' : 'var(--nav-inactive-text)' 
                  }}
                >
                  <Icon className={`w-[22px] h-[22px] ${isActive && item.id === 'log-activity' ? 'fill-amber-400 text-amber-500' : ''}`} />
                </div>
                <span 
                  className="text-[10px] font-bold"
                  style={{ color: isActive ? 'var(--nav-active-text)' : 'var(--nav-inactive-text)' }}
                >
                  {item.label}
                </span>
                
                {/* Active Indicator Line */}
                {isActive && (
                  <div 
                    className="absolute top-0 w-8 h-[3px] rounded-b-full shadow-[0_2px_8px_rgba(251,191,36,0.5)]"
                    style={{ background: 'var(--text-accent)' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
