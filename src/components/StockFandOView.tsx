import React, { useState } from 'react';
import { StockConstituent, OptionChainSummary, OptionStrikeRow, SignalType, TradeStrategy } from '../types/market';
import { generateStockOptionChain } from '../data/nifty50Stocks';
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface StockFandOViewProps {
  stock: StockConstituent;
  niftyTrend: string;
  onClose: () => void;
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
  }) => void;
}

export const StockFandOView: React.FC<StockFandOViewProps> = ({
  stock,
  niftyTrend,
  onClose,
  onExecuteStockPaperTrade,
}) => {
  const [strikeRange, setStrikeRange] = useState<number>(11); // 5, 9, 15, or 21
  const [selectedStrikeRow, setSelectedStrikeRow] = useState<OptionStrikeRow | null>(null);
  const [selectedOptionType, setSelectedOptionType] = useState<'CE' | 'PE'>('CE');
  const [selectedAction, setSelectedAction] = useState<'BUY' | 'SELL'>('BUY');
  const [orderLots, setOrderLots] = useState<number>(1);

  const optionChain = generateStockOptionChain(stock, strikeRange);
  const isPos = stock.change >= 0;

  // Set default selected strike to ATM on mount or update
  const atmRow = optionChain.strikes.find(s => s.isAtm) || optionChain.strikes[Math.floor(optionChain.strikes.length / 2)];
  const activeStrike = selectedStrikeRow || atmRow;

  const handleSelectOption = (row: OptionStrikeRow, type: 'CE' | 'PE', action: 'BUY' | 'SELL') => {
    setSelectedStrikeRow(row);
    setSelectedOptionType(type);
    setSelectedAction(action);
  };

  const handleConfirmTrade = () => {
    if (!activeStrike) return;
    const contract = selectedOptionType === 'CE' ? activeStrike.call : activeStrike.put;
    const strategyName = `${stock.symbol} ${activeStrike.strikePrice} ${selectedOptionType} (${selectedAction})`;

    onExecuteStockPaperTrade({
      symbol: stock.symbol,
      stockName: stock.name,
      strike: activeStrike.strikePrice,
      optionType: selectedOptionType,
      action: selectedAction,
      premium: contract.ltp,
      lotSize: stock.lotSize,
      lots: orderLots,
      strategyName,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in font-mono text-xs">
      <div className="bg-[#0e1424] border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* 1. STOCK F&O HEADER PANEL */}
        <div className="p-4 md:p-5 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl md:text-2xl font-bold text-white tracking-tight">{stock.symbol}</span>
              <span className="text-xs text-slate-400 font-sans hidden sm:inline">{stock.name}</span>
              <span className="text-[11px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                {stock.sector}
              </span>
              <span className="text-[11px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                LOT: {stock.lotSize}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs mt-1.5">
              <span className="text-xl font-bold text-white tabular-nums">
                ₹{stock.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className={`font-bold tabular-nums ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPos ? '+' : ''}{stock.change.toFixed(2)} ({isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">VWAP: ₹{stock.vwap.toLocaleString('en-IN')}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">DAY: ₹{stock.dayLow} – ₹{stock.dayHigh}</span>
            </div>
          </div>

          {/* Right: AI Signal & Close Button */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  stock.signal.includes('BUY') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  stock.signal.includes('SELL') ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  F&O SIGNAL: {stock.signal}
                </span>
                <span className="text-emerald-400 font-bold tabular-nums">{stock.confidence}%</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                INDEX CONTEXT: <strong className={stock.niftyAlignment === 'STRONG_ALIGNMENT' ? 'text-emerald-400' : 'text-amber-400'}>{stock.niftyAlignment.replace('_', ' ')}</strong>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. OPTION CHAIN CONTROLS & FLATTRADE STYLE HEADER */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              FLATTRADE-STYLE OPTION CHAIN
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">EXPIRY: <strong className="text-white">{optionChain.expiryDate}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">STRIKE RANGE:</span>
            {[7, 11, 15, 21].map((range) => (
              <button
                key={range}
                onClick={() => setStrikeRange(range)}
                className={`px-2.5 py-0.5 rounded text-[11px] cursor-pointer ${
                  strikeRange === range
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {range === 7 ? '5' : range === 11 ? '10' : range === 15 ? '15' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* 3. FLATTRADE-STYLE OPTION CHAIN TABLE */}
        <div className="overflow-x-auto overflow-y-auto flex-1 font-mono text-xs">
          <table className="w-full text-center border-collapse">
            <thead className="sticky top-0 bg-[#090d16] text-[10px] text-slate-400 border-b border-slate-800 z-10">
              <tr>
                <th colSpan={4} className="py-2 px-3 text-left font-bold text-emerald-400 border-r border-slate-800 bg-emerald-950/20">
                  CALL (CE)
                </th>
                <th className="py-2 px-4 text-center font-bold text-white bg-slate-900">
                  STRIKE
                </th>
                <th colSpan={4} className="py-2 px-3 text-right font-bold text-rose-400 border-l border-slate-800 bg-rose-950/20">
                  PUT (PE)
                </th>
              </tr>
              <tr className="border-b border-slate-800 text-slate-500 text-[10px]">
                <th className="py-2 px-2 text-left">ACTION</th>
                <th className="py-2 px-2 text-left">OI (Lakhs)</th>
                <th className="py-2 px-2">IV</th>
                <th className="py-2 px-3 text-right font-bold text-slate-300 border-r border-slate-800">CALL LTP</th>
                <th className="py-2 px-4 text-center bg-slate-900 font-bold text-white">STRIKE</th>
                <th className="py-2 px-3 text-left font-bold text-slate-300 border-l border-slate-800">PUT LTP</th>
                <th className="py-2 px-2">IV</th>
                <th className="py-2 px-2 text-right">OI (Lakhs)</th>
                <th className="py-2 px-2 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {optionChain.strikes.map((row) => {
                const isAtm = row.isAtm;
                const isSelected = activeStrike?.strikePrice === row.strikePrice;

                return (
                  <tr
                    key={row.strikePrice}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-emerald-950/30 border-l-2 border-emerald-400' : isAtm ? 'bg-amber-500/10' : ''
                    }`}
                  >
                    {/* CALL BUY / SELL ACTION BUTTONS */}
                    <td className="py-2 px-2 text-left whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSelectOption(row, 'CE', 'BUY')}
                          className="px-1.5 py-0.5 bg-emerald-600/30 hover:bg-emerald-500 text-emerald-300 hover:text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          BUY
                        </button>
                        <button
                          onClick={() => handleSelectOption(row, 'CE', 'SELL')}
                          className="px-1.5 py-0.5 bg-rose-600/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          SELL
                        </button>
                      </div>
                    </td>

                    {/* CALL OI */}
                    <td className="py-2 px-2 text-left tabular-nums">
                      <span className="font-semibold text-slate-200">{(row.call.oi / 100000).toFixed(2)}L</span>
                      <span className={`text-[9px] block ${row.call.changeOi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {row.call.changeOi >= 0 ? '+' : ''}{(row.call.changeOi / 1000).toFixed(0)}k
                      </span>
                    </td>

                    {/* CALL IV */}
                    <td className="py-2 px-2 tabular-nums text-slate-400 text-[11px]">
                      {row.call.iv}%
                    </td>

                    {/* CALL LTP */}
                    <td className={`py-2 px-3 text-right tabular-nums font-bold text-sm border-r border-slate-800 ${
                      row.isItmCall ? 'bg-emerald-950/20 text-emerald-300' : 'text-white'
                    }`}>
                      ₹{row.call.ltp}
                    </td>

                    {/* CENTER STRIKE (FLATTRADE STYLE) */}
                    <td className={`py-2 px-4 text-center font-bold font-mono text-sm bg-slate-900 ${
                      isAtm ? 'text-amber-400 bg-amber-500/20' : 'text-white'
                    }`}>
                      <div className="flex items-center justify-center gap-1">
                        <span>{row.strikePrice}</span>
                        {isAtm && <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1 rounded">ATM</span>}
                      </div>
                    </td>

                    {/* PUT LTP */}
                    <td className={`py-2 px-3 text-left tabular-nums font-bold text-sm border-l border-slate-800 ${
                      row.isItmPut ? 'bg-rose-950/20 text-rose-300' : 'text-white'
                    }`}>
                      ₹{row.put.ltp}
                    </td>

                    {/* PUT IV */}
                    <td className="py-2 px-2 tabular-nums text-slate-400 text-[11px]">
                      {row.put.iv}%
                    </td>

                    {/* PUT OI */}
                    <td className="py-2 px-2 text-right tabular-nums">
                      <span className="font-semibold text-slate-200">{(row.put.oi / 100000).toFixed(2)}L</span>
                      <span className={`text-[9px] block ${row.put.changeOi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {row.put.changeOi >= 0 ? '+' : ''}{(row.put.changeOi / 1000).toFixed(0)}k
                      </span>
                    </td>

                    {/* PUT BUY / SELL ACTION BUTTONS */}
                    <td className="py-2 px-2 text-right whitespace-nowrap">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => handleSelectOption(row, 'PE', 'BUY')}
                          className="px-1.5 py-0.5 bg-emerald-600/30 hover:bg-emerald-500 text-emerald-300 hover:text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          BUY
                        </button>
                        <button
                          onClick={() => handleSelectOption(row, 'PE', 'SELL')}
                          className="px-1.5 py-0.5 bg-rose-600/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          SELL
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. SELECTED OPTION CONTRACT AI ANALYSIS & PAPER TRADE FOOTER */}
        {activeStrike && (
          <div className="p-4 border-t border-slate-800 bg-[#090d16] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-sm">
                  {stock.symbol} {activeStrike.strikePrice} {selectedOptionType} ({selectedAction})
                </span>
                <span className="text-slate-400">· LTP: <strong className="text-white">₹{selectedOptionType === 'CE' ? activeStrike.call.ltp : activeStrike.put.ltp}</strong></span>
                <span className="text-slate-400">· Lot Size: <strong className="text-white">{stock.lotSize}</strong></span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                <strong>Option Rationale:</strong> Underlying {stock.symbol} is trading {stock.trend.toLowerCase()} at ₹{stock.currentPrice}. {selectedOptionType === 'CE' ? 'Call option delta captures upside momentum.' : 'Put option delta positions for breakdown continuation.'}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Lots:</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={orderLots}
                  onChange={(e) => setOrderLots(Number(e.target.value))}
                  className="w-14 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-center"
                />
              </div>

              <button
                onClick={handleConfirmTrade}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors cursor-pointer uppercase shadow whitespace-nowrap"
              >
                <span>Execute in Paper Trade</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
