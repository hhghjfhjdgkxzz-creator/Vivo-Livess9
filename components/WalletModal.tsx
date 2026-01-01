import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Wallet, Gem, Coins, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { User } from '../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onExchange: (diamonds: number) => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, user, onExchange }) => {
  const [exchangeAmount, setExchangeAmount] = useState<string>('');

  if (!isOpen) return null;

  const currentDiamonds = Number(user.diamonds || 0);
  const potentialCoins = Math.floor((Number(exchangeAmount) || 0) * 0.5);

  const handleExchange = () => {
    const amount = Number(exchangeAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (amount > currentDiamonds) {
      alert('رصيد الألماس غير كافٍ!');
      return;
    }

    // التنفيذ الفوري
    onExchange(amount);
    setExchangeAmount('');
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-b border-white/5 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition">
            <X size={20} />
          </button>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-3 border border-indigo-500/30">
              <Wallet size={28} className="text-indigo-400" />
            </div>
            <h2 className="text-xl font-black text-white">محفظتي</h2>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">إدارة الأصول المالية</p>
          </div>
        </div>

        {/* Balances */}
        <div className="p-6 grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 border border-white/5 p-4 rounded-3xl text-center">
            <div className="flex items-center justify-center gap-1.5 text-yellow-500 mb-1">
              <Coins size={16} />
              <span className="text-[10px] font-bold">الكوينز</span>
            </div>
            <div className="text-xl font-black text-white">{(Number(user.coins || 0)).toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/50 border border-white/5 p-4 rounded-3xl text-center">
            <div className="flex items-center justify-center gap-1.5 text-blue-400 mb-1">
              <Gem size={16} />
              <span className="text-[10px] font-bold">الألماس</span>
            </div>
            <div className="text-xl font-black text-white">{(Number(user.diamonds || 0)).toLocaleString()}</div>
          </div>
        </div>

        {/* Exchange Form */}
        <div className="px-6 pb-8">
          <div className="bg-slate-900 rounded-[2rem] p-5 border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-300">استبدال الألماس بالكوينز</h3>
              <div className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[8px] font-black rounded-full border border-blue-500/20">
                نسبة التحويل: 50%
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="number"
                  placeholder="كمية الألماس..."
                  value={exchangeAmount}
                  onChange={(e) => setExchangeAmount(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 pr-12 text-sm text-white outline-none focus:border-blue-500/50 transition-all text-right font-black"
                />
                <Gem size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400" />
                <button 
                  onClick={() => setExchangeAmount(String(currentDiamonds))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg"
                >
                  الكل
                </button>
              </div>

              <div className="flex justify-center">
                <div className="bg-white/5 p-2 rounded-full">
                  <ArrowRightLeft size={16} className="text-slate-500 rotate-90" />
                </div>
              </div>

              <div className="bg-black/20 rounded-2xl p-4 flex justify-between items-center border border-dashed border-white/10">
                <div className="flex items-center gap-2">
                  <Coins size={16} className="text-yellow-500" />
                  <span className="text-xs font-bold text-slate-400">ستحصل على:</span>
                </div>
                <div className="text-lg font-black text-yellow-500">
                  {potentialCoins.toLocaleString()} <span className="text-[10px]">🪙</span>
                </div>
              </div>

              <button 
                disabled={!exchangeAmount || Number(exchangeAmount) <= 0 || Number(exchangeAmount) > currentDiamonds}
                onClick={handleExchange}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-4 rounded-2xl text-white font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <TrendingUp size={18}/> تأكيد الاستبدال فوراً
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WalletModal;