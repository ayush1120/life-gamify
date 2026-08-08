import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X, ShieldCheck, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { playSound } from '../services/sound';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const { user, settings } = useApp();

  if (!isOpen || !user) return null;

  const handleConfirm = () => {
    playSound.click(settings.soundEnabled);
    onConfirm();
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center my-auto"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
        >
          {/* Close Icon Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: 'var(--pill-badge-bg)', color: 'var(--text-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>

          {/* User Profile Avatar Header */}
          <div className="flex flex-col items-center space-y-3 pt-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-emerald-400 p-0.5 shadow-xl overflow-hidden bg-emerald-500/20 flex items-center justify-center">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <User className="w-8 h-8 text-emerald-400" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-rose-500 text-white shadow-md">
                <LogOut className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <h2 className="font-outfit text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Sign Out of Account?
              </h2>
              <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {user.displayName || user.email}
              </p>
            </div>
          </div>

          {/* Warning & Cloud Backup Notice */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-left space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Cloud Backup Active</span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Your habits, logs, and coin balance remain safely synced to your Google Account.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 rounded-2xl font-bold cursor-pointer text-xs transition-opacity hover:opacity-90"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}
            >
              Stay Signed In
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="w-1/2 py-3 rounded-2xl font-outfit text-xs font-bold flex items-center justify-center space-x-1.5 bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 cursor-pointer transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
