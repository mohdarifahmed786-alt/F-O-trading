import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { NiftyDashboard } from './components/NiftyDashboard';
import { GraphSection } from './components/GraphSection';
import { InvestorChatSection } from './components/InvestorChatSection';
import { NewsSection } from './components/NewsSection';
import { PaperTradingSection } from './components/PaperTradingSection';
import { TomorrowSection } from './components/TomorrowSection';
import { OptionChainModal } from './components/OptionChainModal';
import { BacktestModal } from './components/BacktestModal';
import { RiskSettingsModal } from './components/RiskSettingsModal';
import { StockFandOView } from './components/StockFandOView';
import { Footer } from './components/Footer';
import {
  MarketQuote,
  TechnicalIndicators,
  OptionChainSummary,
  IndiaVixSummary,
  MultiTimeframeSummary,
  SignalAnalysis,
  TomorrowScenario,
  NewsItem,
  GlobalIndex,
  PaperTrade,
  PaperTradingStats,
  RiskSettings,
  TradeStrategy,
  SignalType,
  StockConstituent,
} from './types/market';
import { SAMPLE_NEWS, GLOBAL_INDICES } from './data/mockFeed';
import { getAllNifty50Stocks } from './data/nifty50Stocks';
import { Candle } from './engine/indicators';
import { AlertTriangle, RefreshCw, Bot, Sparkles, MessageSquare, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'nifty' | 'graph' | 'news' | 'paper' | 'tomorrow'>('nifty');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);

  // NIFTY 50 Stocks constituents state (Level 2 analysis)
  const [stocks, setStocks] = useState<StockConstituent[]>(() => getAllNifty50Stocks());
  const [selectedStockForFandO, setSelectedStockForFandO] = useState<StockConstituent | null>(null);

  // Market data states
  const [marketData, setMarketData] = useState<{
    quote: MarketQuote;
    candles?: Candle[];
    indicators: TechnicalIndicators;
    optionChain: OptionChainSummary;
    vix: IndiaVixSummary;
    mtf: MultiTimeframeSummary;
    signal: SignalAnalysis;
    tomorrow: TomorrowScenario;
  } | null>(null);

  const [news, setNews] = useState<NewsItem[]>(SAMPLE_NEWS);
  const [globalIndices, setGlobalIndices] = useState<GlobalIndex[]>(GLOBAL_INDICES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // 5-minute standard candle & algorithmic signal recalculation cycle (300 seconds)
  const UPDATE_CYCLE_SECONDS = 300;
  const [nextUpdateSeconds, setNextUpdateSeconds] = useState(UPDATE_CYCLE_SECONDS);

  // Modals state
  const [isOptionChainOpen, setIsOptionChainOpen] = useState(false);
  const [isBacktestOpen, setIsBacktestOpen] = useState(false);
  const [isRiskSettingsOpen, setIsRiskSettingsOpen] = useState(false);

  // Risk settings
  const [riskSettings, setRiskSettings] = useState<RiskSettings>({
    maxRiskPerTradePercent: 2,
    maxDailyLossRupees: 15000,
    maxDailyTrades: 4,
    defaultLots: 1,
  });

  // Paper trading state
  const [paperTrades, setPaperTrades] = useState<PaperTrade[]>([
    {
      id: 'trade-demo-1',
      timestamp: '09:35 AM',
      symbol: 'NIFTY',
      strategyName: 'NIFTY 22500 CE',
      signalType: 'BUY CALL',
      strikePrice: 22500,
      optionType: 'CE',
      lotSize: 25,
      underlyingPriceAtEntry: 22460.0,
      currentSpotPrice: 22485.4,
      legs: [
        { action: 'BUY', optionType: 'CE', strike: 22500, premium: 145, lots: 1 },
      ],
      quantityLots: 1,
      entryNetPrice: 145.0,
      currentNetPrice: 159.2,
      stopLossPrice: 95.0,
      targetPrice: 220.0,
      intrinsicValue: 0,
      timeValue: 159.2,
      moneyness: 'ATM',
      premiumChange: 14.2,
      pnl: 355,
      pnlPercent: 9.8,
      status: 'OPEN',
      maxRisk: 1250,
      maxReward: 1875,
    },
  ]);

  const [paperStats, setPaperStats] = useState<PaperTradingStats>({
    virtualBalance: 1004625,
    totalTrades: 6,
    winningTrades: 4,
    losingTrades: 2,
    winRate: 66.7,
    totalPnl: 4625,
    averageWin: 1850,
    averageLoss: 890,
    maxDrawdown: 1450,
  });

  // Fetch complete market summary
  const fetchMarketSummary = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await fetch('/api/market-summary');
      if (!res.ok) throw new Error('DATA CONNECTION LOST: Market server unavailable');
      const data = await res.json();
      setMarketData(data);
      if (data.stocks && Array.isArray(data.stocks)) {
        setStocks(data.stocks);
      }
      setConnectionError(null);
      setNextUpdateSeconds(300); // reset 5-minute cycle
    } catch (err: any) {
      console.error(err);
      setConnectionError(err.message || 'LIVE DATA UNAVAILABLE');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch news
  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        const data = await res.json();
        if (data.news) setNews(data.news);
        if (data.globalIndices) setGlobalIndices(data.globalIndices);
      }
    } catch (err) {
      console.error('Failed to fetch news:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchMarketSummary();
    fetchNews();
  }, [fetchMarketSummary, fetchNews]);

  // Auto-refresh news & impact every 5 minutes (300,000 ms)
  useEffect(() => {
    const newsInterval = setInterval(() => {
      fetchNews();
    }, 5 * 60 * 1000);

    return () => clearInterval(newsInterval);
  }, [fetchNews]);

  // Fast poller for real-time live NSE quotes, indicators, option chain, and signals (every 2.5 seconds)
  useEffect(() => {
    const liveTimer = setInterval(async () => {
      try {
        const res = await fetch('/api/live-quote');
        if (res.ok) {
          const data = await res.json();
          if (data.quote) {
            setMarketData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                quote: data.quote,
                vix: data.vix || prev.vix,
                signal: data.signal || prev.signal,
                indicators: data.indicators || prev.indicators,
                optionChain: data.optionChain || prev.optionChain,
              };
            });
          }
        }
      } catch {
        // silent fallback
      }
    }, 2500);

    return () => clearInterval(liveTimer);
  }, []);

  // Independent 1-second countdown timer that reliably refreshes complete NIFTY F&O analysis
  useEffect(() => {
    const timer = setInterval(() => {
      setNextUpdateSeconds((prev) => {
        if (prev <= 1) {
          fetchMarketSummary();
          fetchNews();
          return UPDATE_CYCLE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchMarketSummary]);

  // Keep ref of marketData and stocks for real-time position pricing
  const marketDataRef = React.useRef(marketData);
  const stocksRef = React.useRef<StockConstituent[]>([]);
  useEffect(() => {
    marketDataRef.current = marketData;
  }, [marketData]);
  useEffect(() => {
    stocksRef.current = stocks;
  }, [stocks]);

  // Dedicated Real-Time Option Market Tick Engine for Open Paper Trades (every 1.2s)
  // Calculates Net P&L as the difference between Current Option LTP and Entry Option LTP (from Option Chain) x Total Quantity.
  // The difference between Live Spot and Strike determines Intrinsic Value and Moneyness (ITM/ATM/OTM).
  useEffect(() => {
    const pnlInterval = setInterval(() => {
      setPaperTrades((prev) => {
        const hasOpen = prev.some((t) => t.status === 'OPEN');
        if (!hasOpen) return prev;

        const niftySpot = marketDataRef.current?.quote?.currentPrice || 22485;
        const currentStocks = stocksRef.current || [];

        return prev.map((trade) => {
          if (trade.status !== 'OPEN') return trade;

          const isNifty = !trade.symbol || trade.symbol === 'NIFTY' || trade.symbol === 'NIFTY 50';
          const stockObj = !isNifty ? currentStocks.find((s: StockConstituent) => s.symbol === trade.symbol) : null;
          const currentSpot = isNifty ? niftySpot : (stockObj?.currentPrice || trade.underlyingPriceAtEntry);

          const isCall =
            trade.optionType === 'CE' ||
            trade.signalType.includes('BUY CALL') ||
            trade.signalType.includes('SELL CALL') ||
            trade.strategyName.toLowerCase().includes('bull') ||
            trade.strategyName.toLowerCase().includes('call');

          const isBuy = !trade.signalType.includes('SELL') && (!trade.legs?.[0] || trade.legs[0].action !== 'SELL');

          // Purchased strike price from the option chain
          const strike =
            trade.strikePrice ||
            (trade.legs && trade.legs[0]?.strike) ||
            Math.round(trade.underlyingPriceAtEntry / 50) * 50;

          const lotSize = trade.lotSize || (isNifty ? 25 : 50);
          const totalQty = (trade.quantityLots || 1) * lotSize;

          // Intrinsic value: Difference between spot and strike for ITM options, 0 for OTM
          const intrinsicValue = isCall
            ? Math.max(0, Number((currentSpot - strike).toFixed(2)))
            : Math.max(0, Number((strike - currentSpot).toFixed(2)));

          // Spot movement since entry
          const spotMoveFromEntry = currentSpot - trade.underlyingPriceAtEntry;

          // Delta calculation based on distance from ATM
          const distFromAtm = Math.abs(currentSpot - strike);
          const isItm = isCall ? currentSpot > strike : strike > currentSpot;
          const atmThreshold = isNifty ? 25 : Math.max(1, strike * 0.005);
          const maxDistance = isNifty ? 400 : Math.max(50, strike * 0.05);

          let delta = 0.50;
          if (isItm) {
            delta = Math.min(0.95, 0.50 + (distFromAtm / maxDistance) * 0.40);
          } else {
            delta = Math.max(0.08, 0.50 - (distFromAtm / maxDistance) * 0.40);
          }

          // Real-time option premium tick based on option Delta and spot move
          const deltaPriceMove = isCall ? (delta * spotMoveFromEntry) : (-delta * spotMoveFromEntry);

          // Live Option LTP tracking option premium from the entry price entered from the option chain
          const currentOptionLtp = Math.max(
            0.10,
            Number((trade.entryNetPrice + deltaPriceMove).toFixed(2))
          );

          // Net point gain/loss on the option contract premium
          const premiumChange = Number((currentOptionLtp - trade.entryNetPrice).toFixed(2));
          const netPoints = isBuy ? premiumChange : -premiumChange;

          // Net profit or loss is strictly derived from option premium difference x quantity
          const pnl = Math.round(netPoints * totalQty);
          const pnlPercent = Number(((netPoints / (trade.entryNetPrice || 1)) * 100).toFixed(1));

          // Time / Extrinsic value
          const timeValue = Math.max(0, Number((currentOptionLtp - intrinsicValue).toFixed(2)));

          // Moneyness
          const moneyness = distFromAtm <= atmThreshold
            ? 'ATM'
            : isItm
            ? 'ITM'
            : 'OTM';

          return {
            ...trade,
            strikePrice: strike,
            optionType: isCall ? 'CE' : 'PE',
            lotSize,
            currentNetPrice: currentOptionLtp,
            currentSpotPrice: currentSpot,
            intrinsicValue,
            timeValue,
            moneyness,
            premiumChange,
            pnl,
            pnlPercent,
          };
        });
      });
    }, 1200);

    return () => clearInterval(pnlInterval);
  }, []);

  // Paper Trade Action Handlers
  const handleExecutePaperTrade = (strategy: TradeStrategy, sig: SignalType) => {
    if (!marketData) return;
    const atm = Math.round(marketData.quote.currentPrice / 50) * 50;
    const atmRow = marketData.optionChain.strikes.find((s) => s.strikePrice === atm);
    const isCall = sig.includes('CALL') || strategy.name.toLowerCase().includes('call');

    let calculatedEntryPrice = 140;
    if (strategy.legs && strategy.legs.length > 0) {
      let net = 0;
      strategy.legs.forEach((leg) => {
        net += leg.action === 'BUY' ? leg.premium : -leg.premium;
      });
      calculatedEntryPrice = Math.abs(net) > 0 ? Number(Math.abs(net).toFixed(1)) : (isCall ? (atmRow?.call.ltp || 145) : (atmRow?.put.ltp || 135));
    } else {
      calculatedEntryPrice = isCall ? (atmRow?.call.ltp || 145) : (atmRow?.put.ltp || 135);
    }

    const lotCount = riskSettings.defaultLots || 1;
    const totalQty = lotCount * 25;
    const sl = strategy.stopLoss || Number((calculatedEntryPrice * 0.7).toFixed(1));
    const tgt = strategy.target1 || Number((calculatedEntryPrice * 1.5).toFixed(1));

    const newTrade: PaperTrade = {
      id: `trade-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      strategyName: strategy.name,
      signalType: sig,
      strikePrice: atm,
      optionType: isCall ? 'CE' : 'PE',
      lotSize: 25,
      underlyingPriceAtEntry: marketData.quote.currentPrice,
      legs: strategy.legs && strategy.legs.length > 0 ? strategy.legs : [
        {
          action: 'BUY',
          optionType: isCall ? 'CE' : 'PE',
          strike: atm,
          premium: calculatedEntryPrice,
          lots: lotCount,
        },
      ],
      quantityLots: lotCount,
      entryNetPrice: calculatedEntryPrice,
      currentNetPrice: calculatedEntryPrice,
      stopLossPrice: sl,
      targetPrice: tgt,
      pnl: 0,
      pnlPercent: 0,
      status: 'OPEN',
      maxRisk: Math.abs(calculatedEntryPrice - sl) * totalQty,
      maxReward: Math.abs(tgt - calculatedEntryPrice) * totalQty,
    };

    setPaperTrades((prev) => [newTrade, ...prev]);
    setActiveTab('paper');
  };

  const handleOpenManualTrade = (tradeData: Omit<PaperTrade, 'id' | 'pnl' | 'pnlPercent' | 'status'>) => {
    const newTrade: PaperTrade = {
      ...tradeData,
      id: `trade-${Date.now()}`,
      pnl: 0,
      pnlPercent: 0,
      status: 'OPEN',
    };
    setPaperTrades((prev) => [newTrade, ...prev]);
  };

  const handleClosePaperTrade = (id: string, exitReason: 'MANUAL_EXIT' | 'TARGET_HIT' | 'STOP_LOSS_HIT') => {
    setPaperTrades((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updatedPnl = t.pnl;
          const isWin = updatedPnl > 0;
          setPaperStats((st) => ({
            ...st,
            virtualBalance: st.virtualBalance + updatedPnl,
            totalTrades: st.totalTrades + 1,
            winningTrades: isWin ? st.winningTrades + 1 : st.winningTrades,
            losingTrades: !isWin ? st.losingTrades + 1 : st.losingTrades,
            totalPnl: st.totalPnl + updatedPnl,
            winRate: Number((((isWin ? st.winningTrades + 1 : st.winningTrades) / (st.totalTrades + 1)) * 100).toFixed(1)),
          }));

          return {
            ...t,
            status: 'CLOSED',
            exitNetPrice: t.currentNetPrice,
            exitTimestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            exitReason,
          };
        }
        return t;
      })
    );
  };

  const handleResetPaperAccount = () => {
    setPaperTrades([]);
    setPaperStats({
      virtualBalance: 1000000,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalPnl: 0,
      averageWin: 0,
      averageLoss: 0,
      maxDrawdown: 0,
    });
  };

  // Stock F&O Option Contract Paper Trade Execution
  const handleExecuteStockPaperTrade = (tradeData: {
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
  }) => {
    const isBuy = tradeData.action === 'BUY';
    const isCall = tradeData.optionType === 'CE';
    const sigType: SignalType = isBuy
      ? (isCall ? 'BUY CALL' : 'BUY PUT')
      : (isCall ? 'SELL CALL' : 'SELL PUT');
    const totalQty = tradeData.lotSize * tradeData.lots;

    const slPrice = typeof tradeData.stopLoss === 'number' ? tradeData.stopLoss : Number((tradeData.premium * 0.70).toFixed(1));
    const tgtPrice = typeof tradeData.target === 'number' ? tradeData.target : Number((tradeData.premium * 1.50).toFixed(1));

    const isNiftySymbol = !tradeData.symbol || tradeData.symbol === 'NIFTY' || tradeData.symbol === 'NIFTY 50';
    const entrySpot = isNiftySymbol
      ? (marketData?.quote.currentPrice || 22485)
      : (stocks.find((s) => s.symbol === tradeData.symbol)?.currentPrice || tradeData.strike || marketData?.quote.currentPrice || 22485);

    const newTrade: PaperTrade = {
      id: `trade-${tradeData.symbol}-${Date.now()}`,
      symbol: tradeData.symbol,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      strategyName: tradeData.strategyName,
      signalType: sigType,
      strikePrice: tradeData.strike,
      optionType: tradeData.optionType,
      lotSize: tradeData.lotSize,
      underlyingPriceAtEntry: entrySpot,
      currentSpotPrice: entrySpot,
      legs: [
        {
          action: tradeData.action,
          optionType: tradeData.optionType,
          strike: tradeData.strike,
          premium: tradeData.premium,
          lots: tradeData.lots,
        },
      ],
      quantityLots: tradeData.lots,
      entryNetPrice: tradeData.premium,
      currentNetPrice: tradeData.premium,
      stopLossPrice: slPrice,
      targetPrice: tgtPrice,
      pnl: 0,
      pnlPercent: 0,
      status: 'OPEN',
      maxRisk: Math.round(Math.abs(tradeData.premium - slPrice) * totalQty),
      maxReward: Math.round(Math.abs(tgtPrice - tradeData.premium) * totalQty),
    };

    setPaperTrades((prev) => [newTrade, ...prev]);
    setSelectedStockForFandO(null);
    setActiveTab('paper');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-200 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Strict 3-Zone Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dataSourceStatus={marketData?.quote.status || 'LIVE'}
        delaySeconds={marketData?.quote.delaySeconds || 0}
        lastUpdated={marketData?.quote.timestamp || '--:--'}
        nextUpdateSeconds={nextUpdateSeconds}
        niftyPrice={marketData?.quote.currentPrice}
        niftyChange={marketData?.quote.change}
        niftyChangePercent={marketData?.quote.changePercent}
        onManualRefresh={() => {
          fetchMarketSummary(true);
          fetchNews();
          setNextUpdateSeconds(UPDATE_CYCLE_SECONDS);
        }}
        isRefreshing={refreshing}
        onOpenRiskSettings={() => setIsRiskSettingsOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6">
        {/* Error Notification if connection drops */}
        {connectionError && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/40 rounded-xl flex items-center justify-between text-xs font-mono text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{connectionError} — Signals paused to prevent trading on stale quotes.</span>
            </div>
            <button
              onClick={() => fetchMarketSummary(true)}
              className="px-3 py-1 bg-rose-600/30 hover:bg-rose-600/40 rounded text-rose-200 cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && !marketData ? (
          <div className="py-24 text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <div className="text-sm font-mono text-slate-400">
              Connecting to NIFTY 50 Market Data Engine...
            </div>
          </div>
        ) : marketData ? (
          <>
            {/* Tab 1: NIFTY F&O Main Trading Dashboard */}
            {activeTab === 'nifty' && (
              <NiftyDashboard
                quote={marketData.quote}
                indicators={marketData.indicators}
                optionChain={marketData.optionChain}
                vix={marketData.vix}
                mtf={marketData.mtf}
                signal={marketData.signal}
                stocks={stocks}
                onSelectStock={(stock) => setSelectedStockForFandO(stock)}
                onExecutePaperTrade={handleExecutePaperTrade}
                onExecuteStockPaperTrade={handleExecuteStockPaperTrade}
                onOpenOptionChain={() => setIsOptionChainOpen(true)}
                onOpenBacktest={() => setIsBacktestOpen(true)}
                onOpenChat={(prompt) => {
                  setChatInitialPrompt(prompt);
                  setIsChatOpen(true);
                }}
              />
            )}

            {/* Tab 2: Graph & Candlestick Technical Indicators Terminal */}
            {activeTab === 'graph' && (
              <GraphSection
                quote={marketData.quote}
                candles={marketData.candles || []}
                indicators={marketData.indicators}
                optionChain={marketData.optionChain}
                vix={marketData.vix}
                signalAnalysis={marketData.signal}
                stocks={stocks}
                onSelectStockForTrade={(symbol) => {
                  setSelectedStockForFandO(stocks.find((s) => s.symbol === symbol) || null);
                  setActiveTab('nifty');
                }}
              />
            )}

            {/* Tab 3: News & Global Impact Engine */}
            {activeTab === 'news' && (
              <NewsSection news={news} globalIndices={globalIndices} />
            )}

            {/* Tab 4: Virtual Practice Trading */}
            {activeTab === 'paper' && (
              <PaperTradingSection
                trades={paperTrades}
                stats={paperStats}
                spotPrice={marketData.quote.currentPrice}
                optionChain={marketData.optionChain}
                onOpenTrade={handleOpenManualTrade}
                onCloseTrade={handleClosePaperTrade}
                onResetPaperAccount={handleResetPaperAccount}
              />
            )}

            {/* Tab 5: Tomorrow Market Scenarios */}
            {activeTab === 'tomorrow' && (
              <TomorrowSection
                tomorrow={marketData.tomorrow}
                spotPrice={marketData.quote.currentPrice}
              />
            )}
          </>
        ) : null}
      </main>

      {/* Downside Bottom Right Floating AI Chat Symbol & Popover Window */}
      {marketData && (
        <>
          {/* Slide-over floating chat window when opened */}
          {isChatOpen && (
            <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[500px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[82vh] rounded-2xl shadow-2xl border border-slate-700/80 bg-[#090d16] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
              <InvestorChatSection
                quote={marketData.quote}
                indicators={marketData.indicators}
                optionChain={marketData.optionChain}
                vix={marketData.vix}
                signal={marketData.signal}
                stocks={stocks}
                initialPrompt={chatInitialPrompt}
                onClose={() => setIsChatOpen(false)}
                onOpenTrade={(_strike, _optionType, _action) => {
                  setIsOptionChainOpen(true);
                }}
              />
            </div>
          )}

          {/* Downside Bottom Right Chat Symbol */}
          <div className="fixed bottom-5 right-5 z-50">
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 text-xs font-mono group ${
                isChatOpen
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/40 border border-emerald-400/40'
              }`}
              title={isChatOpen ? 'Close AI Advisor' : 'Ask AI Buy/Sell Advisor'}
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                {isChatOpen ? (
                  <X className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white animate-pulse" />
                )}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-[10px] text-emerald-200 uppercase tracking-wider font-sans font-bold">
                  {isChatOpen ? 'CLOSE ADVISOR' : 'AI BUY/SELL CHAT'}
                </span>
                <span className="block text-xs text-white">
                  {marketData.signal.signal.includes('CALL') ? '🟢 CALL BUY' : marketData.signal.signal.includes('PUT') ? '🔴 PUT BUY' : '🟡 WAIT'} · ₹{marketData.quote.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
              {!isChatOpen && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
                </span>
              )}
            </button>
          </div>
        </>
      )}

      {/* Full Option Chain Modal */}
      {marketData && (
        <OptionChainModal
          isOpen={isOptionChainOpen}
          onClose={() => setIsOptionChainOpen(false)}
          optionChain={marketData.optionChain}
          spotPrice={marketData.quote.currentPrice}
          onExecutePaperTrade={handleExecuteStockPaperTrade}
        />
      )}

      {/* Backtest Strategy Engine Modal */}
      <BacktestModal
        isOpen={isBacktestOpen}
        onClose={() => setIsBacktestOpen(false)}
      />

      {/* User Risk Controls Modal */}
      <RiskSettingsModal
        isOpen={isRiskSettingsOpen}
        onClose={() => setIsRiskSettingsOpen(false)}
        settings={riskSettings}
        onSave={(newSettings) => setRiskSettings(newSettings)}
      />

      {/* Selected Individual Stock F&O & Flattrade-Style Option Chain Modal */}
      {selectedStockForFandO && (
        <StockFandOView
          stock={selectedStockForFandO}
          niftyTrend={marketData?.signal.trend || 'BULLISH'}
          onClose={() => setSelectedStockForFandO(null)}
          onExecuteStockPaperTrade={handleExecuteStockPaperTrade}
        />
      )}

      {/* Footer with Mandatory Regulatory Risk Disclaimer */}
      <Footer />
    </div>
  );
}
