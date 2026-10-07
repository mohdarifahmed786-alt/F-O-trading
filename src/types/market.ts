export type MarketTrend = 'BULLISH' | 'BEARISH' | 'SIDEWAYS' | 'UNCERTAIN';

export type MarketRegime =
  | 'TRENDING'
  | 'RANGE-BOUND'
  | 'HIGH-VOLATILITY'
  | 'LOW-VOLATILITY'
  | 'BREAKOUT'
  | 'UNCERTAIN';

export type SignalType = 'BUY CALL' | 'SELL CALL' | 'BUY PUT' | 'SELL PUT' | 'NO TRADE';

export type SignalStatus = 'ACTIVE' | 'PENDING_CONFIRMATION' | 'WAIT';

export type DataSourceStatus = 'LIVE' | 'DELAYED' | 'SIMULATED' | 'MARKET CLOSED';

export interface MarketQuote {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  volume: number;
  vwap: number;
  timestamp: string;
  status: DataSourceStatus;
  delaySeconds: number;
  isMarketOpen: boolean;
  nextUpdateInSeconds: number;
}

export interface TechnicalIndicators {
  vwap: {
    value: number;
    relation: 'ABOVE' | 'BELOW' | 'AT';
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    breakout: boolean;
  };
  rsi14: {
    value: number;
    condition: 'OVERBOUGHT' | 'BULLISH_MOMENTUM' | 'NEUTRAL' | 'BEARISH_MOMENTUM' | 'OVERSOLD';
    divergence: 'BULLISH' | 'BEARISH' | 'NONE';
  };
  emas: {
    ema9: number;
    ema20: number;
    ema50: number;
    ema100: number;
    ema200: number;
    alignment: 'BULLISH' | 'BEARISH' | 'MIXED';
    crossover: 'GOLDEN_CROSS' | 'DEATH_CROSS' | 'NONE';
    priceVsEma: 'ABOVE_ALL' | 'BELOW_ALL' | 'BETWEEN';
  };
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    state: 'EXPANSION' | 'CONTRACTION' | 'NORMAL';
    position: 'UPPER_BAND' | 'MIDDLE' | 'LOWER_BAND';
  };
  atr14: {
    value: number;
    volatilityState: 'LOW' | 'NORMAL' | 'HIGH';
  };
  adx14: {
    value: number;
    trendStrength: 'STRONG' | 'MODERATE' | 'WEAK';
    marketType: 'TRENDING' | 'SIDEWAYS';
  };
  supertrend: {
    value: number;
    direction: 'BULLISH' | 'BEARISH';
  };
  volume: {
    current: number;
    avgVolume: number;
    spike: boolean;
    status: 'EXPANDING' | 'CONTRACTING' | 'NORMAL';
  };
  fibonacci: {
    high: number;
    low: number;
    level236: number;
    level382: number;
    level500: number;
    level618: number;
    level786: number;
  };
  priceAction: {
    structure: 'HIGHER_HIGHS_HIGHER_LOWS' | 'LOWER_HIGHS_LOWER_LOWS' | 'SIDEWAYS';
    supportLevels: number[];
    resistanceLevels: number[];
    breakout: 'BULLISH_BREAKOUT' | 'BEARISH_BREAKDOWN' | 'NONE';
    retestDetected: boolean;
    gapType: 'GAP_UP' | 'GAP_DOWN' | 'FLAT';
    openingRange: {
      high: number;
      low: number;
      breakout: 'UP' | 'DOWN' | 'INSIDE';
    };
    pdh: number;
    pdl: number;
    pdc: number;
  };
}

export type TimeframeId = '5m' | '15m' | '30m' | '1h' | 'daily';

export interface TimeframeAnalysis {
  timeframe: TimeframeId;
  label: string;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  rsi: number;
  emaTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  macdSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number; // -100 to +100
}

export interface MultiTimeframeSummary {
  timeframes: Record<TimeframeId, TimeframeAnalysis>;
  overallTrend: 'STRONG BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG BEARISH' | 'CONFLICTING';
  agreementPercentage: number;
  recommendation: 'TRADE_WITH_TREND' | 'WAIT_FOR_ALIGNMENT' | 'RANGE_ONLY';
}

export interface OptionContract {
  strike: number;
  ltp: number;
  change: number;
  oi: number;
  changeOi: number;
  volume: number;
  iv: number;
  bid: number;
  ask: number;
  buildup: 'LONG_BUILDUP' | 'SHORT_BUILDUP' | 'SHORT_COVERING' | 'LONG_UNWINDING' | 'NEUTRAL';
  intrinsicValue?: number;
  timeValue?: number;
  delta?: number;
  theta?: number;
  gamma?: number;
  vega?: number;
}

