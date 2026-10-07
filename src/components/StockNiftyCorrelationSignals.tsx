import React, { useState, useMemo } from 'react';
import { StockConstituent } from '../types/market';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  CheckCircle2,
  BarChart3,
  Flame,
  Layers,
  Table,
  LayoutGrid,
  ArrowUpDown,
  ListOrdered,
} from 'lucide-react';

interface Nifty50ConstituentsSignalsProps {
  stocks: StockConstituent[];
  niftySpot: number;
  niftyChange: number;
  niftyTrend: string;
  onSelectStockForOptionChain: (symbol: string) => void;
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
}

export const StockNiftyCorrelationSignals: React.FC<Nifty50ConstituentsSignalsProps> = ({
  stocks,
  niftySpot,
  niftyChange,
  niftyTrend,
  onSelectStockForOptionChain,
  onExecuteStockPaperTrade,
}) => {
  const [filterMode, setFilterMode] = useState<
    'ALL' | 'BULLISH' | 'BEARISH' | 'BANKING' | 'IT' | 'AUTO' | 'ENERGY_POWER' | 'FMCG' | 'PHARMA' | 'METALS'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('TABLE');
  const [sortBy, setSortBy] = useState<'WEIGHTAGE' | 'PRICE_DESC' | 'CHANGE_DESC' | 'SYMBOL_ASC'>('WEIGHTAGE');
  const [displayCount, setDisplayCount] = useState<number>(50); // Default to ALL 50 constituents

  // Filter stocks
  const displayStocks = useMemo(() => {
    let list = stocks.filter((s) => s.symbol !== 'NIFTY 50');

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filterMode === 'BULLISH') {
      list = list.filter((s) => s.signal === 'BUY CALL' || s.change >= 0);
    } else if (filterMode === 'BEARISH') {
      list = list.filter((s) => s.signal === 'BUY PUT' || s.change < 0);
    } else if (filterMode === 'BANKING') {
      list = list.filter((s) => s.sector.toLowerCase().includes('bank') || s.sector.toLowerCase().includes('financial'));
    } else if (filterMode === 'IT') {
      list = list.filter((s) => s.sector.toLowerCase().includes('it') || s.sector.toLowerCase().includes('tech'));
    } else if (filterMode === 'AUTO') {
      list = list.filter((s) => s.sector.toLowerCase().includes('auto'));
    } else if (filterMode === 'ENERGY_POWER') {
      list = list.filter(
        (s) =>
          s.sector.toLowerCase().includes('energy') ||
          s.sector.toLowerCase().includes('power') ||
          s.sector.toLowerCase().includes('oil') ||
          s.sector.toLowerCase().includes('conglomerate')
      );
    } else if (filterMode === 'FMCG') {
      list = list.filter((s) => s.sector.toLowerCase().includes('fmcg') || s.sector.toLowerCase().includes('consumer'));
    } else if (filterMode === 'PHARMA') {
      list = list.filter((s) => s.sector.toLowerCase().includes('pharma') || s.sector.toLowerCase().includes('health'));
    } else if (filterMode === 'METALS') {
      list = list.filter((s) => s.sector.toLowerCase().includes('metal') || s.sector.toLowerCase().includes('mining'));
    }

    // Sort order
    return list.sort((a, b) => {
      if (sortBy === 'WEIGHTAGE') {
        return (b.weightage || 0) - (a.weightage || 0);
      }
      if (sortBy === 'PRICE_DESC') {
        return b.currentPrice - a.currentPrice;
      }
      if (sortBy === 'CHANGE_DESC') {
        return b.changePercent - a.changePercent;
      }
      if (sortBy === 'SYMBOL_ASC') {
        return a.symbol.localeCompare(b.symbol);
      }
      return 0;
    });
  }, [stocks, filterMode, searchQuery, sortBy]);

  // Sliced items based on user choice
  const visibleStocks = useMemo(() => {
    return displayStocks.slice(0, displayCount);
  }, [displayStocks, displayCount]);

  // Statistics
  const callSignalsCount = useMemo(
    () => displayStocks.filter((s) => s.signal === 'BUY CALL' || s.trend === 'BULLISH').length,
    [displayStocks]
  );
  const putSignalsCount = useMemo(
    () => displayStocks.filter((s) => s.signal === 'BUY PUT' || s.trend === 'BEARISH').length,
    [displayStocks]
  );

  return (
    <div className="bg-gradient-to-r from-slate-900 via-[#0a0f1d] to-[#0e172a] border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl space-y-6">
      {/* 1. Header: Official NIFTY 50 Constituent Stocks List */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded font-mono font-bold tracking-wide flex items-center gap-1">
              <ListOrdered className="w-3 h-3 text-emerald-400" />
              OFFICIAL NSE INDEX BASKET
            </span>
            <span className="bg-blue-500/20 text-blue-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
              50 CONSTITUENT STOCKS
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2">
            <span>NIFTY 50 Constituent Stocks (Index Components)</span>
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-2xl">
            The full official universe of all 50 individual stocks that make up the NIFTY 50 index. Trade individual stock options or track their live weights, prices, lot sizes, and algorithmic Call / Put signals.
          </p>
        </div>

        {/* View Mode Toggle + Count */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1 text-xs font-mono">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'TABLE' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Full List (Table)</span>
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'CARDS' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Signal Cards</span>
            </button>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-mono text-right">
            <span className="text-[10px] text-slate-500 block">UNIVERSE</span>
            <strong className="text-white text-sm tabular-nums">{stocks.filter(s => s.symbol !== 'NIFTY 50').length} Stocks</strong>
          </div>
        </div>
      </div>

      {/* 2. Controls, Search, Sort & Sector Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Sector Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-500 text-[11px] mr-1">SECTORS:</span>
            {(
              [
                { id: 'ALL', label: `All 50 Stocks` },
                { id: 'BANKING', label: '🏦 Banking (6)' },
                { id: 'IT', label: '💻 IT Tech (6)' },
                { id: 'AUTO', label: '🚗 Auto (6)' },
                { id: 'ENERGY_POWER', label: '⚡ Energy & Power (5)' },
                { id: 'FMCG', label: '🛒 FMCG (5)' },
                { id: 'PHARMA', label: '💊 Pharma (5)' },
                { id: 'METALS', label: '⛏️ Metals (3)' },
                { id: 'BULLISH', label: '🟢 Call Buy (CE)' },
                { id: 'BEARISH', label: '🔴 Put Buy (PE)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  filterMode === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box & Sort */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search any constituent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 py-1.5 px-2.5 rounded-lg font-mono focus:outline-none cursor-pointer"
            >
              <option value="WEIGHTAGE">Sort: Weightage (High to Low)</option>
              <option value="PRICE_DESC">Sort: Stock Price (High to Low)</option>
              <option value="CHANGE_DESC">Sort: % Change (Top Gainers)</option>
              <option value="SYMBOL_ASC">Sort: Alphabetical (A to Z)</option>
            </select>
          </div>
        </div>

        {/* Display count pill filter */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            <span>Showing:</span>
            {[15, 25, 50].map((cnt) => (
              <button
                key={cnt}
                onClick={() => setDisplayCount(cnt)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                  displayCount === cnt
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {cnt === 50 ? 'All 50' : `Top ${cnt}`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">{callSignalsCount} Call Setups</span>
            <span>·</span>
            <span className="text-rose-400 font-semibold">{putSignalsCount} Put Setups</span>
          </div>
        </div>
      </div>

      {/* 3A. VIEW MODE 1: COMPLETE 50 CONSTITUENTS TABLE */}
      {viewMode === 'TABLE' && (
        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/80">
          <table className="w-full text-left font-mono text-xs divide-y divide-slate-800">
            <thead className="bg-slate-900/90 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">Symbol & Company</th>
                <th className="py-3 px-3">Sector</th>
                <th className="py-3 px-3 text-right">Weight</th>
                <th className="py-3 px-3 text-right">Current Price</th>
                <th className="py-3 px-3 text-right">Change</th>
                <th className="py-3 px-3 text-center">Lot Size</th>
                <th className="py-3 px-3 text-center">Strike Step</th>
                <th className="py-3 px-3 text-center">Signal Verdict</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {visibleStocks.map((stock, idx) => {
                const isStockUp = stock.change >= 0;
                const isCall = stock.signal === 'BUY CALL' || (stock.trend === 'BULLISH' && stock.signal !== 'BUY PUT');
                const isPut = stock.signal === 'BUY PUT' || (stock.trend === 'BEARISH' && stock.signal !== 'BUY CALL');
                const step = stock.strikeStep || 20;
                const atmStrike = Math.round(stock.currentPrice / step) * step;
                const estPremium = Math.max(6, Number((stock.currentPrice * 0.019).toFixed(1)));

                return (
                  <tr key={stock.symbol} className="hover:bg-slate-900/60 transition-colors">
                    {/* Index rank */}
                    <td className="py-2.5 px-3 text-center text-slate-500 font-bold text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Symbol & Name */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <strong className="text-white font-extrabold">{stock.symbol}</strong>
                        {stock.weightage >= 5 && (
                          <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1 rounded font-bold">
                            TOP
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans truncate max-w-[180px]">
                        {stock.name}
                      </div>
                    </td>

                    {/* Sector */}
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {stock.sector}
                    </td>

                    {/* Weightage % */}
                    <td className="py-2.5 px-3 text-right font-bold text-amber-400 tabular-nums">
                      {stock.weightage.toFixed(2)}%
                    </td>

                    {/* Current Price */}
                    <td className="py-2.5 px-3 text-right font-bold text-white tabular-nums">
                      ₹{stock.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                    </td>

                    {/* Change & % */}
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      <span className={`font-semibold ${isStockUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isStockUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        ({isStockUp ? '+' : ''}{stock.change.toFixed(1)})
                      </span>
                    </td>

                    {/* Lot Size */}
                    <td className="py-2.5 px-3 text-center text-slate-300 tabular-nums font-semibold">
                      {stock.lotSize}
                    </td>

                    {/* Strike Step */}
                    <td className="py-2.5 px-3 text-center text-slate-400 tabular-nums">
                      {stock.strikeStep} pts
                    </td>

                    {/* Signal */}
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${
                          isCall
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isPut
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isCall ? '🟢 BUY CE' : isPut ? '🔴 BUY PE' : '🟡 WAIT'}
                        <span className="text-[9px] opacity-75">{stock.confidence || 80}%</span>
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            onExecuteStockPaperTrade({
                              symbol: stock.symbol,
                              stockName: stock.name,
                              strike: atmStrike,
                              optionType: isCall ? 'CE' : 'PE',
                              action: 'BUY',
                              premium: estPremium,
                              lotSize: stock.lotSize || 250,
                              lots: 1,
                              strategyName: `${stock.symbol} ${atmStrike} ${isCall ? 'CE' : 'PE'} Buy`,
                              stopLoss: Number((estPremium * 0.7).toFixed(1)),
                              target: Number((estPremium * 1.5).toFixed(1)),
                            });
                          }}
                          className="px-2 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                          title={`Practice trade on ${stock.symbol} ${atmStrike} ${isCall ? 'CE' : 'PE'}`}
                        >
                          <Zap className="w-2.5 h-2.5 text-amber-300" />
                          <span>Trade</span>
                        </button>

                        <button
                          onClick={() => onSelectStockForOptionChain(stock.symbol)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                          title={`Open option chain for ${stock.symbol}`}
                        >
                          <BarChart3 className="w-2.5 h-2.5 text-blue-400" />
                          <span>Chain</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3B. VIEW MODE 2: CARDS GRID VIEW */}
      {viewMode === 'CARDS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleStocks.map((stock, idx) => {
            const isStockUp = stock.change >= 0;
            const isCall = stock.signal === 'BUY CALL' || (stock.trend === 'BULLISH' && stock.signal !== 'BUY PUT');
            const isPut = stock.signal === 'BUY PUT' || (stock.trend === 'BEARISH' && stock.signal !== 'BUY CALL');

            const step = stock.strikeStep || 20;
            const atmStrike = Math.round(stock.currentPrice / step) * step;
            const estPremium = Math.max(6, Number((stock.currentPrice * 0.019).toFixed(1)));
            const recommendedContract = isCall
              ? `${stock.symbol} ${atmStrike} CE`
              : isPut
              ? `${stock.symbol} ${atmStrike} PE`
              : `${stock.symbol} ${atmStrike} WAIT`;

            const target1 = Number((isCall ? stock.currentPrice + step * 1.5 : stock.currentPrice - step * 1.5).toFixed(1));
            const stopLoss = Number((isCall ? stock.currentPrice - step * 0.9 : stock.currentPrice + step * 0.9).toFixed(1));
            const entryLow = Number((stock.currentPrice - step * 0.3).toFixed(1));
            const entryHigh = Number((stock.currentPrice + step * 0.3).toFixed(1));

            return (
              <div
                key={stock.symbol}
                className={`rounded-xl border p-4 space-y-3 transition-all shadow-md relative overflow-hidden flex flex-col justify-between ${
                  isCall
                    ? 'bg-slate-950/90 border-emerald-500/30 hover:border-emerald-500/60'
                    : isPut
                    ? 'bg-slate-950/90 border-rose-500/30 hover:border-rose-500/60'
                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-[10px] font-bold">#{idx + 1}</span>
                        <span className="font-extrabold text-white text-sm font-mono">{stock.symbol}</span>
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                          {stock.weightage}% Wt
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans truncate max-w-[150px] mt-0.5">
                        {stock.name}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {stock.sector} · Lot: <strong className="text-slate-200">{stock.lotSize}</strong>
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-white font-mono tabular-nums">
                        ₹{stock.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                      </div>
                      <div
                        className={`text-[11px] font-mono tabular-nums font-semibold flex items-center justify-end gap-0.5 ${
                          isStockUp ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isStockUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>{isStockUp ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Signal Box */}
                  <div
                    className={`p-3 rounded-xl border space-y-2 mt-2.5 ${
                      isCall
                        ? 'bg-emerald-950/30 border-emerald-500/40'
                        : isPut
                        ? 'bg-rose-950/30 border-rose-500/40'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-extrabold text-xs tracking-wide uppercase font-mono ${
                          isCall ? 'text-emerald-400' : isPut ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      >
                        {isCall ? '👉 🟢 CALL BUY (BUY CE)' : isPut ? '👉 🔴 PUT BUY (BUY PE)' : '👉 🟡 WAIT / RANGE'}
                      </span>
                      <span className="text-[10px] font-mono bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 border border-slate-800">
                        {stock.confidence || 80}% Conf
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block">CONTRACT</span>
                        <strong className="text-white text-xs">{recommendedContract}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">EST. PREMIUM</span>
                        <strong className="text-amber-300 text-xs">~₹{estPremium}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-mono border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block">ENTRY</span>
                        <span className="text-slate-200">₹{entryLow}–{entryHigh}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-slate-500 block">TARGET</span>
                        <span className="text-emerald-400 font-bold">₹{target1}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block">STOP LOSS</span>
                        <span className="text-rose-400 font-bold">₹{stopLoss}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      onExecuteStockPaperTrade({
                        symbol: stock.symbol,
                        stockName: stock.name,
                        strike: atmStrike,
                        optionType: isCall ? 'CE' : 'PE',
                        action: 'BUY',
                        premium: estPremium,
                        lotSize: stock.lotSize || 250,
                        lots: 1,
                        strategyName: `${stock.symbol} ${atmStrike} ${isCall ? 'CE' : 'PE'} Buy`,
                        stopLoss: Number((estPremium * 0.7).toFixed(1)),
                        target: Number((estPremium * 1.5).toFixed(1)),
                      });
                    }}
                    className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] font-mono transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Zap className="w-3 h-3 text-amber-300" />
                    <span>Practice Trade</span>
                  </button>

                  <button
                    onClick={() => onSelectStockForOptionChain(stock.symbol)}
                    className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-[11px] font-mono transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <BarChart3 className="w-3 h-3 text-blue-400" />
                    <span>Option Chain</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
