import React from 'react';

interface CoinTokenProps {
  size?: number; // Size in px (default 24)
  className?: string;
}

export const CoinToken: React.FC<CoinTokenProps> = ({ size = 24, className = '' }) => {
  return (
    <img
      src="/assets/gold_coin_transparent.png"
      alt="Gold Coin"
      className={`inline-block shrink-0 select-none object-contain filter drop-shadow-md transition-transform ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      draggable={false}
    />
  );
};
