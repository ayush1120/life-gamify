import { AISettings } from '../../types';
import { GameMasterContext, GameMasterResponse } from './aiContract';
import { GeminiProvider } from './providers/geminiProvider';
import { OpenAIProvider } from './providers/openaiProvider';
import { AnthropicProvider } from './providers/anthropicProvider';

export interface LLMProvider {
  testConnection(): Promise<{ success: boolean; model: string; message: string; latencyMs: number }>;
  generateGamePlan(context: GameMasterContext): Promise<GameMasterResponse>;
}

export const getLLMProvider = (settings?: AISettings): LLMProvider | null => {
  if (!settings || !settings.apiKey || !settings.apiKey.trim()) {
    return null;
  }

  const provider = settings.provider || 'gemini';
  const apiKey = settings.apiKey.trim();

  switch (provider) {
    case 'gemini':
      return new GeminiProvider(apiKey, settings.model || 'gemini-1.5-flash');
    case 'openai':
      return new OpenAIProvider(apiKey, settings.model || 'gpt-4o-mini');
    case 'anthropic':
      return new AnthropicProvider(apiKey, settings.model || 'claude-3-5-haiku-20241022');
    default:
      return new GeminiProvider(apiKey, settings.model || 'gemini-1.5-flash');
  }
};

/**
 * Checks whether Game Master analysis should run based on cost control rules (Phase 29).
 * Rules:
 * - Minimum 24h since last analysis UNLESS at least 3 new activities have been logged.
 */
export const shouldRunGameMasterAnalysis = (
  aiSettings?: AISettings,
  currentActivityCount: number = 0,
  force: boolean = false
): boolean => {
  if (force) return true;
  if (!aiSettings || !aiSettings.enabled || !aiSettings.apiKey) return false;

  const lastTime = aiSettings.lastAnalysisAt ? new Date(aiSettings.lastAnalysisAt).getTime() : 0;
  const lastCount = aiSettings.lastAnalysisActivityCount || 0;

  const hoursSince = (Date.now() - lastTime) / (1000 * 3600);
  const newActivities = currentActivityCount - lastCount;

  // Run if never run, or if 24 hours have passed AND at least 3 new activities logged
  if (lastTime === 0) return true;
  if (hoursSince >= 24 && newActivities >= 3) return true;

  return false;
};

/**
 * Runs a live diagnostic test against the configured AI provider (Phase 14 & 24).
 */
export const testAIConnection = async (
  settings: AISettings
): Promise<{ success: boolean; model: string; message: string; latencyMs: number }> => {
  const provider = getLLMProvider(settings);
  if (!provider) {
    return {
      success: false,
      model: settings.model || 'none',
      message: 'Missing API Key. Please provide a valid API Key for the selected provider.',
      latencyMs: 0
    };
  }

  return await provider.testConnection();
};

/**
 * Executes a Game Master update via the configured LLM provider.
 */
export const requestGameMasterPlan = async (
  settings: AISettings,
  context: GameMasterContext
): Promise<GameMasterResponse> => {
  const provider = getLLMProvider(settings);
  if (!provider) {
    throw new Error('AI Game Master is not configured. Add an API key in Settings.');
  }

  return await provider.generateGamePlan(context);
};
