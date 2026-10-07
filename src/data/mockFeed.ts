import {
  MarketQuote,
  TechnicalIndicators,
  MultiTimeframeSummary,
  OptionChainSummary,
  OptionStrikeRow,
  IndiaVixSummary,
  NewsItem,
  GlobalIndex,
  TomorrowScenario,
} from '../types/market';
import {
  Candle,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateADX,
  calculateSupertrend,
  calculateFibonacci,
} from '../engine/indicators';
import {
  identifySwingPoints,
  determineMarketStructure,
  calculateSupportResistance,
  evaluateBreakoutConfirmation,
} from '../engine/priceAction';
import { analyzeOptionChain } from '../engine/optionsAnalysis';
import { calculateNseOptionPrice } from '../engine/blackScholes';

/**
 * Generate synthetic historical candles for technical analysis
 */
export function generateCandles(basePrice: number, count = 120, trendBias = 0.3): Candle[] {
  const candles: Candle[] = [];
  let currentPrice = basePrice - 180;
  const now = Date.now();
  const intervalMs = 5 * 60 * 1000; // 5-minute candles

  for (let i = count; i >= 0; i--) {
    const timestamp = now - i * intervalMs;
    const volatility = 12 + Math.random() * 8;
    const direction = (Math.random() - 0.46) + trendBias * 0.1; // slight upward drift
    const change = direction * volatility;

    const open = Number(currentPrice.toFixed(2));
    const close = Number((open + change).toFixed(2));
    const high = Number((Math.max(open, close) + Math.random() * 8).toFixed(2));
    const low = Number((Math.min(open, close) - Math.random() * 8).toFixed(2));
    const volume = Math.floor(45000 + Math.random() * 85000);

    candles.push({ timestamp, open, high, low, close, volume });
    currentPrice = close;
  }

  return candles;
}

/**
 * Builds TechnicalIndicators bundle from synthetic candle series
 */
