import React, { useState } from 'react';
import { OptionChainSummary, OptionStrikeRow } from '../types/market';
import { X, Search, Shield, Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface OptionChainModalProps {
  isOpen: boolean;
  onClose: () => void;
  optionChain: OptionChainSummary;
  spotPrice: number;
  onExecutePaperTrade?: (tradeData: {
    symbol: string;
    stockName: string;
    strike: number;
    optionType: 'CE' | 'PE';
    action: 'BUY' | 'SELL';
    premium: number;
    lotSize: number;
    lots: number;
    strategyName: string;
    stopLoss?: number;
    target?: number;
  }) => void;
}

export const OptionChainModal: React.FC<OptionChainModalProps> = ({
  isOpen,
  onClose,
  optionChain,
  spotPrice,
  onExecutePaperTrade,
}) => {
  const [selectedExpiry, setSelectedExpiry] = useState(optionChain.expiryDate);
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const handleTradeClick = (strike: number, optionType: 'CE' | 'PE', premium: number) => {
    if (onExecutePaperTrade) {
      onExecutePaperTrade({
        symbol: 'NIFTY',
        stockName: 'NIFTY 50 INDEX',
        strike,
        optionType,
        action: 'BUY',
        premium,
        lotSize: 25,
        lots: 1,
        strategyName: `NIFTY ${strike} ${optionType} (BUY)`,
        stopLoss: Number((premium * 0.70).toFixed(1)),
        target: Number((premium * 1.50).toFixed(1)),
      });
      onClose();
    }
  };

  const filteredStrikes = optionChain.strikes.filter(s =>
    searchFilter ? s.strikePrice.toString().includes(searchFilter) : true
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0e1424] border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white font-mono">NIFTY 50 Option Chain Intelligence</h2>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                SPOT: ₹{spotPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-1">
              <span>EXPIRY: <strong>{selectedExpiry}</strong></span>
              <span>·</span>
              <span>OI PCR: <strong className="text-emerald-400">{optionChain.oiPcr}</strong></span>
              <span>·</span>
              <span>MAX PAIN: <strong className="text-amber-400">₹{optionChain.maxPain}</strong></span>
              <span>·</span>
              <span>ATM IV: <strong>{optionChain.atmIv}%</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter strike..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 w-32 font-mono"
              />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* OI Walls & Insights Banner */}
        <div className="bg-slate-950/70 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Put Floor Support (Max Put OI): <strong className="text-emerald-400">₹{optionChain.majorPutSupport}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-400" />
            <span>Call Ceiling Resistance (Max Call OI): <strong className="text-rose-400">₹{optionChain.majorCallResistance}</strong></span>
          </div>
          <div className="text-slate-400 text-[11px]">
            *Shaded green = Call ITM · Shaded rose = Put ITM · Yellow = ATM
          </div>
        </div>

        {/* Option Chain Table */}
        <div className="overflow-x-auto overflow-y-auto flex-1 font-mono text-xs">
          <table className="w-full text-right border-collapse">
            <thead className="sticky top-0 bg-[#090d16] text-[11px] text-slate-400 border-b border-slate-800 shadow-sm z-10">
              <tr>
                {/* Calls Header */}
                <th className="py-2.5 px-3 text-left font-semibold text-emerald-400" colSpan={5}>
                  CALLS (CE)
                </th>
                {/* Strike Center */}
                <th className="py-2.5 px-4 text-center font-bold text-white bg-slate-900 border-x border-slate-800">
                  STRIKE
                </th>
                {/* Puts Header */}
                <th className="py-2.5 px-3 text-right font-semibold text-rose-400" colSpan={5}>
                  PUTS (PE)
                </th>
              </tr>
              <tr className="border-b border-slate-800 text-slate-500 text-[10px]">
                <th className="py-2 px-2 text-left">OI (Chg)</th>
                <th className="py-2 px-2">Volume</th>
                <th className="py-2 px-2">IV</th>
                <th className="py-2 px-2">LTP</th>
                <th className="py-2 px-2">Buildup</th>
                <th className="py-2 px-4 text-center bg-slate-900 border-x border-slate-800 text-white font-bold">STRIKE</th>
                <th className="py-2 px-2 text-left">Buildup</th>
                <th className="py-2 px-2">LTP</th>
                <th className="py-2 px-2">IV</th>
                <th className="py-2 px-2">Volume</th>
                <th className="py-2 px-2 text-right">OI (Chg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredStrikes.map((row) => {
                const isCallWall = row.strikePrice === optionChain.majorCallResistance;
                const isPutWall = row.strikePrice === optionChain.majorPutSupport;

                return (
                  <tr
                    key={row.strikePrice}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      row.isAtm ? 'bg-amber-500/10' : ''
                    }`}
                  >
                    {/* CALLS */}
                    <td className={`py-2 px-2 text-left tabular-nums ${row.isItmCall ? 'bg-emerald-950/20' : ''}`}>
                      <div className="font-semibold text-slate-200">
                        {(row.call.oi / 100000).toFixed(2)}L
                        {isCallWall && <span className="ml-1 text-[9px] text-amber-400 font-bold">WALL</span>}
                      </div>
                      <div className={`text-[10px] ${row.call.changeOi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {row.call.changeOi >= 0 ? '+' : ''}{(row.call.changeOi / 100000).toFixed(2)}L
                      </div>
                    </td>
                    <td className={`py-2 px-2 tabular-nums text-slate-400 ${row.isItmCall ? 'bg-emerald-950/20' : ''}`}>
                      {(row.call.volume / 1000).toFixed(0)}k
                    </td>
                    <td className={`py-2 px-2 tabular-nums text-slate-400 ${row.isItmCall ? 'bg-emerald-950/20' : ''}`}>
                      {row.call.iv}%
                    </td>
                    <td className={`py-2 px-2 tabular-nums font-bold text-white ${row.isItmCall ? 'bg-emerald-950/20 text-emerald-300' : ''}`}>
                      <button
                        onClick={() => handleTradeClick(row.strikePrice, 'CE', row.call.ltp)}
                        title={`Click to Paper Trade: Buy NIFTY ${row.strikePrice} CE @ ₹${row.call.ltp.toFixed(2)}`}
                        className="group/btn flex items-center justify-end gap-1 w-full hover:bg-emerald-500/20 px-1.5 py-0.5 rounded transition-colors text-right cursor-pointer"
                      >
                        <span className="text-[9px] opacity-0 group-hover/btn:opacity-100 text-emerald-400 font-sans font-normal transition-opacity">BUY</span>
                        <span>₹{row.call.ltp.toFixed(2)}</span>
                      </button>
                    </td>
                    <td className={`py-2 px-2 text-[10px] ${row.isItmCall ? 'bg-emerald-950/20' : ''}`}>
                      <span className={row.call.buildup === 'SHORT_BUILDUP' ? 'text-rose-400' : 'text-emerald-400'}>
                        {row.call.buildup === 'SHORT_BUILDUP' ? 'Writing' : 'Covering'}
                      </span>
                    </td>

                    {/* STRIKE PRICE CENTER */}
                    <td className={`py-2 px-4 text-center font-bold font-mono text-sm border-x border-slate-800 bg-slate-900 ${
                      row.isAtm ? 'text-amber-400' : 'text-white'
                    }`}>
                      <div className="flex items-center justify-center gap-1">
                        <span>{row.strikePrice % 1 === 0 ? row.strikePrice : row.strikePrice.toFixed(1)}</span>
                        {row.isAtm && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 rounded">ATM</span>}
                      </div>
                    </td>

                    {/* PUTS */}
                    <td className={`py-2 px-2 text-left text-[10px] ${row.isItmPut ? 'bg-rose-950/20' : ''}`}>
                      <span className={row.put.buildup === 'LONG_BUILDUP' ? 'text-emerald-400' : 'text-rose-400'}>
                        {row.put.buildup === 'LONG_BUILDUP' ? 'Writing' : 'Unwinding'}
                      </span>
                    </td>
                    <td className={`py-2 px-2 tabular-nums font-bold text-white ${row.isItmPut ? 'bg-rose-950/20 text-rose-300' : ''}`}>
                      <button
                        onClick={() => handleTradeClick(row.strikePrice, 'PE', row.put.ltp)}
                        title={`Click to Paper Trade: Buy NIFTY ${row.strikePrice} PE @ ₹${row.put.ltp.toFixed(2)}`}
                        className="group/btn flex items-center justify-start gap-1 w-full hover:bg-rose-500/20 px-1.5 py-0.5 rounded transition-colors text-left cursor-pointer"
                      >
                        <span>₹{row.put.ltp.toFixed(2)}</span>
                        <span className="text-[9px] opacity-0 group-hover/btn:opacity-100 text-rose-400 font-sans font-normal transition-opacity">BUY</span>
                      </button>
                    </td>
                    <td className={`py-2 px-2 tabular-nums text-slate-400 ${row.isItmPut ? 'bg-rose-950/20' : ''}`}>
                      {row.put.iv}%
                    </td>
                    <td className={`py-2 px-2 tabular-nums text-slate-400 ${row.isItmPut ? 'bg-rose-950/20' : ''}`}>
                      {(row.put.volume / 1000).toFixed(0)}k
                    </td>
                    <td className={`py-2 px-2 text-right tabular-nums ${row.isItmPut ? 'bg-rose-950/20' : ''}`}>
                      <div className="font-semibold text-slate-200">
                        {(row.put.oi / 100000).toFixed(2)}L
                        {isPutWall && <span className="ml-1 text-[9px] text-emerald-400 font-bold">WALL</span>}
                      </div>
                      <div className={`text-[10px] ${row.put.changeOi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {row.put.changeOi >= 0 ? '+' : ''}{(row.put.changeOi / 100000).toFixed(2)}L
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            Total Call OI: <strong className="text-slate-200">{(optionChain.totalCallOi / 100000).toFixed(2)}L</strong> · Total Put OI: <strong className="text-slate-200">{(optionChain.totalPutOi / 100000).toFixed(2)}L</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close Chain
          </button>
        </div>
      </div>
    </div>
  );
};
