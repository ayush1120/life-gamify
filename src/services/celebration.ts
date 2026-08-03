import confetti from 'canvas-confetti';
import { CelebrationStyle } from '../types';

export const triggerCelebration = (style: CelebrationStyle = 'confetti') => {
  switch (style) {
    case 'coinShower':
      // Golden coin shower effect
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.2 },
        colors: ['#f59e0b', '#fbbf24', '#d97706', '#fef08a'],
        shapes: ['circle'],
        scalar: 1.4,
        gravity: 1.2
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 80,
          origin: { y: 0.3 },
          colors: ['#f59e0b', '#fef08a'],
          shapes: ['circle'],
          scalar: 1.2
        });
      }, 250);
      break;

    case 'fireworks': {
      // Multi-firework explosion
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const interval: ReturnType<typeof setInterval> = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.4), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.6, 0.9), y: Math.random() - 0.2 } });
      }, 250);
      break;
    }

    case 'starburst':
      // Starburst explosive ring
      confetti({
        particleCount: 100,
        spread: 120,
        startVelocity: 45,
        origin: { y: 0.5 },
        colors: ['#ec4899', '#8b5cf6', '#3b82f6', '#f59e0b', '#10b981'],
        shapes: ['star', 'circle'],
        scalar: 1.3
      });
      break;

    case 'confetti':
    default:
      // Standard colorful confetti burst
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      break;
  }
};

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