export function buildTechnicalIndicators(candles: Candle[], currentPrice: number): TechnicalIndicators {
  const closes = candles.map(c => c.close);
  const ema9Series = calculateEMA(closes, 9);
  const ema20Series = calculateEMA(closes, 20);
  const ema50Series = calculateEMA(closes, 50);
  const ema100Series = calculateEMA(closes, 100);
  const ema200Series = calculateEMA(closes, 200);

  const ema9 = Number((ema9Series[ema9Series.length - 1] || currentPrice).toFixed(1));
  const ema20 = Number((ema20Series[ema20Series.length - 1] || currentPrice - 20).toFixed(1));
  const ema50 = Number((ema50Series[ema50Series.length - 1] || currentPrice - 60).toFixed(1));
  const ema100 = Number((ema100Series[ema100Series.length - 1] || currentPrice - 120).toFixed(1));
  const ema200 = Number((ema200Series[ema200Series.length - 1] || currentPrice - 220).toFixed(1));

  let alignment: 'BULLISH' | 'BEARISH' | 'MIXED' = 'MIXED';
  if (ema9 > ema20 && ema20 > ema50 && ema50 > ema100) alignment = 'BULLISH';
  else if (ema9 < ema20 && ema20 < ema50 && ema50 < ema100) alignment = 'BEARISH';

  const rsiValues = calculateRSI(closes, 14);
  const rsi = Number((rsiValues[rsiValues.length - 1] || 58.5).toFixed(1));

  let rsiCondition: 'OVERBOUGHT' | 'BULLISH_MOMENTUM' | 'NEUTRAL' | 'BEARISH_MOMENTUM' | 'OVERSOLD' = 'NEUTRAL';
  if (rsi > 70) rsiCondition = 'OVERBOUGHT';
  else if (rsi >= 55) rsiCondition = 'BULLISH_MOMENTUM';
  else if (rsi <= 30) rsiCondition = 'OVERSOLD';
  else if (rsi <= 45) rsiCondition = 'BEARISH_MOMENTUM';

  const macdData = calculateMACD(closes);
  const macdVal = Number((macdData.macdLine[macdData.macdLine.length - 1] || 12.4).toFixed(1));
  const signalVal = Number((macdData.signalLine[macdData.signalLine.length - 1] || 8.2).toFixed(1));
  const histVal = Number((macdData.histogram[macdData.histogram.length - 1] || 4.2).toFixed(1));

  const bbData = calculateBollingerBands(closes, 20, 2);
  const bbUpper = Number((bbData.upper[bbData.upper.length - 1] || currentPrice + 80).toFixed(1));
  const bbMiddle = Number((bbData.middle[bbData.middle.length - 1] || currentPrice).toFixed(1));
  const bbLower = Number((bbData.lower[bbData.lower.length - 1] || currentPrice - 80).toFixed(1));
  const bandwidth = Number((bbData.bandwidth[bbData.bandwidth.length - 1] || 0.015).toFixed(4));

  const atrValues = calculateATR(candles, 14);
  const atr = Number((atrValues[atrValues.length - 1] || 32.5).toFixed(1));

  const adxValues = calculateADX(candles, 14);
  const adx = Number((adxValues[adxValues.length - 1] || 27.8).toFixed(1));

  const stData = calculateSupertrend(candles, 10, 3);
  const stValue = Number((stData.values[stData.values.length - 1] || currentPrice - 50).toFixed(1));
  const stDirection = stData.directions[stData.directions.length - 1] || 'BULLISH';

  // Volume
  const currentVol = candles[candles.length - 1].volume;
  const avgVol = Math.floor(candles.slice(-20).reduce((s, c) => s + c.volume, 0) / 20);
  const volSpike = currentVol > avgVol * 1.35;

  // VWAP approximation
  let cumPV = 0;
  let cumV = 0;
  for (const c of candles.slice(-50)) {
    const tp = (c.high + c.low + c.close) / 3;
    cumPV += tp * c.volume;
    cumV += c.volume;
  }
  const vwapValue = Number((cumV > 0 ? cumPV / cumV : currentPrice - 18).toFixed(1));

  // Swings and price action
  const { swingHighs, swingLows } = identifySwingPoints(candles, 3);
  const structure = determineMarketStructure(swingHighs, swingLows);

  const pdh = Number((Math.max(...candles.slice(0, 40).map(c => c.high)) || currentPrice + 90).toFixed(1));
  const pdl = Number((Math.min(...candles.slice(0, 40).map(c => c.low)) || currentPrice - 110).toFixed(1));
  const pdc = Number((candles[0]?.close || currentPrice - 25).toFixed(1));

  const { supportLevels, resistanceLevels } = calculateSupportResistance(
    currentPrice,
    swingHighs,
    swingLows,
    pdh,
    pdl,
    pdc
  );

  const lastCandle = candles[candles.length - 1];
  const { breakout, retestDetected } = evaluateBreakoutConfirmation(
    currentPrice,
    lastCandle,
    supportLevels[0] || currentPrice - 50,
    resistanceLevels[0] || currentPrice + 50,
    avgVol
  );

  const dayHigh = Number(Math.max(...candles.map(c => c.high)).toFixed(1));
  const dayLow = Number(Math.min(...candles.map(c => c.low)).toFixed(1));
  const fib = calculateFibonacci(dayHigh, dayLow);

  return {
    vwap: {
      value: vwapValue,
      relation: currentPrice > vwapValue ? 'ABOVE' : 'BELOW',
      trend: currentPrice > vwapValue ? 'BULLISH' : 'BEARISH',
      breakout: Math.abs(currentPrice - vwapValue) < 8 && lastCandle.close > vwapValue,
    },
    rsi14: {
      value: rsi,
      condition: rsiCondition,
      divergence: 'NONE',
    },
    emas: {
      ema9,
      ema20,
      ema50,
      ema100,
      ema200,
      alignment,
      crossover: ema9 > ema20 && ema9Series[ema9Series.length - 2] <= ema20Series[ema20Series.length - 2] ? 'GOLDEN_CROSS' : 'NONE',
      priceVsEma: currentPrice > ema9 && currentPrice > ema20 && currentPrice > ema50 ? 'ABOVE_ALL' : 'BETWEEN',
    },
    macd: {
      macdLine: macdVal,
      signalLine: signalVal,
      histogram: histVal,
      signal: histVal > 0 ? 'BULLISH' : 'BEARISH',
    },
    bollinger: {
      upper: bbUpper,
      middle: bbMiddle,
      lower: bbLower,
      bandwidth,
      state: bandwidth > 0.018 ? 'EXPANSION' : bandwidth < 0.010 ? 'CONTRACTION' : 'NORMAL',
      position: currentPrice > bbMiddle ? 'UPPER_BAND' : 'LOWER_BAND',
    },
    atr14: {
      value: atr,
      volatilityState: atr > 40 ? 'HIGH' : atr < 25 ? 'LOW' : 'NORMAL',
    },
    adx14: {
      value: adx,
      trendStrength: adx > 25 ? 'STRONG' : adx > 18 ? 'MODERATE' : 'WEAK',
      marketType: adx >= 22 ? 'TRENDING' : 'SIDEWAYS',
    },
    supertrend: {
      value: stValue,
      direction: stDirection,
    },
    volume: {
      current: currentVol,
      avgVolume: avgVol,
      spike: volSpike,
      status: currentVol > avgVol ? 'EXPANDING' : 'CONTRACTING',
    },
    fibonacci: fib,
    priceAction: {
      structure,
      supportLevels,
      resistanceLevels,
      breakout,
      retestDetected,
      gapType: candles[candles.length - 20]?.open > pdc + 20 ? 'GAP_UP' : 'FLAT',
      openingRange: {
        high: Number((candles[5]?.high || currentPrice + 40).toFixed(1)),
        low: Number((candles[5]?.low || currentPrice - 40).toFixed(1)),
        breakout: currentPrice > (candles[5]?.high || currentPrice + 40) ? 'UP' : 'INSIDE',
      },
      pdh,
      pdl,
      pdc,
    },
  };
}

