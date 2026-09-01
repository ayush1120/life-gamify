import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { aiGateway, AIStreamEvent } from '../services/ai/gateway/aiGateway';
import { Bot, User, ArrowLeft, Send, Loader2, Sparkles, AlertCircle, Wrench } from 'lucide-react';

export const AIChatPage: React.FC = () => {
  const { settings, setActiveTab, showToast, user } = useApp();
  const aiSettings = settings.aiSettings;

  const [messages, setMessages] = useState<{role: 'system'|'user'|'assistant', content: string}[]>([
    { role: 'assistant', content: `Hello! I'm your AI Game Master powered by **${aiSettings?.provider}** (${aiSettings?.model}). Ask me about your habits, quests, or daily progress!` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeToolEvent, setActiveToolEvent] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAppleFoundation = aiSettings?.provider === 'apple-foundation';
  const activeKey = aiSettings?.apiKeys?.[aiSettings.provider] || aiSettings?.apiKey;
  const isConfigured = Boolean((isAppleFoundation || activeKey) && aiSettings?.enabled !== false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, activeToolEvent]);

  const handleSend = async () => {
    if (!input.trim() || !isConfigured || !aiSettings) return;

    const userText = input.trim();
    setInput('');
    
    const newMessages = [...messages, { role: 'user' as const, content: userText }];
    setMessages(newMessages);
    setIsTyping(true);
    setActiveToolEvent(null);

    try {
      let currentAssistantMessage = '';
      await aiGateway.streamChat(
        {
          message: userText,
          history: newMessages,
          userId: user?.uid
        },
        (event: AIStreamEvent) => {
          if (event.type === 'tool_call') {
            setActiveToolEvent(`Executing tool: ${event.payload?.tool}...`);
          } else if (event.type === 'tool_result') {
            setActiveToolEvent(`Tool ${event.payload?.tool} completed.`);
            setTimeout(() => setActiveToolEvent(null), 1200);
          } else if (event.type === 'message_delta') {
            currentAssistantMessage = event.payload.text;
            setMessages([...newMessages, { role: 'assistant', content: currentAssistantMessage }]);
          }
        }
      );
    } catch (e: any) {
      console.error(e);
      showToast(`Chat error: ${e.message}`);
      setMessages([...newMessages, { role: 'assistant', content: `**Error:** ${e.message}` }]);
    } finally {
      setIsTyping(false);
      setActiveToolEvent(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex flex-col space-y-4 mb-4">
        <button 
          onClick={() => setActiveTab('ai-settings')}
          className="flex items-center space-x-2 text-sm font-medium hover:opacity-80 transition-opacity w-fit"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to AI Settings</span>
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ 
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(236, 72, 153, 0.25))',
                border: '1px solid rgba(139, 92, 246, 0.4)'
              }}
            >
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-outfit text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Test AI Chat
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Chatting with {aiSettings?.model || 'Unknown Model'} via {aiSettings?.provider || 'Unknown Provider'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {!isConfigured ? (
        <div className="flex-1 glass-panel rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-4 border border-red-500/30">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Not Configured</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Please configure your AI API Key in the settings before chatting.
          </p>
          <button
            onClick={() => setActiveTab('ai-settings')}
            className="px-6 py-3 mt-4 rounded-xl text-sm font-extrabold bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            Go to Settings
          </button>
        </div>
      ) : (
        <div 
          className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden relative"
          style={{ border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)' }}
        >
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.filter(m => m.role !== 'system').map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ 
                      background: msg.role === 'user' ? 'var(--glass-bg)' : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
                      border: '1px solid var(--glass-border)'
                    }}
                  >
                    {msg.role === 'user' ? <User className="w-4 h-4 text-emerald-400" /> : <Bot className="w-4 h-4 text-purple-400" />}
                  </div>
                  
                  <div 
                    className="px-4 py-3 rounded-2xl text-sm prose prose-sm prose-invert max-w-none"
                    style={{ 
                      background: msg.role === 'user' ? 'rgba(16, 185, 129, 0.15)' : 'var(--glass-bg)',
                      border: msg.role === 'user' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                      borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '16px'
                    }}
                  >
                    <div className="whitespace-pre-wrap font-sans text-[13px]">{msg.content}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {activeToolEvent && (
              <div className="flex justify-start my-1">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono animate-pulse">
                  <Wrench className="w-3.5 h-3.5 text-purple-400" />
                  <span>{activeToolEvent}</span>
                </div>
              </div>
            )}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex flex-row items-end gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/20 border border-purple-500/30">
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10" style={{ borderBottomLeftRadius: '4px' }}>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div 
            className="p-3 bg-black/20"
            style={{ borderTop: '1px solid var(--glass-border)' }}
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message AI to test connection..."
                className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors"
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)'
                }}
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
