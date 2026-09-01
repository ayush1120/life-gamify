import { QuestService } from '../../domain/questService';
import { BossService } from '../../domain/bossService';
import { AchievementService } from '../../domain/achievementService';
import { QuestDefinition, BossDefinition, AchievementDefinition } from '../../../types';

export type AIMutationType = 'create_quest' | 'create_boss' | 'create_achievement' | 'update_quest_status';

export interface AIMutationProposal {
  id: string;
  type: AIMutationType;
  title: string;
  description: string;
  summary: string;
  payload: any;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  createdAt: string;
  executedAt?: string;
}

class MutationApprovalService {
  private proposals: AIMutationProposal[] = [];
  private listeners: ((proposals: AIMutationProposal[]) => void)[] = [];

  public createProposal(
    type: AIMutationType,
    title: string,
    description: string,
    summary: string,
    payload: any
  ): AIMutationProposal {
    const proposal: AIMutationProposal = {
      id: `prop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      title,
      description,
      summary,
      payload,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.proposals = [proposal, ...this.proposals];
    this.notify();
    return proposal;
  }

  public getProposals(): AIMutationProposal[] {
    return this.proposals;
  }

  public getPendingProposals(): AIMutationProposal[] {
    return this.proposals.filter(p => p.status === 'pending');
  }

  public async approveProposal(id: string, userId?: string): Promise<{ success: boolean; result?: any; error?: string }> {
    const index = this.proposals.findIndex(p => p.id === id);
    if (index === -1) {
      return { success: false, error: 'Proposal not found' };
    }

    const proposal = this.proposals[index];
    if (proposal.status !== 'pending') {
      return { success: false, error: `Proposal is already ${proposal.status}` };
    }

    try {
      let result: any = null;

      switch (proposal.type) {
        case 'create_quest':
          result = await QuestService.createQuest(proposal.payload as Partial<QuestDefinition>, userId);
          break;
        case 'create_boss':
          result = await BossService.createBoss(proposal.payload as Partial<BossDefinition>, userId);
          break;
        case 'create_achievement':
          result = await AchievementService.createAchievement(proposal.payload as Partial<AchievementDefinition>, userId);
          break;
        case 'update_quest_status':
          result = await QuestService.updateQuestStatus(proposal.payload.questId, proposal.payload.status, userId);
          break;
        default:
          throw new Error(`Unknown mutation type: ${proposal.type}`);
      }

      this.proposals[index] = {
        ...proposal,
        status: 'executed',
        executedAt: new Date().toISOString()
      };
      this.notify();
      return { success: true, result };
    } catch (err: any) {
      console.error('[MutationApprovalService] Execution failed:', err);
      return { success: false, error: err?.message || 'Execution failed' };
    }
  }

  public rejectProposal(id: string): boolean {
    const index = this.proposals.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.proposals[index] = {
      ...this.proposals[index],
      status: 'rejected'
    };
    this.notify();
    return true;
  }

  public subscribe(listener: (proposals: AIMutationProposal[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.proposals);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.proposals));
  }
}

export const mutationApprovalService = new MutationApprovalService();
