import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportAllData, importAllData } from '../services/storage';
import { ThemeOption, CelebrationStyle } from '../types';
import { Settings as SettingsIcon, Volume2, VolumeX, Shield, Download, Upload, Palette, Save, Sparkles, Sun, Moon } from 'lucide-react';
import { playSound } from '../services/sound';
import { triggerCelebration } from '../services/celebration';

const THEMES: { id: ThemeOption; name: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dark', name: 'Dark Theme', desc: 'Midnight Navy background with neon gradients & glowing glass cards', icon: Moon },
  { id: 'light', name: 'Light Theme', desc: 'Warm Ivory & Cream background with golden amber accents', icon: Sun },
];

const CELEBRATION_STYLES: { id: CelebrationStyle; name: string; desc: string }[] = [
  { id: 'confetti', name: '🎉 Confetti Explosion', desc: 'Classic colorful confetti burst' },
  { id: 'coinShower', name: '🪙 Golden Coin Shower', desc: 'Shower of gold coins falling from top' },
  { id: 'fireworks', name: '🎆 Fireworks Sparkle', desc: 'Multi-burst fireworks show' },
  { id: 'starburst', name: '⭐ Starburst Ring', desc: 'Colorful star explosion ring' },
];

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, showToast, user, signInWithGoogle, logout } = useApp();

  const [theme, setTheme] = useState<ThemeOption>(settings.theme || 'dark');
  const [celebrationStyle, setCelebrationStyle] = useState<CelebrationStyle>(settings.celebrationStyle || 'confetti');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '🪙');
  const [currencyName, setCurrencyName] = useState(settings.currencyName || 'Coins');
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [allowedEmail, setAllowedEmail] = useState(settings.allowedEmail || '');
  const [firebaseApiKey, setFirebaseApiKey] = useState(settings.firebaseApiKey || '');
  const [firebaseProjectId, setFirebaseProjectId] = useState(settings.firebaseProjectId || '');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      theme,
      celebrationStyle,
      currencySymbol: currencySymbol.trim() || '🪙',
      currencyName: currencyName.trim() || 'Coins',
      soundEnabled,
      allowedEmail: allowedEmail.trim(),
      firebaseApiKey: firebaseApiKey.trim(),
      firebaseProjectId: firebaseProjectId.trim()
    });
    playSound.click(soundEnabled);
  };

  const handleTestCelebration = (style: CelebrationStyle) => {
    setCelebrationStyle(style);
    triggerCelebration(style);
    playSound.fanfare(soundEnabled);
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-gamify-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Exported backup file successfully!');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content && importAllData(content)) {
        showToast('Data imported successfully! Reloading app...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast('Failed to import invalid backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-outfit text-3xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <SettingsIcon className="w-6 h-6" style={{ color: 'var(--text-accent)' }} />
          <span>Application Settings</span>
        </h1>
        <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
          Customize your theme mode, celebration particle effects, audio feedback, and data backups
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Light / Dark Theme Selection */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6" style={{ border: '1px solid var(--glass-border)' }}>
          <h2 className="font-outfit text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Palette className="w-5 h-5" style={{ color: 'var(--text-accent)' }} />
            <span>Theme Selection</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {THEMES.map(t => {
              const Icon = t.icon;
              const isActive = theme === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    const themeClass = `theme-${t.id}`;
                    document.documentElement.className = themeClass;
                    document.body.className = themeClass;
                  }}
                  className="p-5 rounded-2xl cursor-pointer border transition-all flex items-center space-x-4"
                  style={{
                    background: isActive ? 'var(--pill-badge-bg)' : 'var(--glass-bg)',
                    borderColor: isActive ? 'var(--pill-badge-border)' : 'var(--glass-border)',
                  }}
                >
                  <div className="p-3 rounded-2xl" style={{ background: isActive ? 'var(--btn-hero-bg)' : 'var(--pill-badge-bg)', color: isActive ? '#ffffff' : 'var(--text-accent)' }}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="font-outfit font-bold text-base" style={{ color: 'var(--text-primary)' }}>{t.name}</h3>
                    <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Celebration Particle FX Selector */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6" style={{ border: '1px solid var(--glass-border)' }}>
          <h2 className="font-outfit text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Sparkles className="w-5 h-5" style={{ color: 'var(--text-accent)' }} />
            <span>Celebration Particle Effects</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CELEBRATION_STYLES.map(style => (
              <div
                key={style.id}
                onClick={() => handleTestCelebration(style.id)}
                className="p-4 rounded-2xl cursor-pointer border transition-all flex items-center justify-between"
                style={{
                  background: celebrationStyle === style.id ? 'var(--pill-badge-bg)' : 'var(--glass-bg)',
                  borderColor: celebrationStyle === style.id ? 'var(--pill-badge-border)' : 'var(--glass-border)',
                }}
              >
                <div>
                  <h3 className="font-outfit font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{style.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{style.desc}</p>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  style={{ background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)', color: 'var(--pill-badge-text)' }}
                >
                  Test FX
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Currency & Audio Settings */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6" style={{ border: '1px solid var(--glass-border)' }}>
          <h2 className="font-outfit text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <SettingsIcon className="w-5 h-5" style={{ color: 'var(--text-accent)' }} />
            <span>Currency & Audio Settings</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Currency Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={e => setCurrencySymbol(e.target.value)}
                placeholder="🪙"
                className="w-full px-4 py-2.5 rounded-xl text-xl text-center focus:outline-none"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Currency Unit Name</label>
              <input
                type="text"
                value={currencyName}
                onChange={e => setCurrencyName(e.target.value)}
                placeholder="Coins"
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <div className="flex items-center space-x-3">
              {soundEnabled ? <Volume2 className="w-5 h-5" style={{ color: 'var(--text-accent)' }} /> : <VolumeX className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />}
              <div>
                <span className="font-bold text-sm block" style={{ color: 'var(--text-primary)' }}>Sound Effects</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Audio feedback on habit log and store purchases</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-12 h-7 rounded-full transition-colors relative cursor-pointer"
              style={{ background: soundEnabled ? 'var(--text-accent)' : 'var(--pill-badge-bg)', border: '1px solid var(--glass-border)' }}
            >
              <div
                className={`w-5 h-5 rounded-full transition-transform absolute top-0.5 ${soundEnabled ? 'left-6 bg-white' : 'left-1 bg-amber-600'}`}
              />
            </button>
          </div>
        </div>

        {/* Security & Firebase Cloud Sync */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6" style={{ border: '1px solid var(--glass-border)' }}>
          <h2 className="font-outfit text-xl font-bold flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: 'var(--text-accent)' }} />
              <span>Google Account & Firebase Cloud Sync</span>
            </div>
          </h2>

          {/* Account Status Card */}
          {user ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full border border-emerald-400 object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-emerald-950 font-extrabold flex items-center justify-center">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <h4 className="font-outfit font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{user.displayName || 'Google User'}</h4>
                  <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span>☁️</span> Cloud Active
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-outfit font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Cloud Sync Disabled (Local Storage Mode)</h4>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Sign in with your Google account to automatically back up habits, coin vault, and redemptions to Firebase Firestore!
                </p>
              </div>

              <button
                type="button"
                onClick={signInWithGoogle}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-zinc-900 hover:bg-zinc-100 shadow-md cursor-pointer border border-zinc-200 whitespace-nowrap flex items-center gap-2 font-outfit"
              >
                <span>🔑 Sign In With Google</span>
              </button>
            </div>
          )}

          <div className="space-y-4 text-sm">
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Owner Google Email (Authorized Account)</label>
              <input
                type="email"
                placeholder="your.email@gmail.com"
                value={allowedEmail}
                onChange={e => setAllowedEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Firebase API Key (Optional Override)</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={firebaseApiKey}
                  onChange={e => setFirebaseApiKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl font-mono text-sm focus:outline-none"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Firebase Project ID (Optional Override)</label>
                <input
                  type="text"
                  placeholder="your-project-id"
                  value={firebaseProjectId}
                  onChange={e => setFirebaseProjectId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl font-mono text-sm focus:outline-none"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Settings Button */}
        <button
          type="submit"
          className="btn-gradient-hero w-full py-4 rounded-2xl font-outfit text-base font-extrabold flex items-center justify-center space-x-2 shadow-xl cursor-pointer"
        >
          <Save className="w-5 h-5" />
          <span>Save Settings & Preferences</span>
        </button>
      </form>

      {/* Backup & Import Data Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4" style={{ border: '1px solid var(--glass-border)' }}>
        <h2 className="font-outfit text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Download className="w-5 h-5" style={{ color: 'var(--text-accent)' }} />
          <span>Data Backup & Portability</span>
        </h2>

        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Export your entire habit history, store items, custom uploaded images, and coin balances to a JSON backup file anytime.
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          <button
            onClick={handleExport}
            className="px-5 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2 shadow-sm cursor-pointer"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
          >
            <Download className="w-4 h-4" style={{ color: 'var(--text-accent)' }} />
            <span>Export JSON Backup</span>
          </button>

          <label
            className="px-5 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2 shadow-sm cursor-pointer"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
          >
            <Upload className="w-4 h-4" style={{ color: 'var(--text-accent)' }} />
            <span>Import Backup</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
