import React, { useState, useMemo } from 'react';
import { StockConstituent } from '../types/market';
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface NiftyStocksSectionProps {
  stocks: StockConstituent[];
  onSelectStock: (stock: StockConstituent) => void;
  niftyTrend: string;
}

export const NiftyStocksSection: React.FC<NiftyStocksSectionProps> = ({
  stocks,
  onSelectStock,
  niftyTrend,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('confidence'); // 'confidence' | 'changeDesc' | 'changeAsc' | 'price' | 'volume' | 'symbol'

  // Extract unique sectors
  const sectors = useMemo(() => {
    const list = Array.from(new Set(stocks.map(s => s.sector.split(' / ')[0]))).sort();
    return ['ALL', ...list];
  }, [stocks]);

  // Filter and sort stocks
  const filteredStocks = useMemo(() => {
    return stocks
      .filter((stock) => {
        // Search query filter
        const matchesSearch =
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        // Sector filter
        if (selectedSector !== 'ALL' && !stock.sector.includes(selectedSector)) {
          return false;
        }

        // Signal / Trend filter
        if (selectedFilter === 'ALL') return true;
        if (selectedFilter === 'BUY CALL') return stock.signal === 'BUY CALL';
        if (selectedFilter === 'BUY PUT') return stock.signal === 'BUY PUT';
        if (selectedFilter === 'SELL CALL') return stock.signal === 'SELL CALL';
        if (selectedFilter === 'SELL PUT') return stock.signal === 'SELL PUT';
        if (selectedFilter === 'NO TRADE') return stock.signal === 'NO TRADE';
        if (selectedFilter === 'BULLISH') return stock.trend === 'BULLISH';
        if (selectedFilter === 'BEARISH') return stock.trend === 'BEARISH';
        if (selectedFilter === 'NEUTRAL') return stock.trend === 'SIDEWAYS';

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'confidence') return b.confidence - a.confidence;
        if (sortBy === 'changeDesc') return b.changePercent - a.changePercent;
        if (sortBy === 'changeAsc') return a.changePercent - b.changePercent;
        if (sortBy === 'price') return b.currentPrice - a.currentPrice;
        if (sortBy === 'volume') return b.volume - a.volume;
        if (sortBy === 'symbol') return a.symbol.localeCompare(b.symbol);
        return 0;
      });
  }, [stocks, searchQuery, selectedFilter, selectedSector, sortBy]);

  const getSignalBadge = (sig: string) => {
    switch (sig) {
      case 'BUY CALL':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold';
      case 'SELL PUT':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold';
      case 'BUY PUT':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-bold';
      case 'SELL CALL':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-bold';
      case 'NO TRADE':
      default:
        return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 font-mono text-xs">
      {/* 1. SECTION HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-bold text-white uppercase tracking-wide">
              NIFTY 50 STOCKS (F&O CONSTITUENTS)
            </h2>
            <span className="text-[11px] bg-slate-800 text-emerald-400 border border-slate-700 px-2 py-0.5 rounded font-semibold">
              50 STOCKS
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Select an individual NIFTY 50 stock to analyze its independent price action, F&O signal, and trade its option chain.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search stock symbol or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* 2. FILTER & SORT CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {['ALL', 'BUY CALL', 'BUY PUT', 'SELL CALL', 'SELL PUT', 'NO TRADE', 'BULLISH', 'BEARISH'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                selectedFilter === filter
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Sector and Sorting Dropdowns */}
        <div className="flex items-center gap-2">
          {/* Sector Filter */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 text-[11px] focus:outline-none"
          >
            {sectors.map((sec) => (
              <option key={sec} value={sec}>
                {sec === 'ALL' ? 'All Sectors' : sec}
              </option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 text-[11px] focus:outline-none"
          >
            <option value="confidence">Sort: AI Confidence ↓</option>
            <option value="changeDesc">Sort: Change % (High to Low)</option>
            <option value="changeAsc">Sort: Change % (Low to High)</option>
            <option value="price">Sort: Price (High to Low)</option>
            <option value="volume">Sort: Volume ↓</option>
            <option value="symbol">Sort: Symbol (A–Z)</option>
          </select>
        </div>
      </div>

      {/* 3. STOCK CONSTITUENTS TABLE */}
      <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#090d16] text-[10px] text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">STOCK / SYMBOL</th>
              <th className="py-2.5 px-3">SECTOR</th>
              <th className="py-2.5 px-3 text-right">LTP (₹)</th>
              <th className="py-2.5 px-3 text-right">CHANGE</th>
              <th className="py-2.5 px-3 text-right">VWAP</th>
              <th className="py-2.5 px-3 text-center">TREND</th>
              <th className="py-2.5 px-3 text-center">LOT SIZE</th>
              <th className="py-2.5 px-3 text-center">F&O AI SIGNAL</th>
              <th className="py-2.5 px-3 text-center">INDEX ALIGNMENT</th>
              <th className="py-2.5 px-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredStocks.map((stock) => {
              const isPos = stock.change >= 0;
              return (
                <tr
                  key={stock.symbol}
                  onClick={() => onSelectStock(stock)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  {/* Stock Symbol & Name */}
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                      <span>{stock.symbol}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-sans truncate max-w-[160px]">
                      {stock.name}
                    </div>
                  </td>

                  {/* Sector */}
                  <td className="py-2.5 px-3 text-[11px] text-slate-400">
                    {stock.sector.split(' / ')[0]}
                  </td>

                  {/* LTP */}
                  <td className="py-2.5 px-3 text-right tabular-nums font-bold text-white">
                    ₹{stock.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Change % */}
                  <td className={`py-2.5 px-3 text-right tabular-nums font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </td>

                  {/* VWAP */}
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-300 text-[11px]">
                    ₹{stock.vwap.toLocaleString('en-IN')}
                  </td>

                  {/* Trend */}
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[11px] font-semibold ${
                      stock.trend === 'BULLISH' ? 'text-emerald-400' :
                      stock.trend === 'BEARISH' ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {stock.trend}
                    </span>
                  </td>

                  {/* Lot Size */}
                  <td className="py-2.5 px-3 text-center tabular-nums text-slate-400 text-[11px]">
                    {stock.lotSize}
                  </td>

                  {/* F&O AI Signal */}
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] border ${getSignalBadge(stock.signal)}`}>
                      {stock.signal} <span className="opacity-80">({stock.confidence}%)</span>
                    </span>
                  </td>

                  {/* Index Alignment */}
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] ${
                      stock.niftyAlignment === 'STRONG_ALIGNMENT' ? 'text-emerald-400 font-semibold' :
                      stock.niftyAlignment === 'CONFLICTING' ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {stock.niftyAlignment.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStock(stock);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>F&O</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-slate-500 font-sans flex items-center justify-between">
        <span>Showing {filteredStocks.length} of {stocks.length} NIFTY 50 constituents</span>
        <span>Auto-refreshed every 5 minutes with synchronized options data</span>
      </div>
    </div>
  );
};