/**
 * Builds realistic NIFTY 50 Option Chain centered at spot price
 */
export function generateOptionChain(spotPrice: number, spotChange: number = -198.50): OptionChainSummary {
  const atmStrike = Math.round(spotPrice / 50) * 50;
  const strikes: OptionStrikeRow[] = [];
  const strikeCount = 13; // 6 ITM, 1 ATM, 6 OTM
  const step = 50;
  const startStrike = atmStrike - Math.floor(strikeCount / 2) * step;

  const daysToExpiry = 5; // standard current weekly expiry
  const baseIv = 0.1446;

  for (let i = 0; i < strikeCount; i++) {
    const strike = startStrike + i * step;
    const isAtm = strike === atmStrike;

    // Use authentic NSE Black-Scholes formula
    const bs = calculateNseOptionPrice(
      spotPrice,
      strike,
      daysToExpiry,
      baseIv,
      0.065,
      spotChange
    );

    // Realistic Open Interest in Lakhs (e.g. 15L to 135L)
    const callBase = Math.floor(7500000 / (1 + Math.pow(Math.abs(strike - (atmStrike + step * 2)) / (step * 3), 1.5)));
    const putBase = Math.floor(7800000 / (1 + Math.pow(Math.abs(strike - (atmStrike - step * 2)) / (step * 3), 1.5)));

    const callOi = strike === atmStrike + step * 2 ? 13420000 : callBase;
    const putOi = strike === atmStrike - step * 2 ? 12850000 : putBase;

    const callChangeOi = Math.floor((Math.random() - 0.35) * (callOi * 0.12));
    const putChangeOi = Math.floor((Math.random() - 0.25) * (putOi * 0.12));

    const callVol = Math.floor(callOi * 0.45);
    const putVol = Math.floor(putOi * 0.48);

    strikes.push({
      strikePrice: strike,
      call: {
        strike,
        ltp: bs.callLtp,
        change: bs.callChange,
        oi: callOi,
        changeOi: callChangeOi,
        volume: callVol,
        iv: bs.iv,
        bid: Math.max(0.05, Number((bs.callLtp - 0.15).toFixed(2))),
        ask: Number((bs.callLtp + 0.15).toFixed(2)),
        buildup: callChangeOi > 5000 ? 'SHORT_BUILDUP' : 'SHORT_COVERING',
      },
      put: {
        strike,
        ltp: bs.putLtp,
        change: bs.putChange,
        oi: putOi,
        changeOi: putChangeOi,
        volume: putVol,
        iv: bs.iv,
        bid: Math.max(0.05, Number((bs.putLtp - 0.15).toFixed(2))),
        ask: Number((bs.putLtp + 0.15).toFixed(2)),
        buildup: putChangeOi > 5000 ? 'LONG_BUILDUP' : 'LONG_UNWINDING',
      },
      isAtm,
      isItmCall: spotPrice > strike,
      isItmPut: spotPrice < strike,
    });
  }

  const expiryDate = '08-OCT-2026 (Weekly)';
  const availableExpiries = ['08-OCT-2026 (Weekly)', '15-OCT-2026 (Weekly)', '29-OCT-2026 (Monthly)'];

  return analyzeOptionChain(spotPrice, expiryDate, availableExpiries, strikes);
}

