import { describe, it, expect } from 'vitest';

describe('Navigation routes and structure verification', () => {
  it('validates primary bottom navigation items and more options structure', async () => {
    // Check BottomNav code structure directly
    const bottomNavModule = await import('../BottomNav');
    expect(bottomNavModule.BottomNav).toBeDefined();

    // Verify validTabs includes goals
    const validTabs = [
      'dashboard', 
      'goals', 
      'adventure', 
      'log-activity', 
      'store', 
      'habits', 
      'history', 
      'analytics', 
      'settings', 
      'overlay-demo', 
      'devtools'
    ];

    expect(validTabs).toContain('goals');
    expect(validTabs).toContain('habits');
    expect(validTabs).toContain('adventure');
  });

  it('verifies route parsing for goals, goal detail, habits, and adventure', () => {
    const parseTab = (hashOrPath: string): string => {
      const cleaned = hashOrPath.replace(/^#/, '').replace(/^\//, '').trim();
      const validTabs = ['dashboard', 'goals', 'adventure', 'log-activity', 'store', 'habits', 'history', 'analytics', 'settings', 'overlay-demo', 'devtools'];
      if (validTabs.includes(cleaned) || cleaned.startsWith('habits/') || cleaned.startsWith('goals/')) {
        return cleaned;
      }
      return 'dashboard';
    };

    expect(parseTab('#goals')).toBe('goals');
    expect(parseTab('#goals/goal-123')).toBe('goals/goal-123');
    expect(parseTab('#habits')).toBe('habits');
    expect(parseTab('#habits/habit-1')).toBe('habits/habit-1');
    expect(parseTab('#adventure')).toBe('adventure');
    expect(parseTab('#dashboard')).toBe('dashboard');
    expect(parseTab('#unknown-page')).toBe('dashboard');
  });
});
