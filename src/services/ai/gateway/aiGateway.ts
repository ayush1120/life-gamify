import { mastra } from '../mastra';
import { getLLMProvider } from '../llmService';
import { GameMasterContext, GameMasterResponse } from '../aiContract';
import { requestGameMasterPlan } from '../llmService';
import { loadStoredSettings } from '../../storage';

export type AIStreamEventType = 
  | 'message_start'
  | 'tool_call'
  | 'tool_result'
  | 'message_delta'
  | 'message_complete'
  | 'error';

export interface AIStreamEvent {
  type: AIStreamEventType;
  payload?: any;
  timestamp: string;
}

export interface AIChatRequest {
  conversationId?: string;
  message: string;
  history?: { role: 'system' | 'user' | 'assistant'; content: string }[];
  userId?: string;
}

export interface AIChatResponse {
  conversationId?: string;
  message: string;
  toolCalls?: { tool: string; result: any }[];
  model: string;
  latencyMs: number;
}

export interface AIProgressRequest {
  userId?: string;
}

export interface AIQuestRequest {
  context: GameMasterContext;
  userId?: string;
}

export interface LifeGamifyAIService {
  chat(request: AIChatRequest): Promise<AIChatResponse>;
  streamChat(
    request: AIChatRequest, 
    onEvent: (event: AIStreamEvent) => void
  ): Promise<AIChatResponse>;
  analyzeProgress(request: AIProgressRequest): Promise<any>;
  generateQuests(request: AIQuestRequest): Promise<GameMasterResponse>;
}

export class LifeGamifyAIGateway implements LifeGamifyAIService {
  public async chat(request: AIChatRequest): Promise<AIChatResponse> {
    const start = Date.now();

    // 1. Dispatch to Apple Foundation Model if active on iOS
    const provider = getLLMProvider();
    if (provider && (provider as any).model?.toLowerCase().includes('apple')) {
      const text = await provider.chat([
        ...(request.history || []),
        { role: 'user', content: request.message }
      ]);
      return {
        conversationId: request.conversationId,
        message: text,
        model: 'Apple Intelligence (On-Device)',
        latencyMs: Date.now() - start
      };
    }

    // 2. Otherwise dispatch to Mastra Chat Agent with contextual tools
    const agent = mastra.getAgent('chat-agent');
    const result = await agent.generate(request.message, {
      userId: request.userId,
      history: request.history
    });

    return {
      conversationId: request.conversationId,
      message: result.text,
      model: result.agentName,
      latencyMs: Date.now() - start
    };
  }

  public async streamChat(
    request: AIChatRequest,
    onEvent: (event: AIStreamEvent) => void
  ): Promise<AIChatResponse> {
    const now = () => new Date().toISOString();

    onEvent({ type: 'message_start', timestamp: now() });

    try {
      // Announce tool execution if analyzing stats
      if (request.message.toLowerCase().includes('stat') || request.message.toLowerCase().includes('level') || request.message.toLowerCase().includes('progress')) {
        onEvent({ type: 'tool_call', payload: { tool: 'getUserProgress' }, timestamp: now() });
        const progress = await mastra.tools.getUserProgressTool.execute({}, { userId: request.userId });
        onEvent({ type: 'tool_result', payload: { tool: 'getUserProgress', data: { level: progress.level, xp: progress.totalXp } }, timestamp: now() });
      }

      const response = await this.chat(request);

      // Simulate progressive stream chunks for smooth UX
      const words = response.message.split(' ');
      let accumulated = '';
      for (let i = 0; i < words.length; i++) {
        accumulated += (i > 0 ? ' ' : '') + words[i];
        onEvent({
          type: 'message_delta',
          payload: { delta: words[i] + ' ', text: accumulated },
          timestamp: now()
        });
      }

      onEvent({ type: 'message_complete', payload: { fullText: response.message }, timestamp: now() });
      return response;
    } catch (err: any) {
      onEvent({ type: 'error', payload: { error: err?.message || 'Chat generation failed' }, timestamp: now() });
      throw err;
    }
  }

  public async analyzeProgress(request: AIProgressRequest): Promise<any> {
    const workflow = mastra.getWorkflow('daily-progress-analysis');
    return await workflow.execute({ userId: request.userId });
  }

  public async generateQuests(request: AIQuestRequest): Promise<GameMasterResponse> {
    const settings = loadStoredSettings();
    const aiSettings = settings.aiSettings || { provider: 'gemini', enabled: true };
    return await requestGameMasterPlan(aiSettings, request.context);
  }
}

export const aiGateway = new LifeGamifyAIGateway();
