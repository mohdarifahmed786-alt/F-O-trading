import { describe, it, expect } from 'vitest';
import {
  classifyBuildup,
  calculateMaxPain,
  analyzeOptionChain,
} from '../engine/optionsAnalysis';
import { OptionStrikeRow } from '../types/market';

describe('Options Chain & PCR Analysis Engine', () => {
  it('classifies option market buildups correctly', () => {
    // Price UP, OI UP -> LONG_BUILDUP
    expect(classifyBuildup(15, 25000)).toBe('LONG_BUILDUP');

    // Price DOWN, OI UP -> SHORT_BUILDUP (Call Writing or Put Writing)
    expect(classifyBuildup(-12, 18000)).toBe('SHORT_BUILDUP');

    // Price UP, OI DOWN -> SHORT_COVERING
    expect(classifyBuildup(20, -15000)).toBe('SHORT_COVERING');

    // Price DOWN, OI DOWN -> LONG_UNWINDING
    expect(classifyBuildup(-15, -12000)).toBe('LONG_UNWINDING');

    // Negligible OI change -> NEUTRAL
    expect(classifyBuildup(10, 500)).toBe('NEUTRAL');
  });

  it('calculates Max Pain strike and analyzes option chain metrics', () => {
    const mockStrikes: OptionStrikeRow[] = [
      {
        strikePrice: 24700,
        call: { strike: 24700, ltp: 180, change: 5, oi: 50000, changeOi: 2000, volume: 20000, iv: 13.5, bid: 179, ask: 181, buildup: 'LONG_BUILDUP' },
        put: { strike: 24700, ltp: 30, change: -4, oi: 150000, changeOi: 12000, volume: 50000, iv: 14.0, bid: 29, ask: 31, buildup: 'LONG_BUILDUP' },
        isAtm: false,
        isItmCall: true,
        isItmPut: false,
      },
      {
        strikePrice: 24800,
        call: { strike: 24800, ltp: 95, change: 2, oi: 120000, changeOi: 8000, volume: 60000, iv: 13.8, bid: 94, ask: 96, buildup: 'SHORT_BUILDUP' },
        put: { strike: 24800, ltp: 85, change: -2, oi: 130000, changeOi: 9000, volume: 65000, iv: 13.8, bid: 84, ask: 86, buildup: 'SHORT_BUILDUP' },
        isAtm: true,
        isItmCall: false,
        isItmPut: false,
      },
      {
        strikePrice: 24900,
        call: { strike: 24900, ltp: 35, change: -3, oi: 200000, changeOi: 25000, volume: 80000, iv: 14.2, bid: 34, ask: 36, buildup: 'SHORT_BUILDUP' },
        put: { strike: 24900, ltp: 175, change: 6, oi: 40000, changeOi: -1000, volume: 25000, iv: 14.5, bid: 174, ask: 176, buildup: 'SHORT_COVERING' },
        isAtm: false,
        isItmCall: false,
        isItmPut: true,
      },
    ];

    const maxPain = calculateMaxPain(mockStrikes);
    expect(maxPain).toBe(24800);

    const summary = analyzeOptionChain(24800, '08-OCT-2026', ['08-OCT-2026'], mockStrikes);

    // Call Wall should be at 24900 (200,000 OI)
    expect(summary.majorCallResistance).toBe(24900);

    // Put Wall should be at 24700 (150,000 OI)
    expect(summary.majorPutSupport).toBe(24700);

    // Total Call OI = 50k + 120k + 200k = 370k
    // Total Put OI = 150k + 130k + 40k = 320k
    expect(summary.totalCallOi).toBe(370000);
    expect(summary.totalPutOi).toBe(320000);
    expect(summary.oiPcr).toBeCloseTo(320000 / 370000, 2);
  });
});
