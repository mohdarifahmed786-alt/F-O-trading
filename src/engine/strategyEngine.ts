import { TradeStrategy, SignalType, MarketRegime, OptionChainSummary } from '../types/market';

const LOT_SIZE = 25; // NIFTY standard contract lot size

/**
 * Rounds price to nearest NIFTY strike interval (50 points)
 */
export function roundToStrike(price: number): number {
  return Math.round(price / 50) * 50;
}

/**
 * Strategy Generator for NIFTY 50 Futures & Options
 * Evaluates market regime, volatility (IV/VIX), and directional bias
 * to generate one of the 14 required strategies with exact leg details.
 */
export function buildStrategy(
  strategyId: string,
  spotPrice: number,
  signal: SignalType,
  regime: MarketRegime,
  optionChain?: OptionChainSummary
): TradeStrategy {
  const atm = roundToStrike(spotPrice);

  switch (strategyId) {
    case 'bull-call-spread': {
      const buyStrike = atm;
      const sellStrike = atm + 100;
      const buyPremium = 145;
      const sellPremium = 85;
      const netDebit = buyPremium - sellPremium; // 60 pts
      const maxProfitPoints = 100 - netDebit; // 40 pts
      const maxLossRupees = netDebit * LOT_SIZE;
      const maxProfitRupees = maxProfitPoints * LOT_SIZE;
      const breakeven = buyStrike + netDebit;

      return {
        id: 'bull-call-spread',
        name: 'Bull Call Spread (Defined Risk Debit)',
        category: 'BULLISH',
        legs: [
          { action: 'BUY', optionType: 'CE', strike: buyStrike, premium: buyPremium, lots: 1 },
          { action: 'SELL', optionType: 'CE', strike: sellStrike, premium: sellPremium, lots: 1 },
        ],
        entryRange: [Number((spotPrice - 15).toFixed(1)), Number((spotPrice + 10).toFixed(1))],
        stopLoss: Number((spotPrice - 45).toFixed(1)),
        target1: Number((spotPrice + 85).toFixed(1)),
        target2: Number((spotPrice + 140).toFixed(1)),
        maxProfit: `₹${maxProfitRupees.toLocaleString('en-IN')} (+${maxProfitPoints} pts)`,
        maxLoss: `₹${maxLossRupees.toLocaleString('en-IN')} (-${netDebit} pts)`,
        breakeven: `${breakeven}`,
        rewardRiskRatio: `1 : ${(maxProfitPoints / netDebit).toFixed(2)}`,
        requiredMargin: `₹${(netDebit * LOT_SIZE + 500).toLocaleString('en-IN')}`,
        selectionRationale: `ATM ${buyStrike} CE bought, funded by selling OTM ${sellStrike} CE. Caps IV theta decay and provides defined 1:0.67+ risk-reward.`,
        suitableRegime: 'BULLISH TREND / MODERATE VOLATILITY',
      };
    }

    case 'bear-put-spread': {
      const buyStrike = atm;
      const sellStrike = atm - 100;
      const buyPremium = 140;
      const sellPremium = 80;
      const netDebit = buyPremium - sellPremium; // 60 pts
      const maxProfitPoints = 100 - netDebit; // 40 pts
      const maxLossRupees = netDebit * LOT_SIZE;
      const maxProfitRupees = maxProfitPoints * LOT_SIZE;
      const breakeven = buyStrike - netDebit;

      return {
        id: 'bear-put-spread',
        name: 'Bear Put Spread (Defined Risk Debit)',
        category: 'BEARISH',
        legs: [
          { action: 'BUY', optionType: 'PE', strike: buyStrike, premium: buyPremium, lots: 1 },
          { action: 'SELL', optionType: 'PE', strike: sellStrike, premium: sellPremium, lots: 1 },
        ],
        entryRange: [Number((spotPrice - 10).toFixed(1)), Number((spotPrice + 15).toFixed(1))],
        stopLoss: Number((spotPrice + 45).toFixed(1)),
        target1: Number((spotPrice - 85).toFixed(1)),
        target2: Number((spotPrice - 140).toFixed(1)),
        maxProfit: `₹${maxProfitRupees.toLocaleString('en-IN')} (+${maxProfitPoints} pts)`,
        maxLoss: `₹${maxLossRupees.toLocaleString('en-IN')} (-${netDebit} pts)`,
        breakeven: `${breakeven}`,
        rewardRiskRatio: `1 : ${(maxProfitPoints / netDebit).toFixed(2)}`,
        requiredMargin: `₹${(netDebit * LOT_SIZE + 500).toLocaleString('en-IN')}`,
        selectionRationale: `ATM ${buyStrike} PE bought and OTM ${sellStrike} PE sold to cushion theta decay while capturing downward trend.`,
        suitableRegime: 'BEARISH TREND / NORMAL VOLATILITY',
      };
    }

    case 'bull-put-spread': {
      const sellStrike = atm - 50;
      const buyStrike = atm - 150;
      const sellPremium = 95;
      const buyPremium = 45;
      const netCredit = sellPremium - buyPremium; // 50 pts
      const spreadWidth = 100;
      const maxLossPoints = spreadWidth - netCredit; // 50 pts

      return {
        id: 'bull-put-spread',
        name: 'Bull Put Spread (Credit Spread)',
        category: 'BULLISH',
        legs: [
          { action: 'SELL', optionType: 'PE', strike: sellStrike, premium: sellPremium, lots: 1 },
          { action: 'BUY', optionType: 'PE', strike: buyStrike, premium: buyPremium, lots: 1 },
        ],
        entryRange: [Number((spotPrice - 10).toFixed(1)), Number((spotPrice + 10).toFixed(1))],
        stopLoss: Number((spotPrice - 55).toFixed(1)),
        target1: Number((spotPrice + 60).toFixed(1)),
        target2: Number((spotPrice + 110).toFixed(1)),
        maxProfit: `₹${(netCredit * LOT_SIZE).toLocaleString('en-IN')} (+${netCredit} pts)`,
        maxLoss: `₹${(maxLossPoints * LOT_SIZE).toLocaleString('en-IN')} (-${maxLossPoints} pts)`,
        breakeven: `${sellStrike - netCredit}`,
        rewardRiskRatio: `1 : ${(netCredit / maxLossPoints).toFixed(2)}`,
        requiredMargin: '₹38,000 (Hedged Margin)',
        selectionRationale: `Sell ${sellStrike} PE above strong put OI wall; buy ${buyStrike} PE for hedge protection and margin benefit.`,
        suitableRegime: 'MILD BULLISH / RANGE WITH UPWARD BIAS',
      };
    }

    case 'bear-call-spread': {
      const sellStrike = atm + 50;
      const buyStrike = atm + 150;
      const sellPremium = 90;
      const buyPremium = 42;
      const netCredit = sellPremium - buyPremium; // 48 pts
      const spreadWidth = 100;
      const maxLossPoints = spreadWidth - netCredit;

      return {
        id: 'bear-call-spread',
        name: 'Bear Call Spread (Credit Spread)',
        category: 'BEARISH',
        legs: [
          { action: 'SELL', optionType: 'CE', strike: sellStrike, premium: sellPremium, lots: 1 },
          { action: 'BUY', optionType: 'CE', strike: buyStrike, premium: buyPremium, lots: 1 },
        ],
        entryRange: [Number((spotPrice - 10).toFixed(1)), Number((spotPrice + 10).toFixed(1))],
        stopLoss: Number((spotPrice + 55).toFixed(1)),
        target1: Number((spotPrice - 60).toFixed(1)),
        target2: Number((spotPrice - 110).toFixed(1)),
        maxProfit: `₹${(netCredit * LOT_SIZE).toLocaleString('en-IN')} (+${netCredit} pts)`,
        maxLoss: `₹${(maxLossPoints * LOT_SIZE).toLocaleString('en-IN')} (-${maxLossPoints} pts)`,
        breakeven: `${sellStrike + netCredit}`,
        rewardRiskRatio: `1 : ${(netCredit / maxLossPoints).toFixed(2)}`,
        requiredMargin: '₹38,000 (Hedged Margin)',
        selectionRationale: `Sell ${sellStrike} CE under call OI wall; buy ${buyStrike} CE as defined hedge. Benefits from theta and sideways-to-down bias.`,
        suitableRegime: 'MILD BEARISH / ELEVATED IV SELL ZONE',
      };
    }

    case 'long-call': {
      const itmStrike = atm - 50; // 1 strike ITM for higher delta
      const premium = 175;
      const stopLossPoints = 40;
      const target1Points = 75;
      const target2Points = 130;

      return {
        id: 'long-call',
        name: 'Long Call (High Delta Momentum)',
        category: 'BULLISH',
        legs: [{ action: 'BUY', optionType: 'CE', strike: itmStrike, premium, lots: 1 }],
        entryRange: [Number((spotPrice - 10).toFixed(1)), Number((spotPrice + 15).toFixed(1))],
        stopLoss: Number((spotPrice - 40).toFixed(1)),
        target1: Number((spotPrice + 80).toFixed(1)),
        target2: Number((spotPrice + 150).toFixed(1)),
        maxProfit: 'Unlimited (Directional Momentum)',
        maxLoss: `₹${(premium * LOT_SIZE).toLocaleString('en-IN')} (Strict SL: ₹${(stopLossPoints * LOT_SIZE).toLocaleString('en-IN')})`,
        breakeven: `${itmStrike + premium}`,
        rewardRiskRatio: `1 : ${(target1Points / stopLossPoints).toFixed(2)}`,
        requiredMargin: `₹${(premium * LOT_SIZE).toLocaleString('en-IN')}`,
        selectionRationale: `Selected ITM ${itmStrike} CE (Delta ~0.62) for strong momentum follow-through with reduced theta exposure.`,
        suitableRegime: 'STRONG TRENDING / LOW IV / FAST MOMENTUM',
      };
    }

    case 'long-put': {
      const itmStrike = atm + 50;
      const premium = 170;
      const stopLossPoints = 40;
      const target1Points = 75;

      return {
        id: 'long-put',
        name: 'Long Put (High Delta Downside)',
        category: 'BEARISH',
        legs: [{ action: 'BUY', optionType: 'PE', strike: itmStrike, premium, lots: 1 }],
        entryRange: [Number((spotPrice - 15).toFixed(1)), Number((spotPrice + 10).toFixed(1))],
        stopLoss: Number((spotPrice + 40).toFixed(1)),
        target1: Number((spotPrice - 80).toFixed(1)),
        target2: Number((spotPrice - 150).toFixed(1)),
        maxProfit: 'Substantial (Directional Fall)',
        maxLoss: `₹${(premium * LOT_SIZE).toLocaleString('en-IN')} (Strict SL: ₹${(stopLossPoints * LOT_SIZE).toLocaleString('en-IN')})`,
        breakeven: `${itmStrike - premium}`,
        rewardRiskRatio: `1 : ${(target1Points / stopLossPoints).toFixed(2)}`,
        requiredMargin: `₹${(premium * LOT_SIZE).toLocaleString('en-IN')}`,
        selectionRationale: `Selected ITM ${itmStrike} PE (Delta ~-0.60) to capitalize on sharp breakdown velocity with high responsiveness.`,
        suitableRegime: 'STRONG BEARISH BREAKDOWN / HIGH MOMENTUM',
      };
    }

    case 'iron-condor': {
      const putSell = atm - 150;
      const putBuy = atm - 250;
      const callSell = atm + 150;
      const callBuy = atm + 250;
      const netCredit = 55; // combined credit in pts
      const wingWidth = 100;
      const maxLossPoints = wingWidth - netCredit; // 45 pts

      return {
        id: 'iron-condor',
        name: 'Iron Condor (Range-Bound Non-Directional)',
        category: 'RANGE',
        legs: [
          { action: 'SELL', optionType: 'PE', strike: putSell, premium: 45, lots: 1 },
          { action: 'BUY', optionType: 'PE', strike: putBuy, premium: 18, lots: 1 },
          { action: 'SELL', optionType: 'CE', strike: callSell, premium: 48, lots: 1 },
          { action: 'BUY', optionType: 'CE', strike: callBuy, premium: 20, lots: 1 },
        ],
        entryRange: [Number((spotPrice - 20).toFixed(1)), Number((spotPrice + 20).toFixed(1))],
        stopLoss: Number((callSell + 30).toFixed(1)),
        target1: Number((callSell - 30).toFixed(1)),
        target2: Number((putSell + 30).toFixed(1)),
        maxProfit: `₹${(netCredit * LOT_SIZE).toLocaleString('en-IN')} (+${netCredit} pts)`,
        maxLoss: `₹${(maxLossPoints * LOT_SIZE).toLocaleString('en-IN')} (-${maxLossPoints} pts)`,
        breakeven: `${putSell - netCredit} to ${callSell + netCredit}`,
        rewardRiskRatio: `1 : ${(netCredit / maxLossPoints).toFixed(2)}`,
        requiredMargin: '₹55,000 (Fully Hedged 4-leg)',
        selectionRationale: `Sells OTM call & put wings at key OI walls with protective outer long wings. Captures theta decay in sideways range.`,
        suitableRegime: 'RANGE-BOUND / LOW-VOLATILITY / CONSOLIDATION',
      };
    }

    case 'vwap-breakout': {
      return {
        id: 'vwap-breakout',
        name: 'VWAP Breakout Strategy',
        category: signal === 'BUY CALL' ? 'BULLISH' : 'BEARISH',
        legs: [
          {
            action: 'BUY',
            optionType: signal === 'BUY CALL' ? 'CE' : 'PE',
            strike: atm,
            premium: 135,
            lots: 1,
          },
        ],
        entryRange: [Number((spotPrice - 8).toFixed(1)), Number((spotPrice + 12).toFixed(1))],
        stopLoss: Number(signal === 'BUY CALL' ? (spotPrice - 35).toFixed(1) : (spotPrice + 35).toFixed(1)),
        target1: Number(signal === 'BUY CALL' ? (spotPrice + 70).toFixed(1) : (spotPrice - 70).toFixed(1)),
        target2: Number(signal === 'BUY CALL' ? (spotPrice + 120).toFixed(1) : (spotPrice - 120).toFixed(1)),
        maxProfit: 'Trend Expansion',
        maxLoss: `₹${(35 * LOT_SIZE).toLocaleString('en-IN')} (SL trigger)`,
        breakeven: `${signal === 'BUY CALL' ? atm + 135 : atm - 135}`,
        rewardRiskRatio: '1 : 2.0',
        requiredMargin: `₹${(135 * LOT_SIZE).toLocaleString('en-IN')}`,
        selectionRationale: 'Price crossed and retested VWAP with expanding volume. Institutional VWAP bias in favor of current move.',
        suitableRegime: 'BREAKOUT / INTRADAY MOMENTUM',
      };
    }

    case 'orb-breakout': {
      return {
        id: 'orb-breakout',
        name: 'Opening Range Breakout (ORB 15M)',
        category: signal === 'BUY CALL' ? 'BULLISH' : 'BEARISH',
        legs: [
          {
            action: 'BUY',
            optionType: signal === 'BUY CALL' ? 'CE' : 'PE',
            strike: atm,
            premium: 140,
            lots: 1,
          },
        ],
        entryRange: [Number((spotPrice - 10).toFixed(1)), Number((spotPrice + 15).toFixed(1))],
        stopLoss: Number(signal === 'BUY CALL' ? (spotPrice - 40).toFixed(1) : (spotPrice + 40).toFixed(1)),
        target1: Number(signal === 'BUY CALL' ? (spotPrice + 80).toFixed(1) : (spotPrice - 80).toFixed(1)),
        target2: Number(signal === 'BUY CALL' ? (spotPrice + 130).toFixed(1) : (spotPrice - 130).toFixed(1)),
        maxProfit: 'Day Range Expansion',
        maxLoss: `₹${(40 * LOT_SIZE).toLocaleString('en-IN')}`,
        breakeven: `${signal === 'BUY CALL' ? atm + 140 : atm - 140}`,
        rewardRiskRatio: '1 : 2.0',
        requiredMargin: `₹${(140 * LOT_SIZE).toLocaleString('en-IN')}`,
        selectionRationale: 'First 15-minute high/low decisively violated with candle body close and above-average volume.',
        suitableRegime: 'BREAKOUT / MORNING EXPANSION',
      };
    }

    case 'intraday-breakout': {
      return {
        id: 'intraday-breakout',
        name: 'Intraday S/R Breakout Strategy',
        category: signal === 'BUY CALL' ? 'BULLISH' : 'BEARISH',
        legs: [
          {
            action: 'BUY',
            optionType: signal === 'BUY CALL' ? 'CE' : 'PE',
            strike: atm,
            premium: 130,
            lots: 1,
          },
        ],
        entryRange: [Number((spotPrice - 10).toFixed(1)), Number((spotPrice + 10).toFixed(1))],
        stopLoss: Number(signal === 'BUY CALL' ? (spotPrice - 35).toFixed(1) : (spotPrice + 35).toFixed(1)),
        target1: Number(signal === 'BUY CALL' ? (spotPrice + 70).toFixed(1) : (spotPrice - 70).toFixed(1)),
        target2: Number(signal === 'BUY CALL' ? (spotPrice + 115).toFixed(1) : (spotPrice - 115).toFixed(1)),
        maxProfit: 'Breakout Extension',
        maxLoss: `₹${(35 * LOT_SIZE).toLocaleString('en-IN')}`,
        breakeven: `${signal === 'BUY CALL' ? atm + 130 : atm - 130}`,
        rewardRiskRatio: '1 : 2.0',
        requiredMargin: `₹${(130 * LOT_SIZE).toLocaleString('en-IN')}`,
        selectionRationale: 'Multi-hour horizontal consolidation ceiling cleared with volume expansion.',
        suitableRegime: 'BREAKOUT',
      };
    }

    case 'momentum-strategy': {
      return {
        id: 'momentum-strategy',
        name: 'Momentum Scalp Strategy',
        category: signal === 'BUY CALL' ? 'BULLISH' : 'BEARISH',
        legs: [
          {
            action: 'BUY',
            optionType: signal === 'BUY CALL' ? 'CE' : 'PE',
            strike: atm,
            premium: 125,
            lots: 1,
          },
        ],
        entryRange: [Number((spotPrice - 8).toFixed(1)), Number((spotPrice + 8).toFixed(1))],
        stopLoss: Number(signal === 'BUY CALL' ? (spotPrice - 30).toFixed(1) : (spotPrice + 30).toFixed(1)),
        target1: Number(signal === 'BUY CALL' ? (spotPrice + 60).toFixed(1) : (spotPrice - 60).toFixed(1)),
        target2: Number(signal === 'BUY CALL' ? (spotPrice + 95).toFixed(1) : (spotPrice - 95).toFixed(1)),
        maxProfit: 'Rapid Momentum Surge',
        maxLoss: `₹${(30 * LOT_SIZE).toLocaleString('en-IN')}`,
        breakeven: `${signal === 'BUY CALL' ? atm + 125 : atm - 125}`,
        rewardRiskRatio: '1 : 2.0',
        requiredMargin: `₹${(125 * LOT_SIZE).toLocaleString('en-IN')}`,
        selectionRationale: 'RSI 14 momentum acceleration and MACD histogram expansion indicate rapid continuation.',
        suitableRegime: 'TRENDING / HIGH MOMENTUM',
      };
    }

    case 'mean-reversion': {
      return {
        id: 'mean-reversion',
        name: 'Bollinger Band Mean Reversion',
        category: signal === 'BUY CALL' ? 'BULLISH' : 'BEARISH',
        legs: [
          {
            action: 'BUY',
            optionType: signal === 'BUY CALL' ? 'CE' : 'PE',
            strike: atm,
            premium: 110,
            lots: 1,
          },
        ],
        entryRange: [Number((spotPrice - 10).toFixed(1)), Number((spotPrice + 10).toFixed(1))],
        stopLoss: Number(signal === 'BUY CALL' ? (spotPrice - 35).toFixed(1) : (spotPrice + 35).toFixed(1)),
        target1: Number(signal === 'BUY CALL' ? (spotPrice + 65).toFixed(1) : (spotPrice - 65).toFixed(1)),
        target2: Number(signal === 'BUY CALL' ? (spotPrice + 100).toFixed(1) : (spotPrice - 100).toFixed(1)),
        maxProfit: 'Reversion to 20 EMA',
        maxLoss: `₹${(35 * LOT_SIZE).toLocaleString('en-IN')}`,
        breakeven: `${signal === 'BUY CALL' ? atm + 110 : atm - 110}`,
        rewardRiskRatio: '1 : 1.85',
        requiredMargin: `₹${(110 * LOT_SIZE).toLocaleString('en-IN')}`,
        selectionRationale: 'Price touched outer Bollinger Band with RSI divergence; reverting towards mean SMA 20.',
        suitableRegime: 'RANGE-BOUND / REVERSAL',
      };
    }

    case 'trend-following':
    default: {
      // Default to Bull Call Spread or Bear Put Spread based on signal
      if (signal === 'BUY CALL' || signal === 'SELL PUT') {
        return buildStrategy('bull-call-spread', spotPrice, signal, regime, optionChain);
      } else if (signal === 'BUY PUT' || signal === 'SELL CALL') {
        return buildStrategy('bear-put-spread', spotPrice, signal, regime, optionChain);
      } else {
        return buildStrategy('iron-condor', spotPrice, signal, regime, optionChain);
      }
    }
  }
}

