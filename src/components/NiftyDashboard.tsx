import React, { useState } from 'react';
import {
  MarketQuote,
  TechnicalIndicators,
  OptionChainSummary,
  IndiaVixSummary,
  MultiTimeframeSummary,
  SignalAnalysis,
  TradeStrategy,
  StockConstituent,
} from '../types/market';
import { StockOptionChainSection } from './StockOptionChainSection';
import { StockNiftyCorrelationSignals } from './StockNiftyCorrelationSignals';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Layers,
  BarChart3,
  Bot,
  ArrowRight,
  ExternalLink,
  Shield,
  Target,
  Brain,
  LineChart,
  MessageSquare,
  Sparkles,
  Zap,
  Lightbulb,
} from 'lucide-react';

interface NiftyDashboardProps {
  quote: MarketQuote;
  indicators: TechnicalIndicators;
  optionChain: OptionChainSummary;
  vix: IndiaVixSummary;
  mtf: MultiTimeframeSummary;
  signal: SignalAnalysis;
  stocks: StockConstituent[];
  onSelectStock: (stock: StockConstituent) => void;
  onExecutePaperTrade: (strategy: TradeStrategy, signalType: any) => void;
  onExecuteStockPaperTrade: (tradeData: {
    symbol: string;
    stockName: string;
    strike: number;
    optionType: 'CE' | 'PE';
    action: 'BUY' | 'SELL';
    premium: number;
    lotSize: number;
    lots: number;
    strategyName: string;
    stopLoss: number;
    target: number;
  }) => void;
  onOpenOptionChain: () => void;
  onOpenBacktest: () => void;
  onOpenChat?: (initialPrompt?: string) => void;
}