/**
 * Builds multi-timeframe trend alignment matrix
 */
export function buildMultiTimeframeSummary(): MultiTimeframeSummary {
  const tf5m = { timeframe: '5m' as const, label: '5-Minute', trend: 'BULLISH' as const, rsi: 62.4, emaTrend: 'BULLISH' as const, macdSignal: 'BULLISH' as const, score: 72 };
  const tf15m = { timeframe: '15m' as const, label: '15-Minute', trend: 'BULLISH' as const, rsi: 59.8, emaTrend: 'BULLISH' as const, macdSignal: 'BULLISH' as const, score: 68 };
  const tf30m = { timeframe: '30m' as const, label: '30-Minute', trend: 'BULLISH' as const, rsi: 57.2, emaTrend: 'BULLISH' as const, macdSignal: 'BULLISH' as const, score: 64 };
  const tf1h = { timeframe: '1h' as const, label: '1-Hour', trend: 'BULLISH' as const, rsi: 55.4, emaTrend: 'BULLISH' as const, macdSignal: 'NEUTRAL' as const, score: 58 };
  const tfDaily = { timeframe: 'daily' as const, label: 'Daily', trend: 'BULLISH' as const, rsi: 56.1, emaTrend: 'BULLISH' as const, macdSignal: 'BULLISH' as const, score: 65 };

  const timeframes = { '5m': tf5m, '15m': tf15m, '30m': tf30m, '1h': tf1h, 'daily': tfDaily };
  const bullishCount = Object.values(timeframes).filter(t => t.trend === 'BULLISH').length;
  const agreement = Math.round((bullishCount / 5) * 100);

  return {
    timeframes,
    overallTrend: 'STRONG BULLISH',
    agreementPercentage: agreement,
    recommendation: 'TRADE_WITH_TREND',
  };
}

/**
 * Curated real-time financial news stream with impact scores
 */
