
import React, { useState } from 'react';
import { Mic, MicOff, Gift, Gamepad2, LayoutGrid, Send } from 'lucide-react';

interface ControlBarProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onShowGifts: () => void;
  onShowGames: () => void;
  onShowRoomTools: () => void;
  onSendMessage: (text: string) => void;
  userCoins: number;
}

const ControlBar: React.FC<ControlBarProps> = ({ 
  isMuted, onToggleMute, onShowGifts, onShowGames, onShowRoomTools, onSendMessage, userCoins 
}) => {
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="p-4 bg-gradient-to-t from-black to-transparent z-50 shrink-0">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        
        {/* زر الامتيازات */}
        <button 
          onClick={onShowRoomTools}
          className="w-10 h-10 bg-white/10 backdrop-blur-lg rounded-xl flex items-center justify-center text-white border border-white/10 active:scale-90 shadow-lg shrink-0"
        >
          <LayoutGrid size={20} />
        </button>

        {/* حقل الإدخال المباشر (نظام الكتابة المفعل) */}
        <form onSubmit={handleSend} className="flex-1 flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl px-3 h-10 overflow-hidden">
           <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="دردشة..."
              className="flex-1 bg-transparent text-[11px] text-white outline-none font-bold"
              dir="rtl"
           />
           {inputText.trim() && (
             <button type="submit" className="text-amber-500 mr-2 active:scale-90 transition-transform">
                <Send size={16} fill="currentColor" className="rotate-180" />
             </button>
           )}
        </form>

        {/* زر المايك الرئيسي */}
        <button 
          onClick={onToggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-xl transition-all active:scale-90 shrink-0 ${
            isMuted ? 'bg-slate-800 border-white/10 text-slate-500' : 'bg-blue-600 border-blue-400 text-white animate-pulse'
          }`}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* ألعاب وهدايا */}
        <div className="flex gap-1.5 shrink-0">
           <button onClick={onShowGames} className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 border border-emerald-400/30"><Gamepad2 size={20}/></button>
           <button onClick={onShowGifts} className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 border border-pink-400/30"><Gift size={20} fill="currentColor" /></button>
        </div>

      </div>
    </div>
  );
};

export default ControlBar;
