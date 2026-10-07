import React from 'react';
import { AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#090d16] py-6 px-4 md:px-8 mt-12 text-slate-500 font-mono text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-2.5 max-w-4xl">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-sans text-[11px] text-slate-400">
            <strong>Mandatory Regulatory & Risk Disclaimer:</strong> This application provides market analysis and educational decision-support tools. Signals, confidence scores, backtests, and AI analysis are analytical estimates, not guarantees of future performance or profit. Futures & Options (F&O) trading involves substantial market risk, including the potential loss of capital. Verify all market data independently and evaluate your personal risk tolerance before making trading decisions.
          </p>
        </div>

        <div className="text-right text-[11px] text-slate-500 shrink-0">
          <div>NIFTY 50 F&O Quantitative Analytics</div>
          <div className="text-slate-600">SEBI Reg. Reference / Educational Sandbox</div>
        </div>
      </div>
    </footer>
  );
};