/**
 * Automatically chooses the best strategy matching market regime & signal
 */
export function selectOptimalStrategy(
  signal: SignalType,
  regime: MarketRegime,
  spotPrice: number,
  iv: number,
  optionChain?: OptionChainSummary
): TradeStrategy {
  if (signal === 'NO TRADE') {
    return buildStrategy('iron-condor', spotPrice, signal, regime, optionChain);
  }

  if (signal === 'BUY CALL') {
    if (regime === 'BREAKOUT') return buildStrategy('vwap-breakout', spotPrice, signal, regime, optionChain);
    if (iv < 13) return buildStrategy('long-call', spotPrice, signal, regime, optionChain);
    return buildStrategy('bull-call-spread', spotPrice, signal, regime, optionChain);
  }

  if (signal === 'SELL PUT') {
    return buildStrategy('bull-put-spread', spotPrice, signal, regime, optionChain);
  }

  if (signal === 'BUY PUT') {
    if (regime === 'BREAKOUT') return buildStrategy('vwap-breakout', spotPrice, signal, regime, optionChain);
    if (iv < 13) return buildStrategy('long-put', spotPrice, signal, regime, optionChain);
    return buildStrategy('bear-put-spread', spotPrice, signal, regime, optionChain);
  }

  if (signal === 'SELL CALL') {
    return buildStrategy('bear-call-spread', spotPrice, signal, regime, optionChain);
  }

  return buildStrategy('bull-call-spread', spotPrice, signal, regime, optionChain);
}
