import { GameMasterContext, GameMasterResponse } from '../aiContract';
import { GAME_MASTER_SYSTEM_PROMPT, buildGameMasterUserPrompt } from '../aiPrompt';
import { validateGameMasterResponse } from '../aiValidator';
import { extractAndParseJson } from '../jsonUtils';

export class OpenRouterProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'openrouter/free') {
    this.apiKey = apiKey.trim();
    this.model = model.trim() || 'openrouter/free';
  }

  async testConnection(): Promise<{ success: boolean; model: string; message: string; latencyMs: number }> {
    const start = Date.now();
    try {
      const url = 'https://openrouter.ai/api/v1/chat/completions';
      const payload = {
        model: this.model,
        messages: [
          { role: 'user', content: 'Respond with exactly {"status":"ok","engine":"openrouter"} in raw JSON format.' }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 50
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Life Gamify'
        },
        body: JSON.stringify(payload)
      });

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errText = await res.text();
        let errMsg = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error?.message) errMsg = parsed.error.message;
        } catch {
          // fallback
        }
        return { success: false, model: this.model, message: errMsg, latencyMs };
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return { success: true, model: this.model, message: 'Connection successful & structured output verified via OpenRouter', latencyMs };
      }
      return { success: false, model: this.model, message: 'No content received from OpenRouter', latencyMs };
    } catch (e: any) {
      return { success: false, model: this.model, message: e?.message || 'Network error connecting to OpenRouter API', latencyMs: Date.now() - start };
    }
  }

  async generateGamePlan(context: GameMasterContext): Promise<GameMasterResponse> {
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const userPrompt = buildGameMasterUserPrompt(context);

    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: GAME_MASTER_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Life Gamify'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const rawText = data.choices?.[0]?.message?.content;
    if (!rawText) {
      throw new Error('OpenRouter returned an empty response');
    }

    const parsedJson = extractAndParseJson(rawText, `OpenRouter (${this.model})`);
    
    const validation = validateGameMasterResponse(parsedJson, context);
    if (!validation.isValid) {
      throw new Error(`Invalid OpenRouter Game Master response format: ${validation.errors.join(', ')}`);
    }
    
    return validation.data as GameMasterResponse;
  }

  async chat(messages: { role: 'system' | 'user' | 'assistant', content: string }[]): Promise<string> {
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    
    const payload = {
      model: this.model,
      messages: messages,
      temperature: 0.7
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Life Gamify'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
