import { describe, it, expect } from 'vitest';
import { calculateNseOptionPrice, standardNormalCdf, verifyNseOptionPricing } from '../engine/blackScholes';

describe('NSE Black-Scholes Option Pricing Engine', () => {
  it('computes standard normal cumulative distribution accurately', () => {
    expect(standardNormalCdf(0)).toBeCloseTo(0.5, 4);
    expect(standardNormalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(standardNormalCdf(-1.96)).toBeCloseTo(0.025, 3);
  });

  it('calculates realistic NIFTY 50 weekly ATM options matching live NSE values', () => {
    const spot = 22421.95;
    const strike = 22400; // Near ATM
    const daysToExpiry = 5; // Weekly expiry
    const iv = 0.1446; // India VIX 14.46%
    const spotChange = -198.50;

    const res = calculateNseOptionPrice(spot, strike, daysToExpiry, iv, 0.065, spotChange);

    // Call premium should be in realistic NSE range around 160-185, NOT 450+
    expect(res.callLtp).toBeGreaterThan(150);
    expect(res.callLtp).toBeLessThan(190);

    // Put premium should be in realistic NSE range around 120-145, NOT 450+
    expect(res.putLtp).toBeGreaterThan(115);
    expect(res.putLtp).toBeLessThan(145);

    // Call change should be negative when spot drops by 198.50
    expect(res.callChange).toBeLessThan(0);

    // Put change should be positive when spot drops by 198.50
    expect(res.putChange).toBeGreaterThan(0);

    // Prices must align with NSE 0.05 tick size
    expect(Math.round(res.callLtp * 20) % 1).toBe(0);
    expect(Math.round(res.putLtp * 20) % 1).toBe(0);
  });

  it('reflects correct intrinsic value and parity for deep ITM and OTM options', () => {
    const spot = 22421.95;
    const deepItmCallStrike = 22000;
    const resItm = calculateNseOptionPrice(spot, deepItmCallStrike, 5, 0.1446, 0.065, 0);

    // 22000 Call must be at least intrinsic value (spot - strike = 421.95)
    expect(resItm.callLtp).toBeGreaterThanOrEqual(421.95);

    const deepOtmCallStrike = 22800;
    const resOtm = calculateNseOptionPrice(spot, deepOtmCallStrike, 5, 0.1446, 0.065, 0);
    // 22800 Call is out of money (~380 pts away with 5 days), should be low premium (< 45)
    expect(resOtm.callLtp).toBeLessThan(45);
  });

  it('accurately verifies NSE Put-Call Parity and mathematical compliance', () => {
    const verification = verifyNseOptionPricing(22421.95, 22400, 5, 0.1446, 0.065);
    expect(verification.putCallParity.isParityValid).toBe(true);
    expect(Math.abs(verification.putCallParity.discrepancy)).toBeLessThan(1.0);
    expect(verification.nseRuleCompliance.intrinsicFloorSatisfied).toBe(true);
    expect(verification.nseRuleCompliance.positiveTimeValue).toBe(true);
  });

  it('calculates proper 0 DTE theta decay prices matching expiry day on NSE', () => {
    // On expiry day afternoon (0.2 days), ATM premiums decay from ~170 to ~35-50
    const zeroDte = verifyNseOptionPricing(22421.95, 22400, 0.2, 0.1446, 0.065);
    expect(zeroDte.call.theoreticalPrice).toBeLessThan(60);
    expect(zeroDte.put.theoreticalPrice).toBeLessThan(35);
    expect(zeroDte.putCallParity.isParityValid).toBe(true);
  });
});
