import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StoreReward } from '../types';
import { StoreRewardCard } from '../components/StoreRewardCard';
import { StoreRewardModal } from '../components/StoreRewardModal';
import { ShoppingBag, Plus, Search, History } from 'lucide-react';
import { CoinToken } from '../components/CoinToken';
import { playSound } from '../services/sound';

export const StorePage: React.FC = () => {
  const { rewards, stats, settings, setActiveTab } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingReward, setEditingReward] = useState<StoreReward | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Snacks', 'Break', 'Entertainment', 'Custom'];

  const filteredRewards = rewards.filter(r => {
    if (!r.active) return false;
    const matchesSearch = searchQuery === '' ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = () => {
    playSound.click(settings.soundEnabled);
    setEditingReward(null);
    setIsModalOpen(true);
  };

  const handleEdit = (reward: StoreReward) => {
    playSound.click(settings.soundEnabled);
    setEditingReward(reward);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header & Balance Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'var(--pill-badge-bg)', border: '1px solid var(--pill-badge-border)', color: 'var(--pill-badge-text)' }}
          >
            <CoinToken size={16} />
            <span>Treasury Store</span>
          </div>
          <h1 className="font-outfit text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span>Reward Store</span>
          </h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Spend your earned coins on guilt-free rewards and treats!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Realtime Balance Badge */}
          <div
            className="px-4 py-2.5 rounded-2xl glass-panel font-outfit text-sm font-extrabold flex items-center space-x-2"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
          >
            <CoinToken size={22} />
            <span>{stats.coinBalance} {settings.currencyName} Available</span>
          </div>

          <button
            onClick={() => {
              playSound.click(settings.soundEnabled);
              setActiveTab('history');
              window.location.hash = 'history-redemptions';
            }}
            className="px-3.5 py-2.5 rounded-2xl glass-panel font-outfit text-xs font-bold flex items-center space-x-2 cursor-pointer hover:opacity-90"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
            title="View Store Redemptions & Purchases"
          >
            <History className="w-4 h-4" style={{ color: 'var(--text-accent)' }} />
            <span>Purchase History</span>
          </button>

          <button
            id="btn-add-reward"
            onClick={handleCreate}
            className="btn-gradient-hero px-4 py-2.5 rounded-2xl font-outfit text-sm font-extrabold flex items-center space-x-2 shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reward</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search rewards by title or description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm font-medium focus:outline-none"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                playSound.click(settings.soundEnabled);
                setSelectedCategory(cat);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
              style={{
                background: selectedCategory === cat ? 'var(--pill-badge-bg)' : 'var(--glass-bg)',
                border: selectedCategory === cat ? '1px solid var(--pill-badge-border)' : '1px solid var(--glass-border)',
                color: selectedCategory === cat ? 'var(--pill-badge-text)' : 'var(--text-muted)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Reward Store Grid */}
      {filteredRewards.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-amber-300/70 space-y-3">
          <ShoppingBag className="w-12 h-12 text-amber-500/40 mx-auto" />
          <p className="font-bold text-base">No store rewards found in this category.</p>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-xl bg-amber-500 text-amber-950 font-bold text-xs"
          >
            Create Store Reward
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRewards.map((reward) => (
            <StoreRewardCard
              key={reward.id}
              reward={reward}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Store CRUD Modal */}
      <StoreRewardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rewardToEdit={editingReward}
      />
    </div>
  );
};
