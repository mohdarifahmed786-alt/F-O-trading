import { describe, it, expect } from 'vitest';
import { evaluateSignal, SignalInputs } from '../engine/signalEngine';
import { generateCandles, buildTechnicalIndicators, generateOptionChain, buildMultiTimeframeSummary, SAMPLE_NEWS } from '../data/mockFeed';
import { IndiaVixSummary } from '../types/market';

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

  it('immediately issues BUY PUT when NIFTY drops and never issues BUY CALL on downward move', () => {
    const spot = 22380.0; // Dropped 105 points from 22485
    const netChange = -105.4;
    const candles = generateCandles(spot, 100, -0.4, netChange);
    const indicators = buildTechnicalIndicators(candles, spot);
    const optionChain = generateOptionChain(spot, netChange);
    const mtf = buildMultiTimeframeSummary(spot, netChange, indicators);

    const inputs: SignalInputs = {
      spotPrice: spot,
      indicators,
      optionChain,
      vix: { value: 16.2, change: 1.5, changePercent: 10.2, trend: 'EXPANDING', regime: 'MODERATE_VIX (13-18)', implication: '', favorableStrategies: [] },
      mtf,
      recentNews: SAMPLE_NEWS,
      isMarketOpen: true,
      isLiveAvailable: true,
      dataDelaySeconds: 0,
      dayChange: netChange,
      dayOpen: 22480.0,
      previousClose: 22485.4,
    };

    const result = evaluateSignal(inputs);
    // Must immediately signal BUY PUT, NEVER BUY CALL!
    expect(result.signal).toBe('BUY PUT');
    expect(result.trend).toBe('BEARISH');
    expect(result.suggestedStrategy.category).toBe('BEARISH');
    expect(result.humanIqSignal?.executionVector.recommendedContract).toContain('PE');
    expect(result.reasons.some(r => r.includes('trading down') || r.includes('cannot sustain') || r.includes('VWAP'))).toBe(true);
  });

  it('immediately switches to BUY PUT when NIFTY drops 20 points and cannot sustain an upward move', () => {
    // Spot is near 22460, dropped 25 points from previous close 22485
    const spot = 22460.0;
    const netChange = -25.0; // Dropped 25 points (>= 20 pt trigger)
    const candles = generateCandles(spot, 100, -0.2, netChange);
    const indicators = buildTechnicalIndicators(candles, spot);
    indicators.vwap.value = 22485.0; // VWAP is overhead
    indicators.vwap.relation = 'BELOW';
    indicators.supertrend.direction = 'BEARISH';
    indicators.emas.ema9 = 22470.0;
    indicators.emas.ema20 = 22475.0;
    indicators.priceAction.structure = 'LOWER_HIGHS_LOWER_LOWS';
    const optionChain = generateOptionChain(spot, netChange);
    const mtf = buildMultiTimeframeSummary(spot, netChange, indicators);

    const inputs: SignalInputs = {
      spotPrice: spot,
      indicators,
      optionChain,
      vix: { value: 14.8, change: 0.3, changePercent: 2.1, trend: 'EXPANDING', regime: 'MODERATE_VIX (13-18)', implication: '', favorableStrategies: [] },
      mtf,
      recentNews: SAMPLE_NEWS,
      isMarketOpen: true,
      isLiveAvailable: true,
      dataDelaySeconds: 0,
      dayChange: netChange,
      dayOpen: 22485.0,
      previousClose: 22485.0,
      dayHigh: 22488.0,
      dayLow: 22455.0,
      candles,
      recentTrajectory: -25.0,
    };

    const result = evaluateSignal(inputs);
    // Dropped 25 points (>= 20 pts threshold) -> immediate BUY PUT
    expect(result.signal).toBe('BUY PUT');
    expect(result.trend).toBe('BEARISH');
    expect(result.confidence).toBeGreaterThanOrEqual(80);
    expect(result.suggestedStrategy.legs[0].optionType).toBe('PE');
  });

  it('signals BUY CALL when NIFTY moves up from -165 to -115 (recovering +50 pts) and never signals BUY PUT on upward move', () => {
    // Index moved from -165 to -115 (rising +50 pts off intraday low)
    const prevClose = 22485.0;
    const dayLow = 22320.0; // was at -165 pts
    const spot = 22370.0; // currently at -115 pts (recovered +50 pts!)
    const netChange = -115.0;

    const candles = generateCandles(spot, 100, 0.3, 50.0);
    const indicators = buildTechnicalIndicators(candles, spot);
    // Price holding above 9 EMA on the recovery
    indicators.emas.ema9 = 22355.0;
    indicators.emas.ema20 = 22350.0;
    indicators.rsi14.value = 52.0;
    indicators.rsi14.condition = 'NEUTRAL';
    const optionChain = generateOptionChain(spot, netChange);
    const mtf = buildMultiTimeframeSummary(spot, netChange, indicators);

    const inputs: SignalInputs = {
      spotPrice: spot,
      indicators,
      optionChain,
      vix: { value: 14.2, change: -0.3, changePercent: -2.1, trend: 'CONTRACTION', regime: 'MODERATE_VIX (13-18)', implication: '', favorableStrategies: [] },
      mtf,
      recentNews: SAMPLE_NEWS,
      isMarketOpen: true,
      isLiveAvailable: true,
      dataDelaySeconds: 0,
      dayChange: netChange,
      dayOpen: 22450.0,
      previousClose: prevClose,
      dayLow: dayLow,
      dayHigh: 22460.0,
      recentTrajectory: 50.0, // moved +50 pts upwards
    };

    const result = evaluateSignal(inputs);
    // Market is going UP: Must signal BUY CALL, NEVER BUY PUT!
    expect(result.signal).toBe('BUY CALL');
    expect(result.trend).toBe('BULLISH');
    expect(result.suggestedStrategy.legs[0].optionType).toBe('CE');
    expect(result.humanIqSignal?.executionVector.recommendedContract).toContain('CE');
    expect(result.reasons.some(r => r.includes('actively moving up') || r.includes('rebounded') || r.includes('rising'))).toBe(true);
  });

  it('signals BUY CALL when market is about to go up and sustains above VWAP', () => {
    const spot = 22520.0;
    const netChange = 45.0;
    const candles = generateCandles(spot, 100, 0.4, netChange);
    const indicators = buildTechnicalIndicators(candles, spot);
    indicators.vwap.value = 22490.0;
    indicators.vwap.relation = 'ABOVE';
    indicators.supertrend.direction = 'BULLISH';
    const optionChain = generateOptionChain(spot, netChange);
    const mtf = buildMultiTimeframeSummary(spot, netChange, indicators);

    const inputs: SignalInputs = {
      spotPrice: spot,
      indicators,
      optionChain,
      vix: { value: 13.8, change: -0.4, changePercent: -2.8, trend: 'CONTRACTION', regime: 'MODERATE_VIX (13-18)', implication: '', favorableStrategies: [] },
      mtf,
      recentNews: SAMPLE_NEWS,
      isMarketOpen: true,
      isLiveAvailable: true,
      dataDelaySeconds: 0,
      dayChange: netChange,
      dayOpen: 22475.0,
      previousClose: 22475.0,
    };

    const result = evaluateSignal(inputs);
    expect(result.signal).toBe('BUY CALL');
    expect(result.trend).toBe('BULLISH');
    expect(result.suggestedStrategy.legs[0].optionType).toBe('CE');
    expect(result.humanIqSignal?.executionVector.recommendedContract).toContain('CE');
  });

  describe('20-Point Dynamic Directional Impulse Rule', () => {
    it('triggers Call Buy when NIFTY 50 moves upward by 20 points', () => {
      const spot = 22425.0; // Moved upward by 25 points from 22400 base
      const netChange = 25.0;
      const candles = generateCandles(spot, 100, 0.3, netChange);
      const indicators = buildTechnicalIndicators(candles, spot);
      indicators.emas.ema9 = 22410.0;
      const optionChain = generateOptionChain(spot, netChange);
      const mtf = buildMultiTimeframeSummary(spot, netChange, indicators);

      const inputs: SignalInputs = {
        spotPrice: spot,
        indicators,
        optionChain,
        vix: { value: 14.0, change: 0.1, changePercent: 0.7, trend: 'STABLE', regime: 'MODERATE_VIX (13-18)', implication: '', favorableStrategies: [] },
        mtf,
        recentNews: SAMPLE_NEWS,
        isMarketOpen: true,
        isLiveAvailable: true,
        dataDelaySeconds: 0,
        dayChange: netChange,
        dayOpen: 22400.0,
        previousClose: 22400.0,
        dayLow: 22395.0,
        dayHigh: 22430.0,
        recentTrajectory: 25.0,
      };

      const result = evaluateSignal(inputs);
      expect(result.signal).toBe('BUY CALL');
      expect(result.trend).toBe('BULLISH');
      expect(result.pointImpulseTrigger?.status).toBe('CALL_BUY');
      expect(result.pointImpulseTrigger?.description).toContain('Call Buy');
      expect(result.pointImpulseTrigger?.netMove).toBeGreaterThanOrEqual(20);
    });

    it('triggers Put Buy when NIFTY 50 drops by 20 points', () => {
      const spot = 22380.0; // Dropped by 25 points from 22405
      const netChange = -25.0;
      const candles = generateCandles(spot, 100, -0.3, netChange);
      const indicators = buildTechnicalIndicators(candles, spot);
      indicators.emas.ema9 = 22395.0;
      const optionChain = generateOptionChain(spot, netChange);
      const mtf = buildMultiTimeframeSummary(spot, netChange, indicators);

      const inputs: SignalInputs = {
        spotPrice: spot,
        indicators,
        optionChain,
        vix: { value: 15.5, change: 0.8, changePercent: 5.4, trend: 'EXPANDING', regime: 'MODERATE_VIX (13-18)', implication: '', favorableStrategies: [] },
        mtf,
        recentNews: SAMPLE_NEWS,
        isMarketOpen: true,
        isLiveAvailable: true,
        dataDelaySeconds: 0,
        dayChange: netChange,
        dayOpen: 22405.0,
        previousClose: 22405.0,
        dayLow: 22375.0,
        dayHigh: 22410.0,
        recentTrajectory: -25.0,
      };

      const result = evaluateSignal(inputs);
      expect(result.signal).toBe('BUY PUT');
      expect(result.trend).toBe('BEARISH');
      expect(result.pointImpulseTrigger?.status).toBe('PUT_BUY');
      expect(result.pointImpulseTrigger?.description).toContain('Put Buy');
      expect(result.suggestedStrategy.legs[0].optionType).toBe('PE');
    });

    it('displays No Trade / Wait when NIFTY 50 fluctuates within a tight 20-point range', () => {
      const spot = 22405.0;
      const netChange = 3.0; // Tiny fluctuation (+3 pts)
      const candles = generateCandles(spot, 100, 0.05, netChange);
      const indicators = buildTechnicalIndicators(candles, spot);
      const optionChain = generateOptionChain(spot, netChange);
      const mtf = buildMultiTimeframeSummary(spot, netChange, indicators);

      const inputs: SignalInputs = {
        spotPrice: spot,
        indicators,
        optionChain,
        vix: { value: 13.5, change: -0.1, changePercent: -0.7, trend: 'STABLE', regime: 'MODERATE_VIX (13-18)', implication: '', favorableStrategies: [] },
        mtf,
        recentNews: SAMPLE_NEWS,
        isMarketOpen: true,
        isLiveAvailable: true,
        dataDelaySeconds: 0,
        dayChange: netChange,
        dayOpen: 22400.0,
        previousClose: 22402.0,
        dayLow: 22395.0,
        dayHigh: 22410.0,
        recentTrajectory: 3.0,
      };

      const result = evaluateSignal(inputs);
      // Tight 20-point range: MUST display NO TRADE / WAIT with 0% trade execution confidence!
      expect(result.signal).toBe('NO TRADE');
      expect(result.status).toBe('WAIT');
      expect(result.confidence).toBe(0);
      expect(result.pointImpulseTrigger?.status).toBe('WAIT');
      expect(result.pointImpulseTrigger?.description).toContain('NO TRADE / WAIT');
      expect(result.reasons.some(r => r.includes('20-Point Execution Rule'))).toBe(true);
    });

    describe('User Reference Example: 100 Baseline -> 105 (Wait) / 120 (Call Buy) / 80 (Put Buy)', () => {
      const baseSpot = 22100.0; // Baseline at 100
      const candles = generateCandles(baseSpot, 100, 0.1, 0);
      const indicators = buildTechnicalIndicators(candles, baseSpot);
      const optionChain = generateOptionChain(baseSpot, 0);
      const mtf = buildMultiTimeframeSummary(baseSpot, 0, indicators);
      const baseVix: IndiaVixSummary = { value: 14.0, change: 0, changePercent: 0, trend: 'STABLE', regime: 'MODERATE_VIX (13-18)', implication: '', favorableStrategies: [] };

      it('shows No Trade / Wait with 0% confidence on minor 5-point movement (100 -> 105)', () => {
        const spot = 22105.0; // 5-point minor move from 100
        const result = evaluateSignal({
          spotPrice: spot,
          indicators,
          optionChain,
          vix: baseVix,
          mtf,
          recentNews: SAMPLE_NEWS,
          isMarketOpen: true,
          isLiveAvailable: true,
          dataDelaySeconds: 0,
          lastExecutionPrice: 22100.0, // baseline is 100
        });

        expect(result.signal).toBe('NO TRADE');
        expect(result.status).toBe('WAIT');
        expect(result.confidence).toBe(0); // Strictly 0% confidence during minor fluctuation
        expect(result.pointImpulseTrigger?.status).toBe('WAIT');
        expect(result.pointImpulseTrigger?.baselinePrice).toBe(22100.0); // Baseline remains 100
        expect(result.pointImpulseTrigger?.distanceFromBaseline).toBe(5.0);
        expect(result.pointImpulseTrigger?.nextCallBuyTrigger).toBe(22120.0); // 120
        expect(result.pointImpulseTrigger?.nextPutBuyTrigger).toBe(22080.0); // 80
      });

      it('triggers Call Buy and sets 120 as new baseline when price rises 20 points (100 -> 120)', () => {
        const spot = 22120.0; // Rises by 20 points to 120
        const result = evaluateSignal({
          spotPrice: spot,
          indicators,
          optionChain,
          vix: baseVix,
          mtf,
          recentNews: SAMPLE_NEWS,
          isMarketOpen: true,
          isLiveAvailable: true,
          dataDelaySeconds: 0,
          lastExecutionPrice: 22100.0, // previous baseline was 100
        });

        expect(result.signal).toBe('BUY CALL');
        expect(result.trend).toBe('BULLISH');
        expect(result.confidence).toBeGreaterThanOrEqual(80);
        expect(result.pointImpulseTrigger?.status).toBe('CALL_BUY');
        expect(result.pointImpulseTrigger?.isUpdatedBaseline).toBe(true);
        expect(result.pointImpulseTrigger?.baselinePrice).toBe(22120.0); // Sets 120 as new baseline!
        expect(result.pointImpulseTrigger?.nextCallBuyTrigger).toBe(22140.0); // Next Call Buy at 140
        expect(result.pointImpulseTrigger?.nextPutBuyTrigger).toBe(22100.0); // Next Put Buy at 100
      });

      it('triggers Put Buy and sets 80 as new baseline when price drops 20 points (100 -> 80)', () => {
        const spot = 22080.0; // Drops by 20 points to 80
        const result = evaluateSignal({
          spotPrice: spot,
          indicators,
          optionChain,
          vix: baseVix,
          mtf,
          recentNews: SAMPLE_NEWS,
          isMarketOpen: true,
          isLiveAvailable: true,
          dataDelaySeconds: 0,
          lastExecutionPrice: 22100.0, // previous baseline was 100
        });

        expect(result.signal).toBe('BUY PUT');
        expect(result.trend).toBe('BEARISH');
        expect(result.confidence).toBeGreaterThanOrEqual(80);
        expect(result.pointImpulseTrigger?.status).toBe('PUT_BUY');
        expect(result.pointImpulseTrigger?.isUpdatedBaseline).toBe(true);
        expect(result.pointImpulseTrigger?.baselinePrice).toBe(22080.0); // Sets 80 as new baseline!
        expect(result.pointImpulseTrigger?.nextCallBuyTrigger).toBe(22100.0); // Next Call Buy at 100
        expect(result.pointImpulseTrigger?.nextPutBuyTrigger).toBe(22060.0); // Next Put Buy at 60
      });

      it('from 120 baseline: shows No Trade on minor 5-point move to 125, triggers Call Buy at 140, triggers Put Buy at 100', () => {
        // Minor 5-pt move (120 -> 125)
        const res125 = evaluateSignal({
          spotPrice: 22125.0,
          indicators,
          optionChain,
          vix: baseVix,
          mtf,
          recentNews: SAMPLE_NEWS,
          isMarketOpen: true,
          isLiveAvailable: true,
          dataDelaySeconds: 0,
          lastExecutionPrice: 22120.0, // baseline is 120
        });
        expect(res125.signal).toBe('NO TRADE');
        expect(res125.confidence).toBe(0);
        expect(res125.pointImpulseTrigger?.baselinePrice).toBe(22120.0);

        // +20 pt rise (120 -> 140) -> Maintains Call Buy
        const res140 = evaluateSignal({
          spotPrice: 22140.0,
          indicators,
          optionChain,
          vix: baseVix,
          mtf,
          recentNews: SAMPLE_NEWS,
          isMarketOpen: true,
          isLiveAvailable: true,
          dataDelaySeconds: 0,
          lastExecutionPrice: 22120.0, // baseline is 120
        });
        expect(res140.signal).toBe('BUY CALL');
        expect(res140.confidence).toBeGreaterThanOrEqual(80);
        expect(res140.pointImpulseTrigger?.baselinePrice).toBe(22140.0);

        // -20 pt drop (120 -> 100) -> Switches to Put Buy
        const res100 = evaluateSignal({
          spotPrice: 22100.0,
          indicators,
          optionChain,
          vix: baseVix,
          mtf,
          recentNews: SAMPLE_NEWS,
          isMarketOpen: true,
          isLiveAvailable: true,
          dataDelaySeconds: 0,
          lastExecutionPrice: 22120.0, // baseline is 120
        });
        expect(res100.signal).toBe('BUY PUT');
        expect(res100.confidence).toBeGreaterThanOrEqual(80);
        expect(res100.pointImpulseTrigger?.baselinePrice).toBe(22100.0);
      });

      it('when Call Buy was triggered at 100, a minor 5-point move to 105 maintains Call Buy and preserves baseline', () => {
        const spot = 22105.0; // 5-point minor move from baseline 100
        const result = evaluateSignal({
          spotPrice: spot,
          indicators,
          optionChain,
          vix: baseVix,
          mtf,
          recentNews: SAMPLE_NEWS,
          isMarketOpen: true,
          isLiveAvailable: true,
          dataDelaySeconds: 0,
          lastExecutionPrice: 22100.0, // baseline 100
          lastExecutionSignal: 'BUY CALL', // Call Buy was triggered at 100
        });

        // Must MAINTAIN Call Buy (not collapse to No Trade!)
        expect(result.signal).toBe('BUY CALL');
        expect(result.trend).toBe('BULLISH');
        expect(result.confidence).toBe(85);
        expect(result.pointImpulseTrigger?.status).toBe('WAIT'); // Waiting for next trigger
        expect(result.pointImpulseTrigger?.baselinePrice).toBe(22100.0); // Baseline remains 100
        expect(result.pointImpulseTrigger?.nextCallBuyTrigger).toBe(22120.0); // Next Call Buy at 120
        expect(result.pointImpulseTrigger?.nextPutBuyTrigger).toBe(22080.0); // Reversal Put Buy stop at 80
      });

      it('when Put Buy was triggered at 100, a minor 5-point move to 95 maintains Put Buy and preserves baseline', () => {
        const spot = 22095.0; // 5-point minor move from baseline 100
        const result = evaluateSignal({
          spotPrice: spot,
          indicators,
          optionChain,
          vix: baseVix,
          mtf,
          recentNews: SAMPLE_NEWS,
          isMarketOpen: true,
          isLiveAvailable: true,
          dataDelaySeconds: 0,
          lastExecutionPrice: 22100.0, // baseline 100
          lastExecutionSignal: 'BUY PUT', // Put Buy was triggered at 100
        });

        // Must MAINTAIN Put Buy (not collapse to No Trade!)
        expect(result.signal).toBe('BUY PUT');
        expect(result.trend).toBe('BEARISH');
        expect(result.confidence).toBe(85);
        expect(result.pointImpulseTrigger?.status).toBe('WAIT');
        expect(result.pointImpulseTrigger?.baselinePrice).toBe(22100.0);
        expect(result.pointImpulseTrigger?.nextCallBuyTrigger).toBe(22120.0);
        expect(result.pointImpulseTrigger?.nextPutBuyTrigger).toBe(22080.0);
      });
    });
  });
});