export interface OptionStrikeRow {
  strikePrice: number;
  call: OptionContract;
  put: OptionContract;
  isAtm: boolean;
  isItmCall: boolean;
  isItmPut: boolean;
}

export interface OptionChainSummary {
  spotPrice: number;
  expiryDate: string;
  availableExpiries: string[];
  strikes: OptionStrikeRow[];
  totalCallOi: number;
  totalPutOi: number;
  changeInCallOi: number;
  changeInPutOi: number;
  oiPcr: number;
  volumePcr: number;
  pcrTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  majorCallResistance: number;
  majorPutSupport: number;
  maxPain: number;
  atmIv: number;
  ivRegime: 'LOW' | 'NORMAL' | 'HIGH';
  ivTrend: 'EXPANSION' | 'CONTRACTION' | 'STABLE';
}

export interface IndiaVixSummary {
  value: number;
  change: number;
  changePercent: number;
  trend: 'EXPANDING' | 'CONTRACTION' | 'STABLE';
  regime: 'LOW_VIX (<13)' | 'MODERATE_VIX (13-18)' | 'ELEVATED_VIX (18-24)' | 'EXTREME_VIX (>24)';
  implication: string;
  favorableStrategies: string[];
}

export interface StrategyLeg {
  action: 'BUY' | 'SELL';
  optionType: 'CE' | 'PE';
  strike: number;
  premium: number;
  lots: number;
}

export interface TradeStrategy {
  id: string;
  name: string;
  category: 'BULLISH' | 'BEARISH' | 'RANGE' | 'BREAKOUT' | 'VOLATILITY';
  legs: StrategyLeg[];
  entryRange: [number, number];
  stopLoss: number;
  target1: number;
  target2: number;
  maxProfit: string;
  maxLoss: string;
  breakeven: string;
  rewardRiskRatio: string;
  requiredMargin: string;
  selectionRationale: string;
  suitableRegime: string;
}

export interface HumanIqSignalPillar {
  name: string;
  score: number; // 0 - 100
  status: 'EDGE' | 'PASS' | 'NEUTRAL';
  detail: string;
}

export interface HumanIqSignal {
  iqScore: number; // 98-99%
  confluencePercent: number; // 99%
  rating: 'TOP 1% SUPERFORECASTER' | 'ELITE INSTITUTIONAL QUANT' | 'HIGH CONFLUENCE';
  status: 'ACTIVE_CONVICTION' | 'PRESERVATION_LOCK' | 'ACCUMULATION';
  verdict: string;
  institutionalBias: 'INSTITUTIONAL_LONG' | 'INSTITUTIONAL_SHORT' | 'RANGE_ACCUMULATION' | 'LIQUIDITY_HUNT';
  thesis: string;
  pillars: HumanIqSignalPillar[];
  orderflowDelta: {
    callAbsorption: string;
    putAbsorption: string;
    institutionalImbalance: string;
  };
  trapDetection: {
    detected: boolean;
    type: string;
    action: string;
  };
  smartMoneySetup: {
    orderBlock: string;
    liquidityPool: string;
    fairValueGap: string;
  };
  executionVector: {
    recommendedContract: string;
    entryTrigger: string;
    stopLoss: number;
    target1: number;
    target2: number;
    riskRewardRatio: string;
    expectedValue: string;
  };
}

export interface SignalAnalysis {
  signal: SignalType;
  confidence: number; // 0 - 100%
  status: SignalStatus;
  trend: MarketTrend;
  marketRegime: MarketRegime;
  suggestedStrategy: TradeStrategy;
  humanIqSignal?: HumanIqSignal;
  entryZone: [number, number];
  stopLoss: number;
  target1: number;
  target2: number;
  riskReward: string;
  reasons: string[];
  risks: string[];
  whyNot100: string[];
  timestamp: string;
  weightedScore: {
    priceAction: number;
    trendEma: number;
    vwap: number;
    rsi: number;
    macd: number;
    adx: number;
    volume: number;
    optionOi: number;
    pcr: number;
    ivVix: number;
    newsGlobal: number;
    totalWeightedScore: number;
  };
  conditionChecks: {
    marketOpen: boolean;
    liveDataAvailable: boolean;
    sufficientLiquidity: boolean;
    spreadReasonable: boolean;
    volatilityAcceptable: boolean;
    breakingNewsClear: boolean;
    indicatorsAligned: boolean;
    volumeConfirmed: boolean;
    supportResistanceClear: boolean;
    regimeIdentified: boolean;
  };
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  time: string;
  publishedAt?: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  sentiment: 'BULLISH' | 'BEARISH' | 'MIXED' | 'NEUTRAL';
  expectedMarketEffect: string;
  confidence: string;
  category: 'INDIAN' | 'GLOBAL' | 'MONETARY' | 'GEOPOLITICAL' | 'EARNINGS';
}

