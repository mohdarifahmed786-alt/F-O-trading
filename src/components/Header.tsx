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
    <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 px-2.5 sm:px-4 md:px-8 py-2 sm:py-3 transition-all w-full max-w-full">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 sm:gap-3">
        {/* Top Row on Mobile: Brand Title, Spot Price & Actions */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full lg:w-auto">
          {/* Zone 1: Brand Title + Live NSE Spot Ticker */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white font-mono truncate">
                  NIFTY 50 <span className="text-emerald-400 font-sans text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 border border-emerald-500/40 rounded ml-0.5 font-semibold">F&O AI</span>
                </span>
              </div>

              {/* Live NSE NIFTY 50 Spot Price Ticker */}
              {niftyPrice != null && (
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-[11px] font-mono">
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

          {/* Zone 3 on Mobile (Visible on right of top bar) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 lg:hidden">
            <button
              onClick={onManualRefresh}
              disabled={isRefreshing}
              title="Refresh Analysis"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/90 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
            </button>

            <button
              onClick={onOpenRiskSettings}
              title="Risk Controls"
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Zone 2: Primary Nav Links (Smooth scroll on mobile, inline on desktop) */}
        <div className="w-full lg:w-auto overflow-x-auto scrollbar-none pb-0.5 -mx-1 px-1 lg:mx-0 lg:px-0">
          <nav className="flex items-center gap-1 md:gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-lg w-max lg:w-auto">
            <button
              onClick={() => setActiveTab('nifty')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'nifty'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              NIFTY F&O
            </button>
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
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
              className={`px-2.5 sm:px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'news'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              NEWS & IMPACT
            </button>
            <button
              onClick={() => setActiveTab('paper')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'paper'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PAPER TRADE
            </button>
            <button
              onClick={() => setActiveTab('tomorrow')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'tomorrow'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TOMORROW
            </button>
          </nav>
        </div>

        {/* Zone 3: Desktop Actions (Hidden on mobile, shown on lg screens) */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Market Data Status Info */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
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
            <span className="tabular-nums text-slate-300 font-semibold">NEXT 5M: {formatTime(nextUpdateSeconds)}</span>
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
