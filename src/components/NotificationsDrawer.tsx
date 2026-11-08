import React from 'react';
import {
  Bell,
  X,
  ArrowUpRight,
  ArrowDownRight,
  MinusCircle,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SignalAnalysis } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  signals: SignalAnalysis[];
  onSelectSignal: (sig: SignalAnalysis) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  signals,
  onSelectSignal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm h-full bg-[#0b1224] border-l border-slate-800 p-5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-extrabold text-white">Signal Notifications</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
              {signals.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {signals.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No recent notifications yet. Generated signals will stream here.
            </div>
          ) : (
            signals.slice(0, 15).map((sig) => (
              <div
                key={sig.id}
                onClick={() => {
                  onSelectSignal(sig);
                  onClose();
                }}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold font-mono text-xs">
                    {sig.direction === 'UP' ? (
                      <span className="flex items-center text-emerald-400 gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                        <span>UP</span>
                      </span>
                    ) : sig.direction === 'DOWN' ? (
                      <span className="flex items-center text-red-400 gap-1">
                        <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
                        <span>DOWN</span>
                      </span>
                    ) : (
                      <span className="flex items-center text-amber-400 gap-1">
                        <MinusCircle className="w-3.5 h-3.5" />
                        <span>NEUTRAL</span>
                      </span>
                    )}
                    <span className="text-white ml-1">{sig.pair}</span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">{sig.timeframe}</span>
                </div>

                <p className="text-[11px] text-slate-300 line-clamp-2 mb-1.5">
                  {sig.summary || sig.explanation}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{sig.pktTime}</span>
                  </span>
                  <span className="text-blue-400 font-semibold">{sig.confidence}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-center text-[10px] text-slate-500 font-mono">
          PREMIUM BOT Live Alert Dispatcher
        </div>
      </div>
    </div>
  );
};
