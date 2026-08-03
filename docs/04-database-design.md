# Database Schema & Storage Collections

Collections / Local Storage Keys:

1. `habits`:
{
    id: string,
    name: string,
    description: string,
    icon: string,
    rewardValue: number, // Coins earned (e.g. 5)
    maxPerPeriod: number, // Max completions allowed per frequency period (default 1)
    maxPerDay?: number, // Alias kept for backward compatibility
    frequency: 'daily' | 'weekly' | 'monthly', // Frequency scheduling (default 'daily')
    isQuickHabit: boolean, // Quick habit favorite marker for 1-tap logging
    category: string, // Primary category e.g. 'Health', 'Work', 'Music'
    tags: string[], // Tag array e.g. ['Health', 'Fitness']
    active: boolean,
    color: string,
    order: number,
    createdAt: string,
    updatedAt: string
}

2. `rewards` (Reward Store Items):
{
    id: string,
    name: string,
    description: string,
    cost: number, // Coins required (e.g. 12)
    icon: string,
    image?: string, // Data URL or preset image URL
    active: boolean,
    category: string,
    createdAt: string,
    updatedAt: string
}

3. `rewardLogs` (Habit Completion Logs):
{
    id: string,
    activityId: string,
    habitName: string,
    icon: string,
    timestamp: string,
    rewardEarned: number,
    unit: string,
    isRetracted?: boolean,
    retractedAt?: string,
    karmaFeeApplied?: number
}

4. `rewardRedemptions` (Store Purchases):
{
    id: string,
    rewardId: string,
    rewardName: string,
    coinsSpent: number,
    timestamp: string,
    note?: string
}

5. `settings`:
{
    theme: 'dark' | 'light',
    celebrationStyle: 'confetti' | 'coinShower' | 'fireworks' | 'starburst',
    soundEnabled: boolean,
    currencySymbol: string, // '🪙'
    currencyName: string, // 'Coins'
    allowedEmail?: string,
    firebaseApiKey?: string,
    firebaseProjectId?: string
}