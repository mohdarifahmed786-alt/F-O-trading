import {
  StockConstituent,
  OptionChainSummary,
  OptionStrikeRow,
  SignalType,
  MarketTrend,
  MarketRegime,
  TradeStrategy,
} from '../types/market';
import { roundToStrike } from '../engine/strategyEngine';
import { calculateNseOptionPrice } from '../engine/blackScholes';

export interface BaseStockConfig {
  symbol: string;
  name: string;
  sector: string;
  weightage: number;
  basePrice: number;
  lotSize: number;
  strikeStep: number;
  trendBias: number; // positive = bullish bias, negative = bearish, 0 = neutral
  atmIv: number;
}

export const NIFTY_50_INDEX_CONFIG: BaseStockConfig = {
  symbol: 'NIFTY 50',
  name: 'NIFTY 50 Index',
  sector: 'NSE Benchmark Index',
  weightage: 100,
  basePrice: 22421.95,
  lotSize: 25,
  strikeStep: 50,
  trendBias: 0.35,
  atmIv: 14.45,
};

export const NIFTY_50_BASE_CONSTITUENTS: BaseStockConfig[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', sector: 'Energy / Conglomerate', weightage: 9.12, basePrice: 1167.70, lotSize: 250, strikeStep: 20, trendBias: 0.45, atmIv: 16.4 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', sector: 'Banking', weightage: 11.45, basePrice: 721.20, lotSize: 550, strikeStep: 10, trendBias: 0.55, atmIv: 15.2 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', sector: 'Banking', weightage: 7.82, basePrice: 1310.60, lotSize: 700, strikeStep: 10, trendBias: 0.25, atmIv: 16.8 },
  { symbol: 'INFY', name: 'Infosys Ltd.', sector: 'IT Services', weightage: 5.92, basePrice: 1035.00, lotSize: 400, strikeStep: 20, trendBias: 0.65, atmIv: 18.5 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT Services', weightage: 4.15, basePrice: 2075.00, lotSize: 175, strikeStep: 50, trendBias: 0.50, atmIv: 15.8 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', sector: 'Telecom', weightage: 4.35, basePrice: 1741.10, lotSize: 475, strikeStep: 10, trendBias: 0.40, atmIv: 17.2 },
  { symbol: 'ITC', name: 'ITC Ltd.', sector: 'FMCG', weightage: 3.85, basePrice: 255.90, lotSize: 1600, strikeStep: 5, trendBias: -0.20, atmIv: 13.9 },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd.', sector: 'Infrastructure', weightage: 3.65, basePrice: 3693.40, lotSize: 150, strikeStep: 20, trendBias: -0.15, atmIv: 19.1 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', weightage: 2.95, basePrice: 954.10, lotSize: 750, strikeStep: 5, trendBias: 0.15, atmIv: 18.2 },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd.', sector: 'Banking', weightage: 2.85, basePrice: 1217.10, lotSize: 625, strikeStep: 10, trendBias: 0.10, atmIv: 19.5 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking', weightage: 2.65, basePrice: 1864.00, lotSize: 400, strikeStep: 20, trendBias: -0.30, atmIv: 16.5 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', sector: 'FMCG', weightage: 2.45, basePrice: 2940.50, lotSize: 300, strikeStep: 20, trendBias: -0.15, atmIv: 14.1 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', sector: 'Financial Services', weightage: 2.25, basePrice: 7420.00, lotSize: 125, strikeStep: 50, trendBias: 0.60, atmIv: 21.4 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India', sector: 'Automobile', weightage: 1.85, basePrice: 12850.00, lotSize: 50, strikeStep: 100, trendBias: 0.55, atmIv: 17.6 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Healthcare / Pharma', weightage: 1.75, basePrice: 1890.00, lotSize: 350, strikeStep: 10, trendBias: 0.45, atmIv: 16.3 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', sector: 'Automobile', weightage: 1.80, basePrice: 965.40, lotSize: 700, strikeStep: 10, trendBias: -0.40, atmIv: 23.2 },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', sector: 'Metals & Mining', weightage: 1.45, basePrice: 162.80, lotSize: 5500, strikeStep: 2.5, trendBias: 0.30, atmIv: 25.1 },
  { symbol: 'NTPC', name: 'NTPC Ltd.', sector: 'Power / Energy', weightage: 1.55, basePrice: 428.50, lotSize: 1500, strikeStep: 5, trendBias: 0.60, atmIv: 20.8 },
  { symbol: 'POWERGRID', name: 'Power Grid Corp', sector: 'Power / Utilities', weightage: 1.40, basePrice: 342.10, lotSize: 1800, strikeStep: 5, trendBias: 0.20, atmIv: 18.0 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Energy', weightage: 1.25, basePrice: 295.40, lotSize: 1925, strikeStep: 2.5, trendBias: -0.20, atmIv: 22.4 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', sector: 'Automobile', weightage: 2.10, basePrice: 3120.00, lotSize: 350, strikeStep: 20, trendBias: 0.75, atmIv: 22.0 },
  { symbol: 'TITAN', name: 'Titan Company Ltd.', sector: 'Consumer Goods', weightage: 1.35, basePrice: 3740.00, lotSize: 175, strikeStep: 20, trendBias: -0.35, atmIv: 18.9 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', sector: 'Commodities / Trading', weightage: 1.15, basePrice: 3140.00, lotSize: 300, strikeStep: 20, trendBias: 0.15, atmIv: 32.5 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ', sector: 'Infrastructure / Ports', weightage: 1.20, basePrice: 1450.00, lotSize: 400, strikeStep: 20, trendBias: 0.40, atmIv: 24.1 },
  { symbol: 'COALINDIA', name: 'Coal India Ltd.', sector: 'Energy / Mining', weightage: 1.05, basePrice: 495.20, lotSize: 1050, strikeStep: 5, trendBias: -0.10, atmIv: 21.0 },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd.', sector: 'Financial Services', weightage: 1.10, basePrice: 1910.00, lotSize: 500, strikeStep: 10, trendBias: 0.35, atmIv: 20.5 },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Materials / Cement', weightage: 1.15, basePrice: 11450.00, lotSize: 100, strikeStep: 100, trendBias: 0.25, atmIv: 17.5 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd.', sector: 'Consumer Goods', weightage: 1.00, basePrice: 3250.00, lotSize: 200, strikeStep: 20, trendBias: -0.45, atmIv: 17.8 },
  { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT Services', weightage: 1.45, basePrice: 1820.00, lotSize: 350, strikeStep: 10, trendBias: 0.50, atmIv: 19.2 },
  { symbol: 'WIPRO', name: 'Wipro Ltd.', sector: 'IT Services', weightage: 0.75, basePrice: 535.40, lotSize: 1500, strikeStep: 5, trendBias: -0.50, atmIv: 22.1 },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd.', sector: 'IT Services', weightage: 0.85, basePrice: 1610.00, lotSize: 600, strikeStep: 20, trendBias: 0.20, atmIv: 23.4 },
  { symbol: 'LTIM', name: 'LTIMindtree Ltd.', sector: 'IT Services', weightage: 0.70, basePrice: 6240.00, lotSize: 150, strikeStep: 50, trendBias: -0.30, atmIv: 24.5 },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd.', sector: 'FMCG', weightage: 0.85, basePrice: 2680.00, lotSize: 250, strikeStep: 20, trendBias: -0.20, atmIv: 13.8 },
  { symbol: 'BRITANNIA', name: 'Britannia Industries', sector: 'FMCG', weightage: 0.75, basePrice: 6150.00, lotSize: 200, strikeStep: 50, trendBias: 0.10, atmIv: 15.2 },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products', sector: 'FMCG', weightage: 0.70, basePrice: 1195.00, lotSize: 900, strikeStep: 10, trendBias: 0.30, atmIv: 16.9 },
  { symbol: 'DRREDDY', name: "Dr. Reddy's Laboratories", sector: 'Healthcare / Pharma', weightage: 0.75, basePrice: 6720.00, lotSize: 125, strikeStep: 50, trendBias: 0.20, atmIv: 17.1 },
  { symbol: 'CIPLA', name: 'Cipla Ltd.', sector: 'Healthcare / Pharma', weightage: 0.70, basePrice: 1625.00, lotSize: 650, strikeStep: 10, trendBias: 0.40, atmIv: 17.5 },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', sector: 'Healthcare', weightage: 0.65, basePrice: 7180.00, lotSize: 125, strikeStep: 50, trendBias: 0.55, atmIv: 20.4 },
  { symbol: 'DIVISLAB', name: "Divi's Laboratories", sector: 'Healthcare / Pharma', weightage: 0.60, basePrice: 5340.00, lotSize: 200, strikeStep: 50, trendBias: 0.35, atmIv: 22.0 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd.', sector: 'Metals & Mining', weightage: 0.85, basePrice: 1015.00, lotSize: 675, strikeStep: 10, trendBias: 0.25, atmIv: 24.8 },
  { symbol: 'HINDALCO', name: 'Hindalco Industries', sector: 'Metals & Mining', weightage: 0.90, basePrice: 735.00, lotSize: 1400, strikeStep: 10, trendBias: 0.45, atmIv: 26.2 },
  { symbol: 'GRASIM', name: 'Grasim Industries', sector: 'Materials', weightage: 0.70, basePrice: 2740.00, lotSize: 250, strikeStep: 20, trendBias: 0.15, atmIv: 19.8 },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd.', sector: 'Automobile', weightage: 0.65, basePrice: 4890.00, lotSize: 175, strikeStep: 50, trendBias: 0.50, atmIv: 21.5 },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', sector: 'Automobile', weightage: 0.55, basePrice: 5680.00, lotSize: 150, strikeStep: 50, trendBias: 0.30, atmIv: 22.3 },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd.', sector: 'Automobile', weightage: 0.85, basePrice: 12150.00, lotSize: 75, strikeStep: 100, trendBias: 0.65, atmIv: 21.0 },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd.', sector: 'Banking', weightage: 0.75, basePrice: 1450.00, lotSize: 500, strikeStep: 10, trendBias: -0.45, atmIv: 23.8 },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corp', sector: 'Energy / Oil', weightage: 0.50, basePrice: 358.00, lotSize: 1800, strikeStep: 5, trendBias: -0.15, atmIv: 24.5 },
  { symbol: 'TRENT', name: 'Trent Ltd.', sector: 'Retail / Consumer', weightage: 0.95, basePrice: 7650.00, lotSize: 100, strikeStep: 50, trendBias: 0.85, atmIv: 31.0 },
  { symbol: 'BEL', name: 'Bharat Electronics Ltd.', sector: 'Capital Goods / Defence', weightage: 0.80, basePrice: 298.50, lotSize: 2850, strikeStep: 2.5, trendBias: 0.70, atmIv: 27.5 },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Co.', sector: 'Financial Services', weightage: 0.60, basePrice: 1765.00, lotSize: 750, strikeStep: 10, trendBias: 0.10, atmIv: 16.5 },
];

