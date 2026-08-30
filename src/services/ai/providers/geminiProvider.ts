import { GameMasterContext, GameMasterResponse } from '../aiContract';
import { GAME_MASTER_SYSTEM_PROMPT, buildGameMasterUserPrompt } from '../aiPrompt';
import { validateGameMasterResponse } from '../aiValidator';

export class GeminiProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-3.6-flash') {
    this.apiKey = apiKey.trim();
    this.model = model.trim();
  }


  async testConnection(): Promise<{ success: boolean; model: string; message: string; latencyMs: number }> {
    const start = Date.now();
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Respond with exactly {"status":"ok","engine":"gemini"} in raw JSON format.' }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return { success: true, model: this.model, message: 'Connection successful & structured output verified', latencyMs };
      }
      return { success: false, model: this.model, message: 'No text response from model', latencyMs };
    } catch (e: any) {
      return { success: false, model: this.model, message: e?.message || 'Network error connecting to Gemini API', latencyMs: Date.now() - start };
    }
  }

  async generateGamePlan(context: GameMasterContext): Promise<GameMasterResponse> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const userPrompt = buildGameMasterUserPrompt(context);

    const payload = {
      systemInstruction: {
        parts: [{ text: GAME_MASTER_SYSTEM_PROMPT }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error('Gemini returned an empty response');
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch (e) {
      throw new Error('Failed to parse Gemini response as JSON');
    }

    const validation = validateGameMasterResponse(parsedJson, context);
    if (!validation.isValid || !validation.data) {
      throw new Error(`AI Game Master proposal failed validation: ${validation.errors.join('; ')}`);
    }

    return validation.data;
  }

  async chat(messages: { role: 'system' | 'user' | 'assistant', content: string }[]): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    // Convert generic messages to Gemini format
    const geminiContents = [];
    
    // Find system message to inject if any
    const systemMsg = messages.find(m => m.role === 'system');
    let systemInstruction;
    if (systemMsg) {
      systemInstruction = {
        parts: [{ text: systemMsg.content }]
      };
    }
    
    const conversationMessages = messages.filter(m => m.role !== 'system');
    for (const msg of conversationMessages) {
      geminiContents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }

    const payload: any = {
      contents: geminiContents,
      generationConfig: {
        temperature: 0.7
      }
    };
    
    if (systemInstruction) {
      payload.systemInstruction = systemInstruction;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}
