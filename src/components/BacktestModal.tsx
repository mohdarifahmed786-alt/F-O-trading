import React, { useState } from 'react';
import { BacktestResult } from '../types/market';
import { runBacktest, BacktestTrade } from '../engine/backtestEngine';
import { X, Play, RotateCcw, BarChart2, ShieldCheck } from 'lucide-react';

interface BacktestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BacktestModal: React.FC<BacktestModalProps> = ({ isOpen, onClose }) => {
  const [periodDays, setPeriodDays] = useState(60);
  const [slippage, setSlippage] = useState(1.5);
  const [brokerage, setBrokerage] = useState(20);
  const [isRunning, setIsRunning] = useState(false);
  const [backtestData, setBacktestData] = useState<{ summary: BacktestResult; trades: BacktestTrade[] }>(() =>
    runBacktest(60, 1.5, 20)
  );

  if (!isOpen) return null;

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      const result = runBacktest(periodDays, slippage, brokerage);
      setBacktestData(result);
      setIsRunning(false);
    }, 350);
  };

  const { summary, trades } = backtestData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0e1424] border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wide">
                NIFTY 50 F&O Strategy Backtesting Engine
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Walk-forward out-of-sample backtest incorporating real slippage and statutory transaction costs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="bg-slate-950/80 border-b border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-slate-500 block text-[10px] mb-1">SAMPLE PERIOD</label>
              <select
                value={periodDays}
                onChange={(e) => setPeriodDays(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
              >
                <option value={30}>30 Trading Days</option>
                <option value={60}>60 Trading Days</option>
                <option value={90}>90 Trading Days</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 block text-[10px] mb-1">SLIPPAGE (POINTS)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="5"
                value={slippage}
                onChange={(e) => setSlippage(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 w-24"
              />
            </div>

            <div>
              <label className="text-slate-500 block text-[10px] mb-1">BROKERAGE / ORDER (₹)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={brokerage}
                onChange={(e) => setBrokerage(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 w-24"
              />
            </div>
          </div>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Simulating...' : 'Run Simulation'}</span>
          </button>
        </div>

        {/* Results Metrics Grid */}
        <div className="p-5 overflow-y-auto space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">TOTAL TRADES</span>
              <span className="text-white font-bold text-base tabular-nums">{summary.totalTrades}</span>
              <span className="text-[10px] text-slate-400 block">{summary.winningTrades}W · {summary.losingTrades}L</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">WIN RATE</span>
              <span className="text-emerald-400 font-bold text-base tabular-nums">{summary.winRate}%</span>
              <span className="text-[10px] text-slate-400 block">Out-of-sample</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">PROFIT FACTOR</span>
              <span className="text-emerald-400 font-bold text-base tabular-nums">{summary.profitFactor}</span>
              <span className="text-[10px] text-slate-400 block">&gt; 1.5 is robust</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">TOTAL NET GAIN</span>
              <span className="text-emerald-400 font-bold text-base tabular-nums">+{summary.totalProfitPoints} pts</span>
              <span className="text-[10px] text-slate-400 block">~₹{(summary.totalProfitPoints * 25).toLocaleString('en-IN')}</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">MAX DRAWDOWN</span>
              <span className="text-rose-400 font-bold text-base tabular-nums">-{summary.maxDrawdownPoints} pts</span>
              <span className="text-[10px] text-slate-400 block">({summary.maxDrawdownPercent}%)</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">SHARPE RATIO</span>
              <span className="text-white font-bold text-base tabular-nums">{summary.sharpeRatio}</span>
              <span className="text-[10px] text-slate-400 block">Annualized</span>
            </div>
          </div>

          {/* Trade Log */}
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold text-slate-200">HISTORICAL TRADES LOG ({trades.length})</span>
              <span>Lot Size: 25 Qty</span>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-900 text-slate-400 text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">PERIOD</th>
                    <th className="py-2 px-3">STRATEGY</th>
                    <th className="py-2 px-3">ENTRY / EXIT</th>
                    <th className="py-2 px-3">POINTS (NET)</th>
                    <th className="py-2 px-3">P&L (₹)</th>
                    <th className="py-2 px-3 text-right">OUTCOME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                  {trades.slice(0, 30).map((t) => (
                    <tr key={t.tradeNumber} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 tabular-nums text-slate-500">{t.tradeNumber}</td>
                      <td className="py-2 px-3">{t.entryDate}</td>
                      <td className="py-2 px-3 font-semibold text-white">{t.strategy}</td>
                      <td className="py-2 px-3 tabular-nums">₹{t.entryPrice} → ₹{t.exitPrice}</td>
                      <td className={`py-2 px-3 tabular-nums font-bold ${t.pointsNet > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.pointsNet > 0 ? '+' : ''}{t.pointsNet}
                      </td>
                      <td className={`py-2 px-3 tabular-nums font-bold ${t.pnlRupees > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.pnlRupees > 0 ? '+' : ''}₹{t.pnlRupees.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.outcome === 'WIN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {t.outcome}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
