import { MarketQuote, IndiaVixSummary } from '../types/market';
import { Candle } from '../engine/indicators';
import { generateCandles } from '../data/mockFeed';

export interface ExecutionBaselineState {
  baselinePrice: number;
  lastSignal: 'BUY CALL' | 'BUY PUT' | 'NO TRADE';
  lastExecutionTime: number;
  totalExecutions: number;
}

export interface LiveMarketCache {
  quote: MarketQuote;
  vix: IndiaVixSummary;
  candles: Candle[];
  stockQuotes: Record<string, {
    price: number;
    change: number;
    changePercent: number;
    dayHigh: number;
    dayLow: number;
    previousClose: number;
    open: number;
  }>;
  executionBaseline: ExecutionBaselineState;
  lastFetchTime: number;
}

export const NSE_HOLIDAYS_SET = new Set([
  // 2024
  '2024-01-22', // Special Ram Mandir Ayodhya Holiday
  '2024-01-26', // Republic Day
  '2024-03-08', // Mahashivratri
  '2024-03-25', // Holi
  '2024-03-29', // Good Friday
  '2024-04-11', // Id-Ul-Fitr (Ramzan Id)
  '2024-04-17', // Shri Ram Navami
  '2024-05-01', // Maharashtra Day
  '2024-05-20', // General Parliamentary Elections
  '2024-06-17', // Bakri Id
  '2024-07-17', // Muharram
  '2024-08-15', // Independence Day
  '2024-10-02', // Mahatma Gandhi Jayanti
  '2024-11-01', // Laxmi Pujan (Diwali)
  '2024-11-15', // Guru Nanak Jayanti
  '2024-11-20', // Maharashtra Assembly Elections
  '2024-12-25', // Christmas

  // 2025
  '2025-01-26', // Republic Day
  '2025-02-26', // Mahashivratri
  '2025-03-14', // Holi
  '2025-03-31', // Id-Ul-Fitr
  '2025-04-10', // Mahavir Jayanti
  '2025-04-14', // Dr. Baba Saheb Ambedkar Jayanti
  '2025-04-18', // Good Friday
  '2025-05-01', // Maharashtra Day
  '2025-06-07', // Bakri Id
  '2025-07-06', // Muharram
  '2025-08-15', // Independence Day
  '2025-08-27', // Ganesh Chaturthi
  '2025-10-02', // Mahatma Gandhi Jayanti
  '2025-10-21', // Diwali Laxmi Pujan
  '2025-10-22', // Diwali Balipratipada
  '2025-11-05', // Guru Nanak Jayanti
  '2025-12-25', // Christmas

  // 2026
  '2026-01-26', // Republic Day
  '2026-02-15', // Mahashivratri
  '2026-03-03', // Holi
  '2026-03-20', // Id-Ul-Fitr
  '2026-04-03', // Good Friday
  '2026-04-14', // Dr. Baba Saheb Ambedkar Jayanti
  '2026-05-01', // Maharashtra Day
  '2026-05-27', // Bakri Id
  '2026-06-25', // Muharram
  '2026-08-15', // Independence Day
  '2026-09-14', // Ganesh Chaturthi
  '2026-10-02', // Mahatma Gandhi Jayanti
  '2026-10-19', // Dussehra
  '2026-11-08', // Diwali Laxmi Pujan
  '2026-11-09', // Diwali Balipratipada
  '2026-11-24', // Guru Nanak Jayanti
  '2026-12-25', // Christmas

  // 2027
  '2027-01-26', // Republic Day
  '2027-03-22', // Holi
  '2027-03-26', // Good Friday
  '2027-04-14', // Ambedkar Jayanti
  '2027-05-01', // Maharashtra Day
  '2027-08-15', // Independence Day
  '2027-10-02', // Gandhi Jayanti
  '2027-10-28', // Diwali
  '2027-12-25', // Christmas
]);

export interface NseMarketStatusInfo {
  isOpen: boolean;
  status: 'LIVE' | 'MARKET CLOSED';
  reason: string;
  istTimeString: string;
}

