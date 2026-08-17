import { StatId, StatWeight, QuestType, QuestDifficulty, BossDifficulty, GameNotificationType } from '../../types';

export const GAME_MASTER_VERSION = 'game-master-v1';

export interface ActivityMappingProposal {
  habitId: string;
  stats: StatWeight[];
  reason?: string;
  confidence?: number;
}

export interface QuestRequirementProposal {
  habitId: string;
  targetCount: number;
}

export interface QuestProposal {
  id?: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  requirements: QuestRequirementProposal[];
  narrative?: string;
}

export interface BossProposal {
  id?: string;
  name: string;
  title?: string;
  theme: string;
  description: string;
  relevantStats: StatId[];
  durationDays: number;
  difficulty: BossDifficulty;
  narrative?: string;
}

export interface AchievementRequirementProposal {
  habitId?: string;
  stat?: StatId;
  targetCount?: number;
  targetLevel?: number;
  description: string;
}

export interface AchievementProposal {
  id?: string;
  name: string;
  description: string;
  icon: string;
  category?: string;
  requirements: AchievementRequirementProposal[];
}

export interface NotificationProposal {
  type: GameNotificationType;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface GameMasterResponse {
  version: string;
  summary?: string;
  activityMappings?: ActivityMappingProposal[];
  quests?: QuestProposal[];
  boss?: BossProposal;
  achievements?: AchievementProposal[];
  notifications?: NotificationProposal[];
}

export interface GameMasterContext {
  user: {
    level: number;
    totalXp: number;
    statsBreakdown: Record<StatId, { level: number; xp: number; name: string }>;
  };
  habits: Array<{
    id: string;
    name: string;
    category?: string;
    tags?: string[];
    frequency: string;
    rewardValue: number;
    active: boolean;
  }>;
  recentActivity: Array<{
    habitId: string;
    habitName: string;
    timestamp: string;
    rewardEarned: number;
  }>;
  activeQuests: Array<{
    id: string;
    title: string;
    type: string;
  }>;
  activeBoss: {
    id: string;
    name: string;
    relevantStats: StatId[];
  } | null;
  archivedItemsSummary?: string[];
}
