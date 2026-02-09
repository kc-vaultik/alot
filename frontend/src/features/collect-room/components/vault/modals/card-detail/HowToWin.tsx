/**
 * @fileoverview How to Win Explainer Component - "Digital Vandalism" Style
 * Expandable section explaining how to win in lots with sticker aesthetic
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { ECONOMY_MESSAGING } from '@/constants/messaging';

export const HowToWin = memo(() => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-zinc-900/80 rounded-2xl border-4 border-white shadow-sticker transform rotate-[0.5deg] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-cyan-500/20 border-2 border-cyan-400">
            <HelpCircle className="w-4 h-4 text-cyan-400" strokeWidth={2.5} />
          </div>
          <span className="text-white font-display text-sm tracking-wide">HOW TO WIN</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {ECONOMY_MESSAGING.LOTTERY.howItWorks.map((rule, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-xl bg-white/5 border border-white/10 transform" style={{ transform: `rotate(${(i % 2 === 0 ? -0.3 : 0.3)}deg)` }}>
                  <span className="text-hype-pink font-display text-sm mt-0.5">{i + 1}</span>
                  <span className="text-white/80 text-xs font-semibold">{rule}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-white/10">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-wide">
                  {ECONOMY_MESSAGING.LOTTERY.oddsExplainer}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

HowToWin.displayName = 'HowToWin';