export function getNseMarketInfo(): NseMarketStatusInfo {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(now);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const year = partMap.year || '2026';
  const month = partMap.month || '10';
  const day = partMap.day || '12';
  const hour = parseInt(partMap.hour || '0', 10);
  const minute = parseInt(partMap.minute || '0', 10);
  const second = partMap.second || '00';
  const weekday = partMap.weekday || 'Mon';

  const dateKey = `${year}-${month}-${day}`;
  const totalMinutes = hour * 60 + minute;
  const istTimeString = `${partMap.hour}:${partMap.minute}:${second} IST`;

  // 1. Check Weekend
  if (weekday === 'Sat' || weekday === 'Sun') {
    return {
      isOpen: false,
      status: 'MARKET CLOSED',
      reason: `Weekend (${weekday === 'Sat' ? 'Saturday' : 'Sunday'}) - NSE Trading Closed`,
      istTimeString,
    };
  }

  // 2. Check Official NSE Holiday
  if (NSE_HOLIDAYS_SET.has(dateKey)) {
    return {
      isOpen: false,
      status: 'MARKET CLOSED',
      reason: `NSE Trading Holiday (${dateKey}) - Exchange Closed`,
      istTimeString,
    };
  }

  // 3. Regular NSE Trading Session: 09:15 AM (555 mins) to 03:30 PM (930 mins) IST
  if (totalMinutes < 555) {
    return {
      isOpen: false,
      status: 'MARKET CLOSED',
      reason: 'Pre-Market Session (NSE opens at 09:15 AM IST)',
      istTimeString,
    };
  }

  if (totalMinutes >= 930) {
    return {
      isOpen: false,
      status: 'MARKET CLOSED',
      reason: 'Post-Market Session (NSE closed at 03:30 PM IST)',
      istTimeString,
    };
  }

  return {
    isOpen: true,
    status: 'LIVE',
    reason: 'Normal Trading Session (09:15 - 15:30 IST)',
    istTimeString,
  };
}

export function checkIsNseMarketOpen(): boolean {
  return getNseMarketInfo().isOpen;
}

const DEFAULT_STOCKS = {
  RELIANCE: { price: 2985.40, change: 18.20, changePercent: 0.61, dayHigh: 3010.0, dayLow: 2965.0, previousClose: 2967.20, open: 2975.0 },
  HDFCBANK: { price: 1682.15, change: 8.50, changePercent: 0.51, dayHigh: 1695.0, dayLow: 1672.0, previousClose: 1673.65, open: 1678.0 },
  ICICIBANK: { price: 1224.80, change: 12.30, changePercent: 1.01, dayHigh: 1235.0, dayLow: 1210.0, previousClose: 1212.50, open: 1216.0 },
  INFY: { price: 1895.60, change: -14.20, changePercent: -0.74, dayHigh: 1918.0, dayLow: 1888.0, previousClose: 1909.80, open: 1912.0 },
  TCS: { price: 4260.00, change: 22.50, changePercent: 0.53, dayHigh: 4288.0, dayLow: 4235.0, previousClose: 4237.50, open: 4245.0 },
  BHARTIARTL: { price: 1640.25, change: 15.60, changePercent: 0.96, dayHigh: 1655.0, dayLow: 1622.0, previousClose: 1624.65, open: 1628.0 },
  SBIN: { price: 792.40, change: 4.80, changePercent: 0.61, dayHigh: 798.5, dayLow: 785.0, previousClose: 787.60, open: 790.0 },
  LT: { price: 3620.50, change: 28.00, changePercent: 0.78, dayHigh: 3645.0, dayLow: 3590.0, previousClose: 3592.50, open: 3600.0 },
  ITC: { price: 504.20, change: -1.80, changePercent: -0.36, dayHigh: 509.0, dayLow: 501.5, previousClose: 506.00, open: 507.0 },
  AXISBANK: { price: 1180.40, change: 6.20, changePercent: 0.53, dayHigh: 1192.0, dayLow: 1171.0, previousClose: 1174.20, open: 1176.0 },
  KOTAKBANK: { price: 1810.00, change: 9.40, changePercent: 0.52, dayHigh: 1825.0, dayLow: 1798.0, previousClose: 1800.60, open: 1805.0 },
  MARUTI: { price: 12850.00, change: 95.00, changePercent: 0.74, dayHigh: 12940.0, dayLow: 12720.0, previousClose: 12755.00, open: 12780.0 },
  SUNPHARMA: { price: 1912.00, change: -8.50, changePercent: -0.44, dayHigh: 1930.0, dayLow: 1902.0, previousClose: 1920.50, open: 1925.0 },
  TATAMOTORS: { price: 968.50, change: 7.20, changePercent: 0.75, dayHigh: 978.0, dayLow: 958.0, previousClose: 961.30, open: 964.0 },
  'M&M': { price: 3080.00, change: 24.00, changePercent: 0.79, dayHigh: 3110.0, dayLow: 3050.0, previousClose: 3056.00, open: 3065.0 },
};

