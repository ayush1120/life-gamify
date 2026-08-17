import { 
  GameMasterResponse, 
  GameMasterContext, 
  QuestProposal, 
  BossProposal, 
  AchievementProposal,
  GAME_MASTER_VERSION 
} from './aiContract';
import { 
  StatId, 
  Habit, 
  QuestDefinition, 
  BossDefinition, 
  AchievementDefinition, 
  GameNotification 
} from '../../types';
import { ALL_STAT_IDS, normalizeStatWeights } from '../../utils/progressionUtils';

export interface ValidationResult<T> {
  isValid: boolean;
  errors: string[];
  data?: T;
}

const VALID_QUEST_TYPES = ['daily', 'weekly', 'milestone'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const VALID_BOSS_DIFFICULTIES = ['easy', 'medium', 'hard', 'epic'];
const VALID_NOTIFICATION_TYPES = ['level_up', 'quest_complete', 'boss_defeated', 'achievement_unlocked', 'milestone', 'game_master'];

/**
 * Validates raw AI Game Master response against the strict schema and business rules (Phase 9 & 10).
 */
export const validateGameMasterResponse = (
  raw: unknown,
  context: GameMasterContext
): ValidationResult<GameMasterResponse> => {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { isValid: false, errors: ['Response must be a valid JSON object'] };
  }

  const obj = raw as Partial<GameMasterResponse>;
  const validHabitIds = new Set(context.habits.map(h => h.id));

  // 1. Version check
  const version = typeof obj.version === 'string' ? obj.version : GAME_MASTER_VERSION;

  // 2. Activity Mappings Validation
  const validatedMappings: GameMasterResponse['activityMappings'] = [];
  if (Array.isArray(obj.activityMappings)) {
    for (let i = 0; i < obj.activityMappings.length; i++) {
      const m = obj.activityMappings[i];
      if (!m || typeof m !== 'object') {
        errors.push(`activityMappings[${i}] must be an object`);
        continue;
      }
      if (!m.habitId || !validHabitIds.has(m.habitId)) {
        errors.push(`activityMappings[${i}] references unknown habitId: "${m.habitId}" (AI cannot invent habit IDs)`);
        continue;
      }
      if (!Array.isArray(m.stats) || m.stats.length === 0) {
        errors.push(`activityMappings[${i}] must have non-empty stats array`);
        continue;
      }

      const invalidStat = m.stats.find(s => !ALL_STAT_IDS.includes(s.stat as StatId));
      if (invalidStat) {
        errors.push(`activityMappings[${i}] contains invalid stat "${invalidStat.stat}"`);
        continue;
      }

      validatedMappings.push({
        habitId: m.habitId,
        stats: normalizeStatWeights(m.stats),
        reason: typeof m.reason === 'string' ? m.reason : undefined,
        confidence: typeof m.confidence === 'number' ? m.confidence : 0.9
      });
    }
  }

  // 3. Quests Validation (Max 3 active quests limit)
  const validatedQuests: GameMasterResponse['quests'] = [];
  if (Array.isArray(obj.quests)) {
    if (obj.quests.length > 3) {
      errors.push(`AI proposed ${obj.quests.length} quests, exceeding maximum limit of 3`);
    }

    const questList = obj.quests.slice(0, 3);
    for (let i = 0; i < questList.length; i++) {
      const q = questList[i];
      if (!q || typeof q !== 'object') {
        errors.push(`quests[${i}] must be an object`);
        continue;
      }
      if (!q.title || typeof q.title !== 'string') {
        errors.push(`quests[${i}] is missing a valid title`);
        continue;
      }
      if (!q.description || typeof q.description !== 'string') {
        errors.push(`quests[${i}] is missing a description`);
        continue;
      }
      const type = VALID_QUEST_TYPES.includes(q.type) ? q.type : 'weekly';
      const difficulty = VALID_DIFFICULTIES.includes(q.difficulty) ? q.difficulty : 'medium';

      if (!Array.isArray(q.requirements) || q.requirements.length === 0) {
        errors.push(`quests[${i}] ("${q.title}") must have at least 1 requirement`);
        continue;
      }

      let reqsValid = true;
      const validatedReqs = [];
      for (const req of q.requirements) {
        if (!req.habitId || !validHabitIds.has(req.habitId)) {
          errors.push(`quests[${i}] requirement references unknown habitId "${req.habitId}"`);
          reqsValid = false;
          break;
        }
        const targetCount = Math.max(1, Math.min(50, Math.floor(req.targetCount || 1)));
        validatedReqs.push({ habitId: req.habitId, targetCount });
      }

      if (reqsValid) {
        validatedQuests.push({
          id: q.id || `quest-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: q.title.trim(),
          description: q.description.trim(),
          type,
          difficulty,
          requirements: validatedReqs,
          narrative: typeof q.narrative === 'string' ? q.narrative : undefined
        });
      }
    }
  }

  // 4. Boss Proposal Validation (Max 1 boss)
  let validatedBoss: GameMasterResponse['boss'] = undefined;
  if (obj.boss && typeof obj.boss === 'object') {
    const b = obj.boss;
    if (!b.name || typeof b.name !== 'string') {
      errors.push('boss is missing a valid name');
    } else {
      const stats = Array.isArray(b.relevantStats) 
        ? b.relevantStats.filter(s => ALL_STAT_IDS.includes(s as StatId)) as StatId[]
        : ['discipline' as StatId];

      const durationDays = Math.max(7, Math.min(60, Number(b.durationDays) || 30));
      const difficulty = VALID_BOSS_DIFFICULTIES.includes(b.difficulty) ? b.difficulty : 'medium';

      validatedBoss = {
        id: b.id || `boss-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: b.name.trim(),
        title: typeof b.title === 'string' ? b.title.trim() : undefined,
        theme: typeof b.theme === 'string' ? b.theme.trim() : 'Overcoming Inertia',
        description: typeof b.description === 'string' ? b.description.trim() : 'Defeat the challenge through continuous daily actions.',
        relevantStats: stats.length > 0 ? stats : ['discipline'],
        durationDays,
        difficulty,
        narrative: typeof b.narrative === 'string' ? b.narrative : undefined
      };
    }
  }

  // 5. Achievements Validation (Max 3 achievements)
  const validatedAchievements: GameMasterResponse['achievements'] = [];
  if (Array.isArray(obj.achievements)) {
    const achList = obj.achievements.slice(0, 3);
    for (let i = 0; i < achList.length; i++) {
      const a = achList[i];
      if (!a || typeof a !== 'object') continue;
      if (!a.name || typeof a.name !== 'string') continue;

      const validatedReqs = [];
      if (Array.isArray(a.requirements)) {
        for (const req of a.requirements) {
          if (req.habitId && !validHabitIds.has(req.habitId)) continue;
          if (req.stat && !ALL_STAT_IDS.includes(req.stat as StatId)) continue;
          validatedReqs.push({
            habitId: req.habitId,
            stat: req.stat as StatId,
            targetCount: req.targetCount ? Math.max(1, req.targetCount) : undefined,
            targetLevel: req.targetLevel ? Math.max(1, req.targetLevel) : undefined,
            description: req.description || 'Complete required milestones'
          });
        }
      }

      if (validatedReqs.length > 0) {
        validatedAchievements.push({
          id: a.id || `ach-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: a.name.trim(),
          description: typeof a.description === 'string' ? a.description.trim() : 'Unlock special mastery.',
          icon: typeof a.icon === 'string' && a.icon.length > 0 ? a.icon : '🏆',
          category: typeof a.category === 'string' ? a.category : 'Mastery',
          requirements: validatedReqs
        });
      }
    }
  }

  // 6. Notifications Validation (Max 3 notifications)
  const validatedNotifications: GameMasterResponse['notifications'] = [];
  if (Array.isArray(obj.notifications)) {
    const notifList = obj.notifications.slice(0, 3);
    for (const n of notifList) {
      if (!n || typeof n !== 'object') continue;
      if (!n.title || typeof n.title !== 'string') continue;
      const type = VALID_NOTIFICATION_TYPES.includes(n.type) ? n.type : 'game_master';
      validatedNotifications.push({
        type,
        title: n.title.trim(),
        message: typeof n.message === 'string' ? n.message.trim() : '',
        priority: n.priority === 'high' || n.priority === 'low' ? n.priority : 'medium'
      });
    }
  }

  const sanitizedData: GameMasterResponse = {
    version,
    summary: typeof obj.summary === 'string' ? obj.summary : 'Game Master analysis completed.',
    activityMappings: validatedMappings,
    quests: validatedQuests,
    boss: validatedBoss,
    achievements: validatedAchievements,
    notifications: validatedNotifications
  };

  // If there were fatal structural errors, reject
  return {
    isValid: errors.length === 0,
    errors,
    data: sanitizedData
  };
};

/**
 * Deterministically computes XP and Coin rewards for an accepted Quest proposal (Phase 18).
 * questXP = sum(baseXP) * difficultyMultiplier
 * questCoins = sum(baseCoins) * bonusMultiplier
 */
export const convertProposalToQuest = (
  proposal: QuestProposal,
  habits: Habit[]
): QuestDefinition => {
  const habitMap = new Map(habits.map(h => [h.id, h]));
  let baseCoinSum = 0;

  const enrichedReqs = proposal.requirements.map(req => {
    const habit = habitMap.get(req.habitId);
    const habitReward = habit?.rewardValue || 5;
    baseCoinSum += habitReward * req.targetCount;
    return {
      habitId: req.habitId,
      habitName: habit?.name || 'Habit',
      targetCount: req.targetCount,
      currentCount: 0
    };
  });

  const diffMultiplierMap: Record<string, { xp: number; coin: number }> = {
    easy: { xp: 1.25, coin: 1.1 },
    medium: { xp: 1.5, coin: 1.25 },
    hard: { xp: 2.0, coin: 1.5 }
  };

  const mult = diffMultiplierMap[proposal.difficulty] || diffMultiplierMap.medium;
  const xpReward = Math.round(baseCoinSum * 5 * mult.xp);
  const coinReward = Math.round(baseCoinSum * mult.coin);

  return {
    id: proposal.id || `quest-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    title: proposal.title,
    description: proposal.description,
    type: proposal.type,
    difficulty: proposal.difficulty,
    requirements: enrichedReqs,
    xpReward,
    coinReward,
    status: 'active',
    createdAt: new Date().toISOString(),
    source: 'ai'
  };
};

/**
 * Deterministically computes Max HP and Rewards for an accepted Boss proposal (Phase 20).
 */
export const convertProposalToBoss = (
  proposal: BossProposal,
  userLevel: number
): BossDefinition => {
  const duration = proposal.durationDays || 30;
  const levelMultiplier = Math.max(1, userLevel * 0.5 + 1);

  const difficultyHpMap: Record<string, number> = {
    easy: 300,
    medium: 600,
    hard: 1200,
    epic: 2000
  };

  const baseHp = difficultyHpMap[proposal.difficulty] || 600;
  const maxHp = Math.round(baseHp * (duration / 30) * levelMultiplier);

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + duration * 24 * 3600 * 1000);

  const xpReward = Math.round(maxHp * 1.5);
  const coinReward = Math.round(maxHp * 0.1);

  return {
    id: proposal.id || `boss-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    name: proposal.name,
    title: proposal.title,
    theme: proposal.theme,
    description: proposal.description,
    relevantStats: proposal.relevantStats,
    maxHp,
    currentHp: maxHp,
    durationDays: duration,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    xpReward,
    coinReward,
    status: 'active',
    createdAt: new Date().toISOString(),
    source: 'ai'
  };
};

/**
 * Deterministically computes rewards for an accepted Achievement proposal (Phase 22).
 */
export const convertProposalToAchievement = (
  proposal: AchievementProposal
): AchievementDefinition => {
  return {
    id: proposal.id || `ach-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    name: proposal.name,
    description: proposal.description,
    icon: proposal.icon || '🏆',
    category: proposal.category || 'Mastery',
    requirements: proposal.requirements.map(r => ({
      habitId: r.habitId,
      stat: r.stat,
      targetCount: r.targetCount,
      targetLevel: r.targetLevel,
      description: r.description
    })),
    xpReward: 250,
    coinReward: 30,
    status: 'locked',
    source: 'ai'
  };
};

/**
 * Converts a notification proposal into a game notification (Phase 23).
 */
export const convertProposalToNotification = (
  proposal: GameMasterResponse['notifications'][0]
): GameNotification => {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    type: proposal.type,
    title: proposal.title,
    message: proposal.message,
    timestamp: new Date().toISOString(),
    read: false,
    priority: proposal.priority || 'medium'
  };
};