/**
 * Calculates stock-specific technicals and F&O signal independently
 */
export function generateStockAnalysis(
  cfg: BaseStockConfig,
  niftyTrend: MarketTrend = 'BULLISH',
  liveOverride?: {
    price: number;
    change: number;
    changePercent: number;
    dayHigh: number;
    dayLow: number;
    previousClose: number;
    open: number;
  }
): StockConstituent {
  // If live data is available, prioritize real exchange figures
  let currentPrice = liveOverride ? liveOverride.price : cfg.basePrice;
  let previousClose = liveOverride ? liveOverride.previousClose : cfg.basePrice;
  let change = liveOverride ? liveOverride.change : 0;
  let changePercent = liveOverride ? liveOverride.changePercent : 0;
  let dayHigh = liveOverride ? liveOverride.dayHigh : currentPrice;
  let dayLow = liveOverride ? liveOverride.dayLow : currentPrice;
  let open = liveOverride ? liveOverride.open : previousClose;

  if (!liveOverride) {
    const deltaPct = cfg.trendBias * 1.2 + (Math.random() - 0.48) * 0.8;
    currentPrice = Number((cfg.basePrice * (1 + deltaPct / 100)).toFixed(2));
    previousClose = cfg.basePrice;
    change = Number((currentPrice - previousClose).toFixed(2));
    changePercent = Number(((change / previousClose) * 100).toFixed(2));
    dayHigh = Number((Math.max(currentPrice, previousClose) + Math.random() * (currentPrice * 0.008)).toFixed(2));
    dayLow = Number((Math.min(currentPrice, previousClose) - Math.random() * (currentPrice * 0.008)).toFixed(2));
    open = Number((previousClose + (Math.random() - 0.5) * (currentPrice * 0.004)).toFixed(2));
  }

  const volume = Math.floor(850000 + Math.random() * 2500000);
  const vwap = Number((currentPrice - (cfg.trendBias * currentPrice * 0.003)).toFixed(2));

  // Indicators
  const rsi14 = Number((50 + cfg.trendBias * 18 + (Math.random() - 0.5) * 6).toFixed(1));
  const adx14 = Number((22 + Math.abs(cfg.trendBias) * 12).toFixed(1));
  const pcr = Number((1.0 + cfg.trendBias * 0.35 + (Math.random() - 0.5) * 0.1).toFixed(2));

  // Determine Trend
  let trend: MarketTrend = 'SIDEWAYS';
  if (cfg.trendBias >= 0.3 && (currentPrice >= vwap || rsi14 >= 50)) {
    trend = 'BULLISH';
  } else if (cfg.trendBias <= -0.3 && (currentPrice <= vwap || rsi14 <= 50)) {
    trend = 'BEARISH';
  }

  // Market Regime
  let marketRegime: MarketRegime = 'TRENDING';
  if (adx14 < 20) marketRegime = 'RANGE-BOUND';
  else if (Math.abs(changePercent) > 2.0) marketRegime = 'BREAKOUT';
  else if (cfg.atmIv > 25) marketRegime = 'HIGH-VOLATILITY';

  // Compare with NIFTY confirmation (Section 16 requirement)
  let niftyAlignment: 'STRONG_ALIGNMENT' | 'PARTIAL' | 'CONFLICTING' = 'PARTIAL';
  if (trend === niftyTrend && trend !== 'SIDEWAYS') {
    niftyAlignment = 'STRONG_ALIGNMENT';
  } else if (
    (niftyTrend === 'BULLISH' && trend === 'BEARISH') ||
    (niftyTrend === 'BEARISH' && trend === 'BULLISH')
  ) {
    niftyAlignment = 'CONFLICTING';
  }

  // Independent Signal Generation
  let signal: SignalType = 'NO TRADE';
  let confidence = Math.min(92, Math.max(48, Math.round(52 + Math.abs(cfg.trendBias) * 35 + (niftyAlignment === 'STRONG_ALIGNMENT' ? 10 : 0))));

  const reasons: string[] = [];
  const risks: string[] = [];

  if (niftyAlignment === 'CONFLICTING') {
    // Reduce confidence and prefer NO TRADE when stock strongly contradicts index
    signal = 'NO TRADE';
    confidence = 46;
    reasons.push(`${cfg.symbol} trend (${trend}) conflicts with NIFTY 50 (${niftyTrend}).`);
    reasons.push('Index headwind reduces directional breakout follow-through.');
    risks.push('Divergence between index heavyweight and market breadth.');
  } else if (trend === 'BULLISH') {
    signal = 'BUY CALL';
    reasons.push(`Holding steadily above VWAP (₹${vwap.toLocaleString('en-IN')}).`);
    reasons.push(`Positive RSI momentum at ${rsi14} with strong volume support.`);
    reasons.push(`Put writing concentration visible at nearest round strike.`);
    if (niftyAlignment === 'STRONG_ALIGNMENT') {
      reasons.push(`Trend confirmed by broader NIFTY 50 bullish market structure.`);
    }
    risks.push(`Immediate resistance near day high (₹${dayHigh.toLocaleString('en-IN')}).`);
    risks.push(`Option theta decay if consolidation emerges.`);
  } else if (trend === 'BEARISH') {
    signal = 'BUY PUT';
    reasons.push(`Trading below VWAP (₹${vwap.toLocaleString('en-IN')}) with selling pressure.`);
    reasons.push(`Weak RSI at ${rsi14} confirming downward momentum.`);
    reasons.push(`Call buildup capping upside moves.`);
    risks.push(`Support floor near day low (₹${dayLow.toLocaleString('en-IN')}).`);
    risks.push(`Short-covering risk if sector banking/IT rallies.`);
  } else {
    signal = 'NO TRADE';
    confidence = 50;
    reasons.push(`Stock is oscillating in a tight range around VWAP.`);
    reasons.push(`Balanced Put and Call open interest with no clear institutional bias.`);
    risks.push('Buying options in low-momentum chop leads to theta decay.');
  }

  return {
    symbol: cfg.symbol,
    name: cfg.name,
    sector: cfg.sector,
    weightage: cfg.weightage,
    currentPrice,
    previousClose,
    change,
    changePercent,
    dayHigh,
    dayLow,
    open,
    volume,
    vwap,
    lotSize: cfg.lotSize,
    fAndOEnabled: true,
    strikeStep: cfg.strikeStep,
    trend,
    marketRegime,
    signal,
    confidence,
    rsi14,
    adx14,
    pcr,
    atmIv: cfg.atmIv,
    reasons,
    risks,
    niftyAlignment,
  };
}