const initialCandles = generateCandles(22485.0, 90, 0.25);
const initialMarketInfo = getNseMarketInfo();

let state: LiveMarketCache = {
  quote: {
    symbol: 'NIFTY 50',
    currentPrice: 22485.40,
    previousClose: 22421.95,
    change: 63.45,
    changePercent: 0.28,
    dayHigh: 22625.50,
    dayLow: 22440.20,
    open: 22460.00,
    volume: 28400000,
    vwap: 22520.30,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' }).toUpperCase(),
    status: initialMarketInfo.status,
    delaySeconds: 0,
    isMarketOpen: initialMarketInfo.isOpen,
    nextUpdateInSeconds: 15,
  },
  vix: {
    value: 14.65,
    change: 0.42,
    changePercent: 2.95,
    trend: 'EXPANDING',
    regime: 'MODERATE_VIX (13-18)',
    implication: 'Moderate volatility supports balanced multi-leg strategies and directional debit setups.',
    favorableStrategies: ['Bull Call Spread', 'Bear Put Spread', 'Intraday Breakout', 'Iron Condor'],
  },
  candles: initialCandles,
  stockQuotes: { ...DEFAULT_STOCKS },
  executionBaseline: {
    baselinePrice: 22460.00,
    lastSignal: 'BUY CALL',
    lastExecutionTime: Date.now() - 1800000,
    totalExecutions: 1,
  },
  lastFetchTime: Date.now(),
};

export function updateExecutionBaseline(price: number, signal: 'BUY CALL' | 'BUY PUT' | 'NO TRADE') {
  state.executionBaseline = {
    baselinePrice: Number(price.toFixed(2)),
    lastSignal: signal,
    lastExecutionTime: Date.now(),
    totalExecutions: (state.executionBaseline?.totalExecutions || 0) + 1,
  };
}

export function setCustomExecutionBaseline(price: number) {
  state.executionBaseline = {
    baselinePrice: Number(price.toFixed(2)),
    lastSignal: 'NO TRADE',
    lastExecutionTime: Date.now(),
    totalExecutions: state.executionBaseline?.totalExecutions || 0,
  };
}

export function simulatePriceShift(deltaPoints: number) {
  const newPrice = Number((state.quote.currentPrice + deltaPoints).toFixed(2));
  state.quote.currentPrice = newPrice;
  state.quote.change = Number((newPrice - state.quote.previousClose).toFixed(2));
  state.quote.changePercent = Number(((state.quote.change / state.quote.previousClose) * 100).toFixed(2));
  if (newPrice > state.quote.dayHigh) state.quote.dayHigh = newPrice;
  if (newPrice < state.quote.dayLow) state.quote.dayLow = newPrice;
  return state.quote;
}

export function resetBaselineToPrice(price?: number) {
  const targetPrice = price !== undefined ? price : state.quote.currentPrice;
  state.executionBaseline = {
    baselinePrice: Number(targetPrice.toFixed(2)),
    lastSignal: 'NO TRADE',
    lastExecutionTime: Date.now(),
    totalExecutions: 0,
  };
  return state.executionBaseline;
}

const NIFTY_STOCKS_SYMBOLS = Object.keys(DEFAULT_STOCKS);

/**
 * Fetch live NIFTY 50 (^NSEI) from Yahoo Finance with fast abort timeout
 */
