/**
 * Technical Indicators Engine for NIFTY 50 F&O
 * Pure mathematical functions for calculation and signal detection
 */

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number[] {
  if (data.length < period) return [];
  const sma: number[] = [];
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  sma.push(sum / period);

  for (let i = period; i < data.length; i++) {
    sum += data[i] - data[i - period];
    sma.push(sum / period);
  }
  return sma;
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number[] {
  if (data.length < period) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [];

  // Initial SMA as the seed
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  let currentEma = sum / period;
  ema.push(currentEma);

  for (let i = period; i < data.length; i++) {
    currentEma = data[i] * k + currentEma * (1 - k);
    ema.push(currentEma);
  }
  return ema;
}

/**
 * Calculates Volume Weighted Average Price (VWAP)
 * VWAP = sum(typicalPrice * volume) / sum(volume)
 */
export function calculateVWAP(candles: Candle[]): number[] {
  if (candles.length === 0) return [];
  const vwap: number[] = [];
  let cumulativeTypicalVolume = 0;
  let cumulativeVolume = 0;

  for (const c of candles) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumulativeTypicalVolume += typicalPrice * c.volume;
    cumulativeVolume += c.volume;
    vwap.push(cumulativeVolume > 0 ? cumulativeTypicalVolume / cumulativeVolume : typicalPrice);
  }
  return vwap;
}

/**
 * Calculates Relative Strength Index (RSI 14)
 */
export function calculateRSI(closes: number[], period = 14): number[] {
  if (closes.length <= period) return [];

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(Math.max(0, change));
    losses.push(Math.max(0, -change));
  }

  const rsi: number[] = [];
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const initialRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(100 - 100 / (1 + initialRs));

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - 100 / (1 + rs));
  }

  return rsi;
}

/**
 * Calculates MACD (12, 26, 9)
 */
export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macdLine: number[]; signalLine: number[]; histogram: number[] } {
  const fastEma = calculateEMA(closes, fastPeriod);
  const slowEma = calculateEMA(closes, slowPeriod);

  // Align fast EMA with slow EMA
  const offset = slowPeriod - fastPeriod;
  const macdLine: number[] = [];

  for (let i = 0; i < slowEma.length; i++) {
    macdLine.push(fastEma[i + offset] - slowEma[i]);
  }

  const signalLine = calculateEMA(macdLine, signalPeriod);
  const signalOffset = signalPeriod - 1;

  const histogram: number[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + signalOffset] - signalLine[i]);
  }

  return {
    macdLine: macdLine.slice(signalOffset),
    signalLine,
    histogram,
  };
}

/**
 * Calculates Bollinger Bands (20, 2)
 */
export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDevMultiplier = 2
): { upper: number[]; middle: number[]; lower: number[]; bandwidth: number[] } {
  if (closes.length < period) return { upper: [], middle: [], lower: [], bandwidth: [] };

  const sma = calculateSMA(closes, period);
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];
  const bandwidth: number[] = [];

  for (let i = 0; i < sma.length; i++) {
    const slice = closes.slice(i, i + period);
    const mean = sma[i];
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const up = mean + stdDevMultiplier * stdDev;
    const low = mean - stdDevMultiplier * stdDev;
    upper.push(up);
    middle.push(mean);
    lower.push(low);
    bandwidth.push(mean > 0 ? (up - low) / mean : 0);
  }

  return { upper, middle, lower, bandwidth };
}

/**
 * Calculates Average True Range (ATR 14)
 */
export function calculateATR(candles: Candle[], period = 14): number[] {
  if (candles.length <= period) return [];

  const tr: number[] = [];
  tr.push(candles[0].high - candles[0].low);

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const trueRange = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    tr.push(trueRange);
  }

  // Wilder's smoothing
  const atr: number[] = [];
  let currentAtr = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  atr.push(currentAtr);

  for (let i = period; i < tr.length; i++) {
    currentAtr = (currentAtr * (period - 1) + tr[i]) / period;
    atr.push(currentAtr);
  }

  return atr;
}

/**
 * Calculates Average Directional Index (ADX 14)
 */