/**
 * Builds Flattrade-style Option Chain for a specific stock
 */
export function generateStockOptionChain(
  stock: StockConstituent,
  strikeRangeCount = 11,
  expiryString = '08-OCT-2026 (Weekly Expiry)',
  customDte?: number,
  customIv?: number
): OptionChainSummary {
  const spotPrice = stock.currentPrice;
  const step = stock.strikeStep;
  const atmStrike = Math.round(spotPrice / step) * step;

  const strikes: OptionStrikeRow[] = [];
  const halfCount = Math.floor(strikeRangeCount / 2);
  const startStrike = atmStrike - halfCount * step;

  const isNifty = stock.symbol === 'NIFTY 50';

  // Days to expiry based on selected expiry or custom DTE
  let daysToExpiry = 5;
  if (customDte !== undefined) {
    daysToExpiry = customDte;
  } else if (expiryString.includes('0 DTE') || expiryString.includes('Today Expiry')) {
    daysToExpiry = 0.2;
  } else if (expiryString.includes('1 DTE') || expiryString.includes('Tomorrow')) {
    daysToExpiry = 1.0;
  } else if (expiryString.includes('15-OCT')) {
    daysToExpiry = 12;
  } else if (expiryString.includes('22-OCT')) {
    daysToExpiry = 19;
  } else if (expiryString.includes('29-OCT')) {
    daysToExpiry = 26;
  } else if (expiryString.includes('26-NOV')) {
    daysToExpiry = 54;
  } else if (!isNifty) {
    daysToExpiry = 26; // Stock options on NSE are monthly
  }

  const baseIv = customIv !== undefined
    ? Math.max(0.08, customIv / 100)
    : Math.max(0.10, (stock.atmIv || (isNifty ? 14.46 : 18.5)) / 100);
  const spotChange = stock.change || (isNifty ? -198.50 : 0);

  let totalCallOi = 0;
  let totalPutOi = 0;
  let totalCallVol = 0;
  let totalPutVol = 0;

  let maxCallOi = -1;
  let majorCallRes = atmStrike + step * 2;
  let maxPutOi = -1;
  let majorPutSupp = atmStrike - step * 2;

  for (let i = 0; i < strikeRangeCount; i++) {
    const strike = Number((startStrike + i * step).toFixed(2));
    const isAtm = Math.abs(strike - atmStrike) < step / 2;

    // Calculate official Black-Scholes pricing
    const bs = calculateNseOptionPrice(
      spotPrice,
      strike,
      daysToExpiry,
      baseIv,
      0.065,
      spotChange
    );

    // Realistic Open Interest & Volume distributions for NSE contracts
    let callOi: number;
    let putOi: number;

    if (isNifty) {
      // NSE NIFTY 50 contracts: Open interest quoted in Lakhs (e.g. 15L to 135L)
      const diffFromAtm = (strike - atmStrike) / step;
      const callBase = Math.floor(7500000 / (1 + Math.pow(Math.abs(strike - (atmStrike + step * 2)) / (step * 3), 1.5)));
      const putBase = Math.floor(7800000 / (1 + Math.pow(Math.abs(strike - (atmStrike - step * 2)) / (step * 3), 1.5)));

      callOi = strike === atmStrike + step * 2 ? 13420000 : callBase;
      putOi = strike === atmStrike - step * 2 ? 12850000 : putBase;

      // Deep OTM / ITM falloff matching reference image (e.g. 0.28L, 0.51L)
      if (diffFromAtm < -4) callOi = Math.floor(28000 + Math.random() * 25000);
      if (diffFromAtm > 4) putOi = Math.floor(32000 + Math.random() * 30000);
    } else {
      // Stock options open interest
      const callBase = Math.floor(450000 / (1 + Math.pow(Math.abs(strike - (atmStrike + step * 2)) / (step * 2), 1.5)));
      const putBase = Math.floor(480000 / (1 + Math.pow(Math.abs(strike - (atmStrike - step * 2)) / (step * 2), 1.5)));
      callOi = isAtm ? callBase * 1.8 : callBase;
      putOi = isAtm ? putBase * 1.8 : putBase;
    }

    const callChangeOi = Math.floor((Math.random() - 0.4) * (callOi * 0.15));
    const putChangeOi = Math.floor((Math.random() - 0.35) * (putOi * 0.15));

    const callVol = Math.floor(callOi * 0.42);
    const putVol = Math.floor(putOi * 0.42);

    totalCallOi += callOi;
    totalPutOi += putOi;
    totalCallVol += callVol;
    totalPutVol += putVol;

    if (callOi > maxCallOi) {
      maxCallOi = callOi;
      majorCallRes = strike;
    }
    if (putOi > maxPutOi) {
      maxPutOi = putOi;
      majorPutSupp = strike;
    }

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
        buildup: callChangeOi > 0 ? 'SHORT_BUILDUP' : 'SHORT_COVERING',
        intrinsicValue: bs.callIntrinsic,
        timeValue: bs.callTimeValue,
        delta: bs.callDelta,
        theta: bs.callTheta,
        gamma: bs.gamma,
        vega: bs.vega,
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
        buildup: putChangeOi > 0 ? 'LONG_BUILDUP' : 'LONG_UNWINDING',
        intrinsicValue: bs.putIntrinsic,
        timeValue: bs.putTimeValue,
        delta: bs.putDelta,
        theta: bs.putTheta,
        gamma: bs.gamma,
        vega: bs.vega,
      },
      isAtm,
      isItmCall: spotPrice > strike,
      isItmPut: spotPrice < strike,
    });
  }

  const oiPcr = totalCallOi > 0 ? Number((totalPutOi / totalCallOi).toFixed(2)) : 1.0;
  const volumePcr = totalCallVol > 0 ? Number((totalPutVol / totalCallVol).toFixed(2)) : 1.0;

  const isNiftyIndex = stock.symbol === 'NIFTY 50';

  return {
    spotPrice,
    expiryDate: expiryString,
    availableExpiries: isNiftyIndex
      ? [
          '08-OCT-2026 (Weekly Expiry)',
          'Today Expiry (0 DTE)',
          'Tomorrow (1 DTE)',
          '15-OCT-2026 (Weekly Expiry)',
          '22-OCT-2026 (Weekly Expiry)',
          '29-OCT-2026 (Monthly Expiry)',
          '26-NOV-2026 (Monthly Expiry)',
        ]
      : ['29-OCT-2026 (Monthly Expiry)', '26-NOV-2026 (Monthly Expiry)'],
    strikes,
    totalCallOi,
    totalPutOi,
    changeInCallOi: Math.floor(totalCallOi * 0.05),
    changeInPutOi: Math.floor(totalPutOi * 0.06),
    oiPcr,
    volumePcr,
    pcrTrend: oiPcr > 1.0 ? 'BULLISH' : oiPcr < 0.85 ? 'BEARISH' : 'NEUTRAL',
    majorCallResistance: majorCallRes,
    majorPutSupport: majorPutSupp,
    maxPain: atmStrike,
    atmIv: stock.atmIv,
    ivRegime: stock.atmIv > 24 ? 'HIGH' : stock.atmIv < 14 ? 'LOW' : 'NORMAL',
    ivTrend: 'STABLE',
  };
}

