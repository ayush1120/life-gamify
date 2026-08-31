import { LLMProvider } from '../llmService';
import { GameMasterContext, GameMasterResponse } from '../aiContract';
import { nativeOnDeviceAIService } from '../../native/bridge';
import { GAME_MASTER_SYSTEM_PROMPT, buildGameMasterUserPrompt } from '../aiPrompt';
import { extractAndParseJson } from '../jsonUtils';
import { validateGameMasterResponse } from '../aiValidator';

export class AppleFoundationProvider implements LLMProvider {
  private model: string;

  constructor(model: string = 'Apple Intelligence (On-Device)') {
    this.model = model;
  }

  async testConnection(): Promise<{ success: boolean; model: string; message: string; latencyMs: number }> {
    const start = Date.now();
    try {
      const res = await nativeOnDeviceAIService.generate({
        prompt: 'test_connection',
        systemPrompt: 'Respond with status ok'
      });
      const latencyMs = Date.now() - start;
      return {
        success: true,
        model: this.model,
        message: '🍏 Apple Foundation Model (On-Device) active & responsive. Zero cloud latency.',
        latencyMs: res.latencyMs || latencyMs
      };
    } catch (e: any) {
      return {
        success: false,
        model: this.model,
        message: e?.message || 'Failed to communicate with Apple On-Device Neural Engine.',
        latencyMs: Date.now() - start
      };
    }
  }

  async generateGamePlan(context: GameMasterContext): Promise<GameMasterResponse> {
    const userPrompt = buildGameMasterUserPrompt(context);

    const res = await nativeOnDeviceAIService.generate({
      prompt: userPrompt,
      systemPrompt: GAME_MASTER_SYSTEM_PROMPT
    });

    const parsedJson = extractAndParseJson(res.text, `Apple Foundation (${this.model})`);
    const validation = validateGameMasterResponse(parsedJson, context);
    if (!validation.isValid || !validation.data) {
      throw new Error(`On-device Game Master proposal failed validation: ${validation.errors.join('; ')}`);
    }

    return validation.data;
  }

  async chat(messages: { role: 'system' | 'user' | 'assistant', content: string }[]): Promise<string> {
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || 'Hello';

    const res = await nativeOnDeviceAIService.generate({
      prompt: lastUserMsg,
      systemPrompt: systemMsg
    });

    return res.text;
  }
}