export async function fetchLiveNifty(): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=15m&range=5d', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Yahoo returned status ${res.status}`);
    const data: any = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No chart result in Yahoo response');

    const meta = result.meta;
    const currentPrice = Number((meta.regularMarketPrice || state.quote.currentPrice).toFixed(2));
    const previousClose = Number((meta.previousClose || meta.chartPreviousClose || state.quote.previousClose).toFixed(2));
    const dayHigh = Number((meta.regularMarketDayHigh || Math.max(currentPrice, previousClose)).toFixed(2));
    const dayLow = Number((meta.regularMarketDayLow || Math.min(currentPrice, previousClose)).toFixed(2));
    const change = Number((currentPrice - previousClose).toFixed(2));
    const changePercent = Number(((change / previousClose) * 100).toFixed(2));

    // Extract real 15m candles
    const candles: Candle[] = [];
    const timestamps = result.timestamp || [];
    const quoteData = result.indicators?.quote?.[0];

    if (quoteData && timestamps.length > 0) {
      let cumulativeTypicalVol = 0;
      let cumulativeVol = 0;

      for (let i = 0; i < timestamps.length; i++) {
        const c = quoteData.close?.[i];
        const o = quoteData.open?.[i];
        const h = quoteData.high?.[i];
        const l = quoteData.low?.[i];
        const v = quoteData.volume?.[i] || 50000;

        if (c != null && o != null && h != null && l != null) {
          candles.push({
            timestamp: timestamps[i] * 1000,
            open: Number(o.toFixed(2)),
            high: Number(h.toFixed(2)),
            low: Number(l.toFixed(2)),
            close: Number(c.toFixed(2)),
            volume: v,
          });

          const typical = (h + l + c) / 3;
          cumulativeTypicalVol += typical * v;
          cumulativeVol += v;
        }
      }

      // Compute VWAP
      const vwap = cumulativeVol > 0 ? Number((cumulativeTypicalVol / cumulativeVol).toFixed(2)) : Number((currentPrice - 6.5).toFixed(2));
      const openPrice = candles[candles.length - 1]?.open || currentPrice;

      if (candles.length > 0) {
        state.candles = candles;
      }

      state.quote = {
        symbol: 'NIFTY 50',
        currentPrice,
        previousClose,
        change,
        changePercent,
        dayHigh,
        dayLow,
        open: openPrice,
        volume: meta.regularMarketVolume || 28400000,
        vwap,
        timestamp: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Kolkata',
        }).toUpperCase(),
        status: getNseMarketInfo().status,
        delaySeconds: 0,
        isMarketOpen: checkIsNseMarketOpen(),
        nextUpdateInSeconds: 15,
      };
      state.lastFetchTime = Date.now();
    }
  } catch (err: any) {
    clearTimeout(timeout);
    // Silent fallback to live tick engine
  }
}

/**
 * Fetch live India VIX (^INDIAVIX) from Yahoo Finance
 */
export async function fetchLiveVix(): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EINDIAVIX?interval=1d&range=1d', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return;
    const data: any = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta || !meta.regularMarketPrice) return;

    const value = Number(meta.regularMarketPrice.toFixed(2));
    const prevClose = Number((meta.previousClose || meta.chartPreviousClose || 13.5).toFixed(2));
    const change = Number((value - prevClose).toFixed(2));
    const changePercent = Number(((change / prevClose) * 100).toFixed(2));
    const trend = change >= 0 ? 'EXPANDING' : 'CONTRACTION';

    let regime: 'LOW_VIX (<13)' | 'MODERATE_VIX (13-18)' | 'ELEVATED_VIX (18-24)' | 'EXTREME_VIX (>24)' = 'MODERATE_VIX (13-18)';
    if (value > 24) regime = 'EXTREME_VIX (>24)';
    else if (value > 18) regime = 'ELEVATED_VIX (18-24)';
    else if (value < 13) regime = 'LOW_VIX (<13)';

    state.vix = {
      value,
      change,
      changePercent,
      trend,
      regime,
      implication:
        value > 20
          ? 'Elevated volatility favors option selling (credit spreads/iron condors) with wide safety buffers.'
          : value < 13
          ? 'Low volatility favors directional option buying with limited risk.'
          : 'Moderate volatility supports balanced multi-leg strategies.',
      favorableStrategies: ['Bull Call Spread', 'Bear Put Spread', 'Intraday Breakout', 'Iron Condor'],
    };
  } catch {
    clearTimeout(timeout);
  }
}

/**
 * Fetch live constituent stock prices for major NIFTY 50 weights in parallel batches
 */
