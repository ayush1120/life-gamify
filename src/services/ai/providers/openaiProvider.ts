import { GameMasterContext, GameMasterResponse } from '../aiContract';
import { GAME_MASTER_SYSTEM_PROMPT, buildGameMasterUserPrompt } from '../aiPrompt';
import { validateGameMasterResponse } from '../aiValidator';

export class OpenAIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey.trim();
    this.model = model.trim();
  }

  async testConnection(): Promise<{ success: boolean; model: string; message: string; latencyMs: number }> {
    const start = Date.now();
    try {
      const url = 'https://api.openai.com/v1/chat/completions';
      const payload = {
        model: this.model,
        messages: [
          { role: 'user', content: 'Respond with exactly {"status":"ok","engine":"openai"} in raw JSON format.' }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 30
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
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
        return { success: true, model: this.model, message: 'Connection successful & structured output verified', latencyMs };
      }
      return { success: false, model: this.model, message: 'No content received from OpenAI', latencyMs };
    } catch (e: any) {
      return { success: false, model: this.model, message: e?.message || 'Network error connecting to OpenAI API', latencyMs: Date.now() - start };
    }
  }

  async generateGamePlan(context: GameMasterContext): Promise<GameMasterResponse> {
    const url = 'https://api.openai.com/v1/chat/completions';
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
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const rawText = data.choices?.[0]?.message?.content;
    if (!rawText) {
      throw new Error('OpenAI returned an empty response');
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch (e) {
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    const validation = validateGameMasterResponse(parsedJson, context);
    if (!validation.isValid || !validation.data) {
      throw new Error(`AI Game Master proposal failed validation: ${validation.errors.join('; ')}`);
    }

    return validation.data;
  }
}
