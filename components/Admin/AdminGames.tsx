
import React, { useState } from 'react';
import { Activity, Smile, Upload, Timer, Zap, RefreshCcw, Target, LayoutGrid, X, Trophy, Coins, Settings2, Sparkles } from 'lucide-react';
import { GameSettings, LuckyMultiplier } from '../../types';
import { DEFAULT_REACTIONS } from '../../constants/emojis';
import { motion } from 'framer-motion';

interface AdminGamesProps {
  gameSettings: GameSettings;
  onUpdateGameSettings: (updates: Partial<GameSettings>) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const AdminGames: React.FC<AdminGamesProps> = ({ gameSettings, onUpdateGameSettings, handleFileUpload }) => {
  const [newEmoji, setNewEmoji] = useState('');

  // تحديث نسبة الحظ للهدايا
  const updateLuckyWinRate = (val: number) => {
    onUpdateGameSettings({ luckyGiftWinRate: val });
  };

  // شريط واحد يتحكم في نسبة الربح للعبتين معاً
  const updateUniversalGameLuck = (val: number) => {
    onUpdateGameSettings({ 
      wheelWinRate: val,
      slotsWinRate: val 
    });
  };

  // تفعيل الأكسات الفائقة (من 1 إلى 1000)
  const toggleSuperMultipliers = () => {
    const isCurrentlyEnabled = gameSettings.luckyXEnabled;
    const superMuls: LuckyMultiplier[] = [
      { label: 'X1', value: 1, chance: 50 },
      { label: 'X10', value: 10, chance: 30 },
      { label: 'X100', value: 100, chance: 15 },
      { label: 'X500', value: 500, chance: 4 },
      { label: 'X1000', value: 1000, chance: 1 }
    ];
    
    onUpdateGameSettings({ 
      luckyXEnabled: !isCurrentlyEnabled,
      luckyMultipliers: superMuls
    });
  };

  const handleAddEmoji = (emojiUrlOrText: string) => {
    if (!emojiUrlOrText.trim()) return;
    const currentEmojis = gameSettings.availableEmojis || DEFAULT_REACTIONS;
    if (currentEmojis.includes(emojiUrlOrText.trim())) return;
    onUpdateGameSettings({ availableEmojis: [...currentEmojis, emojiUrlOrText.trim()] });
    setNewEmoji('');
  };

  const handleRemoveEmoji = (emoji: string) => {
    const currentEmojis = gameSettings.availableEmojis || DEFAULT_REACTIONS;
    onUpdateGameSettings({ availableEmojis: currentEmojis.filter(e => e !== emoji) });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-right font-cairo" dir="rtl">
      {/* Header Section */}
      <div className="bg-slate-950/40 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
           <Settings2 size={120} />
        </div>
        <div className="relative z-10 text-center md:text-right">
          <h3 className="text-3xl font-black text-white flex items-center justify-center md:justify-start gap-3">
             <div className="p-2 bg-amber-500 rounded-2xl shadow-lg shadow-amber-900/40"><Activity className="text-black" /></div>
             مركز التحكم الفائق بالحظ
          </h3>
          <p className="text-slate-500 text-sm font-bold mt-2 pr-1">إدارة شاملة لنسب الأرباح وتوازن الألعاب بضغطة واحدة.</p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-500 text-[10px] font-black tracking-widest uppercase">System Active</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Lucky Gifts Control Card */}
        <motion.div whileHover={{ y: -5 }} className="bg-[#0f172a] border border-amber-500/20 p-8 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-30"></div>
           
           <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-black text-white flex items-center gap-2"><Zap className="text-amber-400" /> هدايا الحظ</h4>
                <p className="text-[10px] text-slate-500 font-bold mt-1">نسبة فوز الصناديق في الغرف</p>
              </div>
              <div className="bg-amber-500 text-black px-4 py-1 rounded-full font-black text-xl shadow-lg">{gameSettings.luckyGiftWinRate}%</div>
           </div>
           
           <div className="space-y-6">
              <input 
                type="range" min="0" max="100" 
                value={gameSettings.luckyGiftWinRate} 
                onChange={(e) => updateLuckyWinRate(parseInt(e.target.value))}
                className="w-full h-4 bg-slate-800 rounded-2xl appearance-none cursor-pointer accent-amber-500 border border-white/5" 
              />
              <div className="flex justify-between text-[10px] font-black text-slate-600 px-1">
                 <span className="flex items-center gap-1"><X size={10}/> خسارة (0%)</span>
                 <span className="flex items-center gap-1 text-amber-500">فوز دائم (100%) <Sparkles size={10}/></span>
              </div>
           </div>

           <div className="pt-6 border-t border-white/5">
              <button 
                onClick={toggleSuperMultipliers}
                className={`w-full py-5 rounded-[1.5rem] font-black text-xs flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 ${gameSettings.luckyXEnabled ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-black shadow-amber-500/20' : 'bg-slate-800 text-slate-500 border border-white/5'}`}
              >
                 <Target size={20} />
                 {gameSettings.luckyXEnabled ? 'تعطيل مضاعفات الحظ (X1000)' : 'تفعيل المضاعفات القصوى (X1 - X1000)'}
              </button>
           </div>
        </motion.div>

        {/* Universal Games Control Card */}
        <motion.div whileHover={{ y: -5 }} className="bg-[#0f172a] border border-blue-500/20 p-8 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"></div>
           
           <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-black text-white flex items-center gap-2"><Trophy className="text-blue-400" /> ميزان الأرباح الموحد</h4>
                <p className="text-[10px] text-slate-500 font-bold mt-1">نسبة الربح في العجلة والسلوتس معاً</p>
              </div>
              <div className="bg-blue-600 text-white px-4 py-1 rounded-full font-black text-xl shadow-lg">{gameSettings.wheelWinRate}%</div>
           </div>

           <div className="space-y-6">
              <input 
                type="range" min="0" max="100" 
                value={gameSettings.wheelWinRate} 
                onChange={(e) => updateUniversalGameLuck(parseInt(e.target.value))}
                className="w-full h-4 bg-slate-800 rounded-2xl appearance-none cursor-pointer accent-blue-500 border border-white/5" 
              />
              <div className="flex justify-between text-[10px] font-black text-slate-600 px-1">
                 <span className="flex items-center gap-1"><X size={10}/> تجميد الأرباح</span>
                 <span className="flex items-center gap-1 text-blue-400">توزيع أرباح قصوى <Sparkles size={10}/></span>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3 pt-6 border-t border-white/5">
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-1">
                 <RefreshCcw size={16} className="text-cyan-400" />
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Wheel Luck</span>
                 <span className="text-xs font-black text-white">{gameSettings.wheelWinRate}%</span>
              </div>
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-1">
                 <LayoutGrid size={16} className="text-pink-400" />
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Slots Luck</span>
                 <span className="text-xs font-black text-white">{gameSettings.slotsWinRate}%</span>
              </div>
           </div>
        </motion.div>

        {/* Emojis Section */}
        <div className="md:col-span-2 bg-slate-950/60 p-8 rounded-[3rem] border border-white/5 space-y-6">
           <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white flex items-center gap-2"><Smile className="text-emerald-400" /> مكتبة التفاعلات</h4>
              <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-2xl border border-white/5">
                 <Timer size={14} className="text-blue-400" />
                 <span className="text-[10px] font-bold text-slate-400 ml-1">المدة:</span>
                 <input 
                   type="number" step="0.5" min="0.5" max="10" 
                   value={gameSettings.emojiDuration || 1.5} 
                   onChange={e => onUpdateGameSettings({ emojiDuration: parseFloat(e.target.value) })}
                   className="w-10 bg-transparent text-white font-black text-xs outline-none text-center"
                 />
                 <span className="text-[10px] font-bold text-slate-500">ثانية</span>
              </div>
           </div>

           <div className="flex gap-2">
              <input 
                type="text" placeholder="رابط صورة أو ايموجي..." 
                value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} 
                className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-xs outline-none focus:border-emerald-500/50 shadow-inner" 
              />
              <button onClick={() => handleAddEmoji(newEmoji)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 rounded-2xl font-black text-xs active:scale-95 shadow-lg transition-all">إضافة</button>
              <label className="p-4 bg-white/5 text-white rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
                 <Upload size={20} />
                 <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, (url) => handleAddEmoji(url), 200, 200)} />
              </label>
           </div>

           <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3 max-h-48 overflow-y-auto custom-scrollbar p-3 bg-black/20 rounded-[2rem] border border-white/5">
              {(gameSettings.availableEmojis || DEFAULT_REACTIONS).map((emoji, index) => (
                <div key={index} className="relative group aspect-square bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center text-2xl overflow-hidden shadow-sm transition-all hover:bg-white/10">
                  {emoji.includes('http') || emoji.includes('data:image') ? <img src={emoji} className="w-full h-full object-contain p-2" /> : emoji}
                  <button onClick={() => handleRemoveEmoji(emoji)} className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default AdminGames;
