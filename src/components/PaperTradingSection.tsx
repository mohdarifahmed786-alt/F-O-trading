import React, { useState, useEffect } from 'react';
import { PaperTrade, PaperTradingStats, SignalType, OptionChainSummary } from '../types/market';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  XCircle,
  History,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';

interface PaperTradingSectionProps {
  trades: PaperTrade[];
  stats: PaperTradingStats;
  spotPrice: number;
  optionChain?: OptionChainSummary;
  onOpenTrade: (trade: Omit<PaperTrade, 'id' | 'pnl' | 'pnlPercent' | 'status'>) => void;
  onCloseTrade: (id: string, exitReason: 'MANUAL_EXIT' | 'TARGET_HIT' | 'STOP_LOSS_HIT') => void;
  onResetPaperAccount: () => void;
}

export const PaperTradingSection: React.FC<PaperTradingSectionProps> = ({
  trades,
  stats,
  spotPrice,
  optionChain,
  onOpenTrade,
  onCloseTrade,
  onResetPaperAccount,
}) => {
  const atmStrike = Math.round(spotPrice / 50) * 50;
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('NIFTY ATM Option');
  const [signalType, setSignalType] = useState<SignalType>('BUY CALL');
  const [selectedStrike, setSelectedStrike] = useState<number>(atmStrike);
  const [optionType, setOptionType] = useState<'CE' | 'PE'>('CE');
  const [lots, setLots] = useState(1);
  const [entryPrice, setEntryPrice] = useState(145);
  const [stopLoss, setStopLoss] = useState(100);
  const [target, setTarget] = useState(215);

  // Sync entry price from option chain when strike or option type changes
  useEffect(() => {
    if (optionChain && optionChain.strikes.length > 0) {
      const row = optionChain.strikes.find((s) => s.strikePrice === selectedStrike);
      if (row) {
        const ltp = optionType === 'CE' ? row.call.ltp : row.put.ltp;
        setEntryPrice(Number(ltp.toFixed(2)));
        setStopLoss(Number((ltp * 0.70).toFixed(1)));
        setTarget(Number((ltp * 1.50).toFixed(1)));
      }
    }
  }, [selectedStrike, optionType, optionChain]);

  const openPositions = trades.filter((t) => t.status === 'OPEN');
  const closedPositions = trades.filter((t) => t.status === 'CLOSED');

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isCall = signalType.includes('CALL') || optionType === 'CE';
    const isBuy = !signalType.includes('SELL');
    const finalStrike = selectedStrike || atmStrike;

    const maxRisk = Math.abs(entryPrice - stopLoss) * lots * 25;
    const maxReward = Math.abs(target - entryPrice) * lots * 25;

    onOpenTrade({
      symbol: 'NIFTY',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      strategyName: `${selectedStrategy || 'NIFTY'} ${finalStrike} ${optionType}`,
      signalType,
      strikePrice: finalStrike,
      optionType,
      lotSize: 25,
      underlyingPriceAtEntry: spotPrice,
      currentSpotPrice: spotPrice,
      intrinsicValue: isCall ? Math.max(0, spotPrice - finalStrike) : Math.max(0, finalStrike - spotPrice),
      timeValue: Math.max(0, entryPrice - (isCall ? Math.max(0, spotPrice - finalStrike) : Math.max(0, finalStrike - spotPrice))),
      moneyness: Math.abs(spotPrice - finalStrike) <= 25 ? 'ATM' : (isCall ? spotPrice > finalStrike : finalStrike > spotPrice) ? 'ITM' : 'OTM',
      premiumChange: 0,
      legs: [
        {
          action: isBuy ? 'BUY' : 'SELL',
          optionType,
          strike: finalStrike,
          premium: entryPrice,
          lots,
        },
      ],
      quantityLots: lots,
      entryNetPrice: entryPrice,
      currentNetPrice: entryPrice,
      stopLossPrice: stopLoss,
      targetPrice: target,
      maxRisk,
      maxReward,
    });

    setShowOrderModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Disclaimer & Formula Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>VIRTUAL PAPER TRADING: Simulated environment for strategy practice. No real money or broker orders are placed.</span>
          </div>
          <button
            onClick={onResetPaperAccount}
            className="text-amber-400 hover:text-white underline text-[11px] cursor-pointer"
          >
            Reset Simulator
          </button>
        </div>

        {/* Precise Formula Clarification */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
              OPTION P&L FORMULA
            </span>
            <span className="text-slate-300">
              Net P&L = <strong>(Current Option LTP - Entry Option Price) × Total Quantity</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Live Spot vs Strike determines Option Intrinsic Value & Moneyness (ITM / ATM / OTM).</span>
          </div>
        </div>
      </div>

      {/* 1. PAPER TRADING PERFORMANCE SCOREBOARD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono text-xs">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl col-span-2">
          <span className="text-slate-500 block text-[11px]">VIRTUAL PORTFOLIO VALUE</span>
          <div className="text-xl font-bold text-white tabular-nums mt-0.5">
            ₹{stats.virtualBalance.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Starting: ₹10,00,000</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-slate-500 block text-[11px]">TOTAL TRADES</span>
          <div className="text-lg font-bold text-white tabular-nums mt-0.5">{stats.totalTrades}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-slate-500 block text-[11px]">WIN RATE</span>
          <div className="text-lg font-bold text-emerald-400 tabular-nums mt-0.5">{stats.winRate}%</div>
          <span className="text-[10px] text-slate-400">{stats.winningTrades}W / {stats.losingTrades}L</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl col-span-2">
          <span className="text-slate-500 block text-[11px]">REALIZED P&L</span>
          <div className={`text-lg font-bold tabular-nums mt-0.5 ${stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.totalPnl >= 0 ? '+' : ''}₹{stats.totalPnl.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-slate-500 block text-[11px]">AVG WIN / LOSS</span>
          <div className="text-xs font-semibold text-slate-200 tabular-nums mt-1">
            +₹{Math.round(stats.averageWin)} / -₹{Math.round(stats.averageLoss)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-slate-500 block text-[11px]">MAX DRAWDOWN</span>
          <div className="text-lg font-bold text-rose-400 tabular-nums mt-0.5">₹{stats.maxDrawdown.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* 2. ACTIVE OPEN POSITIONS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
              Active Open Positions ({openPositions.length})
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold ml-1">
              ⚡ LIVE PREMIUM TICKING
            </span>
          </div>

          <button
            onClick={() => setShowOrderModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Practice Order</span>
          </button>
        </div>

        {openPositions.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs font-mono">
            No active positions. Click on any Call/Put LTP in the Option Chain or click New Practice Order.
          </div>
        ) : (
          <div className="overflow-x-auto font-mono text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[11px]">
                  <th className="py-2.5 px-3">CONTRACT & STRIKE</th>
                  <th className="py-2.5 px-3">TYPE & SIDE</th>
                  <th className="py-2.5 px-3">ENTRY PRICE (OPTION CHAIN)</th>
                  <th className="py-2.5 px-3">CURRENT OPTION LTP</th>
                  <th className="py-2.5 px-3">UNDERLYING SPOT</th>
                  <th className="py-2.5 px-3">INTRINSIC & TIME VALUE</th>
                  <th className="py-2.5 px-3">SL / TARGET</th>
                  <th className="py-2.5 px-3">CURRENT NET P&L</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {openPositions.map((pos) => {
                  const isCall =
                    pos.optionType === 'CE' ||
                    pos.signalType.includes('BUY CALL') ||
                    pos.signalType.includes('SELL CALL') ||
                    pos.strategyName.toLowerCase().includes('call') ||
                    pos.strategyName.toLowerCase().includes('bull');

                  const isBuy = !pos.signalType.includes('SELL') && (!pos.legs?.[0] || pos.legs[0].action !== 'SELL');

                  const strike =
                    pos.strikePrice ||
                    (pos.legs && pos.legs[0]?.strike) ||
                    Math.round(pos.underlyingPriceAtEntry / 50) * 50;

                  const isNifty = !pos.symbol || pos.symbol === 'NIFTY' || pos.symbol === 'NIFTY 50';
                  const currentSpot = pos.currentSpotPrice || spotPrice;
                  const lotSize = pos.lotSize || (isNifty ? 25 : 50);
                  const totalQty = (pos.quantityLots || 1) * lotSize;

                  // Current option premium (live LTP)
                  const currentLtp = pos.currentNetPrice;
                  const entryLtp = pos.entryNetPrice;

                  // Premium difference
                  const premiumDiff = pos.premiumChange !== undefined
                    ? pos.premiumChange
                    : Number((currentLtp - entryLtp).toFixed(2));

                  const isProfit = pos.pnl >= 0;

                  // Spot movement since entry
                  const spotMove = currentSpot - pos.underlyingPriceAtEntry;

                  // Intrinsic value (Spot vs Strike difference for ITM options, 0 for OTM)
                  const intrinsic = pos.intrinsicValue !== undefined
                    ? pos.intrinsicValue
                    : (isCall ? Math.max(0, currentSpot - strike) : Math.max(0, strike - currentSpot));

                  // Time value (Extrinsic)
                  const timeVal = pos.timeValue !== undefined
                    ? pos.timeValue
                    : Math.max(0, currentLtp - intrinsic);

                  // Moneyness tag
                  const moneyness = pos.moneyness || (
                    Math.abs(currentSpot - strike) <= 25
                      ? 'ATM'
                      : (isCall ? currentSpot > strike : strike > currentSpot)
                      ? 'ITM'
                      : 'OTM'
                  );

                  return (
                    <tr key={pos.id} className="hover:bg-slate-800/30">
                      {/* Contract and Strike */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{pos.strategyName}</span>
                          <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-mono">
                            ₹{strike}
                          </span>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                            moneyness === 'ITM'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : moneyness === 'ATM'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {moneyness}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {pos.quantityLots} Lots ({totalQty} Qty) · {pos.timestamp}
                        </div>
                      </td>

                      {/* Option Type & Side */}
                      <td className="py-3 px-3">
                        <div className={`text-[11px] font-bold ${isCall ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isBuy ? 'BUY' : 'SELL'} {isCall ? 'CALL (CE)' : 'PUT (PE)'}
                        </div>
                        <span className="text-[9px] text-slate-500">
                          {pos.symbol || 'NIFTY'}
                        </span>
                      </td>

                      {/* Exact Entry Price directly from Option Chain */}
                      <td className="py-3 px-3 tabular-nums">
                        <div className="text-white font-bold text-xs">
                          ₹{Number(entryLtp).toFixed(2)}
                        </div>
                        <span className="text-[9px] text-slate-400">Purchased Option LTP</span>
                      </td>

                      {/* Live Option Premium (Current LTP) */}
                      <td className="py-3 px-3 tabular-nums">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          <span>₹{Number(currentLtp).toFixed(2)}</span>
                        </div>
                        <div className={`text-[10px] font-semibold ${premiumDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {premiumDiff >= 0 ? '+' : ''}{premiumDiff.toFixed(2)} pts ({pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent}%)
                        </div>
                      </td>

                      {/* Underlying Spot Price */}
                      <td className="py-3 px-3 tabular-nums text-slate-200">
                        <div className="flex items-center gap-1 font-semibold text-xs">
                          <span>₹{currentSpot.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                        </div>
                        <span className={`text-[9px] ${spotMove >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          Entry: ₹{pos.underlyingPriceAtEntry.toFixed(1)} ({spotMove >= 0 ? '+' : ''}{spotMove.toFixed(1)} pts)
                        </span>
                      </td>

                      {/* Intrinsic & Time Value Breakdown */}
                      <td className="py-3 px-3 tabular-nums">
                        <div className="text-[11px] text-slate-200">
                          Intrinsic: <span className="text-amber-300 font-semibold">₹{intrinsic.toFixed(1)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Extrinsic: ₹{timeVal.toFixed(1)}
                        </div>
                      </td>

                      {/* SL / Target */}
                      <td className="py-3 px-3 tabular-nums text-slate-400 text-[11px]">
                        SL: <span className="text-rose-400">₹{pos.stopLossPrice}</span> · TGT: <span className="text-emerald-400">₹{pos.targetPrice}</span>
                      </td>

                      {/* Net Profit or Loss (Derived directly from option premium difference) */}
                      <td className="py-3 px-3 tabular-nums font-bold">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs ${isProfit ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'}`}>
                          {isProfit ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {isProfit ? '+' : ''}₹{pos.pnl.toLocaleString('en-IN')}
                        </span>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {premiumDiff >= 0 ? '+' : ''}{premiumDiff.toFixed(1)} pts × {totalQty} Qty
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onCloseTrade(pos.id, 'MANUAL_EXIT')}
                          className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Square Off
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. CLOSED POSITIONS HISTORY */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
            Past Trade History ({closedPositions.length})
          </h3>
        </div>

        {closedPositions.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs font-mono">
            No closed trades recorded in this session.
          </div>
        ) : (
          <div className="overflow-x-auto font-mono text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[11px]">
                  <th className="py-2 px-3">STRATEGY</th>
                  <th className="py-2 px-3">ENTRY / EXIT OPTION LTP</th>
                  <th className="py-2 px-3">NET POINTS</th>
                  <th className="py-2 px-3">EXIT REASON</th>
                  <th className="py-2 px-3 text-right">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {closedPositions.map((t) => {
                  const isWin = t.pnl > 0;
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">{t.strategyName}</div>
                        <div className="text-[10px] text-slate-500">{t.signalType} · {t.quantityLots} Lots</div>
                      </td>
                      <td className="py-2.5 px-3 tabular-nums">
                        ₹{t.entryNetPrice} → ₹{t.exitNetPrice || t.currentNetPrice}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums font-semibold">
                        {isWin ? '+' : ''}{((t.exitNetPrice || t.currentNetPrice) - t.entryNetPrice).toFixed(1)} pts
                      </td>
                      <td className="py-2.5 px-3 text-[11px]">
                        <span className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                          {t.exitReason?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isWin ? '+' : ''}₹{t.pnl.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. NEW ORDER MODAL */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e1424] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide">
                  Place Virtual F&O Order
                </h3>
                <span className="text-[11px] text-slate-400">
                  Select strike to auto-fill exact price directly from the Option Chain
                </span>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-4">
              {/* Option Chain Strike Picker */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>SELECT STRIKE FROM OPTION CHAIN</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    SPOT: ₹{spotPrice.toFixed(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">STRIKE PRICE</label>
                    <select
                      value={selectedStrike}
                      onChange={(e) => setSelectedStrike(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                    >
                      {optionChain && optionChain.strikes.length > 0 ? (
                        optionChain.strikes.map((s) => (
                          <option key={s.strikePrice} value={s.strikePrice}>
                            ₹{s.strikePrice} {s.isAtm ? '(ATM)' : s.strikePrice < spotPrice ? '(ITM Call)' : '(OTM Call)'}
                          </option>
                        ))
                      ) : (
                        [-200, -150, -100, -50, 0, 50, 100, 150, 200].map((offset) => {
                          const stk = atmStrike + offset;
                          return (
                            <option key={stk} value={stk}>
                              ₹{stk} {offset === 0 ? '(ATM)' : ''}
                            </option>
                          );
                        })
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">OPTION TYPE (CE / PE)</label>
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setOptionType('CE');
                          setSignalType('BUY CALL');
                        }}
                        className={`py-2 px-2 rounded-lg font-bold text-center transition-colors cursor-pointer ${
                          optionType === 'CE'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        CALL (CE)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOptionType('PE');
                          setSignalType('BUY PUT');
                        }}
                        className={`py-2 px-2 rounded-lg font-bold text-center transition-colors cursor-pointer ${
                          optionType === 'PE'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        PUT (PE)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Direct Option Chain LTP indicator */}
                <div className="pt-1 flex items-center justify-between text-[11px] bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>LTP Direct from Option Chain:</span>
                  </span>
                  <span className="text-cyan-300 font-bold tabular-nums">
                    ₹{entryPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">STRATEGY NAME</label>
                  <select
                    value={selectedStrategy}
                    onChange={(e) => setSelectedStrategy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="NIFTY ATM Option">NIFTY Naked Option</option>
                    <option value="Bull Call Spread">Bull Call Spread</option>
                    <option value="Bear Put Spread">Bear Put Spread</option>
                    <option value="Long Momentum Option">Long Momentum Option</option>
                    <option value="VWAP Breakout Option">VWAP Breakout Option</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">LOTS (1 Lot = 25 Qty)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={lots}
                    onChange={(e) => setLots(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1 text-[11px]">NET ENTRY (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 text-[11px]">STOP LOSS (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 text-[11px]">TARGET (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] space-y-1 text-slate-400">
                <div className="flex justify-between">
                  <span>Max Simulated Risk:</span>
                  <span className="text-rose-400 font-bold">₹{(Math.abs(entryPrice - stopLoss) * lots * 25).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Potential Gain:</span>
                  <span className="text-emerald-400 font-bold">₹{(Math.abs(target - entryPrice) * lots * 25).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
              >
                Confirm Virtual Order @ ₹{entryPrice.toFixed(2)}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

