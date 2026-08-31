/**
 * Robustly parses JSON from LLM responses, handling thinking tags, markdown code blocks,
 * conversational text, comments, and trailing commas.
 */
export function extractAndParseJson<T = any>(rawText: string, providerName: string = 'LLM'): T {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error(`${providerName} returned an empty or non-string response`);
  }

  let text = rawText.trim();

  // 1. Remove reasoning / thought blocks (e.g. DeepSeek R1 <think>...</think>)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. Try directly parsing first (fast path)
  try {
    return JSON.parse(text);
  } catch {
    // Continue to advanced extractors
  }

  // 3. Extract from markdown code blocks (```json ... ``` or ``` ... ```)
  const codeBlockMatches = [...text.matchAll(/```(?:json|javascript|js)?\s*([\s\S]*?)\s*```/gi)];
  for (const match of codeBlockMatches) {
    if (match[1]) {
      const candidate = match[1].trim();
      try {
        return JSON.parse(candidate);
      } catch {
        const cleaned = cleanJsonString(candidate);
        try {
          return JSON.parse(cleaned);
        } catch {
          // Continue to next code block or fall through
        }
      }
    }
  }

  // 4. Find the outermost JSON object `{ ... }`
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.substring(firstBrace, lastBrace + 1).trim();
    try {
      return JSON.parse(candidate);
    } catch {
      const cleaned = cleanJsonString(candidate);
      try {
        return JSON.parse(cleaned);
      } catch (e: any) {
        console.error(`[${providerName}] JSON Parse error after cleaning:`, e, candidate);
        throw new Error(`Failed to parse ${providerName} response as JSON: ${e?.message || 'Syntax Error'}`);
      }
    }
  }

  // 5. If no object found, try finding outermost JSON array `[ ... ]`
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const candidate = text.substring(firstBracket, lastBracket + 1).trim();
    try {
      return JSON.parse(candidate);
    } catch {
      const cleaned = cleanJsonString(candidate);
      try {
        return JSON.parse(cleaned);
      } catch (e: any) {
        throw new Error(`Failed to parse ${providerName} response as JSON: ${e?.message || 'Syntax Error'}`);
      }
    }
  }

  throw new Error(`Failed to parse ${providerName} response as JSON: No JSON object found in response`);
}

/**
 * Cleans typical LLM JSON anomalies like trailing commas and comments.
 */
function cleanJsonString(jsonStr: string): string {
  let cleaned = jsonStr;

  // Remove multi-line comments /* ... */
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove single line comments // ... on their own lines or at line ends (careful not to strip http:// or https:// inside strings)
  cleaned = cleaned.replace(/(^|[^:])\/\/.*$/gm, '$1');

  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([\}\]])/g, '$1');

  return cleaned.trim();
}
