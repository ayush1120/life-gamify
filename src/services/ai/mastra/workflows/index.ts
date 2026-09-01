import { ProgressService } from '../../../domain/progressService';
import { HabitService } from '../../../domain/habitService';
import { ActivityService } from '../../../domain/activityService';
import { QuestService } from '../../../domain/questService';
import { BossService } from '../../../domain/bossService';
import { requestGameMasterPlan } from '../../llmService';
import { buildGameMasterContext } from '../../aiContextBuilder';
import { convertProposalToQuest, convertProposalToBoss } from '../../aiValidator';
import { loadStoredSettings } from '../../../storage';

export interface WorkflowStepResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  success: boolean;
  steps: WorkflowStepResult[];
  summary: string;
  timestamp: string;
}

// 1. Daily Progress & Consistency Analysis Workflow
export const dailyProgressAnalysisWorkflow = {
  id: 'daily-progress-analysis',
  name: 'Daily Progress Analysis Workflow',
  description: 'Evaluates habit logs, checks streak health, and computes daily momentum.',
  execute: async (context?: { userId?: string }): Promise<WorkflowExecutionResult> => {
    const steps: WorkflowStepResult[] = [];

    // Step 1: Fetch recent activity logs
    let logs: any[] = [];
    try {
      logs = await ActivityService.getActivityLogs(context?.userId);
      steps.push({ step: 'fetch-activity-logs', success: true, data: { count: logs.length } });
    } catch (e: any) {
      steps.push({ step: 'fetch-activity-logs', success: false, error: e?.message });
    }

    // Step 2: Calculate progress and streaks
    let progress: any = null;
    try {
      progress = await ProgressService.calculateProgress(context?.userId);
      steps.push({ step: 'compute-progress', success: true, data: { level: progress.level, streak: progress.currentStreak } });
    } catch (e: any) {
      steps.push({ step: 'compute-progress', success: false, error: e?.message });
    }

    // Step 3: Check raid boss status
    let activeBoss: any = null;
    try {
      activeBoss = await BossService.getActiveBoss(context?.userId);
      steps.push({ step: 'check-active-boss', success: true, data: { activeBoss: activeBoss?.name || null } });
    } catch (e: any) {
      steps.push({ step: 'check-active-boss', success: false, error: e?.message });
    }

    const summary = progress
      ? `Daily analysis complete. Level ${progress.level}, Current Streak: ${progress.currentStreak} days, Active Logs: ${logs.length}.`
      : 'Daily analysis encountered warnings during execution.';

    return {
      workflowId: 'daily-progress-analysis',
      success: steps.every(s => s.success),
      steps,
      summary,
      timestamp: new Date().toISOString()
    };
  }
};

// 2. Adaptive Quest & Boss Encounter Generation Workflow
export const adaptiveQuestGenerationWorkflow = {
  id: 'adaptive-quest-generation',
  name: 'Adaptive Quest & Boss Generation Workflow',
  description: 'Uses Game Master AI to generate personalized quests, raid bosses, and achievements.',
  execute: async (context?: { userId?: string }): Promise<WorkflowExecutionResult> => {
    const steps: WorkflowStepResult[] = [];

    // Step 1: Build Game Master context
    const habits = await HabitService.getHabits(context?.userId);
    const progress = await ProgressService.calculateProgress(context?.userId);
    const logs = await ActivityService.getActivityLogs(context?.userId);
    const quests = await QuestService.getQuests(context?.userId);
    const bosses = await BossService.getBosses(context?.userId);

    const activeQuests = quests.filter(q => q.status === 'active');
    const activeBoss = bosses.find(b => b.status === 'active') || null;
    const archivedQuests = quests.filter(q => q.status === 'archived');
    const archivedBosses = bosses.filter(b => b.status === 'archived');

    const gmContext = buildGameMasterContext(
      progress,
      habits,
      logs,
      activeQuests,
      activeBoss,
      archivedQuests,
      archivedBosses
    );
    steps.push({ step: 'build-game-master-context', success: true });

    // Step 2: Request structured AI proposal
    try {
      const settings = loadStoredSettings();
      const aiSettings = settings.aiSettings || { provider: 'gemini', enabled: true };
      const proposal = await requestGameMasterPlan(aiSettings, gmContext);
      steps.push({ step: 'generate-ai-proposal', success: true, data: { summary: proposal.summary } });

      // Step 3: Persist Quests through QuestService
      if (proposal.quests && proposal.quests.length > 0) {
        for (const q of proposal.quests) {
          const questDef = convertProposalToQuest(q, habits);
          await QuestService.createQuest(questDef, context?.userId);
        }
        steps.push({ step: 'persist-quests', success: true, data: { questCount: proposal.quests.length } });
      }

      // Step 4: Persist Boss Encounter if generated
      if (proposal.boss) {
        const bossDef = convertProposalToBoss(proposal.boss, progress.level);
        await BossService.createBoss(bossDef, context?.userId);
        steps.push({ step: 'persist-boss', success: true, data: { bossName: proposal.boss.name } });
      }

      return {
        workflowId: 'adaptive-quest-generation',
        success: true,
        steps,
        summary: `Successfully generated and persisted ${proposal.quests?.length || 0} quests and ${proposal.boss ? proposal.boss.name : '0 bosses'}.`,
        timestamp: new Date().toISOString()
      };
    } catch (e: any) {
      steps.push({ step: 'generate-ai-proposal', success: false, error: e?.message });
      return {
        workflowId: 'adaptive-quest-generation',
        success: false,
        steps,
        summary: `Quest generation workflow failed: ${e?.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
};

export const LIFE_GAMIFY_WORKFLOWS = {
  dailyProgressAnalysisWorkflow,
  adaptiveQuestGenerationWorkflow
};
