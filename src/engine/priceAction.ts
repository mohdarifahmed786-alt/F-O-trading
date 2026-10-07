import { Candle } from './indicators';

export interface PriceActionAnalysis {
  structure: 'HIGHER_HIGHS_HIGHER_LOWS' | 'LOWER_HIGHS_LOWER_LOWS' | 'SIDEWAYS';
  supportLevels: number[];
  resistanceLevels: number[];
  breakout: 'BULLISH_BREAKOUT' | 'BEARISH_BREAKDOWN' | 'NONE';
  retestDetected: boolean;
  gapType: 'GAP_UP' | 'GAP_DOWN' | 'FLAT';
  gapSize: number;
  openingRange: {
    high: number;
    low: number;
    breakout: 'UP' | 'DOWN' | 'INSIDE';
  };
  pdh: number;
  pdl: number;
  pdc: number;
  confirmationScore: number; // 0-100% confirmation to filter noise
}

/**
 * Identifies swing highs and lows in price series
 */
export function identifySwingPoints(candles: Candle[], window = 3): {
  swingHighs: { price: number; index: number }[];
  swingLows: { price: number; index: number }[];
} {
  const swingHighs: { price: number; index: number }[] = [];
  const swingLows: { price: number; index: number }[] = [];

  for (let i = window; i < candles.length - window; i++) {
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;

    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= window; j++) {
      if (candles[i - j].high >= currentHigh || candles[i + j].high > currentHigh) {
        isHigh = false;
      }
      if (candles[i - j].low <= currentLow || candles[i + j].low < currentLow) {
        isLow = false;
      }
    }

    if (isHigh) swingHighs.push({ price: currentHigh, index: i });
    if (isLow) swingLows.push({ price: currentLow, index: i });
  }

  return { swingHighs, swingLows };
}

/**
 * Analyzes market structure: Higher Highs / Higher Lows vs Lower Highs / Lower Lows
 */
export function determineMarketStructure(
  swingHighs: { price: number }[],
  swingLows: { price: number }[]
): 'HIGHER_HIGHS_HIGHER_LOWS' | 'LOWER_HIGHS_LOWER_LOWS' | 'SIDEWAYS' {
  if (swingHighs.length < 2 || swingLows.length < 2) return 'SIDEWAYS';

  const lastHigh = swingHighs[swingHighs.length - 1].price;
  const prevHigh = swingHighs[swingHighs.length - 2].price;

  const lastLow = swingLows[swingLows.length - 1].price;
  const prevLow = swingLows[swingLows.length - 2].price;

  if (lastHigh > prevHigh && lastLow > prevLow) {
    return 'HIGHER_HIGHS_HIGHER_LOWS';
  } else if (lastHigh < prevHigh && lastLow < prevLow) {
    return 'LOWER_HIGHS_LOWER_LOWS';
  }
  return 'SIDEWAYS';
}

/**
 * Identifies key support and resistance clusters from swings and historical levels
 */
export function calculateSupportResistance(
  currentPrice: number,
  swingHighs: { price: number }[],
  swingLows: { price: number }[],
  pdh: number,
  pdl: number,
  pdc: number
): { supportLevels: number[]; resistanceLevels: number[] } {
  const resistances: number[] = [];
  const supports: number[] = [];

  // Add PDH / PDL / PDC
  if (pdh > currentPrice) resistances.push(pdh);
  else supports.push(pdh);

  if (pdl < currentPrice) supports.push(pdl);
  else resistances.push(pdl);

  if (pdc > currentPrice) resistances.push(pdc);
  else supports.push(pdc);

  for (const sh of swingHighs) {
    if (sh.price > currentPrice && !resistances.some(r => Math.abs(r - sh.price) < 25)) {
      resistances.push(Number(sh.price.toFixed(1)));
    }
  }

  for (const sl of swingLows) {
    if (sl.price < currentPrice && !supports.some(s => Math.abs(s - sl.price) < 25)) {
      supports.push(Number(sl.price.toFixed(1)));
    }
  }

  // Sort resistances ascending, supports descending
  resistances.sort((a, b) => a - b);
  supports.sort((a, b) => b - a);

  // Fallback defaults if none detected
  if (resistances.length === 0) {
    resistances.push(Math.round(currentPrice / 100) * 100 + 100);
    resistances.push(Math.round(currentPrice / 100) * 100 + 200);
  }
  if (supports.length === 0) {
    supports.push(Math.round(currentPrice / 100) * 100 - 100);
    supports.push(Math.round(currentPrice / 100) * 100 - 200);
  }

  return {
    supportLevels: supports.slice(0, 3),
    resistanceLevels: resistances.slice(0, 3),
  };
}

/**
 * Noise reduction filter: validates breakouts with volume confirmation,
 * candle body close, and retest
 */
export function evaluateBreakoutConfirmation(
  currentPrice: number,
  lastCandle: Candle,
  support: number,
  resistance: number,
  avgVolume: number
): {
  breakout: 'BULLISH_BREAKOUT' | 'BEARISH_BREAKDOWN' | 'NONE';
  retestDetected: boolean;
  confirmationScore: number;
} {
  let breakout: 'BULLISH_BREAKOUT' | 'BEARISH_BREAKDOWN' | 'NONE' = 'NONE';
  let retestDetected = false;
  let confirmationScore = 0;

  const candleBody = Math.abs(lastCandle.close - lastCandle.open);
  const candleRange = lastCandle.high - lastCandle.low;
  const isSolidCandle = candleRange > 0 && candleBody / candleRange >= 0.55;
  const hasVolumeSpike = lastCandle.volume >= avgVolume * 1.25;

  // Bullish Breakout Check: Candle must close ABOVE resistance, not just wick
  if (currentPrice > resistance && lastCandle.close > resistance) {
    breakout = 'BULLISH_BREAKOUT';
    confirmationScore += 35; // Closed above level
    if (isSolidCandle) confirmationScore += 25; // Decisive body
    if (hasVolumeSpike) confirmationScore += 25; // Volume expansion
    if (lastCandle.low <= resistance && lastCandle.close > resistance) {
      retestDetected = true; // Tested resistance as new support
      confirmationScore += 15;
    }
  } else if (currentPrice < support && lastCandle.close < support) {
    breakout = 'BEARISH_BREAKDOWN';
    confirmationScore += 35;
    if (isSolidCandle) confirmationScore += 25;
    if (hasVolumeSpike) confirmationScore += 25;
    if (lastCandle.high >= support && lastCandle.close < support) {
      retestDetected = true; // Tested support as new resistance
      confirmationScore += 15;
    }
  }

  return { breakout, retestDetected, confirmationScore };
}
