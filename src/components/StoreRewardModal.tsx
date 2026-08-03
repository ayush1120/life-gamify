import React, { useState, useEffect } from 'react';
import { StoreReward } from '../types';
import { useApp } from '../context/AppContext';
import { processImageFile } from '../services/storage';
import { X, Upload, Sparkles, Image as ImageIcon, Trash2, Plus, Save } from 'lucide-react';
import { playSound } from '../services/sound';

interface StoreRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardToEdit?: StoreReward | null;
}

const PRESET_ICONS = ['🍪', '📱', '☕', '🎮', '🎬', '🍕', '🍩', '🛍️', '🎧', '🍦', '🍔', '✈️'];
const CATEGORIES: ('Snacks' | 'Break' | 'Entertainment' | 'Custom')[] = ['Snacks', 'Break', 'Entertainment', 'Custom'];

export const StoreRewardModal: React.FC<StoreRewardModalProps> = ({ isOpen, onClose, rewardToEdit }) => {
  const { addReward, updateReward, deleteReward, settings, showToast } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState(12);
  const [icon, setIcon] = useState('🍪');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string>('Snacks');

  useEffect(() => {
    if (rewardToEdit) {
      setName(rewardToEdit.name);
      setDescription(rewardToEdit.description || '');
      setCost(rewardToEdit.cost);
      setIcon(rewardToEdit.icon);
      setImage(rewardToEdit.image);
      setCategory(rewardToEdit.category || 'Snacks');
    } else {
      setName('');
      setDescription('');
      setCost(12);
      setIcon('🍪');
      setImage(undefined);
      setCategory('Snacks');
    }
  }, [rewardToEdit, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      setImage(dataUrl);
      showToast('Image uploaded successfully!');
    } catch {
      showToast('Failed to process image file.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (rewardToEdit) {
      updateReward({
        ...rewardToEdit,
        name: name.trim(),
        description: description.trim(),
        cost: Number(cost) || 1,
        icon,
        image,
        category
      });
    } else {
      addReward({
        name: name.trim(),
        description: description.trim(),
        cost: Number(cost) || 1,
        icon,
        image,
        category,
        active: true
      });
    }

    playSound.click(settings.soundEnabled);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8"
        style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-outfit text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Sparkles className="w-5 h-5" style={{ color: 'var(--text-accent)' }} />
            <span>{rewardToEdit ? 'Edit Store Reward' : 'Add New Store Reward'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full cursor-pointer hover:opacity-80"
            style={{ background: 'var(--pill-badge-bg)', color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          
          {/* Reward Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Reward Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Bourbon Packet, 15m Social Media, Gaming..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Cost & Category Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Price ({settings.currencySymbol} {settings.currencyName}) *
              </label>
              <input
                type="number"
                min={1}
                max={500}
                required
                value={cost}
                onChange={e => setCost(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl font-bold text-sm focus:outline-none"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as 'Snacks' | 'Break' | 'Entertainment' | 'Custom')}
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Description (Optional)</label>
            <input
              type="text"
              placeholder="Guilt-free reward notes..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Image Upload & Preview Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold flex items-center justify-between" style={{ color: 'var(--text-secondary)' }}>
              <span>Cover Photo / Image</span>
              {image && (
                <button
                  type="button"
                  onClick={() => setImage(undefined)}
                  className="text-[11px] text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Remove Image
                </button>
              )}
            </label>

            {image ? (
              <div className="relative w-full h-36 rounded-2xl overflow-hidden group" style={{ border: '1px solid var(--glass-border)' }}>
                <img src={image} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="px-3 py-1.5 rounded-xl bg-amber-500 text-amber-950 font-bold text-xs cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" /> Change Photo
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <label
                className="w-full h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors"
                style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }}
              >
                <ImageIcon className="w-6 h-6 mb-1" style={{ color: 'var(--text-accent)' }} />
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Upload Custom Image File</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>PNG, JPG, WebP supported</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Or Select Emoji Icon</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer"
                  style={{
                    background: icon === ic ? 'var(--pill-badge-bg)' : 'var(--glass-bg)',
                    border: icon === ic ? '1px solid var(--pill-badge-border)' : '1px solid var(--glass-border)',
                  }}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-4">
            {rewardToEdit && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete "${rewardToEdit.name}" from store?`)) {
                    deleteReward(rewardToEdit.id);
                    onClose();
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 border border-rose-500/30 cursor-pointer font-bold"
              >
                Delete
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-bold cursor-pointer"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-gradient-hero flex-1 py-2.5 rounded-xl font-outfit font-bold flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
            >
              {rewardToEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{rewardToEdit ? 'Save Reward' : 'Add to Store'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
