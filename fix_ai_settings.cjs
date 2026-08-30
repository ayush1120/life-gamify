const fs = require('fs');

let content = fs.readFileSync('src/pages/AISettingsPage.tsx', 'utf8');

// Replace state
content = content.replace(
  "const [apiKey, setApiKey] = useState<string>(currentAI.apiKey || '');",
  "const [apiKeys, setApiKeys] = useState<Partial<Record<AIProvider, string>>>(currentAI.apiKeys || { [currentAI.provider]: currentAI.apiKey || '' });"
);

// Replace active key check
content = content.replace(
  "const [isConfigured, setIsConfigured] = useState", // Actually there's no isConfigured in AISettingsPage, just `apiKey` in JSX
  ""
);

// We need to find all `apiKey` usages.
// Let's just use `apiKeys[provider] || ''` for active API key checks inside functions.
content = content.replace(/apiKey\.trim\(\)/g, "(apiKeys[provider] || '').trim()");
content = content.replace(/!apiKey/g, "!(apiKeys[provider] || '')");
content = content.replace(/ apiKey /g, " (apiKeys[provider] || '') ");
content = content.replace(/ apiKey\?/g, " (apiKeys[provider] || '')?");

// Replace the single input box with multiple input boxes for each provider.
const newInputs = `
        {/* API Keys Configuration */}
        <div className="md:col-span-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
          <h4 className="font-outfit text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Secret API Keys
          </h4>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Provide API keys for the providers you wish to use. Keys are stored locally.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['gemini', 'openai', 'anthropic', 'openrouter'] as AIProvider[]).map((prov) => (
              <div key={prov} className="space-y-1.5">
                <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  <span className="capitalize">{prov} Key</span>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder={\`\${prov} API key\`}
                    value={apiKeys[prov] || ''}
                    onChange={(e) => setApiKeys({ ...apiKeys, [prov]: e.target.value })}
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl text-xs focus:outline-none transition-colors"
                    style={{
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
`;

// Find the old API Key input block and replace it
const oldInputBlockRegex = /\{\/\* API Key Input \*\/\}[\s\S]*?(?=\{\/\* Action Buttons \*\/\}|<\/div>\s*<\/div>\s*\{\/\* Action Buttons \*\/\}|<\/div>\s*\{\/\* Action Buttons \*\/\}|<!-- Action Buttons -->)/;

content = content.replace(oldInputBlockRegex, newInputs);

// Also fix handleSave
content = content.replace(
  "apiKey: (apiKeys[provider] || '').trim(),",
  "apiKeys: Object.fromEntries(Object.entries(apiKeys).map(([k, v]) => [k, (v || '').trim()])),\\n      apiKey: (apiKeys[provider] || '').trim()," // fallback
);

fs.writeFileSync('src/pages/AISettingsPage.tsx', content);
