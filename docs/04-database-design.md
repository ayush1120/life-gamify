# Database Schema & Storage Collections

Collections / Local Storage Keys:

1. `habits`:
{
    id: string,
    name: string,
    description: string,
    icon: string,
    rewardValue: number, // Coins earned (e.g. 5)
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
    coinsEarned: number
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
    theme: 'golden' | 'cyber' | 'chocolate' | 'emerald' | 'sunset' | 'midnight',
    celebrationStyle: 'confetti' | 'coinShower' | 'fireworks' | 'starburst',
    soundEnabled: boolean,
    currencySymbol: string, // '🪙'
    currencyName: string, // 'Coins'
    allowedEmail?: string,
    firebaseApiKey?: string,
    firebaseProjectId?: string
}