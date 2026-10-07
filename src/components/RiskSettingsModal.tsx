import React, { useState } from 'react';
import { RiskSettings } from '../types/market';
import { X, ShieldAlert, Check } from 'lucide-react';

interface RiskSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RiskSettings;
  onSave: (newSettings: RiskSettings) => void;
}

export const RiskSettingsModal: React.FC<RiskSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [riskPercent, setRiskPercent] = useState(settings.maxRiskPerTradePercent);
  const [maxDailyLoss, setMaxDailyLoss] = useState(settings.maxDailyLossRupees);
  const [maxDailyTrades, setMaxDailyTrades] = useState(settings.maxDailyTrades);
  const [defaultLots, setDefaultLots] = useState(settings.defaultLots);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      maxRiskPerTradePercent: riskPercent,
      maxDailyLossRupees: maxDailyLoss,
      maxDailyTrades: maxDailyTrades,
      defaultLots,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono text-xs">
      <div className="bg-[#0e1424] border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              User Risk Controls & Discipline
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 block mb-1">MAX RISK PER TRADE (%)</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((pct) => (
                <button
                  type="button"
                  key={pct}
                  onClick={() => setRiskPercent(pct)}
                  className={`flex-1 py-1.5 rounded-lg border cursor-pointer ${
                    riskPercent === pct
                      ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {pct}%
                </button>
              ))}
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="10"
                value={riskPercent}
                onChange={(e) => setRiskPercent(Number(e.target.value))}
                className="w-20 bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-center text-white"
                placeholder="Custom"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">MAX DAILY LOSS LIMIT (₹)</label>
            <input
              type="number"
              step="1000"
              value={maxDailyLoss}
              onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              System alerts when cumulative daily losses reach this threshold.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">MAX TRADES / DAY</label>
              <input
                type="number"
                min="1"
                max="15"
                value={maxDailyTrades}
                onChange={(e) => setMaxDailyTrades(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">DEFAULT LOTS</label>
              <input
                type="number"
                min="1"
                max="10"
                value={defaultLots}
                onChange={(e) => setDefaultLots(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 leading-relaxed font-sans">
            <strong>Capital Preservation Principle:</strong> These parameters serve as voluntary behavioral boundaries. Never risk capital you cannot afford to lose in derivatives.
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors cursor-pointer uppercase flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Save Risk Settings</span>
          </button>
        </form>
      </div>
    </div>
  );
};