/**
 * Builds all 50 constituents dynamically, applying live quote overrides if available
 */
export function getAllNifty50Stocks(
  niftyTrend: MarketTrend = 'BULLISH',
  liveOverrides?: Record<string, {
    price: number;
    change: number;
    changePercent: number;
    dayHigh: number;
    dayLow: number;
    previousClose: number;
    open: number;
  }>
): StockConstituent[] {
  return NIFTY_50_BASE_CONSTITUENTS.map((cfg) => {
    const override = liveOverrides?.[cfg.symbol];
    return generateStockAnalysis(cfg, niftyTrend, override);
  });
}

/**
 * Creates the NIFTY 50 Index constituent object for F&O analysis & Option Chain
 */
export function getNifty50IndexStock(
  spotPrice: number = 22421.95,
  trend: MarketTrend = 'BULLISH',
  vixValue: number = 14.46
): StockConstituent {
  const previousClose = 22620.45;
  const change = Number((spotPrice - previousClose).toFixed(2));
  const changePercent = Number(((change / previousClose) * 100).toFixed(2));

  return {
    symbol: 'NIFTY 50',
    name: 'NIFTY 50 Index',
    sector: 'NSE Benchmark Index',
    weightage: 100,
    currentPrice: spotPrice,
    previousClose,
    change,
    changePercent,
    dayHigh: Math.max(spotPrice, 22610.60),
    dayLow: Math.min(spotPrice, 22217.30),
    open: 22446.00,
    volume: 28400000,
    vwap: Number((spotPrice - 6.5).toFixed(2)),
    lotSize: 25,
    fAndOEnabled: true,
    strikeStep: 50,
    trend,
    marketRegime: 'TRENDING',
    signal: trend === 'BULLISH' ? 'BUY CALL' : trend === 'BEARISH' ? 'BUY PUT' : 'NO TRADE',
    confidence: 78,
    rsi14: 56.4,
    adx14: 24.2,
    pcr: 1.05,
    atmIv: vixValue,
    reasons: ['Broad-market technical momentum above VWAP', 'Strong institutional Put writing at lower strikes'],
    risks: ['Intraday volatility near resistance ceilings', 'Global macro headwinds'],
    niftyAlignment: 'STRONG_ALIGNMENT',
  };
}
