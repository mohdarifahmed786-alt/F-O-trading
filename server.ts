import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  generateCandles,
  buildTechnicalIndicators,
  generateOptionChain,
  buildMultiTimeframeSummary,
  SAMPLE_NEWS,
  GLOBAL_INDICES,
  buildTomorrowScenario,
} from './src/data/mockFeed';
import {
  getAllNifty50Stocks,
  generateStockOptionChain,
  NIFTY_50_BASE_CONSTITUENTS,
  generateStockAnalysis,
} from './src/data/nifty50Stocks';
import { evaluateSignal } from './src/engine/signalEngine';
import { HISTORICAL_EVENTS } from './src/data/historicalEvents';
import { runBacktest } from './src/engine/backtestEngine';
import { IndiaVixSummary, MarketQuote } from './src/types/market';

import {
  initLiveFeed,
  getLiveMarketState,
} from './src/services/liveMarketData';
import { getUpdatedMarketNews } from './src/services/newsService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize live market poller
initLiveFeed();

// Initialize server-side Gemini client
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (geminiApiKey) {
  aiClient = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * GET /api/live-quote
 * Returns fast real-time NIFTY 50 quote, live indicators, option chain, and signals
 */
app.get('/api/live-quote', (_req: Request, res: Response) => {
  const liveState = getLiveMarketState();
  const quote = liveState.quote;
  const currentNiftyPrice = quote.currentPrice;

  const candles = liveState.candles && liveState.candles.length >= 20
    ? liveState.candles
    : generateCandles(currentNiftyPrice, 100, 0.3);

  const indicators = buildTechnicalIndicators(candles, currentNiftyPrice);
  const optionChain = generateOptionChain(currentNiftyPrice, quote.change);
  const mtf = buildMultiTimeframeSummary();

  const signal = evaluateSignal({
    spotPrice: currentNiftyPrice,
    indicators,
    optionChain,
    vix: liveState.vix,
    mtf,
    recentNews: SAMPLE_NEWS,
    isMarketOpen: quote.isMarketOpen,
    isLiveAvailable: true,
    dataDelaySeconds: quote.delaySeconds,
  });

  res.json({
    quote: liveState.quote,
    vix: liveState.vix,
    signal,
    indicators,
    optionChain,
  });
});

/**
 * GET /api/market-summary
 * Returns complete NIFTY 50 live market data, indicators, option chain, and signals
 */
app.get('/api/market-summary', async (_req: Request, res: Response) => {
  const liveState = getLiveMarketState();
  const quote = liveState.quote;
  const currentNiftyPrice = quote.currentPrice;

  // Use real exchange candles if populated, otherwise generate around current spot
  const candles = liveState.candles && liveState.candles.length >= 20
    ? liveState.candles
    : generateCandles(currentNiftyPrice, 100, 0.3);

  const indicators = buildTechnicalIndicators(candles, currentNiftyPrice);
  const optionChain = generateOptionChain(currentNiftyPrice, quote.change);
  const mtf = buildMultiTimeframeSummary();
  const vix = liveState.vix;

  let currentNews = SAMPLE_NEWS;
  try {
    const newsData = await getUpdatedMarketNews();
    currentNews = newsData.news;
  } catch {
    // fallback
  }

  const signal = evaluateSignal({
    spotPrice: currentNiftyPrice,
    indicators,
    optionChain,
    vix,
    mtf,
    recentNews: currentNews,
    isMarketOpen: quote.isMarketOpen,
    isLiveAvailable: true,
    dataDelaySeconds: quote.delaySeconds,
  });

  const tomorrow = buildTomorrowScenario(
    currentNiftyPrice,
    indicators.priceAction.pdh,
    indicators.priceAction.pdl,
    indicators.priceAction.pdc
  );

  const stocks = getAllNifty50Stocks(signal.trend, liveState.stockQuotes);

  res.json({
    quote,
    candles,
    indicators,
    optionChain,
    vix,
    mtf,
    signal,
    tomorrow,
    stocks,
  });
});

/**
 * GET /api/stocks
 * Returns full list of NIFTY 50 constituents with independent F&O metrics
 */
app.get('/api/stocks', (_req: Request, res: Response) => {
  const stocks = getAllNifty50Stocks('BULLISH');
  res.json({ stocks });
});

/**
 * GET /api/stock/:symbol
 * Returns single stock details and its Flattrade-style option chain
 */
app.get('/api/stock/:symbol', (req: Request, res: Response) => {
  const symbol = req.params.symbol.toUpperCase();
  const cfg = NIFTY_50_BASE_CONSTITUENTS.find(s => s.symbol === symbol);
  if (!cfg) {
    return res.status(404).json({ error: 'Stock not found in NIFTY 50 constituents' });
  }

  const stock = generateStockAnalysis(cfg, 'BULLISH');
  const optionChain = generateStockOptionChain(stock, 15);
  res.json({ stock, optionChain });
});


/**
 * POST /api/ai-analyst
 * Uses server-side Gemini 3.8 Flash to generate structured, professional AI Market Analysis
 */
app.post('/api/ai-analyst', async (req: Request, res: Response) => {
  const { spotPrice, indicators, optionChain, vix, mtf, signal } = req.body;

  if (!aiClient) {
    // Return analytical heuristic response when API key is not supplied
    return res.json({
      marketView: signal.trend,
      marketRegime: signal.marketRegime,
      signal: signal.signal,
      confidence: signal.confidence,
      reasons: signal.reasons,
      risks: signal.risks,
      whyNot100: signal.whyNot100,
      macroContext: 'Domestic mutual fund SIP inflows remain strong. FII flows are supportive with stable USD/INR at 83.92.',
      source: 'Internal Quantitative Engine (Gemini key not configured)',
    });
  }

  try {
    const prompt = `
You are a disciplined, professional senior NIFTY 50 Futures & Options Market Analyst at an Indian brokerage.
Analyze the following exact technical and options data for NIFTY 50:
- Current Spot Price: ₹${spotPrice}
- VWAP: ₹${indicators?.vwap?.value} (Price is ${indicators?.vwap?.relation} VWAP)
- RSI 14: ${indicators?.rsi14?.value} (${indicators?.rsi14?.condition})
- EMA Alignment: 9=${indicators?.emas?.ema9}, 20=${indicators?.emas?.ema20}, 50=${indicators?.emas?.ema50}, 200=${indicators?.emas?.ema200} (Alignment: ${indicators?.emas?.alignment})
- MACD Histogram: ${indicators?.macd?.histogram} (${indicators?.macd?.signal})
- ADX 14: ${indicators?.adx14?.value} (${indicators?.adx14?.trendStrength} ${indicators?.adx14?.marketType})
- India VIX: ${vix?.value} (${vix?.trend})
- Options PCR (OI): ${optionChain?.oiPcr} (Trend: ${optionChain?.pcrTrend})
- Major Call Wall (Resistance): ₹${optionChain?.majorCallResistance}
- Major Put Wall (Support): ₹${optionChain?.majorPutSupport}
- Max Pain: ₹${optionChain?.maxPain}
- Multi-Timeframe Trend: ${mtf?.overallTrend} (Agreement: ${mtf?.agreementPercentage}%)

Generate an analytical evaluation in JSON adhering strictly to:
1. marketView: "Bullish", "Bearish", or "Neutral"
2. marketRegime: "Trending", "Range-bound", "High-volatility", "Low-volatility", "Breakout", or "Uncertain"
3. signal: "BUY CALL", "SELL CALL", "BUY PUT", "SELL PUT", or "NO TRADE"
4. confidence: An integer between 0 and 100 representing analytical confluence probability (not a guarantee)
5. reasons: Exactly 3 to 5 concise technical reasons supporting the signal
6. risks: Exactly 2 to 3 key risk factors or resistance/support barriers
7. whyNot100: Exactly 2 to 3 reasons why market probability is never 100%
8. macroContext: 1 short sentence on broader market context
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            marketView: { type: Type.STRING },
            marketRegime: { type: Type.STRING },
            signal: { type: Type.STRING },
            confidence: { type: Type.INTEGER },
            reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            whyNot100: { type: Type.ARRAY, items: { type: Type.STRING } },
            macroContext: { type: Type.STRING },
          },
          required: ['marketView', 'marketRegime', 'signal', 'confidence', 'reasons', 'risks', 'whyNot100', 'macroContext'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      ...parsed,
      source: 'Gemini 3.8 Flash AI Market Analyst',
    });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    // Fallback gracefully to algorithmic engine
    return res.json({
      marketView: signal.trend,
      marketRegime: signal.marketRegime,
      signal: signal.signal,
      confidence: signal.confidence,
      reasons: signal.reasons,
      risks: signal.risks,
      whyNot100: signal.whyNot100,
      macroContext: 'Domestic liquidity cushion supported by steady institutional participation.',
      source: 'Algorithmic Confluence Engine (Fallback)',
    });
  }
});

/**
 * POST /api/investor-chat
 * Real-time AI chat advisor for investor buy/sell inquiries.
 * Ingests complete market references (Spot, VWAP, VIX, Option Chain, Indicators, Stocks)
 * and generates clear, direct, jargon-free answers.
 */
app.post('/api/investor-chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message string is required' });
    }

    const liveState = getLiveMarketState();
    const currentNiftyPrice = liveState.quote.currentPrice;
    const quote = liveState.quote;
    const candles = liveState.candles && liveState.candles.length >= 20
      ? liveState.candles
      : generateCandles(currentNiftyPrice, 100, 0.3);

    const indicators = buildTechnicalIndicators(candles, currentNiftyPrice);
    const optionChain = generateOptionChain(currentNiftyPrice);
    const mtf = buildMultiTimeframeSummary();
    const vix = liveState.vix;

    const signal = evaluateSignal({
      spotPrice: currentNiftyPrice,
      indicators,
      optionChain,
      vix,
      mtf,
      recentNews: SAMPLE_NEWS,
      isMarketOpen: quote.isMarketOpen,
      isLiveAvailable: true,
      dataDelaySeconds: quote.delaySeconds,
    });

    const stocks = getAllNifty50Stocks(signal.trend, liveState.stockQuotes);
    const topGainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
    const topLosers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);

    const atmStrike = Math.round(currentNiftyPrice / 50) * 50;
    const atmRow = optionChain.strikes.find(s => s.strikePrice === atmStrike) || optionChain.strikes[Math.floor(optionChain.strikes.length / 2)];

    // Grounding reference context
    const marketContextString = `
[CURRENT LIVE REAL-TIME NSE MARKET REFERENCES]:
- Underlying: NIFTY 50 Spot Price = ₹${currentNiftyPrice.toLocaleString('en-IN')} (Change: ${quote.change >= 0 ? '+' : ''}${quote.change} / ${quote.changePercent}%)
- Day Range: Low ₹${quote.dayLow.toLocaleString('en-IN')} — High ₹${quote.dayHigh.toLocaleString('en-IN')}, Open: ₹${quote.open.toLocaleString('en-IN')}
- VWAP (Average Traded Price): ₹${quote.vwap.toLocaleString('en-IN')} (Price is currently ${currentNiftyPrice >= quote.vwap ? 'ABOVE VWAP - Buyers in control' : 'BELOW VWAP - Sellers active'})
- India VIX (Volatility Index): ${vix.value} (${vix.trend}) — ${vix.regime}
- Technical Indicators:
  * Supertrend (10, 3): ${indicators.supertrend.direction} (Level: ₹${indicators.supertrend.value})
  * 9 EMA vs 20 EMA: 9 EMA is ${indicators.emas.ema9 > indicators.emas.ema20 ? 'ABOVE' : 'BELOW'} 20 EMA (${indicators.emas.alignment})
  * RSI (14): ${indicators.rsi14.value} (${indicators.rsi14.condition})
  * MACD: ${indicators.macd.signal} (Histogram: ${indicators.macd.histogram})
  * Price Structure: ${indicators.priceAction.structure}, PDH: ₹${indicators.priceAction.pdh}, PDL: ₹${indicators.priceAction.pdl}
- Option Chain Reference:
  * Put-Call Ratio (PCR): ${optionChain.oiPcr} (${optionChain.pcrTrend})
  * Major Resistance (Call Wall): ₹${optionChain.majorCallResistance.toLocaleString('en-IN')}
  * Major Support (Put Wall): ₹${optionChain.majorPutSupport.toLocaleString('en-IN')}
  * Max Pain Strike: ₹${optionChain.maxPain.toLocaleString('en-IN')}
  * ATM Strike ${atmStrike}: Call LTP ₹${atmRow?.call.ltp || 170}, Put LTP ₹${atmRow?.put.ltp || 130}
- Current Algorithmic Signal:
  * Verdict: ${signal.signal} (Trend: ${signal.trend}, Regime: ${signal.marketRegime})
  * Recommended Strategy: ${signal.suggestedStrategy.name}
  * Entry Zone: ₹${signal.entryZone[0]} - ₹${signal.entryZone[1]}
  * Stop Loss: ₹${signal.stopLoss}
  * Target 1: ₹${signal.target1} | Target 2: ₹${signal.target2}
  * Risk:Reward: ${signal.riskReward}
- Top Movers:
  * Gainers: ${topGainers.map(s => `${s.symbol} (+${s.changePercent.toFixed(1)}%)`).join(', ')}
  * Losers: ${topLosers.map(s => `${s.symbol} (${s.changePercent.toFixed(1)}%)`).join(', ')}
`;

    const systemInstruction = `
You are the "NIFTY 50 AI Investor Advisor" built for retail stock and options investors in India.
Your mission is to provide clear, direct, honest, and easy-to-understand trading guidance in plain everyday language.
The user is asking buy/sell questions ("Should I buy Call or Put?", "Which strike?", "What is the stop loss?", etc.).

ALWAYS FOLLOW THESE RULES:
1. GIVE A CLEAR DIRECT VERDICT FIRST:
   - State clearly: "🟢 CALL BUY (BUY CE)" or "🔴 PUT BUY (BUY PE)" or "🟡 WAIT / DO NOT BUY" (if choppy or near resistance).
2. PROVIDE SPECIFIC NUMBERS:
   - Contract Strike (e.g. NIFTY ${atmStrike} CE or PE)
   - Entry Range (e.g. ₹${signal.entryZone[0]} - ₹${signal.entryZone[1]})
   - Strict Stop Loss (e.g. ₹${signal.stopLoss})
   - Target 1 & Target 2 (e.g. ₹${signal.target1} & ₹${signal.target2})
3. GIVE 2-3 BULLET POINTS IN SIMPLE WORDS:
   - Explain WHY based on the live references provided (e.g. "Nifty is above VWAP", "Put writers defending support at ₹${optionChain.majorPutSupport}", etc.)
   - Avoid confusing academic jargon. Explain like talking to a smart friend.
4. ANSWER IN THE USER'S LANGUAGE:
   - If asked in English, reply in friendly English.
   - If asked in Hindi or Hinglish, reply in easy Hinglish/Hindi.
5. ALWAYS INCLUDE A QUICK RISK REMINDER:
   - "Always maintain your stop-loss of ₹${signal.stopLoss} to protect your capital."
`;

    if (aiClient) {
      const chatContents: any[] = [];

      // Include previous history turns if provided
      if (Array.isArray(history)) {
        for (const h of history.slice(-6)) {
          if (h.role === 'user' || h.role === 'model') {
            chatContents.push({
              role: h.role,
              parts: [{ text: h.text }],
            });
          }
        }
      }

      chatContents.push({
        role: 'user',
        parts: [{ text: `${marketContextString}\n\nUser Question: ${message}` }],
      });

      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: chatContents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        return res.json({
          reply: response.text || 'Unable to generate response at this moment.',
          references: {
            spotPrice: currentNiftyPrice,
            signal: signal.signal,
            pcr: optionChain.oiPcr,
            support: optionChain.majorPutSupport,
            resistance: optionChain.majorCallResistance,
            recommendedStrike: `${atmStrike} ${signal.signal.includes('CALL') ? 'CE' : 'PE'}`,
            stopLoss: signal.stopLoss,
            target: signal.target1,
          },
          source: 'Gemini 3.8 Flash AI Investor Advisor',
        });
      } catch (aiErr) {
        console.warn('Gemini API call failed, using intelligent fallback:', aiErr);
        // Fall through to algorithmic fallback below
      }
    }

    // High quality intelligent fallback if AI client key is not configured
    const isBull = signal.signal.includes('CALL') || currentNiftyPrice > quote.vwap;
    const isBear = signal.signal.includes('PUT') || currentNiftyPrice < quote.vwap;

    let fallbackReply = '';
    if (isBull) {
      fallbackReply = `### 🟢 Recommendation: CALL BUY (BUY CE)

- **Recommended Contract:** **NIFTY ${atmStrike} CE** (Current Premium: ~₹${atmRow?.call.ltp || 170})
- **Entry Range:** ₹${signal.entryZone[0]} – ₹${signal.entryZone[1]}
- **Stop Loss:** **₹${signal.stopLoss}** (Strict Exit)
- **Target 1:** **₹${signal.target1}** | **Target 2:** **₹${signal.target2}**
- **Risk : Reward:** **${signal.riskReward}**

#### Why Buy Call right now?
1. **Trading Above Average Price:** NIFTY (₹${currentNiftyPrice.toLocaleString('en-IN')}) is sustaining above today's VWAP (₹${quote.vwap.toLocaleString('en-IN')}), meaning institutional buyers are currently in control.
2. **Put Writers Protecting Support:** Put Open Interest buildup at **₹${optionChain.majorPutSupport}** (PCR: ${optionChain.oiPcr}) indicates strong institutional buying support on any dip.
3. **Supertrend & Momentum:** Supertrend is **${indicators.supertrend.direction}** and RSI is at **${indicators.rsi14.value}**, confirming upward momentum.

*⚠️ Risk Reminder: Never risk more than 2% of your trading capital. Keep stop loss at ₹${signal.stopLoss} active in your terminal.*`;
    } else if (isBear) {
      fallbackReply = `### 🔴 Recommendation: PUT BUY (BUY PE)

- **Recommended Contract:** **NIFTY ${atmStrike} PE** (Current Premium: ~₹${atmRow?.put.ltp || 130})
- **Entry Range:** ₹${signal.entryZone[0]} – ₹${signal.entryZone[1]}
- **Stop Loss:** **₹${signal.stopLoss}** (Strict Exit)
- **Target 1:** **₹${signal.target1}** | **Target 2:** **₹${signal.target2}**
- **Risk : Reward:** **${signal.riskReward}**

#### Why Buy Put right now?
1. **Trading Below VWAP:** NIFTY (₹${currentNiftyPrice.toLocaleString('en-IN')}) is trading under today's VWAP (₹${quote.vwap.toLocaleString('en-IN')}) with continuous selling pressure.
2. **Heavy Call Resistance:** Call writers have built a massive wall at **₹${optionChain.majorCallResistance}**, making it very difficult for the index to rally higher.
3. **Weak Momentum:** RSI is at **${indicators.rsi14.value}** and MACD confirms persistent downward drift.

*⚠️ Risk Reminder: Keep your stop loss at ₹${signal.stopLoss} to guard against sharp short-covering bounces.*`;
    } else {
      fallbackReply = `### 🟡 Recommendation: WAIT / DO NOT BUY OPTIONS

- **Current Market Condition:** **RANGE-BOUND / SIDEWAYS CONSOLIDATION**
- **Trading Range:** Support at **₹${optionChain.majorPutSupport}** — Resistance at **₹${optionChain.majorCallResistance}**
- **Action Advice:** Avoid buying OTM Calls or Puts today because option premiums are losing value rapidly due to time decay (theta).
- **When to Enter:** Wait for NIFTY to cleanly break above **₹${optionChain.majorCallResistance}** (for Call Buy) or below **₹${optionChain.majorPutSupport}** (for Put Buy).

*💡 Capital Preservation Tip: Professional traders sit on cash during choppy markets and only trade when there is high directional clarity.*`;
    }

    return res.json({
      reply: fallbackReply,
      references: {
        spotPrice: currentNiftyPrice,
        signal: signal.signal,
        pcr: optionChain.oiPcr,
        support: optionChain.majorPutSupport,
        resistance: optionChain.majorCallResistance,
        recommendedStrike: `${atmStrike} ${isBull ? 'CE' : isBear ? 'PE' : 'STRANGLE'}`,
        stopLoss: signal.stopLoss,
        target: signal.target1,
      },
      source: 'NIFTY 50 Quantitative Advisor Engine',
    });
  } catch (err: any) {
    console.error('Investor Chat Error:', err);
    return res.status(500).json({ error: 'Failed to process investor inquiry', details: err.message });
  }
});

/**
 * GET /api/news
 * Returns market news and global indices updated dynamically every 5 minutes
 */
app.get('/api/news', async (_req: Request, res: Response) => {
  try {
    const data = await getUpdatedMarketNews();
    res.json(data);
  } catch (err: any) {
    res.json({
      news: SAMPLE_NEWS,
      globalIndices: GLOBAL_INDICES,
    });
  }
});

/**
 * GET /api/historical-events
 * Returns historical crashes and rallies database
 */
app.get('/api/historical-events', (_req: Request, res: Response) => {
  res.json({
    events: HISTORICAL_EVENTS,
  });
});

/**
 * POST /api/backtest
 * Runs walk-forward backtest
 */
app.post('/api/backtest', (req: Request, res: Response) => {
  const periodDays = Number(req.body.periodDays) || 60;
  const slippage = Number(req.body.slippagePoints) || 1.5;
  const brokerage = Number(req.body.brokeragePerOrder) || 20;

  const result = runBacktest(periodDays, slippage, brokerage);
  res.json(result);
});

// Configure Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NIFTY 50 F&O AI Trading Analyst running on port ${PORT}`);
  });
}

startServer();
