import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  TrendingUp,
  Maximize2,
  Eye,
  EyeOff,
  Layers,
  Activity,
  Compass,
  Zap,
  BarChart2,
  Sliders,
  ChevronDown,
  Info,
  Brain,
  Crosshair,
} from 'lucide-react';
import {
  MarketQuote,
  TechnicalIndicators,
  OptionChainSummary,
  IndiaVixSummary,
  StockConstituent,
  SignalAnalysis,
} from '../types/market';
import { Candle, calculateEMA, calculateVWAP, calculateBollingerBands, calculateSupertrend, calculateRSI, calculateMACD } from '../engine/indicators';

interface GraphSectionProps {
  quote: MarketQuote;
  candles: Candle[];
  indicators: TechnicalIndicators;
  optionChain: OptionChainSummary;
  vix: IndiaVixSummary;
  signalAnalysis: SignalAnalysis;
  stocks: StockConstituent[];
  onSelectStockForTrade?: (symbol: string) => void;
}

type Timeframe = '1m' | '5m' | '15m' | '1h' | '1D';

export const GraphSection: React.FC<GraphSectionProps> = ({
  quote,
  candles: initialCandles,
  indicators,
  optionChain,
  vix,
  signalAnalysis,
  stocks,
  onSelectStockForTrade,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NIFTY 50');
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);
  const [activeSubChart, setActiveSubChart] = useState<'volume' | 'rsi' | 'macd'>('volume');

  // Indicator Visibility Toggles
  const [showEma9, setShowEma9] = useState(true);
  const [showEma20, setShowEma20] = useState(true);
  const [showEma50, setShowEma50] = useState(false);
  const [showEma200, setShowEma200] = useState(false);
  const [showVwap, setShowVwap] = useState(true);
  const [showSupertrend, setShowSupertrend] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showFibonacci, setShowFibonacci] = useState(true);
  const [showSupportResistance, setShowSupportResistance] = useState(true);
  const [showHumanIqOverlay, setShowHumanIqOverlay] = useState(true);

  // SVG Chart dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(900);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(Math.max(600, containerRef.current.clientWidth));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Determine active stock or NIFTY 50
  const activeStock = useMemo(() => {
    if (selectedSymbol === 'NIFTY 50') {
      return {
        symbol: 'NIFTY 50',
        name: 'NSE NIFTY 50 Index',
        currentPrice: quote.currentPrice,
        change: quote.change,
        changePercent: quote.changePercent,
        dayHigh: quote.dayHigh,
        dayLow: quote.dayLow,
        open: quote.open,
        volume: quote.volume,
        vwap: quote.vwap,
      };
    }
    const found = stocks.find((s) => s.symbol === selectedSymbol);
    return found || {
      symbol: selectedSymbol,
      name: selectedSymbol,
      currentPrice: quote.currentPrice,
      change: quote.change,
      changePercent: quote.changePercent,
      dayHigh: quote.dayHigh,
      dayLow: quote.dayLow,
      open: quote.open,
      volume: quote.volume,
      vwap: quote.vwap,
    };
  }, [selectedSymbol, quote, stocks]);

  // Generate synthetic candles for stock or use real NIFTY candles
  const candles = useMemo(() => {
    if (selectedSymbol === 'NIFTY 50' && initialCandles.length > 5) {
      return initialCandles.slice(-60); // latest 60 candles
    }

    // Generate accurate synthetic candles anchored on activeStock price
    const basePrice = activeStock.currentPrice;
    const generated: Candle[] = [];
    const count = 50;
    const now = Date.now();
    const intervalMs = timeframe === '1m' ? 60000 : timeframe === '5m' ? 300000 : timeframe === '15m' ? 900000 : timeframe === '1h' ? 3600000 : 86400000;

    let p = basePrice - (activeStock.change || 0);
    const volatility = basePrice * 0.0022;

    for (let i = count; i >= 0; i--) {
      const time = now - i * intervalMs;
      const walk = (Math.sin(i * 0.4) * 0.7 + (Math.random() - 0.48)) * volatility;
      const o = p;
      const c = i === 0 ? basePrice : p + walk;
      const h = Math.max(o, c) + Math.random() * volatility * 0.6;
      const l = Math.min(o, c) - Math.random() * volatility * 0.6;
      const v = Math.floor(45000 + Math.random() * 85000);

      generated.push({
        timestamp: time,
        open: Number(o.toFixed(2)),
        high: Number(h.toFixed(2)),
        low: Number(l.toFixed(2)),
        close: Number(c.toFixed(2)),
        volume: v,
      });
      p = c;
    }
    return generated;
  }, [selectedSymbol, activeStock, initialCandles, timeframe]);

  // Price calculations and indicator lines
  const closes = useMemo(() => candles.map((c) => c.close), [candles]);

  const ema9 = useMemo(() => calculateEMA(closes, 9), [closes]);
  const ema20 = useMemo(() => calculateEMA(closes, 20), [closes]);
  const ema50 = useMemo(() => calculateEMA(closes, Math.min(50, Math.floor(closes.length / 2))), [closes]);
  const ema200 = useMemo(() => calculateEMA(closes, Math.min(200, Math.floor(closes.length * 0.75))), [closes]);
  const vwapSeries = useMemo(() => calculateVWAP(candles), [candles]);
  const bb = useMemo(() => calculateBollingerBands(closes, 20, 2), [closes]);
  const supertrend = useMemo(() => calculateSupertrend(candles, 10, 3), [candles]);
  const rsi = useMemo(() => calculateRSI(closes, 14), [closes]);
  const macd = useMemo(() => calculateMACD(closes, 12, 26, 9), [closes]);

  // Chart layout calculations
  const chartHeight = 440;
  const subChartHeight = 120;
  const paddingRight = 70; // for Y-axis labels
  const paddingLeft = 10;
  const paddingTop = 25;
  const paddingBottom = 25;

  const drawableWidth = Math.max(200, containerWidth - paddingLeft - paddingRight);
  const drawableHeight = chartHeight - paddingTop - paddingBottom;

  // Min and Max prices across candles & active indicators
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const c of candles) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    }
    // Include Bollinger Bands if visible
    if (showBollinger && bb.lower.length > 0) {
      for (const val of bb.lower) if (val != null && val < min) min = val;
      for (const val of bb.upper) if (val != null && val > max) max = val;
    }
    // Add 1.5% margin top and bottom
    const range = max - min || 1;
    const margin = range * 0.05;
    return {
      minPrice: min - margin,
      maxPrice: max + margin,
      priceRange: range + margin * 2,
    };
  }, [candles, showBollinger, bb]);

  // Coordinate conversion helpers
  const candleCount = candles.length;
  const candleSpacing = drawableWidth / Math.max(1, candleCount);
  const candleWidth = Math.max(3, candleSpacing * 0.65);

  const getX = (index: number) => paddingLeft + index * candleSpacing + candleSpacing / 2;
  const getY = (price: number) => paddingTop + drawableHeight - ((price - minPrice) / priceRange) * drawableHeight;

  // Sub-chart coordinate conversions
  const getSubYVolume = (vol: number, maxVol: number) => {
    return subChartHeight - 10 - (vol / (maxVol || 1)) * (subChartHeight - 20);
  };

  const getSubYRsi = (val: number) => {
    return subChartHeight - 10 - (Math.max(0, Math.min(100, val)) / 100) * (subChartHeight - 20);
  };

  const maxVolume = useMemo(() => {
    return Math.max(...candles.map((c) => c.volume), 1);
  }, [candles]);

  const maxMacdVal = useMemo(() => {
    if (!macd.histogram.length) return 1;
    const all = [...macd.macdLine, ...macd.signalLine, ...macd.histogram].map(Math.abs);
    return Math.max(...all, 1);
  }, [macd]);

  // Fibonacci Retracements
  const swingHigh = useMemo(() => Math.max(...candles.map((c) => c.high)), [candles]);
  const swingLow = useMemo(() => Math.min(...candles.map((c) => c.low)), [candles]);
  const fibDiff = swingHigh - swingLow;
  const fibLevels = useMemo(() => [
    { level: '1.000 (High)', price: swingHigh, color: '#f43f5e' },
    { level: '0.786', price: swingHigh - fibDiff * 0.214, color: '#fb923c' },
    { level: '0.618 (Golden Ratio)', price: swingHigh - fibDiff * 0.382, color: '#eab308' },
    { level: '0.500 (Mid)', price: swingHigh - fibDiff * 0.5, color: '#38bdf8' },
    { level: '0.382', price: swingHigh - fibDiff * 0.618, color: '#a855f7' },
    { level: '0.236', price: swingHigh - fibDiff * 0.764, color: '#a3e635' },
    { level: '0.000 (Low)', price: swingLow, color: '#10b981' },
  ], [swingHigh, swingLow, fibDiff]);

  // Support and Resistance Levels (from optionChain & indicators)
  const srLevels = useMemo(() => [
    { label: 'CALL WALL (Resistance)', price: optionChain.majorCallResistance, color: '#f43f5e', type: 'RES' },
    { label: 'PUT WALL (Support)', price: optionChain.majorPutSupport, color: '#10b981', type: 'SUP' },
    { label: 'PDH (Prev Day High)', price: indicators.priceAction.pdh, color: '#ec4899', type: 'PDH' },
    { label: 'PDL (Prev Day Low)', price: indicators.priceAction.pdl, color: '#06b6d4', type: 'PDL' },
  ], [optionChain, indicators]);

  // Path generator for continuous series (e.g. EMA, VWAP)
  const generatePath = (data: number[], offset: number = 0) => {
    let d = '';
    for (let i = 0; i < data.length; i++) {
      const candleIdx = i + offset;
      if (candleIdx >= candleCount) break;
      const x = getX(candleIdx);
      const y = getY(data[i]);
      if (isNaN(x) || isNaN(y)) continue;
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    return d;
  };

  // Bollinger Band Polygon Area
  const generateBandArea = () => {
    if (!bb.upper.length || !bb.lower.length) return '';
    const offset = candleCount - bb.upper.length;
    let upperStr = '';
    let lowerStr = '';

    for (let i = 0; i < bb.upper.length; i++) {
      const x = getX(i + offset);
      const yUp = getY(bb.upper[i]);
      const yLow = getY(bb.lower[i]);
      upperStr += i === 0 ? `M ${x} ${yUp}` : ` L ${x} ${yUp}`;
      lowerStr = ` L ${x} ${yLow}` + lowerStr;
    }
    return upperStr + lowerStr + ' Z';
  };

  // 99% Human IQ Signal execution values
  const humanIq = signalAnalysis.humanIqSignal;
  const isPos = activeStock.change >= 0;

  return (
    <div className="space-y-5 font-mono text-xs">
      {/* 1. TOP CONTROL BAR: INSTRUMENT SELECTOR + TIMEFRAMES + QUICK STATS */}
      <div className="bg-[#090d16] border border-slate-800 rounded-xl p-3 md:p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        {/* Instrument Switcher & Current Spot Info */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400 text-[11px] font-sans">INSTRUMENT:</span>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value="NIFTY 50" className="bg-slate-900 text-emerald-400 font-bold">
                ⭐ NIFTY 50 INDEX (LIVE)
              </option>
              <optgroup label="Top NIFTY 50 Constituents" className="bg-slate-900 text-slate-300">
                {stocks.map((s) => (
                  <option key={s.symbol} value={s.symbol} className="bg-slate-900 text-white">
                    {s.symbol} - {s.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Live Price Badge */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg md:text-xl font-bold text-white tabular-nums tracking-tight">
              ₹{activeStock.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-xs font-semibold tabular-nums ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPos ? '+' : ''}{activeStock.change.toFixed(2)} ({isPos ? '+' : ''}{activeStock.changePercent.toFixed(2)}%)
            </span>
          </div>

          {/* Quick H/L/VWAP Pill */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-400 border-l border-slate-800 pl-3">
            <span>H: <strong className="text-slate-200">₹{activeStock.dayHigh.toFixed(2)}</strong></span>
            <span>L: <strong className="text-slate-200">₹{activeStock.dayLow.toFixed(2)}</strong></span>
            <span>VWAP: <strong className="text-amber-400">₹{activeStock.vwap.toFixed(2)}</strong></span>
            <span>VIX: <strong className="text-sky-400">{vix.value.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Timeframe Tabs & Actions */}
        <div className="flex items-center gap-2">
          {/* Timeframe Chips */}
          <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
            {(['1m', '5m', '15m', '1h', '1D'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer transition-all ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* 99% Human IQ Mode Pill */}
          <button
            onClick={() => setShowHumanIqOverlay(!showHumanIqOverlay)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showHumanIqOverlay
                ? 'bg-violet-950/80 border-violet-500 text-violet-300 shadow-md shadow-violet-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle 99% Human IQ institutional signal overlay"
          >
            <Brain className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            <span className="hidden sm:inline">99% HUMAN IQ</span>
            <span className="text-[10px] bg-violet-800/60 px-1 rounded font-mono">99%</span>
          </button>
        </div>
      </div>

      {/* 2. INDICATOR TOGGLE RIBBON */}
      <div className="bg-[#090d16] border border-slate-800/80 rounded-xl p-2.5 px-3 flex items-center justify-between gap-2 overflow-x-auto text-[11px]">
        <div className="flex items-center gap-2 shrink-0 text-slate-400">
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold uppercase text-[10px] tracking-wider text-slate-500">INDICATORS:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {/* EMA 9 */}
          <button
            onClick={() => setShowEma9(!showEma9)}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
              showEma9 ? 'bg-sky-500/10 border-sky-400 text-sky-300 font-bold' : 'border-slate-800 text-slate-500'
            }`}
          >
            ● 9 EMA
          </button>

          {/* EMA 20 */}
          <button
            onClick={() => setShowEma20(!showEma20)}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
              showEma20 ? 'bg-amber-500/10 border-amber-400 text-amber-300 font-bold' : 'border-slate-800 text-slate-500'
            }`}
          >
            ● 20 EMA
          </button>

          {/* EMA 50 */}
          <button
            onClick={() => setShowEma50(!showEma50)}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
              showEma50 ? 'bg-purple-500/10 border-purple-400 text-purple-300 font-bold' : 'border-slate-800 text-slate-500'
            }`}
          >
            ● 50 EMA
          </button>

          {/* EMA 200 */}
          <button
            onClick={() => setShowEma200(!showEma200)}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
              showEma200 ? 'bg-slate-400/10 border-slate-400 text-slate-300 font-bold' : 'border-slate-800 text-slate-500'
            }`}
          >
            ● 200 EMA
          </button>

          {/* VWAP */}
          <button
            onClick={() => setShowVwap(!showVwap)}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
              showVwap ? 'bg-yellow-500/10 border-yellow-400 text-yellow-300 font-bold' : 'border-slate-800 text-slate-500'
            }`}
          >
            ┅ VWAP
          </button>

          {/* Supertrend */}
          <button
            onClick={() => setShowSupertrend(!showSupertrend)}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
              showSupertrend ? 'bg-emerald-500/10 border-emerald-400 text-emerald-300 font-bold' : 'border-slate-800 text-slate-500'
            }`}
          >
            ▲ SUPERTREND (10,3)
          </button>

          {/* Bollinger Bands */}
          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
              showBollinger ? 'bg-indigo-500/10 border-indigo-400 text-indigo-300 font-bold' : 'border-slate-800 text-slate-500'
            }`}
          >
            ░ BOLLINGER (20,2)
          </button>

          {/* Fibonacci */}
          <button
            onClick={() => setShowFibonacci(!showFibonacci)}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
              showFibonacci ? 'bg-rose-500/10 border-rose-400 text-rose-300 font-bold' : 'border-slate-800 text-slate-500'
            }`}
          >
            ⩩ FIBONACCI
          </button>

          {/* Support / Resistance */}
          <button
            onClick={() => setShowSupportResistance(!showSupportResistance)}
            className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
              showSupportResistance ? 'bg-teal-500/10 border-teal-400 text-teal-300 font-bold' : 'border-slate-800 text-slate-500'
            }`}
          >
            ⌗ S/R & WALLS
          </button>
        </div>
      </div>

      {/* 3. MAIN CANDLESTICK CHART CONTAINER */}
      <div
        ref={containerRef}
        className="bg-[#0b0f19] border border-slate-800 rounded-2xl shadow-2xl p-2 md:p-4 relative select-none overflow-hidden"
      >
        {/* Interactive Candle Hover Status Bar */}
        <div className="flex flex-wrap items-center justify-between text-[11px] border-b border-slate-800/80 pb-2 mb-2 px-1 text-slate-300">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {selectedSymbol} [{timeframe}]
            </span>
            {hoveredCandle ? (
              <>
                <span>O: <strong className="text-white">₹{hoveredCandle.open.toFixed(2)}</strong></span>
                <span>H: <strong className="text-emerald-400">₹{hoveredCandle.high.toFixed(2)}</strong></span>
                <span>L: <strong className="text-rose-400">₹{hoveredCandle.low.toFixed(2)}</strong></span>
                <span>C: <strong className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400' : 'text-rose-400'}>₹{hoveredCandle.close.toFixed(2)}</strong></span>
                <span>Vol: <strong className="text-sky-300">{hoveredCandle.volume.toLocaleString('en-IN')}</strong></span>
                <span className="text-slate-500">{new Date(hoveredCandle.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            ) : (
              <>
                <span>O: <strong className="text-white">₹{activeStock.open.toFixed(2)}</strong></span>
                <span>H: <strong className="text-emerald-400">₹{activeStock.dayHigh.toFixed(2)}</strong></span>
                <span>L: <strong className="text-rose-400">₹{activeStock.dayLow.toFixed(2)}</strong></span>
                <span>C: <strong className={isPos ? 'text-emerald-400' : 'text-rose-400'}>₹{activeStock.currentPrice.toFixed(2)}</strong></span>
                <span>Vol: <strong className="text-sky-300">{activeStock.volume.toLocaleString('en-IN')}</strong></span>
                <span className="text-slate-500">Live Active Candle</span>
              </>
            )}
          </div>

          {/* Quick Active Indicators Legend */}
          <div className="hidden md:flex items-center gap-2.5 text-[10px]">
            {showEma9 && ema9.length > 0 && <span className="text-sky-400">EMA9: ₹{ema9[ema9.length - 1].toFixed(1)}</span>}
            {showEma20 && ema20.length > 0 && <span className="text-amber-400">EMA20: ₹{ema20[ema20.length - 1].toFixed(1)}</span>}
            {showVwap && vwapSeries.length > 0 && <span className="text-yellow-400">VWAP: ₹{vwapSeries[vwapSeries.length - 1].toFixed(1)}</span>}
            {showSupertrend && supertrend.values.length > 0 && (
              <span className={supertrend.directions[supertrend.directions.length - 1] === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}>
                ST: ₹{supertrend.values[supertrend.values.length - 1].toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* SVG Drawing Canvas for Main Chart */}
        <div className="relative">
          <svg
            width="100%"
            height={chartHeight}
            viewBox={`0 0 ${containerWidth} ${chartHeight}`}
            className="overflow-visible cursor-crosshair"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const mouseY = e.clientY - rect.top;
              setHoverX(mouseX);
              setHoverY(mouseY);

              // Find closest candle by X coordinate
              const idx = Math.floor((mouseX - paddingLeft) / candleSpacing);
              if (idx >= 0 && idx < candles.length) {
                setHoveredCandle(candles[idx]);
              }
            }}
            onMouseLeave={() => {
              setHoveredCandle(null);
              setHoverX(null);
              setHoverY(null);
            }}
          >
            <defs>
              <linearGradient id="bbGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="bullCandleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="bearCandleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines & Price Labels */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
              const p = minPrice + (1 - frac) * priceRange;
              const y = paddingTop + frac * drawableHeight;
              return (
                <g key={idx}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={containerWidth - paddingRight}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={containerWidth - paddingRight + 8}
                    y={y + 4}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    ₹{p.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Bollinger Bands Shaded Area & Lines */}
            {showBollinger && bb.upper.length > 0 && (
              <>
                <path d={generateBandArea()} fill="url(#bbGradient)" />
                <path d={generatePath(bb.upper, candleCount - bb.upper.length)} fill="none" stroke="#818cf8" strokeWidth="1.2" strokeDasharray="2 2" />
                <path d={generatePath(bb.middle, candleCount - bb.middle.length)} fill="none" stroke="#6366f1" strokeWidth="1" />
                <path d={generatePath(bb.lower, candleCount - bb.lower.length)} fill="none" stroke="#818cf8" strokeWidth="1.2" strokeDasharray="2 2" />
              </>
            )}

            {/* Fibonacci Retracements Horizontal Lines */}
            {showFibonacci &&
              fibLevels.map((fib, idx) => {
                const y = getY(fib.price);
                if (y < paddingTop || y > paddingTop + drawableHeight) return null;
                return (
                  <g key={idx}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={containerWidth - paddingRight}
                      y2={y}
                      stroke={fib.color}
                      strokeWidth="1"
                      strokeOpacity="0.45"
                      strokeDasharray="4 2"
                    />
                    <text
                      x={paddingLeft + 4}
                      y={y - 3}
                      fill={fib.color}
                      fontSize="9"
                      fontFamily="monospace"
                      opacity="0.8"
                    >
                      Fib {fib.level}: ₹{fib.price.toFixed(1)}
                    </text>
                  </g>
                );
              })}

            {/* Support and Resistance / Major OI Walls */}
            {showSupportResistance &&
              srLevels.map((sr, idx) => {
                const y = getY(sr.price);
                if (y < paddingTop || y > paddingTop + drawableHeight) return null;
                return (
                  <g key={idx}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={containerWidth - paddingRight}
                      y2={y}
                      stroke={sr.color}
                      strokeWidth="1.5"
                      strokeDasharray={sr.type.includes('WALL') ? '6 4' : '2 2'}
                    />
                    <rect
                      x={containerWidth - paddingRight + 4}
                      y={y - 8}
                      width={62}
                      height={16}
                      rx="3"
                      fill={sr.color}
                      fillOpacity="0.2"
                      stroke={sr.color}
                      strokeWidth="0.8"
                    />
                    <text
                      x={containerWidth - paddingRight + 8}
                      y={y + 3}
                      fill={sr.color}
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {sr.type}: ₹{sr.price}
                    </text>
                  </g>
                );
              })}

            {/* Moving Average Continuous Lines */}
            {showEma200 && ema200.length > 0 && (
              <path d={generatePath(ema200, candleCount - ema200.length)} fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            )}
            {showEma50 && ema50.length > 0 && (
              <path d={generatePath(ema50, candleCount - ema50.length)} fill="none" stroke="#a855f7" strokeWidth="1.5" />
            )}
            {showEma20 && ema20.length > 0 && (
              <path d={generatePath(ema20, candleCount - ema20.length)} fill="none" stroke="#f59e0b" strokeWidth="1.8" />
            )}
            {showEma9 && ema9.length > 0 && (
              <path d={generatePath(ema9, candleCount - ema9.length)} fill="none" stroke="#38bdf8" strokeWidth="1.8" />
            )}
            {showVwap && vwapSeries.length > 0 && (
              <path d={generatePath(vwapSeries, 0)} fill="none" stroke="#eab308" strokeWidth="2" strokeDasharray="5 3" />
            )}

            {/* Supertrend Line & Arrows */}
            {showSupertrend && supertrend.values.length > 0 && (
              <>
                <path
                  d={generatePath(supertrend.values, candleCount - supertrend.values.length)}
                  fill="none"
                  stroke={supertrend.directions[supertrend.directions.length - 1] === 'BULLISH' ? '#10b981' : '#ef4444'}
                  strokeWidth="2"
                />
              </>
            )}

            {/* Candlestick Bars */}
            {candles.map((candle, idx) => {
              const isBull = candle.close >= candle.open;
              const x = getX(idx);
              const yOpen = getY(candle.open);
              const yClose = getY(candle.close);
              const yHigh = getY(candle.high);
              const yLow = getY(candle.low);

              const candleTop = Math.min(yOpen, yClose);
              const candleHeight = Math.max(1.5, Math.abs(yClose - yOpen));
              const color = isBull ? '#10b981' : '#f43f5e';

              return (
                <g key={idx}>
                  {/* Upper Wick */}
                  <line x1={x} y1={yHigh} x2={x} y2={candleTop} stroke={color} strokeWidth="1.2" />
                  {/* Lower Wick */}
                  <line x1={x} y1={candleTop + candleHeight} x2={x} y2={yLow} stroke={color} strokeWidth="1.2" />
                  {/* Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={candleTop}
                    width={candleWidth}
                    height={candleHeight}
                    fill={isBull ? 'url(#bullCandleGrad)' : 'url(#bearCandleGrad)'}
                    stroke={color}
                    strokeWidth="0.8"
                    rx="1"
                  />
                </g>
              );
            })}

            {/* 99% Human IQ Signal Vector Visual Overlay */}
            {showHumanIqOverlay && humanIq && (
              <g>
                {/* Entry Level Line */}
                {(() => {
                  const yEntry = getY(activeStock.currentPrice);
                  const ySl = getY(humanIq.executionVector.stopLoss);
                  const yT1 = getY(humanIq.executionVector.target1);
                  const yT2 = getY(humanIq.executionVector.target2);

                  return (
                    <>
                      {/* Entry Line */}
                      <line
                        x1={containerWidth * 0.4}
                        y1={yEntry}
                        x2={containerWidth - paddingRight}
                        y2={yEntry}
                        stroke="#8b5cf6"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                      <rect
                        x={containerWidth - paddingRight - 150}
                        y={yEntry - 20}
                        width={145}
                        height={18}
                        rx="4"
                        fill="#581c87"
                        stroke="#a855f7"
                        strokeWidth="1"
                      />
                      <text
                        x={containerWidth - paddingRight - 142}
                        y={yEntry - 7}
                        fill="#e9d5ff"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        🧠 99% IQ ENTRY: ₹{activeStock.currentPrice.toFixed(0)}
                      </text>

                      {/* Stop Loss Line */}
                      <line
                        x1={containerWidth * 0.4}
                        y1={ySl}
                        x2={containerWidth - paddingRight}
                        y2={ySl}
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={containerWidth - paddingRight - 120}
                        y={ySl - 4}
                        fill="#f87171"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        SL: ₹{humanIq.executionVector.stopLoss}
                      </text>

                      {/* Target 1 Line */}
                      <line
                        x1={containerWidth * 0.4}
                        y1={yT1}
                        x2={containerWidth - paddingRight}
                        y2={yT1}
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={containerWidth - paddingRight - 130}
                        y={yT1 - 4}
                        fill="#34d399"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        TARGET 1: ₹{humanIq.executionVector.target1}
                      </text>

                      {/* Target 2 Line */}
                      <line
                        x1={containerWidth * 0.4}
                        y1={yT2}
                        x2={containerWidth - paddingRight}
                        y2={yT2}
                        stroke="#059669"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={containerWidth - paddingRight - 130}
                        y={yT2 - 4}
                        fill="#10b981"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        TARGET 2: ₹{humanIq.executionVector.target2}
                      </text>
                    </>
                  );
                })()}
              </g>
            )}

            {/* Interactive Crosshair & Cursor Coordinates */}
            {hoverX != null && hoverY != null && (
              <g pointerEvents="none">
                {/* Vertical Line */}
                <line
                  x1={hoverX}
                  y1={paddingTop}
                  x2={hoverX}
                  y2={chartHeight - paddingBottom}
                  stroke="#94a3b8"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                />
                {/* Horizontal Line */}
                <line
                  x1={paddingLeft}
                  y1={hoverY}
                  x2={containerWidth - paddingRight}
                  y2={hoverY}
                  stroke="#94a3b8"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                />
                {/* Y-Price Tag at Cursor */}
                <rect
                  x={containerWidth - paddingRight + 2}
                  y={hoverY - 10}
                  width={66}
                  height={20}
                  rx="3"
                  fill="#1e293b"
                  stroke="#475569"
                />
                <text
                  x={containerWidth - paddingRight + 6}
                  y={hoverY + 4}
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  ₹{(minPrice + ((chartHeight - paddingBottom - hoverY) / drawableHeight) * priceRange).toFixed(1)}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* 4. OSCILLATORS & SUB-PANEL TABS: VOLUME | RSI | MACD */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">SUB-CHART:</span>
              <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px]">
                <button
                  onClick={() => setActiveSubChart('volume')}
                  className={`px-2.5 py-0.5 rounded cursor-pointer transition-all ${
                    activeSubChart === 'volume' ? 'bg-slate-800 text-sky-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  VOLUME (20MA)
                </button>
                <button
                  onClick={() => setActiveSubChart('rsi')}
                  className={`px-2.5 py-0.5 rounded cursor-pointer transition-all ${
                    activeSubChart === 'rsi' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  RSI (14)
                </button>
                <button
                  onClick={() => setActiveSubChart('macd')}
                  className={`px-2.5 py-0.5 rounded cursor-pointer transition-all ${
                    activeSubChart === 'macd' ? 'bg-slate-800 text-purple-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  MACD (12,26,9)
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-400">
              {activeSubChart === 'volume' && (
                <span>Current Vol: <strong className="text-white">{(candles[candles.length - 1]?.volume || 0).toLocaleString('en-IN')}</strong></span>
              )}
              {activeSubChart === 'rsi' && (
                <span>RSI: <strong className="text-amber-400">{(rsi[rsi.length - 1] || 50).toFixed(1)}</strong> ({indicators.rsi14.condition})</span>
              )}
              {activeSubChart === 'macd' && (
                <span>Histogram: <strong className={indicators.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {indicators.macd.histogram >= 0 ? '+' : ''}{indicators.macd.histogram.toFixed(2)}
                </strong> ({indicators.macd.signal})</span>
              )}
            </div>
          </div>

          {/* Sub-panel SVG */}
          <div className="bg-slate-950/60 rounded-xl p-1 border border-slate-800/80">
            <svg width="100%" height={subChartHeight} viewBox={`0 0 ${containerWidth} ${subChartHeight}`}>
              {/* Volume Bars Sub-chart */}
              {activeSubChart === 'volume' && (
                <g>
                  {candles.map((c, idx) => {
                    const isBull = c.close >= c.open;
                    const x = getX(idx);
                    const y = getSubYVolume(c.volume, maxVolume);
                    const h = subChartHeight - 10 - y;
                    return (
                      <rect
                        key={idx}
                        x={x - candleWidth / 2}
                        y={y}
                        width={candleWidth}
                        height={Math.max(2, h)}
                        fill={isBull ? '#10b981' : '#f43f5e'}
                        fillOpacity="0.65"
                        rx="1"
                      />
                    );
                  })}
                  {/* Volume baseline */}
                  <line x1={paddingLeft} y1={subChartHeight - 10} x2={containerWidth - paddingRight} y2={subChartHeight - 10} stroke="#334155" />
                </g>
              )}

              {/* RSI Sub-chart */}
              {activeSubChart === 'rsi' && rsi.length > 0 && (
                <g>
                  {/* Overbought line 70 */}
                  <line x1={paddingLeft} y1={getSubYRsi(70)} x2={containerWidth - paddingRight} y2={getSubYRsi(70)} stroke="#ef4444" strokeDasharray="3 3" />
                  <text x={containerWidth - paddingRight + 6} y={getSubYRsi(70) + 4} fill="#ef4444" fontSize="9">70 OB</text>

                  {/* Center line 50 */}
                  <line x1={paddingLeft} y1={getSubYRsi(50)} x2={containerWidth - paddingRight} y2={getSubYRsi(50)} stroke="#475569" strokeDasharray="2 2" />
                  <text x={containerWidth - paddingRight + 6} y={getSubYRsi(50) + 4} fill="#64748b" fontSize="9">50 Mid</text>

                  {/* Oversold line 30 */}
                  <line x1={paddingLeft} y1={getSubYRsi(30)} x2={containerWidth - paddingRight} y2={getSubYRsi(30)} stroke="#10b981" strokeDasharray="3 3" />
                  <text x={containerWidth - paddingRight + 6} y={getSubYRsi(30) + 4} fill="#10b981" fontSize="9">30 OS</text>

                  {/* RSI Curve */}
                  {(() => {
                    const offset = candleCount - rsi.length;
                    let pathD = '';
                    for (let i = 0; i < rsi.length; i++) {
                      const x = getX(i + offset);
                      const y = getSubYRsi(rsi[i]);
                      pathD += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
                    }
                    return <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2" />;
                  })()}
                </g>
              )}

              {/* MACD Sub-chart */}
              {activeSubChart === 'macd' && macd.histogram.length > 0 && (
                <g>
                  {/* Zero line */}
                  <line x1={paddingLeft} y1={subChartHeight / 2} x2={containerWidth - paddingRight} y2={subChartHeight / 2} stroke="#334155" />
                  <text x={containerWidth - paddingRight + 6} y={subChartHeight / 2 + 3} fill="#64748b" fontSize="9">0.0</text>

                  {/* Histogram bars */}
                  {macd.histogram.map((val, idx) => {
                    const offset = candleCount - macd.histogram.length;
                    const x = getX(idx + offset);
                    const zeroY = subChartHeight / 2;
                    const barHeight = (Math.abs(val) / maxMacdVal) * (subChartHeight / 2 - 15);
                    const y = val >= 0 ? zeroY - barHeight : zeroY;

                    return (
                      <rect
                        key={idx}
                        x={x - candleWidth / 2}
                        y={y}
                        width={candleWidth}
                        height={Math.max(1, barHeight)}
                        fill={val >= 0 ? '#10b981' : '#f43f5e'}
                        rx="1"
                      />
                    );
                  })}
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* 5. 99% HUMAN IQ SUPERFORECASTER SIGNAL PANEL */}
      {humanIq && (
        <div className="bg-gradient-to-r from-violet-950/40 via-[#0e1428] to-slate-900 border border-violet-500/40 rounded-2xl p-4 md:p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-500/20 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center shrink-0 shadow-inner">
                <Brain className="w-5 h-5 text-violet-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-violet-300 font-extrabold text-sm uppercase tracking-wider">
                    99% HUMAN IQ LEVEL SIGNAL
                  </span>
                  <span className="bg-violet-600 text-white font-mono text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                    {humanIq.confluencePercent}% CONFLUENCE
                  </span>
                  <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                    {humanIq.rating}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5 font-sans">
                  Institutional multi-layer quantitative synthesis: Volatility Surface, Orderflow Traps, SMC Geometry & Execution.
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">INSTITUTIONAL VERDICT:</span>
              <div className="text-emerald-400 font-bold text-sm tracking-tight">{humanIq.verdict}</div>
            </div>
          </div>

          {/* Core Thesis & Trap Detection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block mb-1">
                INSTITUTIONAL QUANT THESIS
              </span>
              <p className="text-slate-200 text-xs font-sans leading-relaxed">
                {humanIq.thesis}
              </p>
            </div>

            <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-3">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                ⚠️ TRAP DETECTION & ACTION
              </span>
              <div className="text-white text-xs font-semibold">{humanIq.trapDetection.type}</div>
              <p className="text-slate-400 text-[11px] font-sans mt-1">
                {humanIq.trapDetection.action}
              </p>
            </div>
          </div>

          {/* The 5 Institutional Thinking Pillars */}
          <div className="space-y-2 mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              THE 5 PILLARS OF 99% CONFLUENCE:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {humanIq.pillars.map((pillar, idx) => (
                <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-[11px] truncate">{pillar.name.split(':')[0]}</span>
                    <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
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

          {/* High-Probability Execution Vector */}
          <div className="bg-violet-950/30 border border-violet-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">RECOMMENDED:</span>
                <strong className="text-amber-400 font-mono text-sm">{humanIq.executionVector.recommendedContract}</strong>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-slate-400 text-[10px] block">ENTRY TRIGGER:</span>
                <span className="text-white font-semibold">{humanIq.executionVector.entryTrigger}</span>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-slate-400 text-[10px] block">STOP LOSS:</span>
                <span className="text-rose-400 font-bold">₹{humanIq.executionVector.stopLoss.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-slate-400 text-[10px] block">TARGET 1 / 2:</span>
                <span className="text-emerald-400 font-bold">
                  ₹{humanIq.executionVector.target1.toLocaleString('en-IN')} / ₹{humanIq.executionVector.target2.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-slate-400 text-[10px] block">RISK : REWARD:</span>
                <span className="text-sky-300 font-bold">{humanIq.executionVector.riskRewardRatio} ({humanIq.executionVector.expectedValue})</span>
              </div>
            </div>

            {onSelectStockForTrade && (
              <button
                onClick={() => onSelectStockForTrade(selectedSymbol)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 cursor-pointer transition-all flex items-center gap-1.5"
              >
                <span>⚡ Trade In Option Chain</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
