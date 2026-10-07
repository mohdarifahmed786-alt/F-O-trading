import React, { useState } from 'react';
import { NewsItem, GlobalIndex, HistoricalEvent } from '../types/market';
import { HISTORICAL_EVENTS } from '../data/historicalEvents';
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Flame,
  Clock,
  BookOpen,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface NewsSectionProps {
  news: NewsItem[];
  globalIndices: GlobalIndex[];
}

export const NewsSection: React.FC<NewsSectionProps> = ({ news, globalIndices }) => {
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent>(HISTORICAL_EVENTS[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredNews = (categoryFilter === 'ALL'
    ? news
    : news.filter(n => n.category === categoryFilter)
  ).slice().sort((a, b) => {
    if (a.publishedAt && b.publishedAt) {
      return b.publishedAt - a.publishedAt;
    }
    return 0;
  });

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'EXTREME':
        return 'text-rose-400 font-bold';
      case 'HIGH':
        return 'text-amber-400 font-semibold';
      case 'MEDIUM':
        return 'text-sky-400';
      case 'LOW':
      default:
        return 'text-slate-400';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH':
        return 'text-emerald-400';
      case 'BEARISH':
        return 'text-rose-400';
      case 'MIXED':
        return 'text-amber-400';
      case 'NEUTRAL':
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. GLOBAL MARKET OVERVIEW */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 font-bold text-slate-200 uppercase tracking-wider">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Global Market Cues & Macro Indicators</span>
          </div>
          <span className="text-slate-500">Live Global Indices</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {globalIndices.map((idx) => {
            const isPos = idx.change >= 0;
            return (
              <div key={idx.symbol} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-xs">
                <div className="text-[11px] text-slate-400 truncate">{idx.name}</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-white font-bold tabular-nums">
                    {idx.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                  <span className={`text-[10px] font-semibold tabular-nums ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPos ? '+' : ''}{idx.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. LIVE NEWS FEED WITH IMPACT SCORES */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Market-Moving News & Impact Engine
              </h2>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25 font-semibold">
                LATEST FIRST
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live chronological financial and macroeconomic feed evaluated for NIFTY F&O impact
            </p>
          </div>

          {/* Interactive filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
            {['ALL', 'MONETARY', 'INDIAN', 'GLOBAL'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-slate-800 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-800/80">
          {filteredNews.map((item) => (
            <div key={item.id} className="py-4 space-y-2 first:pt-1 last:pb-1">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className={`uppercase text-[11px] ${getImpactBadge(item.impact)}`}>
                    IMPACT: {item.impact}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className={`font-semibold ${getSentimentColor(item.sentiment)}`}>
                    {item.sentiment}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">{item.source}</span>
                </div>

                {item.time && (
                  <div className="text-slate-400 text-[11px] flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800/90 shrink-0">
                    <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-slate-300 font-mono font-medium">{item.time}</span>
                  </div>
                )}
              </div>

              <h3 className="text-sm font-semibold text-white leading-snug">
                {item.title}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {item.summary}
              </p>

              {/* Expected Market Effect */}
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/60 text-xs font-mono text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <strong>EXPECTED NIFTY F&O EFFECT:</strong>
                </div>
                <p className="text-slate-300 text-[11px] font-sans pl-5">
                  {item.expectedMarketEffect}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. HISTORICAL EVENT LEARNING DATABASE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Historical Event Learning & Volatility Memory</span>
          </div>
          <p className="text-xs text-slate-400">
            Learn from major past crashes, political events, and macro shocks to understand NIFTY, VIX, and options behavior under stress.
          </p>
        </div>

        {/* Event Selector Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-mono">
          {HISTORICAL_EVENTS.map((ev) => (
            <button
              key={ev.id}
              onClick={() => setSelectedEvent(ev)}
              className={`px-3 py-2 rounded-lg border text-left shrink-0 transition-all cursor-pointer ${
                selectedEvent.id === ev.id
                  ? 'bg-slate-800 border-emerald-500/50 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="truncate max-w-[200px]">{ev.title}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{ev.date}</div>
            </button>
          ))}
        </div>

        {/* Selected Historical Event Case Study */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">{selectedEvent.title}</h3>
              <span className="text-slate-400 text-xs font-sans">{selectedEvent.date} · {selectedEvent.category}</span>
            </div>
            <div className="text-rose-400 font-bold text-sm bg-rose-950/30 border border-rose-800/40 px-3 py-1 rounded-lg">
              {selectedEvent.dropOrRisePoints}
            </div>
          </div>

          <p className="text-slate-300 font-sans leading-relaxed text-xs">
            {selectedEvent.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/60">
              <div>
                <span className="text-slate-500 block text-[11px]">NIFTY REACTION & SPEED</span>
                <span className="text-slate-200 leading-snug block mt-0.5">{selectedEvent.niftyReaction}</span>
                <span className="text-amber-400 text-[11px] block mt-1">Velocity: {selectedEvent.reactionSpeed}</span>
              </div>

              <div className="border-t border-slate-800 pt-2">
                <span className="text-slate-500 block text-[11px]">INDIA VIX & OPTION PREMIUMS</span>
                <span className="text-slate-200 leading-snug block mt-0.5">{selectedEvent.vixImpact}</span>
              </div>
            </div>

            <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/60">
              <div>
                <span className="text-slate-500 block text-[11px]">OPEN INTEREST & PCR BEHAVIOR</span>
                <span className="text-slate-200 leading-snug block mt-0.5">{selectedEvent.oiPcrBehavior}</span>
              </div>

              <div className="border-t border-slate-800 pt-2">
                <span className="text-slate-500 block text-[11px]">RECOVERY & NORMALIZATION DURATION</span>
                <span className="text-slate-200 leading-snug block mt-0.5">{selectedEvent.recoveryDuration}</span>
              </div>
            </div>
          </div>

          {/* Key Trading Takeaway */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>KEY TRADING LESSON FOR F&O TRADERS:</span>
            </div>
            <p className="text-slate-300 text-xs font-sans leading-relaxed">
              {selectedEvent.keyTakeaway}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