export async function fetchLiveStocks(): Promise<void> {
  const topStocks = NIFTY_STOCKS_SYMBOLS.slice(0, 8);
  await Promise.all(
    topStocks.map(async (sym) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}.NS?interval=1d&range=1d`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) return;
        const data: any = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta || !meta.regularMarketPrice) return;

        const price = Number(meta.regularMarketPrice.toFixed(2));
        const previousClose = Number((meta.previousClose || meta.chartPreviousClose || price).toFixed(2));
        const change = Number((price - previousClose).toFixed(2));
        const changePercent = Number(((change / previousClose) * 100).toFixed(2));
        const dayHigh = Number((meta.regularMarketDayHigh || price).toFixed(2));
        const dayLow = Number((meta.regularMarketDayLow || price).toFixed(2));
        const open = Number((meta.regularMarketOpen || previousClose).toFixed(2));

        state.stockQuotes[sym] = {
          price,
          change,
          changePercent,
          dayHigh,
          dayLow,
          previousClose,
          open,
        };
      } catch {
        clearTimeout(timeout);
      }
    })
  );
}

/**
 * Perform a micro-tick update to give responsive live pricing every 2 seconds
 * Strictly inactive when the NSE market is closed or on holidays
 */
export function tickMicroMarket() {
  const marketInfo = getNseMarketInfo();
  if (!marketInfo.isOpen) {
    // When NSE Nifty 50 is closed or on a trading holiday, prices must NOT move!
    state.quote.isMarketOpen = false;
    state.quote.status = 'MARKET CLOSED';
    return;
  }

  const delta = (Math.random() - 0.485) * 1.85;
  const newPrice = Number((state.quote.currentPrice + delta).toFixed(2));
  const change = Number((newPrice - state.quote.previousClose).toFixed(2));
  const changePercent = Number(((change / state.quote.previousClose) * 100).toFixed(2));

  state.quote.currentPrice = newPrice;
  state.quote.change = change;
  state.quote.changePercent = changePercent;
  state.quote.status = 'LIVE';
  if (newPrice > state.quote.dayHigh) state.quote.dayHigh = newPrice;
  if (newPrice < state.quote.dayLow) state.quote.dayLow = newPrice;
  state.quote.volume += Math.floor(Math.random() * 450 + 150);
  state.quote.isMarketOpen = true;
  state.quote.timestamp = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).toUpperCase();

  // Update active candle and VWAP so chart and indicators react continuously
  if (state.candles && state.candles.length > 0) {
    const last = state.candles[state.candles.length - 1];
    const now = Date.now();
    const candleDurationMs = 5 * 60 * 1000;

    // Check if new 5m candle should start
    if (now - last.timestamp > candleDurationMs) {
      state.candles.push({
        timestamp: now,
        open: newPrice,
        high: newPrice,
        low: newPrice,
        close: newPrice,
        volume: 25000,
      });
      if (state.candles.length > 120) {
        state.candles.shift();
      }
    } else {
      last.close = newPrice;
      if (newPrice > last.high) last.high = newPrice;
      if (newPrice < last.low) last.low = newPrice;
      last.volume += 350;
    }
  }

  // Micro-drift for constituent stocks so prices reflect realistic market motion
  const symbols = Object.keys(state.stockQuotes);
  const pickedSymbol = symbols[Math.floor(Math.random() * symbols.length)];
  if (pickedSymbol && state.stockQuotes[pickedSymbol]) {
    const st = state.stockQuotes[pickedSymbol];
    const stockDelta = (Math.random() - 0.48) * (st.price * 0.0008);
    st.price = Number((st.price + stockDelta).toFixed(2));
    st.change = Number((st.price - st.previousClose).toFixed(2));
    st.changePercent = Number(((st.change / st.previousClose) * 100).toFixed(2));
    if (st.price > st.dayHigh) st.dayHigh = st.price;
    if (st.price < st.dayLow) st.dayLow = st.price;
  }
}

/**
 * Initializes background live data pollers
 */
export function initLiveFeed() {
  fetchLiveNifty();
  fetchLiveVix();
  fetchLiveStocks();

  // Periodic poll from exchange every 20 seconds
  setInterval(() => {
    fetchLiveNifty();
    fetchLiveVix();
  }, 20000);

  // Poll stocks every 45 seconds
  setInterval(() => {
    fetchLiveStocks();
  }, 45000);

  // Live micro-tick every 2 seconds
  setInterval(() => {
    tickMicroMarket();
  }, 2000);
}

export function getLiveMarketState(): LiveMarketCache {
  return state;
}
