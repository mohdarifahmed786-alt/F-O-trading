import { OptionChainSummary, OptionStrikeRow, OptionContract } from '../types/market';

/**
 * Classifies option buildup based on price and OI change
 */
export function classifyBuildup(
  priceChange: number,
  oiChange: number
): 'LONG_BUILDUP' | 'SHORT_BUILDUP' | 'SHORT_COVERING' | 'LONG_UNWINDING' | 'NEUTRAL' {
  if (Math.abs(oiChange) < 1000) return 'NEUTRAL';

  if (priceChange > 0 && oiChange > 0) return 'LONG_BUILDUP';
  if (priceChange < 0 && oiChange > 0) return 'SHORT_BUILDUP';
  if (priceChange > 0 && oiChange < 0) return 'SHORT_COVERING';
  if (priceChange < 0 && oiChange < 0) return 'LONG_UNWINDING';

  return 'NEUTRAL';
}

/**
 * Calculates Max Pain strike for the option chain
 * Max Pain = strike where total loss of option buyers is maximized (and sellers' payout minimized)
 */
export function calculateMaxPain(strikes: OptionStrikeRow[]): number {
  if (strikes.length === 0) return 0;

  let minLoss = Infinity;
  let maxPainStrike = strikes[0].strikePrice;

  for (const targetStrike of strikes) {
    const spot = targetStrike.strikePrice;
    let totalLoss = 0;

    for (const row of strikes) {
      // Call buyers payout if spot > row.strikePrice
      if (spot > row.strikePrice) {
        totalLoss += (spot - row.strikePrice) * row.call.oi;
      }
      // Put buyers payout if spot < row.strikePrice
      if (spot < row.strikePrice) {
        totalLoss += (row.strikePrice - spot) * row.put.oi;
      }
    }

    if (totalLoss < minLoss) {
      minLoss = totalLoss;
      maxPainStrike = spot;
    }
  }

  return maxPainStrike;
}

/**
 * Analyzes option chain and returns comprehensive summary metrics
 */
export function analyzeOptionChain(
  spotPrice: number,
  expiryDate: string,
  availableExpiries: string[],
  strikes: OptionStrikeRow[]
): OptionChainSummary {
  let totalCallOi = 0;
  let totalPutOi = 0;
  let totalCallVolume = 0;
  let totalPutVolume = 0;
  let changeInCallOi = 0;
  let changeInPutOi = 0;

  let maxCallOi = -1;
  let majorCallResistance = spotPrice + 200;

  let maxPutOi = -1;
  let majorPutSupport = spotPrice - 200;

  let atmStrikeRow: OptionStrikeRow | undefined;
  let minAtmDistance = Infinity;

  for (const row of strikes) {
    totalCallOi += row.call.oi;
    totalPutOi += row.put.oi;
    totalCallVolume += row.call.volume;
    totalPutVolume += row.put.volume;
    changeInCallOi += row.call.changeOi;
    changeInPutOi += row.put.changeOi;

    // Call Wall (Highest Call OI)
    if (row.call.oi > maxCallOi) {
      maxCallOi = row.call.oi;
      majorCallResistance = row.strikePrice;
    }

    // Put Wall (Highest Put OI)
    if (row.put.oi > maxPutOi) {
      maxPutOi = row.put.oi;
      majorPutSupport = row.strikePrice;
    }

    // Find ATM strike
    const distance = Math.abs(row.strikePrice - spotPrice);
    if (distance < minAtmDistance) {
      minAtmDistance = distance;
      atmStrikeRow = row;
    }
  }

  const oiPcr = totalCallOi > 0 ? Number((totalPutOi / totalCallOi).toFixed(2)) : 1.0;
  const volumePcr = totalCallVolume > 0 ? Number((totalPutVolume / totalCallVolume).toFixed(2)) : 1.0;

  // PCR trend analysis
  let pcrTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (oiPcr > 1.15 && changeInPutOi > changeInCallOi) {
    pcrTrend = 'BULLISH';
  } else if (oiPcr < 0.85 && changeInCallOi > changeInPutOi) {
    pcrTrend = 'BEARISH';
  }

  // ATM IV
  const atmIv = atmStrikeRow ? Number(((atmStrikeRow.call.iv + atmStrikeRow.put.iv) / 2).toFixed(1)) : 14.0;

  let ivRegime: 'LOW' | 'NORMAL' | 'HIGH' = 'NORMAL';
  if (atmIv < 12) ivRegime = 'LOW';
  else if (atmIv > 17) ivRegime = 'HIGH';

  // Max Pain
  const maxPain = calculateMaxPain(strikes);

  return {
    spotPrice,
    expiryDate,
    availableExpiries,
    strikes,
    totalCallOi,
    totalPutOi,
    changeInCallOi,
    changeInPutOi,
    oiPcr,
    volumePcr,
    pcrTrend,
    majorCallResistance,
    majorPutSupport,
    maxPain,
    atmIv,
    ivRegime,
    ivTrend: 'STABLE',
  };
}
