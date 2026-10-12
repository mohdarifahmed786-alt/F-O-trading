import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getNseMarketInfo, NSE_HOLIDAYS_SET } from '../services/liveMarketData';

describe('NSE Market Hours and Holiday Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('detects market is open during trading hours (e.g. Wednesday 11:30 AM IST)', () => {
    // 2026-10-14 is a Wednesday. 11:30 AM IST is 06:00 UTC
    vi.setSystemTime(new Date('2026-10-14T06:00:00.000Z'));
    const info = getNseMarketInfo();
    expect(info.isOpen).toBe(true);
    expect(info.status).toBe('LIVE');
    expect(info.reason).toContain('Normal Trading Session');
  });

  it('detects market is closed after 3:30 PM IST (e.g. Wednesday 4:00 PM IST)', () => {
    // 2026-10-14 Wednesday. 4:00 PM IST is 10:30 UTC
    vi.setSystemTime(new Date('2026-10-14T10:30:00.000Z'));
    const info = getNseMarketInfo();
    expect(info.isOpen).toBe(false);
    expect(info.status).toBe('MARKET CLOSED');
    expect(info.reason).toContain('Post-Market Session');
  });

  it('detects market is closed before 9:15 AM IST (e.g. Wednesday 8:45 AM IST)', () => {
    // 2026-10-14 Wednesday. 8:45 AM IST is 03:15 UTC
    vi.setSystemTime(new Date('2026-10-14T03:15:00.000Z'));
    const info = getNseMarketInfo();
    expect(info.isOpen).toBe(false);
    expect(info.status).toBe('MARKET CLOSED');
    expect(info.reason).toContain('Pre-Market Session');
  });

  it('detects market is closed on Saturdays and Sundays', () => {
    // 2026-10-17 is a Saturday. 11:00 AM IST
    vi.setSystemTime(new Date('2026-10-17T05:30:00.000Z'));
    const infoSat = getNseMarketInfo();
    expect(infoSat.isOpen).toBe(false);
    expect(infoSat.status).toBe('MARKET CLOSED');
    expect(infoSat.reason).toContain('Saturday');

    // 2026-10-18 is a Sunday
    vi.setSystemTime(new Date('2026-10-18T05:30:00.000Z'));
    const infoSun = getNseMarketInfo();
    expect(infoSun.isOpen).toBe(false);
    expect(infoSun.status).toBe('MARKET CLOSED');
    expect(infoSun.reason).toContain('Sunday');
  });

  it('detects market is closed on NSE Trading Holidays (e.g. Gandhi Jayanti Oct 2)', () => {
    // 2026-10-02 is Gandhi Jayanti (Friday at 11:00 AM IST)
    vi.setSystemTime(new Date('2026-10-02T05:30:00.000Z'));
    const info = getNseMarketInfo();
    expect(info.isOpen).toBe(false);
    expect(info.status).toBe('MARKET CLOSED');
    expect(info.reason).toContain('NSE Trading Holiday');
  });

  it('contains essential national and exchange holidays in NSE_HOLIDAYS_SET', () => {
    expect(NSE_HOLIDAYS_SET.has('2026-01-26')).toBe(true); // Republic Day
    expect(NSE_HOLIDAYS_SET.has('2026-08-15')).toBe(true); // Independence Day
    expect(NSE_HOLIDAYS_SET.has('2026-10-02')).toBe(true); // Gandhi Jayanti
    expect(NSE_HOLIDAYS_SET.has('2026-12-25')).toBe(true); // Christmas
  });
});