export const SAMPLE_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'RBI Monetary Policy Committee Keeps Repo Rate Unchanged at 6.50%; Retains Stance',
    summary: 'Governor affirms inflation trajectory is moderating towards 4% target while Indian GDP growth remains resilient at 7.2%.',
    source: 'Press Trust of India / RBI',
    time: '42 mins ago',
    impact: 'HIGH',
    sentiment: 'BULLISH',
    expectedMarketEffect: 'Supports banking heavyweights (HDFC Bank, ICICI Bank) and maintains domestic liquidity cushion.',
    confidence: 'Verified official announcement',
    category: 'MONETARY',
  },
  {
    id: 'news-2',
    title: 'US Fed Signals Measured Rate Cut Trajectory Following Mild PCE Inflation Print',
    summary: 'Core PCE inflation printed at 2.6% YoY, matching expectations. Global equity futures ticked higher.',
    source: 'Bloomberg Financial Markets',
    time: '1 hour ago',
    impact: 'MEDIUM',
    sentiment: 'BULLISH',
    expectedMarketEffect: 'Cooling US 10-year Treasury yields eases foreign capital flight from emerging markets.',
    confidence: 'Economic calendar consensus data',
    category: 'GLOBAL',
  },
  {
    id: 'news-3',
    title: 'Brent Crude Stabilizes at $74.20/bbl Amid OPEC+ Production Quota Discipline',
    summary: 'Crude oil remains range-bound, alleviating severe import cost pressures for India’s current account deficit.',
    source: 'Reuters Commodities',
    time: '2 hours ago',
    impact: 'MEDIUM',
    sentiment: 'NEUTRAL',
    expectedMarketEffect: 'Neutral for Indian oil marketing companies and paint manufacturers.',
    confidence: 'Energy exchange quote',
    category: 'GLOBAL',
  },
  {
    id: 'news-4',
    title: 'Foreign Institutional Investors (FIIs) Turn Net Buyers with ₹1,480 Cr Inflows',
    summary: 'FIIs purchased ₹1,482 Cr in cash segment while Domestic Institutional Investors (DIIs) added ₹945 Cr.',
    source: 'NSE Institutional Clearing Data',
    time: '3 hours ago',
    impact: 'HIGH',
    sentiment: 'BULLISH',
    expectedMarketEffect: 'Strong institutional liquidity support reduces probability of deep breakdowns.',
    confidence: 'NSE Official EOD Sheet',
    category: 'INDIAN',
  },
  {
    id: 'news-5',
    title: 'USD/INR Trades Flat at 83.92 as RBI Intervenes to Curb Sharp Currency Volatility',
    summary: 'Forex reserves remain robust at $690B, providing comfortable import cover against sudden external dollar spikes.',
    source: 'Forex Market Desk',
    time: '4 hours ago',
    impact: 'LOW',
    sentiment: 'NEUTRAL',
    expectedMarketEffect: 'Stable exchange rate prevents currency-hedging panic among overseas funds.',
    confidence: 'Interbank Forex quote',
    category: 'INDIAN',
  },
];

/**
 * Global market indices monitoring
 */
export const GLOBAL_INDICES: GlobalIndex[] = [
  { symbol: 'GIFT_NIFTY', name: 'Gift Nifty (NSE IX)', price: 24895.0, change: 135.5, changePercent: 0.55, status: 'OPEN' },
  { symbol: 'SP500', name: 'S&P 500 (US)', price: 5745.2, change: 22.8, changePercent: 0.40, status: 'CLOSED' },
  { symbol: 'NASDAQ', name: 'Nasdaq 100', price: 20120.4, change: 95.6, changePercent: 0.48, status: 'CLOSED' },
  { symbol: 'DOW', name: 'Dow Jones Industrial', price: 42310.0, change: 110.2, changePercent: 0.26, status: 'CLOSED' },
  { symbol: 'NIKKEI', name: 'Nikkei 225 (Japan)', price: 38620.0, change: -75.0, changePercent: -0.19, status: 'OPEN' },
  { symbol: 'HANGSENG', name: 'Hang Seng (Hong Kong)', price: 21150.0, change: 310.0, changePercent: 1.49, status: 'OPEN' },
  { symbol: 'BRENT_CRUDE', name: 'Brent Crude ($/bbl)', price: 74.25, change: -0.45, changePercent: -0.60, status: 'OPEN' },
  { symbol: 'GOLD', name: 'Gold ($/oz)', price: 2658.0, change: 8.5, changePercent: 0.32, status: 'OPEN' },
  { symbol: 'US10Y', name: 'US 10-Yr Treasury Yield (%)', price: 3.78, change: -0.03, changePercent: -0.79, status: 'OPEN' },
  { symbol: 'USD_INR', name: 'USD / INR', price: 83.92, change: -0.04, changePercent: -0.05, status: 'OPEN' },
];

