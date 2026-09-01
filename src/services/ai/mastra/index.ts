import { LIFE_GAMIFY_TOOLS } from './tools';
import { LIFE_GAMIFY_AGENTS, chatAgent, progressAgent, questAgent } from './agents';
import { LIFE_GAMIFY_WORKFLOWS, dailyProgressAnalysisWorkflow, adaptiveQuestGenerationWorkflow } from './workflows';

export class LifeGamifyMastra {
  public tools = LIFE_GAMIFY_TOOLS;
  public agents = LIFE_GAMIFY_AGENTS;
  public workflows = LIFE_GAMIFY_WORKFLOWS;

  public getAgent(id: 'chat-agent' | 'progress-agent' | 'quest-agent') {
    switch (id) {
      case 'chat-agent': return chatAgent;
      case 'progress-agent': return progressAgent;
      case 'quest-agent': return questAgent;
      default: return chatAgent;
    }
  }

  public getWorkflow(id: 'daily-progress-analysis' | 'adaptive-quest-generation') {
    switch (id) {
      case 'daily-progress-analysis': return dailyProgressAnalysisWorkflow;
      case 'adaptive-quest-generation': return adaptiveQuestGenerationWorkflow;
      default: return dailyProgressAnalysisWorkflow;
    }
  }
}

export const mastra = new LifeGamifyMastra();
export * from './tools';
export * from './agents';
export * from './workflows';
