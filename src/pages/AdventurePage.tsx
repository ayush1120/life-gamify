import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QuestCard } from '../components/QuestCard';
import { BossCard } from '../components/BossCard';
import { AchievementCard } from '../components/AchievementCard';
import { CharacterStatsCard } from '../components/CharacterStatsCard';
import { LevelProgressBar } from '../components/LevelProgressBar';
import { 
  Compass, 
  Sword, 
  Flame, 
  Trophy, 
  Sparkles, 
  Bot, 
  Loader2 
} from 'lucide-react';

import { requestGameMasterPlan } from '../services/ai/llmService';
import { buildGameMasterContext } from '../services/ai/aiContextBuilder';
import { 
  convertProposalToQuest, 
  convertProposalToBoss, 
  convertProposalToAchievement 
} from '../services/ai/aiValidator';

export const AdventurePage: React.FC = () => {
  const { 
    quests, 
    bosses, 
    achievements, 
    stats, 
    habits, 
    rewardLogs, 
    settings, 
    addQuest, 
    addBoss, 
    updateAchievement, 
    updateSettings, 
    showToast,
    setActiveTab 
  } = useApp();

  const [questFilter, setQuestFilter] = useState<'active' | 'completed' | 'archived'>('active');
  const [isConsulting, setIsConsulting] = useState<boolean>(false);

  const activeQuests = quests.filter(q => q.status === 'active');
  const completedQuests = quests.filter(q => q.status === 'completed');
  const archivedQuests = quests.filter(q => q.status === 'archived');
  const displayedQuests = questFilter === 'active' 
    ? activeQuests 
    : (questFilter === 'completed' ? completedQuests : archivedQuests);

  const activeBoss = bosses.find(b => b.status === 'active') || null;

  const handleAskGameMaster = async () => {
    const ai = settings.aiSettings;
    const provider = ai?.provider || 'gemini';
    const envKey = 
      provider === 'gemini' ? (import.meta as any).env?.VITE_GEMINI_API_KEY :
      provider === 'openai' ? (import.meta as any).env?.VITE_OPENAI_API_KEY :
      provider === 'anthropic' ? (import.meta as any).env?.VITE_ANTHROPIC_API_KEY :
      provider === 'openrouter' ? (import.meta as any).env?.VITE_OPENROUTER_API_KEY : '';
    const activeKey = (ai?.apiKeys?.[provider] || ai?.apiKey || envKey)?.trim();
    if (!activeKey) {
      showToast('Please configure an API Key in AI Settings first.');
      setActiveTab('ai-settings');
      return;
    }

    const aiConfig = {
      provider,
      apiKeys: ai?.apiKeys || {},
      apiKey: activeKey,
      model: ai?.model || 'gemini-3.6-flash',
      enabled: true
    };

    setIsConsulting(true);
    try {
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

      const plan = await requestGameMasterPlan(aiConfig, context);
      let count = 0;

      if (plan.quests && plan.quests.length > 0) {
        const availableSlots = Math.max(0, 3 - activeQuests.length);
        for (const qProp of plan.quests.slice(0, availableSlots)) {
          const quest = convertProposalToQuest(qProp, habits);
          addQuest(quest);
          count++;
        }
      }

      if (plan.boss && !activeBoss) {
        const boss = convertProposalToBoss(plan.boss, stats.level);
        addBoss(boss);
        count++;
      }

      if (plan.achievements && plan.achievements.length > 0) {
        for (const aProp of plan.achievements) {
          const ach = convertProposalToAchievement(aProp);
          updateAchievement(ach);
        }
      }

      updateSettings({
        aiSettings: {
          ...aiConfig,
          lastAnalysisAt: new Date().toISOString(),
          lastAnalysisActivityCount: rewardLogs.filter(l => !l.isRetracted).length
        }
      });

      showToast(`✨ Game Master summoned ${count} new RPG challenges!`);
    } catch (e: any) {
      console.error('Game Master request error:', e);
      showToast(`Game Master error: ${e?.message || 'Failed to generate'}`);
    } finally {
      setIsConsulting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(236, 72, 153, 0.3))',
                border: '1px solid rgba(245, 158, 11, 0.4)'
              }}
            >
              <Compass className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="font-outfit text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                RPG Adventure Hub
              </h1>
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Personalized Quests, Boss Encounters, and Hall of Achievements
              </p>
            </div>
          </div>
        </div>

        {/* Ask Game Master Action */}
        <button
          onClick={handleAskGameMaster}
          disabled={isConsulting}
          className="px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white shadow-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          {isConsulting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Summoning Game Master...</span>
            </>
          ) : (
            <>
              <Bot className="w-4 h-4" />
              <span>Ask AI Game Master</span>
            </>
          )}
        </button>
      </div>

      {/* Character Progression Overview */}
      <div className="space-y-4">
        <LevelProgressBar />
        <CharacterStatsCard />
      </div>

      {/* World Boss Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-red-400" />
            <h2 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              World Boss Challenge
            </h2>
          </div>
        </div>

        {activeBoss ? (
          <BossCard boss={activeBoss} />
        ) : (
          <div 
            className="glass-panel rounded-3xl p-8 text-center space-y-4"
            style={{ border: '1px dashed var(--glass-border)' }}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto text-2xl">
              🐉
            </div>
            <div className="space-y-1">
              <h4 className="font-outfit text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                No Active World Boss
              </h4>
              <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                Consult the AI Game Master to summon an epic multi-day boss challenge tailored to your habits.
              </p>
            </div>
            <button
              onClick={handleAskGameMaster}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Summon World Boss</span>
            </button>
          </div>
        )}
      </div>

      {/* Quests Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Sword className="w-5 h-5 text-amber-400" />
            <h2 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Active Quests ({activeQuests.length})
            </h2>
          </div>

          {/* Filter Pills */}
          <div 
            className="flex items-center space-x-1 p-1 rounded-xl self-start"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          >
            {(['active', 'completed', 'archived'] as const).map(f => (
              <button
                key={f}
                onClick={() => setQuestFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  questFilter === f 
                    ? 'bg-amber-500 text-amber-950 shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {displayedQuests.length === 0 ? (
          <div 
            className="glass-panel rounded-2xl p-8 text-center space-y-3"
            style={{ border: '1px dashed var(--glass-border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {questFilter === 'active' 
                ? 'No active quests right now. Ask the Game Master to generate personalized weekly quests!'
                : `No ${questFilter} quests.`
              }
            </p>
            {questFilter === 'active' && (
              <button
                onClick={handleAskGameMaster}
                className="px-4 py-2 rounded-xl bg-amber-500 text-amber-950 font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
              >
                Generate Quests
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedQuests.map(quest => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        )}
      </div>

      {/* Hall of Achievements */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Hall of Achievements ({achievements.filter(a => a.status === 'unlocked').length} / {achievements.length})
          </h2>
        </div>

        {achievements.length === 0 ? (
          <div 
            className="glass-panel rounded-2xl p-8 text-center space-y-3"
            style={{ border: '1px dashed var(--glass-border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              No achievements unlocked yet. Log habits or consult the Game Master to forge new milestones!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map(ach => (
              <AchievementCard key={ach.id} achievement={ach} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
