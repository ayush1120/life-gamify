import { describe, it, expect } from 'vitest';
import { extractAndParseJson } from '../jsonUtils';

describe('extractAndParseJson', () => {
  it('parses valid raw JSON directly', () => {
    const raw = '{"status": "ok", "version": "1.0"}';
    const result = extractAndParseJson(raw, 'TestProvider');
    expect(result).toEqual({ status: 'ok', version: '1.0' });
  });

  it('strips <think>...</think> reasoning blocks from DeepSeek R1 models', () => {
    const raw = `
<think>
Let me analyze the user's habits and structure the output properly.
First, check the context...
</think>
\`\`\`json
{
  "summary": "Focus on fitness and coding",
  "version": "1.0"
}
\`\`\`
`;
    const result = extractAndParseJson(raw, 'OpenRouter');
    expect(result).toEqual({
      summary: 'Focus on fitness and coding',
      version: '1.0'
    });
  });

  it('handles conversational text before and after markdown code block', () => {
    const raw = `
Here is the Game Master plan for today:

\`\`\`json
{
  "summary": "Heroic progress ahead!",
  "quests": []
}
\`\`\`

Let me know if you need any adjustments!
`;
    const result = extractAndParseJson(raw, 'OpenRouter');
    expect(result).toEqual({
      summary: 'Heroic progress ahead!',
      quests: []
    });
  });

  it('handles raw JSON without code blocks but with conversational text', () => {
    const raw = 'Sure! Here is the JSON: {"summary": "Great day", "quests": []} Enjoy your quests!';
    const result = extractAndParseJson(raw, 'OpenRouter');
    expect(result).toEqual({
      summary: 'Great day',
      quests: []
    });
  });

  it('cleans trailing commas in arrays and objects', () => {
    const raw = `
{
  "summary": "Clean commas",
  "quests": [
    { "title": "Run 5k", },
  ],
}
`;
    const result = extractAndParseJson(raw, 'OpenRouter');
    expect(result).toEqual({
      summary: 'Clean commas',
      quests: [{ title: 'Run 5k' }]
    });
  });

  it('cleans comments from JSON', () => {
    const raw = `
{
  // Summary of the day
  "summary": "Clean comments",
  /* Multi line
     comment */
  "active": true
}
`;
    const result = extractAndParseJson(raw, 'OpenRouter');
    expect(result).toEqual({
      summary: 'Clean comments',
      active: true
    });
  });

  it('repairs truncated JSON when model hits token limit', () => {
    const raw = `
{
  "summary": "Building momentum",
  "quests": [
    {
      "title": "Morning Jog",
      "difficulty": "easy"
    }
`;
    const result = extractAndParseJson(raw, 'OpenRouter');
    expect(result).toEqual({
      summary: 'Building momentum',
      quests: [
        {
          title: 'Morning Jog',
          difficulty: 'easy'
        }
      ]
    });
  });

  it('throws descriptive error if no valid JSON exists', () => {
    expect(() => extractAndParseJson('Just plain text with no json', 'OpenRouter')).toThrow(
      /Failed to parse OpenRouter response as JSON/
    );
  });
});
