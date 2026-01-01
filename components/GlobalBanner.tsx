
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Flame, Crown, Star, Zap } from 'lucide-react';
import { GlobalAnnouncement } from '../types';

interface GlobalBannerProps {
  announcement: GlobalAnnouncement;
}

const GlobalBanner: React.FC<GlobalBannerProps> = ({ announcement }) => {
  const renderIcon = (icon: string) => {
    if (!icon) return null;
    const isImage = icon.startsWith('http') || icon.startsWith('data:');
    return isImage ? <img src={icon} className="w-12 h-12 object-contain drop-shadow-xl" alt="" /> : <span className="text-3xl">{icon}</span>;
  };

  const isLuckyWin = announcement.type === 'lucky_win';

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-[90%] pointer-events-none">
      <motion.div
        initial={{ y: -100, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -50, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`relative overflow-hidden rounded-full p-[2px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] ${
          isLuckyWin 
          ? 'bg-gradient-to-r from-emerald-500 via-yellow-400 to-emerald-600 shadow-emerald-500/40' 
          : 'bg-gradient-to-r from-amber-500 via-yellow-300 to-orange-600 shadow-amber-500/40'
        }`}
      >
        {/* Glass Content */}
        <div className="bg-black/80 backdrop-blur-3xl rounded-full px-6 py-3 flex items-center justify-between gap-4 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
          
          <div className="flex items-center gap-4 shrink-0">
             <div className="relative">
                {renderIcon(announcement.giftIcon)}
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-white/20 rounded-full blur-xl"
                />
             </div>
             
             <div className="flex flex-col items-start leading-tight">
                <div className="flex items-center gap-2">
                   <span className="text-white font-black text-sm drop-shadow-md">{announcement.senderName}</span>
                   <span className="text-white/60 text-[10px] font-bold">أرسل {announcement.giftName}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                   <span className="text-white/40 text-[9px]">إلى</span>
                   <span className="text-blue-400 font-black text-xs">{announcement.recipientName}</span>
                   {announcement.amount > 0 && (
                      <span className="text-yellow-500 font-black text-xs mr-2">🪙 {announcement.amount.toLocaleString()}</span>
                   )}
                </div>
             </div>
          </div>

          {/* Room Badge */}
          <div className="shrink-0 flex flex-col items-center border-r border-white/10 pr-4">
             <div className="flex items-center gap-1 mb-0.5">
                <Flame size={10} className="text-orange-500 animate-pulse" />
                <span className="text-[8px] text-white/40 uppercase font-black tracking-tighter">في غرفة</span>
             </div>
             <span className="text-[11px] text-amber-500 font-black truncate max-w-[80px]">{announcement.roomTitle}</span>
          </div>
        </div>

        {/* Dynamic Light Sweep */}
        <motion.div 
          animate={{ x: ['-150%', '350%'] }} 
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 w-1/4 pointer-events-none"
        />
      </motion.div>
    </div>
  );
};

export default GlobalBanner;