/**
 * Builds Tomorrow Market Scenarios & Key Levels
 */
export function buildTomorrowScenario(spotPrice: number, pdh: number, pdl: number, pdc: number): TomorrowScenario {
  const pivot = Number(((pdh + pdl + pdc) / 3).toFixed(1));
  const r1 = Number((2 * pivot - pdl).toFixed(1));
  const r2 = Number((pivot + (pdh - pdl)).toFixed(1));
  const s1 = Number((2 * pivot - pdh).toFixed(1));
  const s2 = Number((pivot - (pdh - pdl)).toFixed(1));

  return {
    date: 'Next Trading Session',
    bullish: {
      conditions: [
        `NIFTY sustains above Opening Pivot (₹${pivot}) in first 15-minute candle.`,
        `Decisive body close above Previous Day High (₹${pdh}).`,
        `Put OI additions exceed 1.5x Call OI additions across ATM strikes.`,
        `India VIX stays subdued below 14.5 without panic spikes.`,
      ],
      potentialSetup: 'Bull Call Spread (Buy ATM CE, Sell OTM CE +100)',
      entryTrigger: `Sustained breakout above ₹${pdh} with volume confirmation`,
      targetZone: `₹${r1} – ₹${r2}`,
    },
    bearish: {
      conditions: [
        `NIFTY breaks and closes below Previous Day Low (₹${pdl}).`,
        `Heavy call writing initiated at ₹${Math.round(spotPrice / 50) * 50} CE.`,
        `Price rejections from VWAP on intraday pullback attempts.`,
        `India VIX expanding above 16.0 with FII index futures selling.`,
      ],
      potentialSetup: 'Bear Put Spread (Buy ATM PE, Sell OTM PE -100)',
      entryTrigger: `Breakdown below ₹${pdl} with expanding volume`,
      targetZone: `₹${s1} – ₹${s2}`,
    },
    rangeBound: {
      conditions: [
        `NIFTY trades strictly between Support S1 (₹${s1}) and Resistance R1 (₹${r1}).`,
        `Balanced Put and Call writing at both wings with IV compression.`,
        `ADX remains under 20 on 15-minute chart indicating lack of directional drive.`,
      ],
      potentialSetup: 'Iron Condor (Sell OTM CE & PE wings, Buy outer wings)',
      rangeExpected: `₹${s1} – ₹${r1}`,
      targetZone: 'Full premium decay within expected range boundaries',
    },
    keyLevels: {
      pivot,
      resistance1: r1,
      resistance2: r2,
      support1: s1,
      support2: s2,
      expectedOpenRange: [Number((spotPrice - 35).toFixed(1)), Number((spotPrice + 35).toFixed(1))],
    },
    scheduledEvents: [
      { title: 'India Monthly Services PMI Print', time: '10:30 AM IST', importance: 'MEDIUM', expectedImpact: 'Economic activity gauge' },
      { title: 'US Initial Jobless Claims & Fed Governor Speech', time: '06:00 PM IST', importance: 'HIGH', expectedImpact: 'Global bond yield movement' },
      { title: 'Weekly NIFTY Options Expiry Settlement', time: '03:30 PM IST', importance: 'HIGH', expectedImpact: 'Theta decay and pinned strike settlement' },
    ],
  };
}
