import { GameMasterContext, GameMasterResponse } from '../aiContract';
import { GAME_MASTER_SYSTEM_PROMPT, buildGameMasterUserPrompt } from '../aiPrompt';
import { validateGameMasterResponse } from '../aiValidator';

export class AnthropicProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-5-haiku-20241022') {
    this.apiKey = apiKey.trim();
    this.model = model.trim();
  }

  async testConnection(): Promise<{ success: boolean; model: string; message: string; latencyMs: number }> {
    const start = Date.now();
    try {
      const url = 'https://api.anthropic.com/v1/messages';
      const payload = {
        model: this.model,
        max_tokens: 50,
        messages: [
          { role: 'user', content: 'Respond with exactly {"status":"ok","engine":"anthropic"} in raw JSON format.' }
        ]
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true'
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
      const content = data.content?.[0]?.text;
      if (content) {
        return { success: true, model: this.model, message: 'Connection successful & structured output verified', latencyMs };
      }
      return { success: false, model: this.model, message: 'No content received from Anthropic', latencyMs };
    } catch (e: any) {
      return { success: false, model: this.model, message: e?.message || 'Network error connecting to Anthropic API', latencyMs: Date.now() - start };
    }
  }

  async generateGamePlan(context: GameMasterContext): Promise<GameMasterResponse> {
    const url = 'https://api.anthropic.com/v1/messages';
    const userPrompt = buildGameMasterUserPrompt(context);

    const payload = {
      model: this.model,
      max_tokens: 2048,
      system: `${GAME_MASTER_SYSTEM_PROMPT}\n\nIMPORTANT: Return ONLY the valid JSON object without any surrounding markdown code fences.`,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'dangerously-allow-browser': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    let rawText = data.content?.[0]?.text;
    if (!rawText) {
      throw new Error('Anthropic returned an empty response');
    }

    // Strip markdown code fences if present
    rawText = rawText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch (e) {
      throw new Error('Failed to parse Anthropic response as JSON');
    }

    const validation = validateGameMasterResponse(parsedJson, context);
    if (!validation.isValid || !validation.data) {
      throw new Error(`AI Game Master proposal failed validation: ${validation.errors.join('; ')}`);
    }

    return validation.data;
  }

  async chat(messages: { role: 'system' | 'user' | 'assistant', content: string }[]): Promise<string> {
    const url = 'https://api.anthropic.com/v1/messages';
    
    // Find system message to inject if any
    const systemMsg = messages.find(m => m.role === 'system');
    
    const conversationMessages = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role,
      content: m.content
    }));

    const payload: any = {
      model: this.model,
      messages: conversationMessages,
      max_tokens: 1000,
      temperature: 0.7
    };
    
    if (systemMsg) {
      payload.system = systemMsg.content;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text || '';
  }
}
