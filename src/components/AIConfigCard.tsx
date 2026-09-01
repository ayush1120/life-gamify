import React from 'react';
import { useApp } from '../context/AppContext';
import { ChevronRight, CheckCircle2, AlertCircle, Network } from 'lucide-react';

export const AIConfigCard: React.FC = () => {
  const { settings, setActiveTab } = useApp();
  const currentAI = settings.aiSettings;
  const isConfigured = Boolean((currentAI?.provider === 'apple-foundation' || currentAI?.apiKey || currentAI?.apiKeys?.[currentAI?.provider]) && currentAI?.enabled !== false);

  return (
    <div 
      className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 relative overflow-hidden group cursor-pointer hover:bg-white/5 transition-all"
      onClick={() => setActiveTab('ai-settings')}
      style={{
        border: '1px solid var(--glass-border)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(236, 72, 153, 0.25))',
              border: '1px solid rgba(139, 92, 246, 0.4)'
            }}
          >
            <Network className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                AI Access Point & Game Master
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Mastra + Native
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isConfigured ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-semibold">
                    Gateway Ready ({currentAI?.provider || 'gemini'} / {currentAI?.model || 'default'})
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-amber-400 font-semibold">
                    Setup Access Point (Keys / Local Neural Engine)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className="w-6 h-6 text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Central AI Access Point for chat endpoints, Mastra multi-step workflows, on-device Apple Intelligence, and automated quest architecture.
      </p>

      <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 font-mono text-[11px] text-purple-300">
          /api/ai/chat
        </div>
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 font-mono text-[11px] text-blue-300">
          /api/ai/analyze
        </div>
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 font-mono text-[11px] text-emerald-300">
          /api/ai/quests
        </div>
      </div>
    </div>
  );
};
