import React from 'react';
import { RefreshCw, Clock, Activity, ShieldAlert, LineChart, Bot, Sparkles } from 'lucide-react';
import { DataSourceStatus } from '../types/market';

interface HeaderProps {
  activeTab: 'nifty' | 'graph' | 'news' | 'paper' | 'tomorrow';
  setActiveTab: (tab: 'nifty' | 'graph' | 'news' | 'paper' | 'tomorrow') => void;
  dataSourceStatus: DataSourceStatus;
  delaySeconds: number;
  lastUpdated: string;
  nextUpdateSeconds: number;
  niftyPrice?: number;
  niftyChange?: number;
  niftyChangePercent?: number;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  onOpenRiskSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  dataSourceStatus,
  delaySeconds,
  lastUpdated,
  nextUpdateSeconds,
  niftyPrice,
  niftyChange = 0,
  niftyChangePercent = 0,
  onManualRefresh,
  isRefreshing,
  onOpenRiskSettings,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isPos = niftyChange >= 0;

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand Title + Live NSE Spot Ticker */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base md:text-lg font-bold tracking-tight text-white font-mono">
                NIFTY 50 <span className="text-emerald-400 font-sans text-xs px-1.5 py-0.5 border border-emerald-500/40 rounded ml-1 font-semibold">F&O AI</span>
              </span>
            </div>

            {/* Live NSE NIFTY 50 Spot Price Ticker */}
            {niftyPrice != null && (
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-slate-400">NSE LIVE:</span>
                <span className="font-bold text-white tabular-nums">
                  ₹{niftyPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`font-semibold tabular-nums ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPos ? '+' : ''}{niftyChange.toFixed(2)} ({isPos ? '+' : ''}{niftyChangePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Zone 2: 4 Primary Nav Links (Strictly single-line, clean buttons) */}
        <nav className="flex items-center gap-1 md:gap-2 p-1 bg-slate-900/80 border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('nifty')}
            className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'nifty'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            NIFTY F&O
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'graph'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LineChart className="w-3.5 h-3.5 text-emerald-400" />
            <span>GRAPH & CHART</span>
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'news'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            NEWS & IMPACT
          </button>
          <button
            onClick={() => setActiveTab('paper')}
            className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'paper'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PAPER TRADE
          </button>
          <button
            onClick={() => setActiveTab('tomorrow')}
            className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'tomorrow'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            TOMORROW
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Refresh timer + Status + Risk settings) */}
        <div className="flex items-center gap-3">
          {/* Market Data Status Info (Unboxed text with separators per Zero-Pill discipline) */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dataSourceStatus === 'LIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-semibold">{dataSourceStatus}</span>
            </span>
            {delaySeconds > 0 && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-amber-400">DELAYED: {delaySeconds}S</span>
              </>
            )}
            <span className="text-slate-600">·</span>
            <span className="tabular-nums text-slate-300 font-semibold">NEXT 5M CANDLE: {formatTime(nextUpdateSeconds)}</span>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={onManualRefresh}
            disabled={isRefreshing}
            title="Refresh Analysis (Auto-refreshes every 5 mins)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/90 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Risk Controls Button */}
          <button
            onClick={onOpenRiskSettings}
            title="Configure Trading Risk Controls"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-mono">Risk</span>
          </button>
        </div>
      </div>
    </header>
  );
};
