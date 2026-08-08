import React, { useState } from 'react';
import { Plus, Zap, ShoppingBag, X } from 'lucide-react';
import { playSound } from '../services/sound';
import { useApp } from '../context/AppContext';

export const FAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { setActiveTab } = useApp();

  const toggleMenu = () => {
    playSound.click(true);
    setIsOpen(!isOpen);
  };

  const handleAction = (tabId: string, btnId: string) => {
    playSound.click(true);
    setIsOpen(false);
    setActiveTab(tabId);
    setTimeout(() => {
      document.getElementById(btnId)?.click();
    }, 100);
  };

  return (
    <div 
      className="fixed right-4 md:bottom-8 md:right-8 z-20 flex flex-col items-end md:hidden"
      style={{ bottom: 'var(--floating-bottom-offset)' }}
    >
      {/* Backdrop for mobile to focus on the menu */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[-1] transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Options */}
      <div 
        className={`flex flex-col space-y-3 mb-4 transition-all duration-300 origin-bottom ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <button
          onClick={() => handleAction('store', 'btn-add-reward')}
          className="flex items-center space-x-3 bg-white text-zinc-900 px-4 py-3 rounded-2xl shadow-xl shadow-black/20 hover:bg-zinc-50 border border-zinc-200 transition-transform active:scale-95 cursor-pointer group"
        >
          <span className="font-outfit font-bold text-sm">Add Reward</span>
          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </button>
        
        <button
          onClick={() => handleAction('habits', 'btn-add-habit')}
          className="flex items-center space-x-3 bg-white text-zinc-900 px-4 py-3 rounded-2xl shadow-xl shadow-black/20 hover:bg-zinc-50 border border-zinc-200 transition-transform active:scale-95 cursor-pointer group"
        >
          <span className="font-outfit font-bold text-sm">Add Habit</span>
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Zap className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Primary FAB Button */}
      <button
        onClick={toggleMenu}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/40 text-white transition-all duration-300 z-10 cursor-pointer border-2 ${
          isOpen 
            ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-600 rotate-45' 
            : 'bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 hover:scale-105 border-amber-300/50'
        }`}
        aria-label="Quick actions"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6 stroke-[3]" />}
      </button>
    </div>
  );
};
