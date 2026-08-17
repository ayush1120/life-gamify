import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AISettings, AIProvider } from '../types';
import { testAIConnection, requestGameMasterPlan } from '../services/ai/llmService';
import { buildGameMasterContext } from '../services/ai/aiContextBuilder';
import { 
  convertProposalToQuest, 
  convertProposalToBoss, 
  convertProposalToAchievement 
} from '../services/ai/aiValidator';
import { Bot, Key, Cpu, Play, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';

const MODEL_PRESETS: Record<AIProvider, string[]> = {
  gemini: ['gemini-3.6-flash', 'gemini-2.5-pro', 'gemini-3.5-flash', 'gemini-flash-latest'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022']
};

export const AIConfigCard: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    stats, 
    habits, 
    rewardLogs, 
    quests, 
    bosses, 
    addQuest, 
    addBoss, 
    updateAchievement,
    showToast 
  } = useApp();


  const currentAI: AISettings = settings.aiSettings || {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-3.6-flash',
    enabled: true
  };

  const [provider, setProvider] = useState<AIProvider>(currentAI.provider || 'gemini');
  const [apiKey, setApiKey] = useState<string>(currentAI.apiKey || '');
  const [model, setModel] = useState<string>(currentAI.model || MODEL_PRESETS[provider][0]);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number; model?: string } | null>(null);

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setModel(MODEL_PRESETS[newProvider][0]);
    setTestResult(null);
  };

  const handleSave = () => {
    const updatedAISettings: AISettings = {
      provider,
      apiKey: apiKey.trim(),
      model: model.trim(),
      enabled: true
    };
    updateSettings({ aiSettings: updatedAISettings });
    showToast('AI Game Master settings saved');
  };

  const handleRunDiagnostic = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter a valid API Key before testing.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testAIConnection({
      provider,
      apiKey: apiKey.trim(),
      model: model.trim(),
      enabled: true
    });

    setIsTesting(false);
    setTestResult(result);
  };

  const handleGenerateGamePlan = async () => {
    if (!apiKey.trim()) {
      showToast('Please configure an API Key first.');
      return;
    }

    setIsGenerating(true);
    try {
      const activeBoss = bosses.find(b => b.status === 'active') || null;
      const archivedQuests = quests.filter(q => q.status === 'archived');
      const archivedBosses = bosses.filter(b => b.status === 'archived');

      const context = buildGameMasterContext(
        stats, 
        habits, 
        rewardLogs, 
        quests, 
        activeBoss, 
        archivedQuests, 
        archivedBosses
      );

      const plan = await requestGameMasterPlan({
        provider,
        apiKey: apiKey.trim(),
        model: model.trim(),
        enabled: true
      }, context);

      let createdCount = 0;

      // 1. Quests
      if (plan.quests && plan.quests.length > 0) {
        for (const qProp of plan.quests) {
          const quest = convertProposalToQuest(qProp, habits);
          addQuest(quest);
          createdCount++;
        }
      }

      // 2. Boss (if no active boss exists)
      if (plan.boss && !activeBoss) {
        const boss = convertProposalToBoss(plan.boss, stats.level);
        addBoss(boss);
        createdCount++;
      }

      // 3. Achievements
      if (plan.achievements && plan.achievements.length > 0) {
        for (const aProp of plan.achievements) {
          const ach = convertProposalToAchievement(aProp);
          updateAchievement(ach);
        }
      }

      // Update last analysis timestamp
      updateSettings({
        aiSettings: {
          ...currentAI,
          provider,
          apiKey: apiKey.trim(),
          model: model.trim(),
          lastAnalysisAt: new Date().toISOString(),
          lastAnalysisActivityCount: rewardLogs.filter(l => !l.isRetracted).length
        }
      });

      showToast(`✨ Game Master created ${createdCount} new challenges!`);
    } catch (e: any) {
      console.error('Game Master generation failed:', e);
      showToast(`Game Master error: ${e?.message || 'Failed to generate'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div 
      className="glass-panel rounded-2xl p-6 space-y-6 relative overflow-hidden"
      style={{
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)'
      }}
    >
      {/* Background ambient glow */}
      <div 
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none opacity-10 blur-3xl"
        style={{ background: '#8b5cf6' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(236, 72, 153, 0.25))',
              border: '1px solid rgba(139, 92, 246, 0.4)'
            }}
          >
            <Bot className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-outfit text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                AI Game Master Configuration
              </h3>
              <span 
                className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                style={{ 
                  background: apiKey ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: apiKey ? '#10b981' : '#ef4444',
                  border: `1px solid ${apiKey ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}
              >
                {apiKey ? 'Configured' : 'No Key Set'}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Powers dynamic quests, boss encounters, and personalized achievements (Phase 13 & 14)
            </p>
          </div>
        </div>
      </div>

      {/* Form Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Provider Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Provider</span>
          </label>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
            className="w-full p-2.5 rounded-xl text-xs font-semibold focus:outline-none transition-colors"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="gemini">Google Gemini (Recommended)</option>
            <option value="openai">OpenAI (GPT-4o)</option>
            <option value="anthropic">Anthropic (Claude 3.5)</option>
          </select>
        </div>

        {/* Model Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span>Model</span>
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full p-2.5 rounded-xl text-xs font-semibold focus:outline-none transition-colors"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)'
            }}
          >
            {MODEL_PRESETS[provider].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* API Key Input */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold flex items-center justify-between" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-purple-400" />
              <span>User-Owned API Key</span>
            </span>
            <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>
              Stored locally on device / your private account
            </span>
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder={`Enter your ${provider.toUpperCase()} API key`}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2.5 pr-10 rounded-xl text-xs focus:outline-none font-mono transition-colors"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)'
              }}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-white transition-colors"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostic Test Output Panel */}
      {testResult && (
        <div 
          className={`p-3.5 rounded-xl text-xs flex items-start space-x-2.5 transition-all ${
            testResult.success ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5 flex-1">
            <div className="font-bold flex items-center justify-between">
              <span className={testResult.success ? 'text-emerald-400' : 'text-red-400'}>
                {testResult.success ? '✓ AI Connection & Structured JSON Verified' : '✕ Connection Diagnostic Failed'}
              </span>
              {testResult.latencyMs !== undefined && (
                <span className="text-[10px] opacity-75 font-mono">
                  {testResult.latencyMs}ms
                </span>
              )}
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {testResult.message}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-amber-950 hover:bg-amber-400 transition-colors cursor-pointer"
          >
            Save AI Keys
          </button>
          <button
            onClick={handleRunDiagnostic}
            disabled={isTesting}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Testing Connection...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Test Connection Diagnostic</span>
              </>
            )}
          </button>
        </div>

        {/* Generate Game Master Update Button */}
        {apiKey && (
          <button
            onClick={handleGenerateGamePlan}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Consulting Game Master...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Trigger Game Master Analysis</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
