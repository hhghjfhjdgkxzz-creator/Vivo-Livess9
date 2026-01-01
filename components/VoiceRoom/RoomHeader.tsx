
import React, { useState } from 'react';
import { ChevronDown, LogOut, Minimize2, Users as UsersIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Room } from '../../types';

interface RoomHeaderProps {
  room: Room;
  onLeave: () => void;
  onMinimize: () => void;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({ room, onLeave, onMinimize }) => {
  const [showExitDropdown, setShowExitDropdown] = useState(false);

  return (
    <div className="flex justify-between items-center p-4 pt-12 bg-gradient-to-b from-black/80 to-transparent shrink-0 z-50">
      <div className="flex items-center gap-3 relative">
        <button onClick={() => setShowExitDropdown(!showExitDropdown)} className="w-9 h-9 flex items-center justify-center bg-black/40 rounded-xl">
          <ChevronDown size={20} className={`text-white transition-transform ${showExitDropdown ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {showExitDropdown && (
            <>
              <div className="fixed inset-0 z-[190]" onClick={() => setShowExitDropdown(false)}></div>
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-12 right-0 w-44 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl z-[200] overflow-hidden text-right" dir="rtl">
                <button onClick={onLeave} className="w-full p-4 flex items-center gap-3 border-b border-white/5 hover:bg-white/5"><LogOut size={16} className="text-red-500" /><span className="text-xs font-black text-white">خروج</span></button>
                <button onClick={onMinimize} className="w-full p-4 flex items-center gap-3 hover:bg-white/5"><Minimize2 size={16} className="text-amber-500" /><span className="text-xs font-black text-white">تصغير</span></button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <div className="text-white text-right" dir="rtl">
          <h2 className="font-black text-sm truncate max-w-[120px]">{room.title}</h2>
          <p className="text-[10px] opacity-60">ID: {room.id}</p>
        </div>
      </div>
      <div className="bg-black/40 px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/5">
        <UsersIcon size={12} className="text-emerald-400" />
        <span className="text-xs font-black text-white">{room.listeners || 0}</span>
      </div>
    </div>
  );
};

export default RoomHeader;
