import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CoinToken } from './CoinToken';
import { LogoutModal } from './LogoutModal';
import { LayoutDashboard, ShoppingBag, CheckSquare, History, BarChart3, Settings as SettingsIcon, Flame, Sun, Moon, LogIn, LogOut, User, Zap } from 'lucide-react';
import { playSound } from '../services/sound';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, stats, settings, updateSettings, user, signInWithGoogle, logout, showToast } = useApp();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleTabClick = (tabId: string) => {
    playSound.click(settings.soundEnabled);
    setActiveTab(tabId);
  };

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
    const themeClass = `theme-${nextTheme}`;
    document.documentElement.className = themeClass;
    document.body.className = themeClass;
    playSound.click(settings.soundEnabled);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'log-activity', label: 'Log Activity', icon: Zap },
    { id: 'store', label: 'Reward Store', icon: ShoppingBag },
    { id: 'habits', label: 'Habits', icon: CheckSquare },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header
      className="sticky top-0 z-40 w-full backdrop-blur-xl"
      style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row: Branding + Controls */}
        <div className="flex items-center justify-between h-16 sm:h-[72px]">

          {/* Logo & App Branding */}
          <div
            onClick={() => handleTabClick('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            {/* Golden Coin Emblem */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-amber-300/60 group-hover:scale-105 transition-transform overflow-hidden p-1">
              <CoinToken size={36} />
            </div>
            <div>
              <h1 className="font-outfit text-lg sm:text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Life Gamify
              </h1>
              <p className="text-[11px] hidden sm:block font-medium" style={{ color: 'var(--text-muted)' }}>
                Habit Coin Economy & Reward Store
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">

            {/* Streak Badge */}
            <div
              onClick={() => showToast(`🔥 Current Streak: ${stats.currentStreak} Days (Longest: ${stats.longestStreak} Days)`)}
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity"
              style={{
                background: 'var(--streak-bg)',
                border: '1px solid var(--streak-border)',
                color: 'var(--streak-text)',
              }}
              title={`Current Streak: ${stats.currentStreak} days (Click for details)`}
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
              <span className="sm:hidden font-outfit">{stats.currentStreak}d</span>
              <span className="hidden sm:inline font-outfit">{stats.currentStreak}d streak</span>
            </div>

            {/* Coin Balance Pill */}
            <button
              onClick={() => handleTabClick('store')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full font-outfit text-xs sm:text-sm font-extrabold bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg shadow-amber-500/25 hover:scale-105 border border-amber-400/50 transition-all cursor-pointer"
            >
              <CoinToken size={20} />
              <span>{stats.coinBalance}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full transition-colors cursor-pointer"
              style={{
                background: 'var(--streak-bg)',
                border: '1px solid var(--streak-border)',
                color: 'var(--text-accent)',
              }}
              title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Theme`}
            >
              {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Google Auth User Profile / Login */}
            {user ? (
              <>
                {/* Mobile Profile Avatar Button */}
                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="sm:hidden p-0.5 rounded-full border-2 border-emerald-400/80 hover:scale-105 transition-transform cursor-pointer shrink-0"
                  title={`Signed in as ${user.displayName || 'User'}. Tap to sign out.`}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center font-bold text-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </button>

                {/* Desktop Full Profile Pill */}
                <div className="hidden sm:flex items-center space-x-2 p-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-7 h-7 rounded-full border border-emerald-400 object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center font-bold text-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <span className="text-xs font-bold hidden md:inline px-1" style={{ color: 'var(--text-primary)' }}>
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={() => setIsLogoutModalOpen(true)}
                    className="p-1.5 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 cursor-pointer"
                    title="Sign out of Google"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>

                <LogoutModal
                  isOpen={isLogoutModalOpen}
                  onClose={() => setIsLogoutModalOpen(false)}
                  onConfirm={logout}
                />
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-zinc-900 hover:bg-zinc-100 shadow-md cursor-pointer border border-zinc-200 shrink-0"
                title="Sign in with Google"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline font-outfit">Google Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Nav Tabs Row (Hidden on mobile since we have BottomNav) */}
        <nav
          className="hidden md:flex items-center space-x-1 overflow-x-auto py-2 no-scrollbar"
          style={{ borderTop: '1px solid var(--nav-border)' }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer"
                style={{
                  background: isActive ? 'var(--nav-active-bg)' : 'transparent',
                  color: isActive ? 'var(--nav-active-text)' : 'var(--nav-inactive-text)',
                  border: isActive ? '1px solid var(--pill-badge-border)' : '1px solid transparent',
                }}
              >
                <Icon className="w-4 h-4" style={{ color: isActive ? 'var(--nav-active-text)' : 'var(--nav-inactive-text)' }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