export function calculateADX(candles: Candle[], period = 14): number[] {
  if (candles.length <= period * 2) return [];

  const tr: number[] = [];
  const plusDm: number[] = [];
  const minusDm: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];

    const upMove = curr.high - prev.high;
    const downMove = prev.low - curr.low;

    plusDm.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDm.push(downMove > upMove && downMove > 0 ? downMove : 0);

    const trueRange = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
    tr.push(trueRange);
  }

  let smoothedTr = tr.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothedPlusDm = plusDm.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothedMinusDm = minusDm.slice(0, period).reduce((a, b) => a + b, 0);

  const dxValues: number[] = [];

  for (let i = period; i < tr.length; i++) {
    if (i > period) {
      smoothedTr = smoothedTr - smoothedTr / period + tr[i];
      smoothedPlusDm = smoothedPlusDm - smoothedPlusDm / period + plusDm[i];
      smoothedMinusDm = smoothedMinusDm - smoothedMinusDm / period + minusDm[i];
    }

    const plusDi = smoothedTr > 0 ? (smoothedPlusDm / smoothedTr) * 100 : 0;
    const minusDi = smoothedTr > 0 ? (smoothedMinusDm / smoothedTr) * 100 : 0;
    const diSum = plusDi + minusDi;
    const dx = diSum > 0 ? (Math.abs(plusDi - minusDi) / diSum) * 100 : 0;
    dxValues.push(dx);
  }

  if (dxValues.length < period) return [];

  // ADX is EMA/SMA of DX
  return calculateSMA(dxValues, period);
}

/**
 * Calculates Supertrend indicator (10, 3)
 */
export function calculateSupertrend(
  candles: Candle[],
  period = 10,
  multiplier = 3
): { values: number[]; directions: ('BULLISH' | 'BEARISH')[] } {
  const atr = calculateATR(candles, period);
  if (atr.length === 0) return { values: [], directions: [] };

  const offset = candles.length - atr.length;
  const values: number[] = [];
  const directions: ('BULLISH' | 'BEARISH')[] = [];

  let prevUpper = 0;
  let prevLower = 0;
  let prevSupertrend = 0;
  let prevDirection: 'BULLISH' | 'BEARISH' = 'BULLISH';

  for (let i = 0; i < atr.length; i++) {
    const candle = candles[i + offset];
    const currentAtr = atr[i];
    const basicUpper = (candle.high + candle.low) / 2 + multiplier * currentAtr;
    const basicLower = (candle.high + candle.low) / 2 - multiplier * currentAtr;

    const prevCandleClose = i > 0 ? candles[i + offset - 1].close : candle.close;

    // Final upper band
    const finalUpper =
      i === 0 || basicUpper < prevUpper || prevCandleClose > prevUpper
        ? basicUpper
        : prevUpper;

    // Final lower band
    const finalLower =
      i === 0 || basicLower > prevLower || prevCandleClose < prevLower
        ? basicLower
        : prevLower;

    let currentSupertrend = finalUpper;
    let currentDirection: 'BULLISH' | 'BEARISH' = 'BEARISH';

    if (i === 0) {
      currentDirection = candle.close > finalUpper ? 'BULLISH' : 'BEARISH';
      currentSupertrend = currentDirection === 'BULLISH' ? finalLower : finalUpper;
    } else {
      if (prevSupertrend === prevUpper) {
        currentDirection = candle.close > finalUpper ? 'BULLISH' : 'BEARISH';
      } else {
        currentDirection = candle.close < finalLower ? 'BEARISH' : 'BULLISH';
      }
      currentSupertrend = currentDirection === 'BULLISH' ? finalLower : finalUpper;
    }

    values.push(currentSupertrend);
    directions.push(currentDirection);

    prevUpper = finalUpper;
    prevLower = finalLower;
    prevSupertrend = currentSupertrend;
    prevDirection = currentDirection;
  }

  return { values, directions };
}

/**
 * Calculates Fibonacci retracement levels from a swing high and low
 */
export function calculateFibonacci(high: number, low: number): {
  high: number;
  low: number;
  level236: number;
  level382: number;
  level500: number;
  level618: number;
  level786: number;
} {
  const diff = high - low;
  return {
    high,
    low,
    level236: Number((high - diff * 0.236).toFixed(2)),
    level382: Number((high - diff * 0.382).toFixed(2)),
    level500: Number((high - diff * 0.5).toFixed(2)),
    level618: Number((high - diff * 0.618).toFixed(2)),
    level786: Number((high - diff * 0.786).toFixed(2)),
  };
}
