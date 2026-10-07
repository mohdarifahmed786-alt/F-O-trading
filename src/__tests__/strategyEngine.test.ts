import { describe, it, expect } from 'vitest';
import { roundToStrike, buildStrategy, selectOptimalStrategy } from '../engine/strategyEngine';

describe('F&O Strategy Engine', () => {
  it('rounds prices to nearest 50-point NIFTY strike', () => {
    expect(roundToStrike(24823.5)).toBe(24800);
    expect(roundToStrike(24825.0)).toBe(24850);
    expect(roundToStrike(24874.9)).toBe(24850);
    expect(roundToStrike(24876.0)).toBe(24900);
  });

  it('builds defined-risk Bull Call Spread with correct payoff parameters', () => {
    const strat = buildStrategy('bull-call-spread', 24850, 'BUY CALL', 'TRENDING');
    expect(strat.id).toBe('bull-call-spread');
    expect(strat.legs.length).toBe(2);
    expect(strat.legs[0].action).toBe('BUY');
    expect(strat.legs[0].optionType).toBe('CE');
    expect(strat.legs[1].action).toBe('SELL');
    expect(strat.legs[1].optionType).toBe('CE');
    expect(strat.stopLoss).toBeLessThan(24850);
    expect(strat.target1).toBeGreaterThan(24850);
  });

  it('builds Range-Bound Iron Condor with 4 defined-risk wings', () => {
    const strat = buildStrategy('iron-condor', 24800, 'NO TRADE', 'RANGE-BOUND');
    expect(strat.id).toBe('iron-condor');
    expect(strat.legs.length).toBe(4);
    expect(strat.legs.some(l => l.optionType === 'CE' && l.action === 'SELL')).toBe(true);
    expect(strat.legs.some(l => l.optionType === 'PE' && l.action === 'SELL')).toBe(true);
  });

  it('selects optimal strategy dynamically based on regime and IV', () => {
    // Bullish trend with normal IV -> Bull Call Spread
    const bullStrat = selectOptimalStrategy('BUY CALL', 'TRENDING', 24850, 14.0);
    expect(bullStrat.id).toBe('bull-call-spread');

    // Bullish breakout -> VWAP Breakout
    const breakoutStrat = selectOptimalStrategy('BUY CALL', 'BREAKOUT', 24850, 14.0);
    expect(breakoutStrat.id).toBe('vwap-breakout');

    // Low IV (<13) bullish -> Long Call
    const lowIvStrat = selectOptimalStrategy('BUY CALL', 'TRENDING', 24850, 11.5);
    expect(lowIvStrat.id).toBe('long-call');

    // NO TRADE -> Iron Condor
    const neutralStrat = selectOptimalStrategy('NO TRADE', 'RANGE-BOUND', 24850, 13.0);
    expect(neutralStrat.id).toBe('iron-condor');
  });
});
