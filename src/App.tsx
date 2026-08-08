import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { LogActivityPage } from './pages/LogActivityPage';
import { StorePage } from './pages/StorePage';
import { HabitsPage } from './pages/HabitsPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { FlyingReward } from './components/FlyingReward';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { BottomNav } from './components/BottomNav';
import { FAB } from './components/FAB';
import { PullToRefresh } from './components/PullToRefresh';

const MainContent: React.FC = () => {
  const { 
    activeTab, 
    toastMessage, 
    flyingReward, 
    setFlyingReward, 
    showPurchaseSuccessModal,
    setShowPurchaseSuccessModal,
    settings 
  } = useApp();

  return (
    <PullToRefresh>
      <div className="min-h-screen flex flex-col font-sans pb-24 md:pb-0">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'log-activity' && <LogActivityPage />}
        {activeTab === 'store' && <StorePage />}
        {activeTab === 'habits' && <HabitsPage />}
        {activeTab === 'history' && <HistoryPage />}
        {activeTab === 'analytics' && <AnalyticsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      {/* Purchase Success Celebration Modal */}
      <AnimatePresence>
        {showPurchaseSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass-panel rounded-3xl p-8 max-w-sm w-full text-center space-y-4 border border-amber-400/40 shadow-2xl"
            >
              <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-4xl mx-auto shadow-lg overflow-hidden">
                {showPurchaseSuccessModal.image ? (
                  <img src={showPurchaseSuccessModal.image} alt={showPurchaseSuccessModal.rewardName} className="w-full h-full object-cover" />
                ) : (
                  <span>{showPurchaseSuccessModal.icon || '🎁'}</span>
                )}
              </div>

              <h2 className="font-outfit text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                🎉 Reward Unlocked!
              </h2>

              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                You successfully redeemed <strong style={{ color: 'var(--text-accent)' }}>{showPurchaseSuccessModal.rewardName}</strong> for {showPurchaseSuccessModal.coinsSpent} {settings.currencySymbol}!
              </p>

              <div className="flex items-center justify-center space-x-1.5 text-emerald-400 text-xs font-semibold py-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Recorded in Redemption History</span>
              </div>

              <button
                onClick={() => setShowPurchaseSuccessModal(null)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-700 text-amber-950 font-outfit font-extrabold text-sm shadow-lg border border-amber-300 cursor-pointer"
              >
                Enjoy Your Reward!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FlyingReward
        reward={flyingReward}
        onComplete={() => setFlyingReward(null)}
      />

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed left-4 right-4 md:left-auto md:right-6 z-50 px-5 py-3 rounded-2xl glass-panel font-outfit text-sm font-bold shadow-2xl flex items-center justify-center sm:justify-start space-x-2 border border-amber-500/30 backdrop-blur-xl"
            style={{ 
              bottom: 'var(--floating-bottom-offset)',
              color: 'var(--text-primary)' 
            }}
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-6 text-center text-xs pb-[90px] md:pb-6" style={{ borderTop: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
        <p>Life Gamify • Personal Habit Coin Economy & Reward Store</p>
      </footer>

      <BottomNav />
      <FAB />
    </div>
    </PullToRefresh>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
