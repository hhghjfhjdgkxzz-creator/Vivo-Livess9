
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Trophy, Wallet, Share2, ShieldCheck, Zap, RotateCcw, Mic, LayoutGrid } from 'lucide-react';

interface RoomToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  isHost: boolean;
}

const RoomToolsModal: React.FC<RoomToolsModalProps> = ({ isOpen, onClose, onAction, isHost }) => {
  if (!isOpen) return null;

  // قائمة جميع الأدوات
  const allTools = [
    { id: 'settings', label: 'إعدادات الغرفة', icon: Settings, color: 'bg-blue-500' },
    { id: 'rank', label: 'ترتيب الداعمين', icon: Trophy, color: 'bg-amber-500' },
    { id: 'luckybag', label: 'حقيبة الحظ', icon: Wallet, color: 'bg-emerald-500' },
    { id: 'mic_layout', label: 'تبديل المقاعد', icon: LayoutGrid, color: 'bg-indigo-600' },
    { id: 'reset_charm', label: 'تصفير الكاريزما', icon: RotateCcw, color: 'bg-rose-500' },
    { id: 'open_mics', label: 'فتح المايكات', icon: Mic, color: 'bg-indigo-500' },
  ];

  // تصفية الأدوات: صاحب الغرفة يرى الكل، المستخدم العادي يرى حقيبة الحظ فقط
  const tools = isHost ? allTools : allTools.filter(t => t.id === 'luckybag');

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center pointer-events-none">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" 
      />
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }} 
        className="relative w-full max-w-md bg-[#0f172a] rounded-t-[2.5rem] border-t border-white/10 p-6 pb-12 pointer-events-auto shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              <h3 className="text-lg font-black text-white text-right">امتيازات الغرفة</h3>
           </div>
           <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><X size={20} className="text-slate-400" /></button>
        </div>

        <div className={`grid ${tools.length === 1 ? 'grid-cols-1' : 'grid-cols-3'} gap-y-8 gap-x-4`}>
           {tools.map(tool => (
              <button 
                key={tool.id} 
                onClick={() => onAction(tool.id)}
                className="flex flex-col items-center gap-2 group active:scale-90 transition-all"
              >
                 <div className={`w-16 h-16 ${tool.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:brightness-110 border border-white/10`}>
                    <tool.icon size={28} />
                 </div>
                 <span className="text-[10px] font-bold text-slate-300 text-center leading-tight">{tool.label}</span>
              </button>
           ))}
        </div>
      </motion.div>
    </div>
  );
};

export default RoomToolsModal;
