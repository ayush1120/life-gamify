import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { CoinToken } from './CoinToken';
import { useApp } from '../context/AppContext';
import { playSound } from '../services/sound';

interface PullToRefreshProps {
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ children }) => {
  const { settings } = useApp();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);

  const THRESHOLD = 75;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull-to-refresh when scrolled to the top of the page
      if (window.scrollY <= 0) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const dy = currentY - startYRef.current;

      if (dy > 0 && window.scrollY <= 0) {
        // Rubberband resistance physics calculation
        const distance = Math.min(100, Math.pow(dy, 0.82) * 2.2);
        setPullDistance(distance);
      } else {
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;

      if (pullDistance >= THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        playSound.click(settings.soundEnabled);
        
        // Short delay to show spinning animation before reloading page
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, settings.soundEnabled]);

  const progress = Math.min(1, pullDistance / THRESHOLD);

  return (
    <div className="relative">
      {/* Pull To Refresh Top Indicator Bar */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none transition-transform duration-75"
          style={{
            transform: `translateY(${isRefreshing ? 60 : pullDistance * 0.8}px)`,
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center space-x-2 px-4 py-2 rounded-full glass-panel border border-amber-400/40 shadow-2xl backdrop-blur-xl"
            style={{ background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
          >
            <div className={`transition-transform ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${progress * 360}deg)` }}>
              {isRefreshing ? (
                <RefreshCw className="w-5 h-5 text-amber-400" />
              ) : (
                <CoinToken size={22} />
              )}
            </div>
            <span className="text-xs font-bold font-outfit">
              {isRefreshing
                ? 'Fetching latest deployment...'
                : pullDistance >= THRESHOLD
                ? 'Release to refresh'
                : 'Pull down to update app'}
            </span>
          </motion.div>
        </div>
      )}

      {children}
    </div>
  );
};
