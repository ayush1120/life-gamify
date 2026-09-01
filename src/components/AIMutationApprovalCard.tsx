import React, { useState } from 'react';
import { AIMutationProposal, mutationApprovalService } from '../services/ai/gateway/mutationApprovalService';
import { useApp } from '../context/AppContext';
import { playSound } from '../services/sound';
import { triggerCelebration } from '../services/celebration';
import { CheckCircle2, Sparkles, Sword, Trophy, ShieldAlert, Loader2, Check } from 'lucide-react';

interface AIMutationApprovalCardProps {
  proposal: AIMutationProposal;
  onResolved?: (updated: AIMutationProposal) => void;
}

export const AIMutationApprovalCard: React.FC<AIMutationApprovalCardProps> = ({ proposal, onResolved }) => {
  const { user, showToast, settings } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<AIMutationProposal>(proposal);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const res = await mutationApprovalService.approveProposal(currentProposal.id, user?.uid);
      if (res.success) {
        playSound.fanfare(settings.soundEnabled);
        triggerCelebration(settings.celebrationStyle || 'confetti');
        showToast(`✨ Approved: ${currentProposal.title}!`);
        const updated = { ...currentProposal, status: 'executed' as const };
        setCurrentProposal(updated);
        onResolved?.(updated);
      } else {
        showToast(`Error approving action: ${res.error}`);
      }
    } catch (e: any) {
      showToast(`Approval failed: ${e?.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = () => {
    mutationApprovalService.rejectProposal(currentProposal.id);
    showToast(`Declined: ${currentProposal.title}`);
    const updated = { ...currentProposal, status: 'rejected' as const };
    setCurrentProposal(updated);
    onResolved?.(updated);
  };

  const isPending = currentProposal.status === 'pending';
  const isExecuted = currentProposal.status === 'executed';
  const isRejected = currentProposal.status === 'rejected';

  const getIcon = () => {
    switch (currentProposal.type) {
      case 'create_quest': return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'create_boss': return <Sword className="w-5 h-5 text-rose-400" />;
      case 'create_achievement': return <Trophy className="w-5 h-5 text-yellow-400" />;
      default: return <ShieldAlert className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div 
      className={`my-3 p-4 rounded-2xl border transition-all ${
        isExecuted 
          ? 'bg-emerald-500/10 border-emerald-500/30' 
          : isRejected 
          ? 'bg-zinc-500/10 border-zinc-500/20 opacity-60' 
          : 'bg-gradient-to-r from-purple-500/15 to-pink-500/15 border-purple-500/40 shadow-lg'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                {currentProposal.type.replace('_', ' ')}
              </span>
              {isExecuted && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
                  <Check className="w-3 h-3" /> Executed
                </span>
              )}
              {isRejected && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-500/20 text-zinc-400 border border-zinc-500/30 font-mono">
                  Declined
                </span>
              )}
            </div>

            <h4 className="font-outfit font-bold text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
              {currentProposal.title}
            </h4>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {currentProposal.description}
            </p>
            <p className="text-[11px] font-medium text-purple-300/90 mt-1">
              {currentProposal.summary}
            </p>
          </div>
        </div>
      </div>

      {isPending && (
        <div className="flex items-center justify-end gap-2.5 mt-3 pt-3 border-t border-white/10">
          <button
            onClick={handleDecline}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Decline
          </button>
          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="px-4 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Applying...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve & Apply</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
