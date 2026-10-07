import { describe, it, expect } from 'vitest';
import {
  getAllNifty50Stocks,
  generateStockAnalysis,
  generateStockOptionChain,
  NIFTY_50_BASE_CONSTITUENTS,
} from '../data/nifty50Stocks';

describe('NIFTY 50 Individual Stocks F&O Engine', () => {
  it('generates all 50 NIFTY constituent stocks with complete metadata', () => {
    const stocks = getAllNifty50Stocks('BULLISH');
    expect(stocks.length).toBe(50);

    // Verify key constituents exist with authentic F&O lot sizes
    const reliance = stocks.find(s => s.symbol === 'RELIANCE');
    expect(reliance).toBeDefined();
    expect(reliance?.lotSize).toBe(250);
    expect(reliance?.sector).toContain('Energy');

    const hdfc = stocks.find(s => s.symbol === 'HDFCBANK');
    expect(hdfc).toBeDefined();
    expect(hdfc?.lotSize).toBe(550);
    expect(hdfc?.sector).toContain('Banking');

    const infy = stocks.find(s => s.symbol === 'INFY');
    expect(infy).toBeDefined();
    expect(infy?.lotSize).toBe(400);

    const tcs = stocks.find(s => s.symbol === 'TCS');
    expect(tcs).toBeDefined();
    expect(tcs?.lotSize).toBe(175);
  });

  it('generates independent signals for stocks, not merely copying the NIFTY index', () => {
    const stocks = getAllNifty50Stocks('BULLISH');

    const buyCallStocks = stocks.filter(s => s.signal === 'BUY CALL');
    const buyPutStocks = stocks.filter(s => s.signal === 'BUY PUT');
    const noTradeStocks = stocks.filter(s => s.signal === 'NO TRADE');

    // Individual stocks have their own signals based on their own price action and indicators
    expect(buyCallStocks.length).toBeGreaterThan(0);
    expect(noTradeStocks.length).toBeGreaterThan(0);

    // Verify signals vary across constituents
    const signals = new Set(stocks.map(s => s.signal));
    expect(signals.size).toBeGreaterThan(1);
  });

  it('detects index alignment vs conflict with NIFTY 50 trend', () => {
    // When NIFTY is Bullish and stock is Bullish -> STRONG_ALIGNMENT
    const bullishCfg = NIFTY_50_BASE_CONSTITUENTS.find(s => s.trendBias > 0.4)!;
    const alignedStock = generateStockAnalysis(bullishCfg, 'BULLISH');
    expect(alignedStock.niftyAlignment).toBe('STRONG_ALIGNMENT');
    expect(alignedStock.signal).toBe('BUY CALL');

    // When NIFTY is Bullish and stock is Bearish -> CONFLICTING & shifts to NO TRADE
    const bearishCfg = NIFTY_50_BASE_CONSTITUENTS.find(s => s.trendBias < -0.3)!;
    const conflictingStock = generateStockAnalysis(bearishCfg, 'BULLISH');
    expect(conflictingStock.niftyAlignment).toBe('CONFLICTING');
    expect(conflictingStock.signal).toBe('NO TRADE');
    expect(conflictingStock.confidence).toBeLessThan(50);
  });

  it('generates Flattrade-style option chain for an individual stock', () => {
    const stocks = getAllNifty50Stocks('BULLISH');
    const reliance = stocks.find(s => s.symbol === 'RELIANCE')!;
    const chain = generateStockOptionChain(reliance, 11);

    expect(chain.strikes.length).toBe(11);
    expect(chain.spotPrice).toBe(reliance.currentPrice);

    // Check ATM strike exists
    const atmRow = chain.strikes.find(s => s.isAtm);
    expect(atmRow).toBeDefined();

    // Verify Call & Put LTPs and OI are populated
    for (const row of chain.strikes) {
      expect(row.call.ltp).toBeGreaterThan(0);
      expect(row.put.ltp).toBeGreaterThan(0);
      expect(row.call.oi).toBeGreaterThan(0);
      expect(row.put.oi).toBeGreaterThan(0);
      expect(row.strikePrice).toBeGreaterThan(0);
    }
  });
});
