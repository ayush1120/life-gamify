import React from 'react';
import { useApp } from '../context/AppContext';
import { Bot, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const AIConfigCard: React.FC = () => {
  const { settings, setActiveTab } = useApp();
  const currentAI = settings.aiSettings;
  const isConfigured = Boolean((currentAI?.provider === 'apple-foundation' || currentAI?.apiKey || currentAI?.apiKeys?.[currentAI?.provider]) && currentAI?.enabled !== false);

  return (
    <div 
      className="glass-panel rounded-2xl p-5 space-y-4 relative overflow-hidden group cursor-pointer hover:bg-white/5 transition-colors"
      onClick={() => setActiveTab('ai-settings')}
      style={{
        border: '1px solid var(--glass-border)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(236, 72, 153, 0.25))',
              border: '1px solid rgba(139, 92, 246, 0.4)'
            }}
          >
            <Bot className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-outfit text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              AI Game Master
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              {isConfigured ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">
                    Configured ({currentAI?.provider})
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-amber-400 font-medium">
                    Not Configured
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Manage AI models, OpenRouter free keys, and generate dynamic quests and bosses.
      </p>
    </div>
  );
};
