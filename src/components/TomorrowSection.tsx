import React from 'react';
import { TomorrowScenario } from '../types/market';
import {
  Calendar,
  Compass,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface TomorrowSectionProps {
  tomorrow: TomorrowScenario;
  spotPrice: number;
}

export const TomorrowSection: React.FC<TomorrowSectionProps> = ({ tomorrow, spotPrice }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Disclaimer Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-300">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>SCENARIO-BASED PLANNING: This section evaluates potential market scenarios and conditional triggers for the next session. It does not predict future direction.</span>
        </div>
        <span className="text-slate-500">Session: {tomorrow.date}</span>
      </div>

      {/* 1. SCENARIOS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bullish Scenario */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Bullish Scenario</span>
            </div>

            <div className="space-y-2 text-xs font-sans text-slate-300">
              <span className="text-slate-400 font-mono text-[11px] block">CONDITIONS REQUIRED:</span>
              <ul className="space-y-1.5 pl-1">
                {tomorrow.bullish.conditions.map((cond, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5">
            <div className="text-slate-400 text-[11px]">POTENTIAL SETUP:</div>
            <div className="text-emerald-300 font-bold">{tomorrow.bullish.potentialSetup}</div>
            <div className="text-slate-400 text-[11px] pt-1">Target Zone: <strong className="text-white">{tomorrow.bullish.targetZone}</strong></div>
          </div>
        </div>

        {/* Bearish Scenario */}
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
              <TrendingDown className="w-4 h-4" />
              <span>Bearish Scenario</span>
            </div>

            <div className="space-y-2 text-xs font-sans text-slate-300">
              <span className="text-slate-400 font-mono text-[11px] block">CONDITIONS REQUIRED:</span>
              <ul className="space-y-1.5 pl-1">
                {tomorrow.bearish.conditions.map((cond, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5">
            <div className="text-slate-400 text-[11px]">POTENTIAL SETUP:</div>
            <div className="text-rose-300 font-bold">{tomorrow.bearish.potentialSetup}</div>
            <div className="text-slate-400 text-[11px] pt-1">Target Zone: <strong className="text-white">{tomorrow.bearish.targetZone}</strong></div>
          </div>
        </div>

        {/* Range-Bound Scenario */}
        <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300 font-mono text-xs font-bold uppercase tracking-wider">
              <Activity className="w-4 h-4 text-slate-400" />
              <span>Range-Bound Scenario</span>
            </div>

            <div className="space-y-2 text-xs font-sans text-slate-300">
              <span className="text-slate-400 font-mono text-[11px] block">CONDITIONS REQUIRED:</span>
              <ul className="space-y-1.5 pl-1">
                {tomorrow.rangeBound.conditions.map((cond, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-slate-400 font-bold">·</span>
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5">
            <div className="text-slate-400 text-[11px]">POTENTIAL SETUP:</div>
            <div className="text-slate-200 font-bold">{tomorrow.rangeBound.potentialSetup}</div>
            <div className="text-slate-400 text-[11px] pt-1">Expected Band: <strong className="text-white">{tomorrow.rangeBound.rangeExpected}</strong></div>
          </div>
        </div>
      </div>

      {/* 2. TOMORROW KEY PIVOTS & EVENTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Pivot Levels */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-200 font-mono text-xs font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Key Reference Levels for Next Session</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-2">
              <span className="text-rose-400 font-semibold text-[11px] block">RESISTANCE TARGETS</span>
              <div className="flex justify-between">
                <span className="text-slate-400">Resistance 2 (R2):</span>
                <span className="text-white font-bold tabular-nums">₹{tomorrow.keyLevels.resistance2}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Resistance 1 (R1):</span>
                <span className="text-white font-bold tabular-nums">₹{tomorrow.keyLevels.resistance1}</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-2">
              <span className="text-emerald-400 font-semibold text-[11px] block">SUPPORT FLOORS</span>
              <div className="flex justify-between">
                <span className="text-slate-400">Support 1 (S1):</span>
                <span className="text-white font-bold tabular-nums">₹{tomorrow.keyLevels.support1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Support 2 (S2):</span>
                <span className="text-white font-bold tabular-nums">₹{tomorrow.keyLevels.support2}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-300">
            <span>CENTRAL OPENING PIVOT: <strong className="text-white">₹{tomorrow.keyLevels.pivot}</strong></span>
            <span>EXPECTED OPEN RANGE: <strong className="text-emerald-400">₹{tomorrow.keyLevels.expectedOpenRange[0]}–{tomorrow.keyLevels.expectedOpenRange[1]}</strong></span>
          </div>
        </div>

        {/* Scheduled Macro & Corporate Events */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-200 font-mono text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Scheduled Economic & Market Events</span>
          </div>

          <div className="space-y-2.5">
            {tomorrow.scheduledEvents.map((evt, i) => (
              <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">{evt.title}</div>
                  <div className="text-slate-400 text-[11px]">{evt.expectedImpact}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-bold block ${evt.importance === 'HIGH' ? 'text-rose-400' : 'text-amber-400'}`}>
                    {evt.importance}
                  </span>
                  <span className="text-[10px] text-slate-500">{evt.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
