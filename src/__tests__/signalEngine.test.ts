import { describe, it, expect } from 'vitest';
import { evaluateSignal, SignalInputs } from '../engine/signalEngine';
import { generateCandles, buildTechnicalIndicators, generateOptionChain, buildMultiTimeframeSummary, SAMPLE_NEWS } from '../data/mockFeed';

describe('Signal Engine & Confluence Filtering', () => {
  it('enforces NO TRADE when live data is unavailable', () => {
    const spot = 24850;
    const candles = generateCandles(spot, 100);
    const indicators = buildTechnicalIndicators(candles, spot);
    const optionChain = generateOptionChain(spot);
    const mtf = buildMultiTimeframeSummary();

    const inputs: SignalInputs = {
      spotPrice: spot,
      indicators,
      optionChain,
      vix: { value: 13.5, change: -0.2, changePercent: -1.4, trend: 'CONTRACTION', regime: 'MODERATE_VIX (13-18)', implication: '', favorableStrategies: [] },
      mtf,
      recentNews: SAMPLE_NEWS,
      isMarketOpen: true,
      isLiveAvailable: false, // Live data disconnected!
      dataDelaySeconds: 0,
    };

    const result = evaluateSignal(inputs);
    expect(result.signal).toBe('NO TRADE');
    expect(result.confidence).toBe(0);
    expect(result.status).toBe('WAIT');
    expect(result.reasons[0]).toContain('Live market data stream is disconnected');
  });

  it('enforces NO TRADE when multi-timeframes conflict', () => {
    const spot = 24850;
    const candles = generateCandles(spot, 100);
    const indicators = buildTechnicalIndicators(candles, spot);
    const optionChain = generateOptionChain(spot);
    const mtf = buildMultiTimeframeSummary();
    mtf.overallTrend = 'CONFLICTING';
    mtf.agreementPercentage = 40;

    const inputs: SignalInputs = {
      spotPrice: spot,
      indicators,
      optionChain,
      vix: { value: 13.5, change: -0.2, changePercent: -1.4, trend: 'CONTRACTION', regime: 'MODERATE_VIX (13-18)', implication: '', favorableStrategies: [] },
      mtf,
      recentNews: SAMPLE_NEWS,
      isMarketOpen: true,
      isLiveAvailable: true,
      dataDelaySeconds: 0,
    };

    const result = evaluateSignal(inputs);
    expect(result.signal).toBe('NO TRADE');
    expect(result.status).toBe('WAIT');
  });

  it('generates 99% Human IQ Level Signal with 5 institutional pillars and execution vector', () => {
    const spot = 22421.95;
    const candles = generateCandles(spot, 100);
    const indicators = buildTechnicalIndicators(candles, spot);
    const optionChain = generateOptionChain(spot);
    const mtf = buildMultiTimeframeSummary();

    const inputs: SignalInputs = {
      spotPrice: spot,
      indicators,
      optionChain,
      vix: { value: 14.46, change: 0.97, changePercent: 7.19, trend: 'EXPANDING', regime: 'MODERATE_VIX (13-18)', implication: '', favorableStrategies: [] },
      mtf,
      recentNews: SAMPLE_NEWS,
      isMarketOpen: true,
      isLiveAvailable: true,
      dataDelaySeconds: 0,
    };

    const result = evaluateSignal(inputs);
    expect(result.humanIqSignal).toBeDefined();
    const iq = result.humanIqSignal!;

    expect(iq.iqScore).toBe(99);
    expect(iq.confluencePercent).toBe(99);
    expect(iq.rating).toBe('TOP 1% SUPERFORECASTER');
    expect(iq.pillars.length).toBe(5);
    expect(iq.thesis.length).toBeGreaterThan(20);
    expect(iq.executionVector.recommendedContract).toContain('NIFTY');
    expect(iq.executionVector.stopLoss).toBeGreaterThan(0);
    expect(iq.executionVector.target1).toBeGreaterThan(0);
    expect(iq.executionVector.riskRewardRatio).toBeDefined();
    expect(iq.trapDetection.detected).toBe(true);
  });
});
