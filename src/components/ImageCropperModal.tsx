import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropUtils';
import { X, Check } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  aspectRatio?: number;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ 
  isOpen, 
  imageSrc, 
  onClose, 
  onCropComplete,
  aspectRatio = 16 / 9
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropCompleteHandler = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
      onClose();
    } catch (e) {
      console.error('Error cropping image:', e);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div 
        className="relative w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col h-[70vh]" 
        style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
      >
        
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Crop Image</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-full cursor-pointer hover:opacity-80" 
            style={{ background: 'var(--pill-badge-bg)', color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex-1 rounded-2xl overflow-hidden bg-black mb-4">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
          />
        </div>

        <div className="shrink-0 space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Zoom</span>
            <input 
              type="range" 
              value={zoom} 
              min={1} 
              max={3} 
              step={0.1} 
              onChange={(e) => setZoom(Number(e.target.value))} 
              className="flex-1 accent-amber-500 cursor-pointer" 
            />
          </div>
          
          <button 
            type="button"
            onClick={handleSave} 
            className="w-full btn-gradient-hero py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-5 h-5" />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
