import { describe, it, expect } from 'vitest';
import {
  calculateSMA,
  calculateEMA,
  calculateVWAP,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateFibonacci,
  Candle,
} from '../engine/indicators';

describe('Technical Indicators Engine', () => {
  it('calculates SMA accurately', () => {
    const data = [10, 20, 30, 40, 50];
    const sma3 = calculateSMA(data, 3);
    // (10+20+30)/3 = 20, (20+30+40)/3 = 30, (30+40+50)/3 = 40
    expect(sma3).toEqual([20, 30, 40]);
  });

  it('calculates EMA with exponential weighting', () => {
    const data = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const ema5 = calculateEMA(data, 5);
    expect(ema5.length).toBe(7);
    expect(ema5[0]).toBe((10 + 11 + 12 + 13 + 14) / 5);
    expect(ema5[ema5.length - 1]).toBeGreaterThan(ema5[0]);
  });

  it('calculates VWAP from price and volume', () => {
    const candles: Candle[] = [
      { timestamp: 1, open: 100, high: 105, low: 95, close: 100, volume: 1000 }, // TP = 100, PV = 100,000, V = 1,000 => VWAP = 100
      { timestamp: 2, open: 100, high: 115, low: 105, close: 110, volume: 2000 }, // TP = 110, PV = 220,000, CumPV = 320,000, CumV = 3,000 => VWAP = 106.67
    ];
    const vwap = calculateVWAP(candles);
    expect(vwap[0]).toBe(100);
    expect(vwap[1]).toBeCloseTo(106.67, 1);
  });

  it('calculates RSI 14 and identifies extreme values', () => {
    // Monotonically increasing prices should have RSI close to 100
    const risingCloses = Array.from({ length: 25 }, (_, i) => 100 + i * 2);
    const rsi = calculateRSI(risingCloses, 14);
    expect(rsi.length).toBeGreaterThan(0);
    expect(rsi[rsi.length - 1]).toBeGreaterThan(70);

    // Monotonically decreasing prices should have RSI close to 0
    const fallingCloses = Array.from({ length: 25 }, (_, i) => 200 - i * 2);
    const rsiFalling = calculateRSI(fallingCloses, 14);
    expect(rsiFalling[rsiFalling.length - 1]).toBeLessThan(30);
  });

  it('calculates MACD lines and histogram', () => {
    const closes = Array.from({ length: 45 }, (_, i) => 100 + i * 1.5);
    const macd = calculateMACD(closes, 12, 26, 9);
    expect(macd.macdLine.length).toBeGreaterThan(0);
    expect(macd.signalLine.length).toBeGreaterThan(0);
    expect(macd.histogram.length).toBe(macd.signalLine.length);
  });

  it('calculates Bollinger Bands and bandwidth', () => {
    const closes = Array.from({ length: 30 }, () => 100);
    const bb = calculateBollingerBands(closes, 20, 2);
    expect(bb.middle.length).toBe(11);
    expect(bb.middle[0]).toBe(100);
    expect(bb.upper[0]).toBe(100);
    expect(bb.lower[0]).toBe(100);
  });

  it('calculates ATR volatility accurately', () => {
    const candles: Candle[] = Array.from({ length: 25 }, (_, i) => ({
      timestamp: i,
      open: 100,
      high: 110,
      low: 90,
      close: 100,
      volume: 1000,
    }));
    const atr = calculateATR(candles, 14);
    expect(atr.length).toBe(12);
    expect(atr[0]).toBe(20); // High - Low = 20
  });

  it('calculates Fibonacci retracement levels', () => {
    const fib = calculateFibonacci(25000, 24000);
    expect(fib.high).toBe(25000);
    expect(fib.low).toBe(24000);
    expect(fib.level500).toBe(24500);
    expect(fib.level618).toBe(24382);
    expect(fib.level382).toBe(24618);
  });
});
