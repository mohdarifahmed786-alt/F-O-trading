import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Compass,
  X,
} from 'lucide-react';
import {
  MarketQuote,
  TechnicalIndicators,
  OptionChainSummary,
  IndiaVixSummary,
  SignalAnalysis,
  StockConstituent,
} from '../types/market';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  references?: {
    spotPrice: number;
    signal: string;
    pcr: number;
    support: number;
    resistance: number;
    recommendedStrike?: string;
    stopLoss?: number;
    target?: number;
  };
}

interface InvestorChatSectionProps {
  quote: MarketQuote;
  indicators: TechnicalIndicators;
  optionChain: OptionChainSummary;
  vix: IndiaVixSummary;
  signal: SignalAnalysis;
  stocks: StockConstituent[];
  initialPrompt?: string;
  onOpenTrade?: (strike: number, optionType: 'CE' | 'PE', action: 'BUY' | 'SELL') => void;
  onClose?: () => void;
}

export const InvestorChatSection: React.FC<InvestorChatSectionProps> = ({
  quote,
  indicators,
  optionChain,
  vix,
  signal,
  stocks,
  initialPrompt,
  onOpenTrade,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      role: 'model',
      text: `Hello! I am your **NIFTY 50 AI Investor Advisor**. 

I continuously monitor the live NSE order book, India VIX, Put-Call Ratio, VWAP, and all 50 constituent stocks.

Ask me anything in **simple language**, such as:
- *"Should I buy Call or Put right now?"*
- *"What is the exact strike, entry, stop loss, and target?"*
- *"Is it safe to trade today or should I wait?"*
- *"Explain today's market in simple words"*`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialPromptSentRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialPrompt && !initialPromptSentRef.current) {
      initialPromptSentRef.current = true;
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendMessage = async (userPrompt?: string) => {
    const textToSend = userPrompt || input.trim();
    if (!textToSend || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!userPrompt) setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome-msg')
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/investor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history,
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: data.reply || 'No response generated.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        references: data.references,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('Failed to send investor chat:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `⚠️ **Unable to reach advisor right now.**\n\nBased on live market data: NIFTY is at **₹${quote.currentPrice.toLocaleString('en-IN')}**, algorithmic signal is **${signal.signal}** with stop loss at **₹${signal.stopLoss}** and target **₹${signal.target1}**.`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Quick Ask Chips
  const quickQuestions = [
    'Should I buy Call or Put right now?',
    'What strike price, Stop Loss & Target should I trade?',
    'Where is the strongest support and resistance today?',
    'Which Nifty 50 stock has the strongest signal?',
    'Aaj market me Call lena chahiye ya Put? Simple bhasha me samjhao.',
  ];

  const isPos = quote.change >= 0;

  return (
    <div className="bg-[#090d16] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col h-full">
      {/* 1. TOP LIVE MARKET REFERENCE HEADER */}
      <div className="bg-[#0b0f19] p-4 border-b border-slate-800 space-y-2 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-bold text-white tracking-tight">
                  NIFTY 50 AI Investor Advisor
                </h1>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE GROUNDED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Ask simple buy/sell questions. Responses use live NSE tick quotes, Option Chain PCR, VWAP, and VIX.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Spot Reference Bar */}
            <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 block">NIFTY 50:</span>
                <span className="text-white font-bold tabular-nums">
                  ₹{quote.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-[10px] text-slate-500 block">TODAY SIGNAL:</span>
                <span className={`font-bold ${signal.signal.includes('CALL') ? 'text-emerald-400' : signal.signal.includes('PUT') ? 'text-rose-400' : 'text-amber-400'}`}>
                  {signal.signal}
                </span>
              </div>
              <div className="border-l border-slate-800 pl-3 hidden sm:block">
                <span className="text-[10px] text-slate-500 block">INDIA VIX:</span>
                <span className="text-sky-300 font-bold">{vix.value.toFixed(2)}</span>
              </div>
              <div className="border-l border-slate-800 pl-3 hidden sm:block">
                <span className="text-[10px] text-slate-500 block">PCR:</span>
                <span className="text-slate-200 font-bold">{optionChain.oiPcr}</span>
              </div>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 ml-1"
                title="Close Advisor Chat"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Reference Strip */}
        <div className="flex items-center gap-2 overflow-x-auto text-[10px] text-slate-400 pt-1 pb-0.5">
          <span className="text-slate-500 uppercase font-semibold">Live References:</span>
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            VWAP: <strong className="text-amber-400">₹{quote.vwap.toFixed(1)}</strong>
          </span>
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            Support: <strong className="text-emerald-400">₹{optionChain.majorPutSupport}</strong>
          </span>
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            Resistance: <strong className="text-rose-400">₹{optionChain.majorCallResistance}</strong>
          </span>
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            Supertrend: <strong className="text-emerald-300">{indicators.supertrend.direction}</strong>
          </span>
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            RSI 14: <strong className="text-white">{indicators.rsi14.value}</strong>
          </span>
        </div>
      </div>

      {/* 2. CHAT MESSAGES STREAM */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-md ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 space-y-3 leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] opacity-70 pb-1 border-b border-white/10">
                  <span className="font-bold">{isUser ? 'YOU' : 'AI INVESTOR ADVISOR'}</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Formatted Message Body */}
                <div className="text-xs whitespace-pre-wrap font-sans space-y-2 leading-relaxed">
                  {msg.text.split('\n\n').map((paragraph, pIdx) => {
                    // Check for headers
                    if (paragraph.startsWith('### ')) {
                      return (
                        <h3 key={pIdx} className="text-sm font-bold text-white font-mono flex items-center gap-1.5 pt-1">
                          {paragraph.replace('### ', '')}
                        </h3>
                      );
                    }
                    if (paragraph.startsWith('#### ')) {
                      return (
                        <h4 key={pIdx} className="text-xs font-bold text-slate-300 font-mono pt-1">
                          {paragraph.replace('#### ', '')}
                        </h4>
                      );
                    }

                    // Bullet lists
                    if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
                      const items = paragraph.split('\n- ').map((s) => s.replace(/^- /, ''));
                      return (
                        <ul key={pIdx} className="space-y-1 pl-2">
                          {items.map((item, iIdx) => (
                            <li key={iIdx} className="flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    // Numbered lists
                    if (paragraph.includes('\n1. ') || paragraph.startsWith('1. ')) {
                      const items = paragraph.split(/\n\d+\. /).map((s) => s.replace(/^\d+\. /, ''));
                      return (
                        <ol key={pIdx} className="space-y-1 pl-2">
                          {items.map((item, iIdx) => (
                            <li key={iIdx} className="flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold font-mono">{iIdx + 1}.</span>
                              <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
                            </li>
                          ))}
                        </ol>
                      );
                    }

                    return (
                      <p
                        key={pIdx}
                        dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(paragraph) }}
                      />
                    );
                  })}
                </div>

                {/* If trade references exist, show quick trade execution pill */}
                {msg.references && msg.references.recommendedStrike && onOpenTrade && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                    <span className="text-slate-400">
                      Contract: <strong className="text-amber-400">{msg.references.recommendedStrike}</strong>
                    </span>
                    <button
                      onClick={() => {
                        const parts = msg.references?.recommendedStrike?.split(' ') || [];
                        const strike = Number(parts[0]) || 22400;
                        const type = (parts[1] as 'CE' | 'PE') || 'CE';
                        onOpenTrade(strike, type, 'BUY');
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                    >
                      <span>⚡ Open Contract in Option Chain</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 font-sans flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Analyzing live market orderflow & option chain references...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. QUICK INVESTOR ASK CHIPS */}
      <div className="p-3 bg-[#0b0f19] border-t border-slate-800 space-y-2 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          <span className="text-slate-500 text-[10px] shrink-0 font-sans font-semibold">QUICK ASK:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg shrink-0 cursor-pointer transition-all disabled:opacity-50 text-[11px] font-sans"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Box & Submit Button */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything: 'Should I buy Call or Put?', 'What is your target for Nifty?', etc..."
              disabled={loading}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs font-sans disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shrink-0"
          >
            <span>Ask Advisor</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

// Simple Markdown formatting helper for bolding and italics
function formatInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-slate-800 px-1 py-0.5 rounded text-amber-300 font-mono text-[11px]">$1</code>');
}