export interface GlobalIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  status: 'OPEN' | 'CLOSED';
}

export interface HistoricalEvent {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  niftyReaction: string;
  dropOrRisePoints: string;
  reactionSpeed: string;
  vixImpact: string;
  oiPcrBehavior: string;
  recoveryDuration: string;
  keyTakeaway: string;
}

export interface TomorrowScenario {
  date: string;
  bullish: {
    conditions: string[];
    potentialSetup: string;
    entryTrigger: string;
    targetZone: string;
  };
  bearish: {
    conditions: string[];
    potentialSetup: string;
    entryTrigger: string;
    targetZone: string;
  };
  rangeBound: {
    conditions: string[];
    potentialSetup: string;
    rangeExpected: string;
    targetZone: string;
  };
  keyLevels: {
    pivot: number;
    resistance1: number;
    resistance2: number;
    support1: number;
    support2: number;
    expectedOpenRange: [number, number];
  };
  scheduledEvents: {
    title: string;
    time: string;
    importance: 'HIGH' | 'MEDIUM' | 'LOW';
    expectedImpact: string;
  }[];
}

export interface PaperTrade {
  id: string;
  timestamp: string;
  symbol?: string;
  strategyName: string;
  signalType: SignalType;
  strikePrice?: number;
  optionType?: 'CE' | 'PE';
  lotSize?: number;
  strikeDifference?: number;
  underlyingPriceAtEntry: number;
  currentSpotPrice?: number;
  intrinsicValue?: number;
  timeValue?: number;
  moneyness?: 'ITM' | 'ATM' | 'OTM';
  premiumChange?: number;
  legs: StrategyLeg[];
  quantityLots: number;
  entryNetPrice: number;
  currentNetPrice: number;
  exitNetPrice?: number;
  stopLossPrice: number;
  targetPrice: number;
  pnl: number;
  pnlPercent: number;
  status: 'OPEN' | 'CLOSED';
  exitTimestamp?: string;
  exitReason?: 'TARGET_HIT' | 'STOP_LOSS_HIT' | 'MANUAL_EXIT' | 'EOD_SQUAREOFF';
  maxRisk: number;
  maxReward: number;
}

export interface PaperTradingStats {
  virtualBalance: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  averageWin: number;
  averageLoss: number;
  maxDrawdown: number;
}

export interface SignalHistoryItem {
  id: string;
  time: string;
  niftyPrice: number;
  signal: SignalType;
  confidence: number;
  strategy: string;
  entry: number;
  target: number;
  stop: number;
  outcome: 'WIN' | 'LOSS' | 'OPEN' | 'NO_TRADE';
  pointsGained?: number;
}

export interface BacktestResult {
  periodDays: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfitPoints: number;
  profitFactor: number;
  maxDrawdownPoints: number;
  maxDrawdownPercent: number;
  averageWinPoints: number;
  averageLossPoints: number;
  sharpeRatio: number;
  expectancyPoints: number;
  assumptions: {
    brokeragePerOrder: number;
    slippagePoints: number;
    sttAndTaxesIncluded: boolean;
  };
}

export interface RiskSettings {
  maxRiskPerTradePercent: number; // e.g. 1%, 2%
  maxDailyLossRupees: number;
  maxDailyTrades: number;
  defaultLots: number;
}

export interface StockConstituent {
  symbol: string;
  name: string;
  sector: string;
  weightage: number; // e.g. 8.5%
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  volume: number;
  vwap: number;
  lotSize: number;
  fAndOEnabled: boolean;
  strikeStep: number;
  trend: MarketTrend;
  marketRegime: MarketRegime;
  signal: SignalType;
  confidence: number;
  rsi14: number;
  adx14: number;
  pcr: number;
  atmIv: number;
  reasons: string[];
  risks: string[];
  niftyAlignment: 'STRONG_ALIGNMENT' | 'PARTIAL' | 'CONFLICTING';
}

export interface StockOptionAnalysis {
  stock: StockConstituent;
  optionChain: OptionChainSummary;
  suggestedStrategy: TradeStrategy;
  entryZone: [number, number];
  stopLoss: number;
  target1: number;
  target2: number;
  selectedStrikeAnalysis?: {
    strike: number;
    optionType: 'CE' | 'PE';
    action: 'BUY' | 'SELL';
    ltp: number;
    signal: SignalType;
    confidence: number;
    reasons: string[];
    risks: string[];
  };
}
