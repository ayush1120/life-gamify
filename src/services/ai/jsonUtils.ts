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

  if (firstBrace !== -1) {
    // If we have a closing brace, try parsing normal substring first
    if (lastBrace > firstBrace) {
      const candidate = text.substring(firstBrace, lastBrace + 1).trim();
      try {
        return JSON.parse(candidate);
      } catch {
        const cleaned = cleanJsonString(candidate);
        try {
          return JSON.parse(cleaned);
        } catch {
          // Fall through to truncated repair
        }
      }
    }

    // Try repairing truncated JSON (in case model hit token limit)
    try {
      const repaired = repairTruncatedJson(text.substring(firstBrace));
      return JSON.parse(repaired);
    } catch {
      // Continue
    }
  }

  // 5. If no object found, try finding outermost JSON array `[ ... ]`
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1) {
    if (lastBracket > firstBracket) {
      const candidate = text.substring(firstBracket, lastBracket + 1).trim();
      try {
        return JSON.parse(candidate);
      } catch {
        const cleaned = cleanJsonString(candidate);
        try {
          return JSON.parse(cleaned);
        } catch {
          // Fall through to truncated repair
        }
      }
    }

    try {
      const repaired = repairTruncatedJson(text.substring(firstBracket));
      return JSON.parse(repaired);
    } catch {
      // Continue
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

/**
 * Automatically repairs truncated JSON (e.g. when LLM reaches max_tokens limit)
 * by stripping unclosed trailing keys/values and closing all unclosed arrays and objects.
 */
export function repairTruncatedJson(jsonStr: string): string {
  let str = cleanJsonString(jsonStr);
  if (!str) return '{}';

  // Find first { or [
  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');
  let startIdx = 0;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }
  str = str.substring(startIdx);

  // Scan characters and track stack of open braces/brackets and in-string state
  const stack: string[] = [];
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack.length > 0 && stack[stack.length - 1] === '{') stack.pop();
      } else if (char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === '[') stack.pop();
      }
    }
  }

  // If we were inside an unclosed string at EOF, close it
  if (inString) {
    str += '"';
  }

  // Trim trailing incomplete keys, colons, or commas
  str = str.replace(/,\s*$/, '');
  str = str.replace(/:\s*$/, ': null');
  str = str.replace(/,\s*([\}\]])/g, '$1');

  // Close open brackets and braces in reverse order
  while (stack.length > 0) {
    const open = stack.pop();
    if (open === '{') str += '}';
    else if (open === '[') str += ']';
  }

  // Clean trailing commas once more before closing braces
  str = str.replace(/,\s*([\}\]])/g, '$1');

  return str;
}