export const NiftyDashboard: React.FC<NiftyDashboardProps> = ({
  quote,
  indicators,
  optionChain,
  vix,
  mtf,
  signal,
  stocks,
  onSelectStock,
  onExecutePaperTrade,
  onExecuteStockPaperTrade,
  onOpenOptionChain,
  onOpenBacktest,
  onOpenChat,
}) => {
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [simpleMode, setSimpleMode] = useState<boolean>(true);
  const [showConstituentDirectory, setShowConstituentDirectory] = useState<boolean>(false);
  const [selectedStockForChain, setSelectedStockForChain] = useState<string>('NIFTY 50');
  const optionChainRef = React.useRef<HTMLDivElement>(null);

  const handleSelectStockForOptionChain = (symbol: string) => {
    setSelectedStockForChain(symbol);
    optionChainRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Trigger server-side Gemini AI Analyst
  const handleRunAiAnalysis = async () => {
    try {
      setLoadingAi(true);
      const res = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotPrice: quote.currentPrice,
          indicators,
          optionChain,
          vix,
          mtf,
          signal,
        }),
      });
      const data = await res.json();
      setAiAnalysisResult(data);
    } catch (err) {
      console.error('Failed to run AI analysis:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const isPositive = quote.change >= 0;

  // Signal color styling
  const getSignalBadge = (sig: string) => {
    switch (sig) {
      case 'BUY CALL':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400',
          icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
        };
      case 'SELL PUT':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400',
          icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
        };
      case 'BUY PUT':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-400',
          icon: <TrendingDown className="w-5 h-5 text-rose-400" />,
        };
      case 'SELL CALL':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-400',
          icon: <TrendingDown className="w-5 h-5 text-rose-400" />,
        };
      case 'NO TRADE':
      default:
        return {
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
          dot: 'bg-slate-400',
          icon: <Minus className="w-5 h-5 text-slate-400" />,
        };
    }
  };

  const signalStyle = getSignalBadge(signal.signal);

  return (
    <div className="space-y-6">
      {/* 1. TOP HERO SECTION: NIFTY 50 PRICE & CORE SIGNAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: NIFTY 50 Spot Metric Panel */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
              <span className="tracking-wider uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                NSE LIVE SPOT · NIFTY 50
                <span className="text-[11px] text-slate-300 font-mono font-medium ml-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {quote.timestamp}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <span>OPEN: ₹{quote.open.toLocaleString('en-IN')}</span>
                <span>·</span>
                <span>PREV CLOSE: ₹{quote.previousClose.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-baseline gap-4 mb-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white font-mono tabular-nums">
                ₹{quote.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h1>
              <div className={`flex items-center text-lg md:text-xl font-bold font-mono tabular-nums ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%)
              </div>
            </div>

            {/* Day High / Low Bar */}
            <div className="space-y-1.5 py-3 border-y border-slate-800/80 my-3 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>DAY LOW: <strong className="text-slate-200">₹{quote.dayLow.toLocaleString('en-IN')}</strong></span>
                <span>DAY HIGH: <strong className="text-slate-200">₹{quote.dayHigh.toLocaleString('en-IN')}</strong></span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  style={{
                    width: `${Math.max(5, Math.min(95, ((quote.currentPrice - quote.dayLow) / (quote.dayHigh - quote.dayLow || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Core Indicator Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs font-mono">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-500 block">VWAP</span>
              <span className="text-slate-200 font-semibold tabular-nums text-sm">₹{indicators.vwap.value.toLocaleString('en-IN')}</span>
              <span className={`text-[10px] block mt-0.5 ${indicators.vwap.relation === 'ABOVE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {indicators.vwap.relation} VWAP
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-500 block">INDIA VIX</span>
              <span className="text-slate-200 font-semibold tabular-nums text-sm">{vix.value.toFixed(2)}</span>
              <span className={`text-[10px] block mt-0.5 ${vix.change < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {vix.change > 0 ? '+' : ''}{vix.changePercent.toFixed(1)}% ({vix.trend})
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-500 block">PCR (OI)</span>
              <span className="text-slate-200 font-semibold tabular-nums text-sm">{optionChain.oiPcr}</span>
              <span className={`text-[10px] block mt-0.5 ${optionChain.pcrTrend === 'BULLISH' ? 'text-emerald-400' : 'text-slate-400'}`}>
                {optionChain.pcrTrend}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-500 block">TREND</span>
              <span className={`font-semibold text-sm ${signal.trend === 'BULLISH' ? 'text-emerald-400' : signal.trend === 'BEARISH' ? 'text-rose-400' : 'text-slate-300'}`}>
                {signal.trend}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {signal.marketRegime}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Dynamic Signal & Strategy Execution Box */}
        <div className={`lg:col-span-6 border rounded-xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden ${signalStyle.bg}`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${signalStyle.dot} animate-pulse`} />
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">F&O ALGORITHMIC SIGNAL</span>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                  99th% HUMAN IQ ENGINE
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <span>UPDATED: <strong className="text-emerald-400 font-semibold">{signal.timestamp || quote.timestamp}</strong></span>
                <span>·</span>
                <span>STATUS: <strong className="text-slate-200">{signal.status}</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                {signalStyle.icon}
                <div className="text-3xl md:text-4xl font-black tracking-tight font-mono">
                  {signal.signal}
                </div>
              </div>

              {/* Analytical Confidence Score */}
              <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-right">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Confidence Score</div>
                <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                  {signal.confidence}%
                </div>
                <div className="text-[9px] text-slate-400 font-sans">Analytical estimate</div>
              </div>
            </div>

            {/* Suggested Strategy Summary */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-800 pb-2">
                <span>SETUP: {signal.suggestedStrategy.name}</span>
                <span className="text-emerald-400 font-mono">R:R {signal.suggestedStrategy.rewardRiskRatio}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div>
                  <span className="text-slate-500 block text-[11px]">ENTRY ZONE</span>
                  <span className="text-white font-semibold">₹{signal.entryZone[0]}–{signal.entryZone[1]}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">STOP LOSS</span>
                  <span className="text-rose-400 font-semibold">₹{signal.stopLoss}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">TARGET 1</span>
                  <span className="text-emerald-400 font-semibold">₹{signal.target1}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">TARGET 2</span>
                  <span className="text-emerald-400 font-semibold">₹{signal.target2}</span>
                </div>
              </div>

              <div className="text-slate-400 text-[11px] pt-1 leading-relaxed">
                <strong className="text-slate-300">Contract Strike Rationale:</strong> {signal.suggestedStrategy.selectionRationale}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-4 mt-2">
            <button
              onClick={() => onExecutePaperTrade(signal.suggestedStrategy, signal.signal)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Practice Trade in Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {onOpenChat && (
              <button
                onClick={() => onOpenChat(`Should I ${signal.signal} on NIFTY right now? Explain the entry price, target, and stop loss in simple language.`)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow transition-all cursor-pointer whitespace-nowrap"
              >
                <Bot className="w-4 h-4 text-white" />
                <span>Ask AI Advisor</span>
              </button>
            )}

            <button
              onClick={handleRunAiAnalysis}
              disabled={loadingAi}
              className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <Bot className={`w-4 h-4 ${loadingAi ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
              <span>{loadingAi ? 'Analyzing...' : 'AI Analyst'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI ANALYST EXPANDED INSIGHT (WHEN TRIGGERED) */}
      {aiAnalysisResult && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 shadow-lg space-y-3 transition-all">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                AI Market Analyst Evaluation
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Model: {aiAnalysisResult.source}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block mb-1">MARKET VIEW & REGIME</span>
              <span className="text-emerald-400 font-bold text-sm block">{aiAnalysisResult.marketView} · {aiAnalysisResult.marketRegime}</span>
              <p className="text-slate-400 text-[11px] mt-1">{aiAnalysisResult.macroContext}</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 md:col-span-2">
              <span className="text-slate-500 block mb-1">CONFLUENCE RATIONALE</span>
              <ul className="space-y-1 text-slate-300">
                {aiAnalysisResult.reasons?.map((r: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SIMPLE CALL BUY / PUT BUY INVESTOR DASHBOARD */}
      {(() => {
        const atmStrike = Math.round(quote.currentPrice / 50) * 50;
        const atmRow = optionChain.strikes.find((s) => s.strikePrice === atmStrike) || optionChain.strikes[Math.floor(optionChain.strikes.length / 2)];
        const callLtp = atmRow?.call.ltp || 170;
        const putLtp = atmRow?.put.ltp || 130;

        const isCallSignal = signal.signal === 'BUY CALL' || signal.signal === 'SELL PUT';
        const isPutSignal = signal.signal === 'BUY PUT' || signal.signal === 'SELL CALL';
        const isBullish = isCallSignal || (signal.trend === 'BULLISH' && signal.signal !== 'BUY PUT' && signal.signal !== 'SELL CALL');
        const isBearish = isPutSignal || (signal.trend === 'BEARISH' && signal.signal !== 'BUY CALL' && signal.signal !== 'SELL PUT');

        const recommendedAction = isCallSignal || isBullish
          ? 'CALL BUY (BUY CE)'
          : isPutSignal || isBearish
          ? 'PUT BUY (BUY PE)'
          : 'WAIT / DO NOT BUY OPTIONS';

        const recommendedContract = isCallSignal || isBullish
          ? `NIFTY ${atmStrike} CE`
          : isPutSignal || isBearish
          ? `NIFTY ${atmStrike} PE`
          : `NIFTY ${atmStrike} (WAIT)`;

        const contractPremium = (isCallSignal || isBullish) ? callLtp : (isPutSignal || isBearish) ? putLtp : (callLtp + putLtp) / 2;

        return (
          <div className="bg-gradient-to-r from-slate-900 via-[#0a0f1d] to-[#0e172a] border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header with Mode Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                  isBullish
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                    : isBearish
                    ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                    : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                }`}>
                  {isBullish ? <TrendingUp className="w-5 h-5" /> : isBearish ? <TrendingDown className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base md:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                      <span>SIMPLE CALL BUY / PUT BUY DECISION</span>
                    </h2>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                      PLAIN ENGLISH
                    </span>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                      99% HUMAN IQ LAYER
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    Clear, jargon-free trading direction for retail investors & options buyers
                  </p>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setSimpleMode(true)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                    simpleMode
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⭐ Simple Call / Put (Default)
                </button>
                <button
                  onClick={() => setSimpleMode(false)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                    !simpleMode
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🔬 Advanced Quant Breakdown
                </button>
              </div>
            </div>

            {/* Content: Mode 1 - Simple Call/Put View */}
            {simpleMode ? (
              <div className="space-y-5">
                {/* 1. Large High-Visibility Decision Banner */}
                <div className={`p-4 md:p-5 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
                  isBullish
                    ? 'bg-emerald-950/40 border-emerald-500/40'
                    : isBearish
                    ? 'bg-rose-950/40 border-rose-500/40'
                    : 'bg-amber-950/40 border-amber-500/40'
                }`}>
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                      YOUR ACTION TODAY FOR NIFTY 50:
                    </div>
                    <div className={`text-2xl md:text-3xl font-black font-mono tracking-tight flex items-center gap-2 ${
                      isBullish ? 'text-emerald-400' : isBearish ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      <span>{isBullish ? '👉 🟢 CALL BUY (BUY CE)' : isBearish ? '👉 🔴 PUT BUY (BUY PE)' : '👉 🟡 WAIT / DO NOT BUY'}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans max-w-2xl leading-relaxed">
                      {isBullish
                        ? 'Market is in an UPWARD TREND. Retail investors should look to BUY CALL (CE) options to profit from the upward move.'
                        : isBearish
                        ? 'Market is in a DOWNWARD TREND. Retail investors should look to BUY PUT (PE) options to profit when the market falls.'
                        : 'Market is range-bound / choppy. Do NOT buy options right now because option buyers lose money to time decay (theta) in sideways markets.'}
                    </p>
                  </div>

                  <div className="bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800 text-right shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">TODAY'S VERDICT</span>
                    <span className={`text-lg font-bold font-mono ${
                      isBullish ? 'text-emerald-400' : isBearish ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {recommendedAction}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Confidence: <strong className="text-white font-mono">{signal.confidence}%</strong>
                    </span>
                  </div>
                </div>

                {/* 2. 4-Box Retail Investor Action Plan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                  {/* Card 1: What to Trade */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-bold text-amber-400 uppercase">1. CONTRACT TO TRADE</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-lg font-bold text-white font-mono">
                      {recommendedContract}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Est. Premium: <strong className="text-amber-400 font-mono">~₹{contractPremium.toFixed(1)}</strong>
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans">
                      {isBullish ? 'Profits when NIFTY rises above ' + atmStrike : isBearish ? 'Profits when NIFTY drops below ' + atmStrike : 'Wait for clear breakout'}
                    </p>
                  </div>

                  {/* Card 2: Where to Buy (Entry) */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-bold text-blue-400 uppercase">2. BUYING ZONE (ENTRY)</span>
                      <Target className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="text-lg font-bold text-white font-mono">
                      ₹{signal.entryZone[0]} – ₹{signal.entryZone[1]}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Spot Range for Entry
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Enter when spot price is inside this zone. Never chase a runaway price.
                    </p>
                  </div>

                  {/* Card 3: Target (Where to Sell for Profit) */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase">3. TARGET (BOOK PROFIT)</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-lg font-bold text-emerald-400 font-mono">
                      ₹{signal.target1} / ₹{signal.target2}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Target 1 & Target 2
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Book half profit at Target 1 and shift Stop Loss to your entry price.
                    </p>
                  </div>

                  {/* Card 4: Stop-Loss (Protect Capital) */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-bold text-rose-400 uppercase">4. STRICT STOP-LOSS</span>
                      <Shield className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                    <div className="text-lg font-bold text-rose-400 font-mono">
                      ₹{signal.stopLoss}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Strict Exit Barrier
                    </div>
                    <p className="text-[10px] text-rose-300 font-sans">
                      Exit immediately if price touches this level. Never trade without stop-loss!
                    </p>
                  </div>
                </div>

                {/* 3. "Why this trade in simple everyday words? (Zero quant jargon)" */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wide">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>WHY THIS TRADE? (EXPLAINED IN 3 SIMPLE POINTS):</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>1. Trading {quote.currentPrice >= quote.vwap ? 'Above Average' : 'Below Average'}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        NIFTY (₹{quote.currentPrice.toLocaleString('en-IN')}) is currently trading{' '}
                        <strong>{quote.currentPrice >= quote.vwap ? 'ABOVE' : 'BELOW'}</strong> today's VWAP (₹{quote.vwap.toFixed(1)}), meaning institutional buyers are currently in control.
                      </p>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>2. Big Support & Resistance Walls</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Support is rock-solid at <strong>₹{optionChain.majorPutSupport}</strong> with buyers defending, while major ceiling resistance is at <strong>₹{optionChain.majorCallResistance}</strong> (PCR: {optionChain.oiPcr}).
                      </p>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>3. Technical Momentum Check</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Supertrend is <strong>{indicators.supertrend.direction}</strong> and RSI is at <strong>{indicators.rsi14.value}</strong>, showing that directional momentum is active and supportive.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. Investor Guide: Call Buy vs Put Buy vs Sell Made Simple */}
                <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/50 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                    RETAIL INVESTOR QUICK GUIDE: WHAT DO THESE MEAN?
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        🟢 CALL BUY (CE)
                      </span>
                      <p className="text-[11px] text-slate-300 font-sans">
                        Buy when you think Nifty will <strong>GO UP 📈</strong>. Limited risk (only the premium paid), high upside profit.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/20 space-y-1">
                      <span className="font-bold text-rose-400 flex items-center gap-1">
                        🔴 PUT BUY (PE)
                      </span>
                      <p className="text-[11px] text-slate-300 font-sans">
                        Buy when you think Nifty will <strong>GO DOWN 📉</strong>. Gives profit when the market falls or crashes.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                      <span className="font-bold text-emerald-300 flex items-center gap-1">
                        🟢 PUT SELL (PE Write)
                      </span>
                      <p className="text-[11px] text-slate-300 font-sans">
                        For option sellers: Sell when you believe Nifty will <strong>STAY ABOVE ₹{optionChain.majorPutSupport}</strong> to collect premium decay.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/20 space-y-1">
                      <span className="font-bold text-rose-300 flex items-center gap-1">
                        🔴 CALL SELL (CE Write)
                      </span>
                      <p className="text-[11px] text-slate-300 font-sans">
                        For option sellers: Sell when you believe Nifty <strong>CANNOT CROSS ₹{optionChain.majorCallResistance}</strong> to collect premium decay.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5. Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        if (onOpenChat) {
                          onOpenChat(`Should I ${recommendedAction} right now on NIFTY? What is the best strike, entry, stop loss, and target in simple words?`);
                        }
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer transition-all flex items-center gap-2 text-xs"
                    >
                      <Bot className="w-4 h-4 text-white" />
                      <span>💬 Ask AI Investor Advisor About This Trade</span>
                    </button>

                    <button
                      onClick={() => onExecutePaperTrade(signal.suggestedStrategy, isCallSignal || isBullish ? 'BUY CALL' : (isPutSignal || isBearish ? 'BUY PUT' : 'NO TRADE'))}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 text-xs"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Practice {recommendedAction} in Simulator</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setSimpleMode(false)}
                    className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    Want to see deep quantitative formulas? Click here →
                  </button>
                </div>
              </div>
            ) : (
              /* Content: Mode 2 - Advanced Quant Confluence (5 Pillars & Skew) */
              signal.humanIqSignal && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-violet-950/30 p-3 rounded-xl border border-violet-500/20">
                    <span className="text-xs text-violet-300 font-mono font-bold">
                      INSTITUTIONAL QUANT BREAKDOWN ({signal.humanIqSignal.rating})
                    </span>
                    <button
                      onClick={() => setSimpleMode(true)}
                      className="text-xs text-slate-300 hover:text-white underline cursor-pointer"
                    >
                      ← Back to Simple Investor View
                    </button>
                  </div>

                  {/* Thesis & Trap Detection */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="md:col-span-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block mb-1">
                        INSTITUTIONAL QUANT THESIS
                      </span>
                      <p className="text-slate-300 text-xs font-sans leading-relaxed">
                        {signal.humanIqSignal.thesis}
                      </p>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                        ⚠️ INSTITUTIONAL TRAP DETECTION
                      </span>
                      <div className="text-white text-xs font-semibold">{signal.humanIqSignal.trapDetection.type}</div>
                      <p className="text-slate-400 text-[11px] font-sans mt-1">
                        {signal.humanIqSignal.trapDetection.action}
                      </p>
                    </div>
                  </div>

                  {/* The 5 Pillars of 99% Confluence */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      THE 5 PILLARS OF 99% QUANT CONFLUENCE:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                      {signal.humanIqSignal.pillars.map((pillar, idx) => (
                        <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-bold text-[11px] truncate">{pillar.name.split(':')[0]}</span>
                            <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
                              {pillar.score}%
                            </span>
                          </div>
                          <p className="text-slate-400 text-[10px] font-sans leading-tight line-clamp-3">
                            {pillar.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Execution Vector */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <span className="text-slate-400 text-[10px] block">CONTRACT:</span>
                        <strong className="text-amber-400 text-sm">{signal.humanIqSignal.executionVector.recommendedContract}</strong>
                      </div>
                      <div className="border-l border-slate-800 pl-3">
                        <span className="text-slate-400 text-[10px] block">SL:</span>
                        <span className="text-rose-400 font-bold">₹{signal.humanIqSignal.executionVector.stopLoss.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="border-l border-slate-800 pl-3">
                        <span className="text-slate-400 text-[10px] block">TARGET:</span>
                        <span className="text-emerald-400 font-bold">₹{signal.humanIqSignal.executionVector.target1.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="border-l border-slate-800 pl-3">
                        <span className="text-slate-400 text-[10px] block">R:R:</span>
                        <span className="text-sky-300 font-bold">{signal.humanIqSignal.executionVector.riskRewardRatio}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onExecutePaperTrade(signal.suggestedStrategy, signal.signal)}
                      className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg cursor-pointer transition-all"
                    >
                      Execute Trade
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        );
      })()}

      {/* 3. NIFTY 50 OPTION CHAIN (MATCHING REFERENCE IMAGE LAYOUT) */}
      <div ref={optionChainRef}>
        <StockOptionChainSection
          stocks={stocks}
          niftySpot={quote.currentPrice}
          niftyTrend={signal.trend}
          selectedSymbol={selectedStockForChain}
          onSelectSymbol={setSelectedStockForChain}
          onExecutePaperTrade={onExecuteStockPaperTrade}
        />
      </div>

      {/* 4. COMPREHENSIVE TECHNICAL INDICATORS PANEL */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Mandatory Indicator Snapshot
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenOptionChain}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Full Option Chain</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenBacktest}
              className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Run Backtest</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[11px]">RSI (14)</span>
            <span className="text-white font-bold text-sm tabular-nums">{indicators.rsi14.value}</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">{indicators.rsi14.condition}</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[11px]">EMA (9/20/50)</span>
            <span className="text-white font-bold text-sm tabular-nums">₹{indicators.emas.ema9}</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">{indicators.emas.alignment}</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[11px]">MACD (12,26,9)</span>
            <span className="text-white font-bold text-sm tabular-nums">{indicators.macd.histogram}</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">{indicators.macd.signal}</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[11px]">BOLLINGER (20,2)</span>
            <span className="text-white font-bold text-sm tabular-nums">BW: {(indicators.bollinger.bandwidth * 100).toFixed(2)}%</span>
            <span className="text-[10px] text-slate-300 block mt-0.5">{indicators.bollinger.position}</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[11px]">ADX (14)</span>
            <span className="text-white font-bold text-sm tabular-nums">{indicators.adx14.value}</span>
            <span className="text-[10px] text-slate-300 block mt-0.5">{indicators.adx14.trendStrength} {indicators.adx14.marketType}</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[11px]">SUPERTREND (10,3)</span>
            <span className="text-white font-bold text-sm tabular-nums">₹{indicators.supertrend.value}</span>
            <span className={`text-[10px] block mt-0.5 ${indicators.supertrend.direction === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {indicators.supertrend.direction}
            </span>
          </div>
        </div>

        {/* Fibonacci Levels Row */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
          <span className="text-slate-400 font-semibold text-[11px]">FIBONACCI INTRADAY:</span>
          <span className="text-slate-300">23.6%: <strong className="text-white">₹{indicators.fibonacci.level236}</strong></span>
          <span className="text-slate-300">38.2%: <strong className="text-white">₹{indicators.fibonacci.level382}</strong></span>
          <span className="text-slate-300">50.0%: <strong className="text-white">₹{indicators.fibonacci.level500}</strong></span>
          <span className="text-slate-300">61.8%: <strong className="text-white">₹{indicators.fibonacci.level618}</strong></span>
          <span className="text-slate-300">78.6%: <strong className="text-white">₹{indicators.fibonacci.level786}</strong></span>
        </div>
      </div>

      {/* 5. OPTIONAL: NIFTY 50 CONSTITUENT STOCKS DIRECTORY (COLLAPSED) */}
      <div className="pt-2">
        <button
          onClick={() => setShowConstituentDirectory(!showConstituentDirectory)}
          className="w-full py-2.5 px-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white font-mono text-xs flex items-center justify-between transition-all cursor-pointer"
        >
          <span className="flex items-center gap-2 font-semibold">
            <span>🏢 NIFTY 50 Constituent Stocks Directory (All 50 Companies)</span>
          </span>
          <span className="text-[11px] text-slate-400">
            {showConstituentDirectory ? '▲ Hide Stocks List' : '▼ View All 50 Stocks (Optional)'}
          </span>
        </button>

        {showConstituentDirectory && (
          <div className="mt-3">
            <StockNiftyCorrelationSignals
              stocks={stocks}
              niftySpot={quote.currentPrice}
              niftyChange={quote.change}
              niftyTrend={signal.trend}
              onSelectStockForOptionChain={handleSelectStockForOptionChain}
              onExecuteStockPaperTrade={onExecuteStockPaperTrade}
            />
          </div>
        )}
      </div>
    </div>
  );
};
