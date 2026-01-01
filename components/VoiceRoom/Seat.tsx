
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MicOff, Mic, Zap } from 'lucide-react';
import { User } from '../../types';

interface SeatProps {
  index: number;
  speaker: User | null;
  onClick: (index: number) => void;
  currentUser: User;
  sizeClass: string;
  customSkin?: string; 
}

const Seat: React.FC<SeatProps> = ({ index, speaker, onClick, currentUser, sizeClass, customSkin }) => {
  return (
    <div className={`relative flex items-center justify-center ${sizeClass} shrink-0`}>
      <button 
        onClick={() => onClick(index)} 
        className="w-full h-full relative group transition-transform active:scale-90 flex items-center justify-center"
      >
        {speaker ? (
          <div className="relative w-full h-full p-0.5 flex flex-col items-center">
            {/* التوهج عند التحدث */}
            {!speaker.isMuted && (
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1], 
                  opacity: [0.4, 0.7, 0.4],
                  boxShadow: [
                    "0 0 0px rgba(251,191,36,0)",
                    "0 0 15px rgba(251,191,36,0.5)",
                    "0 0 0px rgba(251,191,36,0)"
                  ]
                }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 z-0 rounded-full bg-amber-400/20"
              />
            )}

            <div className="relative z-10 w-full h-full rounded-full overflow-hidden border border-white/20 bg-slate-900 shadow-xl">
              <img src={speaker.avatar} className="w-full h-full object-cover" alt={speaker.name} />
              
              <AnimatePresence>
                {speaker.activeEmoji && (
                  <motion.div 
                    initial={{ scale: 0, y: 10 }} 
                    animate={{ scale: 1.5, y: -15 }} 
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
                  >
                    <span className="text-2xl filter drop-shadow-lg">{speaker.activeEmoji}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* الإطارات */}
            {speaker.frame && (
              <img src={speaker.frame} className="absolute inset-0 w-full h-full object-contain z-20 scale-[1.18] pointer-events-none" />
            )}

            {/* معلومات المستخدم - تم تقريبها للمقعد (bottom-6) لتناسب الأحجام الصغيرة */}
            <div className="absolute -bottom-6 left-0 right-0 flex flex-col items-center gap-0.5 pointer-events-none">
               <span className="text-[7px] font-black text-white truncate drop-shadow-md px-1.5 py-0.5 bg-black/70 rounded-full max-w-[48px] border border-white/5 leading-none">
                  {speaker.name}
               </span>
               
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="flex items-center gap-0.5 px-1 py-0.5 bg-pink-600/20 border border-pink-500/30 rounded-full shadow-lg backdrop-blur-sm"
               >
                  <span className="text-pink-400 font-black text-[5px] leading-none tracking-tighter">
                     {(Number(speaker.charm || 0)).toLocaleString()}
                  </span>
                  <div className="w-0.5 h-0.5 bg-pink-500 rounded-full animate-pulse"></div>
               </motion.div>
            </div>
          </div>
        ) : (
          /* تصميم المقعد الفارغ */
          <div className="w-full h-full relative flex items-center justify-center">
            {customSkin ? (
               <img src={customSkin} className="w-full h-full object-contain filter drop-shadow-lg group-hover:scale-110 transition-all opacity-80" alt="Seat Skin" />
            ) : (
              <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner group-hover:bg-white/20 transition-all">
                 <span className="text-base filter grayscale opacity-40">🛋️</span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Mic size={10} className="text-white" />
               </div>
            </div>
          </div>
        )}
      </button>
    </div>
  );
};

export default Seat;
