import React from 'react';
import { Clock } from 'lucide-react';
import { Timeframe } from '../types';

interface TimeframeSelectorProps {
  selectedTimeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
}

export const TIMEFRAMES: Timeframe[] = [
  '5S',
  '10S',
  '15S',
  '30S',
  '1M',
  '2M',
  '3M',
  '5M',
  '10M',
  '15M',
];

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  selectedTimeframe,
  onSelectTimeframe,
}) => {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1 px-2 text-[11px] text-slate-400 font-medium shrink-0">
        <Clock className="w-3.5 h-3.5 text-blue-400" />
        <span className="hidden sm:inline">Interval:</span>
      </div>

      <div className="flex items-center gap-1">
        {TIMEFRAMES.map((tf) => {
          const isActive = selectedTimeframe === tf;
          const isSeconds = tf.endsWith('S');

          return (
            <button
              key={tf}
              onClick={() => onSelectTimeframe(tf)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40 border border-blue-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <span>{tf}</span>
              {isSeconds && (
                <span className="hidden md:inline ml-0.5 text-[9px] opacity-60">sec</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
