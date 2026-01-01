
import React, { useMemo, useEffect, useState } from 'react';
import { User, Room } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Gift, Medal, Award, Trophy, Star, MoreVertical, ShieldCheck, MicOff, UserX, ShieldAlert, RotateCcw } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';

interface UserProfileSheetProps {
  user: User;
  onClose: () => void;
  isCurrentUser: boolean;
  onAction: (action: string, payload?: any) => void;
  currentUser: User;
  allUsers?: User[]; 
  currentRoom: Room; // تغيير من آيدي فقط إلى كائن الغرفة بالكامل
  onShowRoomRank?: () => void;
}

const calculateLevel = (points: number) => {
  if (!points || points <= 0) return 1;
  const lvl = Math.floor(Math.sqrt(points) / 200);
  return Math.max(1, Math.min(100, lvl));
};

const LevelBadge: React.FC<{ level: number; type: 'wealth' | 'recharge' }> = ({ level, type }) => {
  const isWealth = type === 'wealth';
  return (
    <div className="relative h-7 min-w-[85px] flex items-center group cursor-default">
      <div className={`absolute inset-0 rounded-l-md rounded-r-2xl border-y border-r shadow-lg transition-all duration-300 ${
        isWealth 
          ? 'bg-gradient-to-r from-[#6a29e3] via-[#8b5cf6] to-[#6a29e3] border-[#a78bfa]/30 shadow-[#6a29e3]/20' 
          : 'bg-gradient-to-r from-[#1a1a1a] via-[#333] to-[#1a1a1a] border-amber-500/30 shadow-black/40'
      }`}>
        <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      </div>
      <div className={`relative z-10 -ml-1 h-9 w-9 flex items-center justify-center shrink-0 drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]`}>
        <div className={`absolute inset-0 rounded-lg transform rotate-45 border-2 ${
          isWealth ? 'bg-[#5b21b6] border-[#fbbf24]' : 'bg-[#000] border-amber-500'
        }`}></div>
        <span className="relative z-20 text-lg mb-0.5">👑</span>
      </div>
      <div className="relative z-10 flex-1 pr-3 text-center">
        <span className="text-sm font-black italic tracking-tighter text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{level}</span>
      </div>
    </div>
  );
};

const UserProfileSheet: React.FC<UserProfileSheetProps> = ({ user: initialUser, onClose, isCurrentUser, onAction, currentUser, allUsers = [], currentRoom, onShowRoomRank }) => {
  const [roomContribution, setRoomContribution] = useState<number>(0);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  
  const user = useMemo(() => {
    const latest = allUsers.find(u => u.id === initialUser.id);
    return latest || initialUser;
  }, [initialUser, allUsers]);

  const isHost = currentRoom.hostId === currentUser.id;
  const isModerator = currentRoom.moderators?.includes(currentUser.id);
  const targetIsModerator = currentRoom.moderators?.includes(user.id);
  const canManage = (isHost || isModerator) && !isCurrentUser;

  useEffect(() => {
    if (currentRoom.id && user.id) {
       const fetchContrib = async () => {
          const docRef = doc(db, 'rooms', currentRoom.id, 'contributors', user.id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
             setRoomContribution(snap.data().amount || 0);
          }
       };
       fetchContrib();
    }
  }, [currentRoom.id, user.id]);

  const handleAdminAction = async (action: 'toggleMod' | 'kickMic' | 'kickRoom' | 'resetUserCharm') => {
    const roomRef = doc(db, 'rooms', currentRoom.id);
    
    try {
      if (action === 'toggleMod') {
        if (targetIsModerator) {
          await updateDoc(roomRef, { moderators: arrayRemove(user.id) });
        } else {
          await updateDoc(roomRef, { moderators: arrayUnion(user.id) });
        }
      } else if (action === 'kickMic') {
        const newSpeakers = (currentRoom.speakers || []).filter(s => s.id !== user.id);
        await updateDoc(roomRef, { speakers: newSpeakers });
      } else if (action === 'kickRoom') {
        if (confirm(`هل أنت متأكد من طرد ${user.name} من الغرفة؟`)) {
          const newSpeakers = (currentRoom.speakers || []).filter(s => s.id !== user.id);
          await updateDoc(roomRef, { 
            speakers: newSpeakers,
            listeners: increment(-1),
            kickedUsers: arrayUnion(user.id)
          });
          onClose();
        }
      } else if (action === 'resetUserCharm') {
        if (confirm(`هل تريد تصفير كاريزما ${user.name} على المايك؟`)) {
          const updatedSpeakers = (currentRoom.speakers || []).map(s => 
            s.id === user.id ? { ...s, charm: 0 } : s
          );
          await updateDoc(roomRef, { speakers: updatedSpeakers });
        }
      }
      setShowAdminMenu(false);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تنفيذ الإجراء');
    }
  };

  const wealthLvl = calculateLevel(Number(user.wealth || 0));
  const rechargeLvl = calculateLevel(Number(user.rechargePoints || 0));
  
  return (
    <div className="fixed inset-0 z-[160] flex items-end justify-center pointer-events-none p-4 overflow-hidden pb-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-[2px] pointer-events-auto" />

      <motion.div 
        initial={{ y: "100%", opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: "100%", opacity: 0 }} 
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-[340px] bg-[#0c101b] rounded-[2.5rem] pointer-events-auto border border-amber-500/20 shadow-[0_40px_150px_rgba(0,0,0,1)] flex flex-col max-h-[85vh]"
      >
        <div className="h-28 bg-slate-950 relative rounded-t-[2.5rem] shrink-0 overflow-visible">
          {user.cover ? <img src={user.cover} className="w-full h-full object-cover opacity-20 rounded-t-[2.5rem]" alt="" /> : <div className="w-full h-full bg-gradient-to-br from-[#1a1202] via-[#0c101b] to-[#1a1202] rounded-t-[2.5rem]"></div>}
          
          <div className="absolute top-4 left-5 z-[110] flex gap-2">
            <button onClick={onClose} className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white/70 hover:text-white border border-white/10 shadow-lg active:scale-90"><X size={16} /></button>
            {canManage && (
              <div className="relative">
                <button 
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  className={`p-2 rounded-full border border-white/10 shadow-lg active:scale-90 transition-all ${showAdminMenu ? 'bg-amber-500 text-black' : 'bg-black/60 text-white/70'}`}
                >
                  <MoreVertical size={16} />
                </button>
                
                <AnimatePresence>
                  {showAdminMenu && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, x: 10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute top-10 left-0 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-[200] overflow-hidden"
                    >
                      {isHost && (
                        <button onClick={() => handleAdminAction('toggleMod')} className="w-full p-3 flex items-center gap-3 hover:bg-white/5 border-b border-white/5 text-right" dir="rtl">
                           <ShieldCheck size={16} className={targetIsModerator ? 'text-red-500' : 'text-emerald-500'} />
                           <span className="text-xs font-bold text-white">{targetIsModerator ? 'سحب الإشراف' : 'تعيين مشرف'}</span>
                        </button>
                      )}
                      <button onClick={() => handleAdminAction('resetUserCharm')} className="w-full p-3 flex items-center gap-3 hover:bg-white/5 border-b border-white/5 text-right" dir="rtl">
                         <RotateCcw size={16} className="text-blue-500" />
                         <span className="text-xs font-bold text-white">تصفير الكاريزما</span>
                      </button>
                      <button onClick={() => handleAdminAction('kickMic')} className="w-full p-3 flex items-center gap-3 hover:bg-white/5 border-b border-white/5 text-right" dir="rtl">
                         <MicOff size={16} className="text-orange-500" />
                         <span className="text-xs font-bold text-white">تنزيل من المايك</span>
                      </button>
                      <button onClick={() => handleAdminAction('kickRoom')} className="w-full p-3 flex items-center gap-3 hover:bg-red-950/30 text-right text-red-500" dir="rtl">
                         <UserX size={16} />
                         <span className="text-xs font-bold">طرد من الغرفة</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="absolute top-2 -right-2 w-28 h-28 z-[150] flex items-center justify-center overflow-visible">
             <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-[72%] h-[72%] rounded-full overflow-hidden border-[3px] border-[#0c101b] bg-slate-800 shadow-xl relative z-10 translate-y-0.5"><img src={user.avatar} className="w-full h-full object-cover" alt="Profile" /></div>
                {user.frame && <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1.0 }} src={user.frame} className="absolute inset-0 w-full h-full object-contain z-20 scale-[1.15] pointer-events-none" />}
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pb-6 relative z-10 bg-gradient-to-b from-[#0c101b] to-[#05070a] rounded-b-[2.5rem]">
          <div className="pt-4 text-right mb-4">
             <div className="flex items-center gap-2 justify-end mb-3">
               {targetIsModerator && (
                 <div className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg text-[9px] font-black border border-emerald-500/30">مشرف</div>
               )}
               <h2 className={`text-xl ${user.nameStyle ? user.nameStyle : 'font-black text-white'}`}>{user.name}</h2>
             </div>
             
             <div className="flex items-center justify-end gap-2 flex-wrap mb-5">
                <button onClick={() => { navigator.clipboard.writeText(user.customId?.toString() || user.id); onAction('copyId'); }} className="relative h-8 min-w-[100px] flex items-center justify-center px-3 active:scale-95 group">
                  {user.badge ? (
                    <><img src={user.badge} className="absolute inset-0 w-full h-full object-fill z-0" /><span className="relative z-10 font-black text-white text-[9px] tracking-tight">ID: {user.customId || user.id}</span></>
                  ) : (
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/5 shadow-md"><span className="text-[9px] font-black text-white">{user.customId || user.id}</span></div>
                  )}
                </button>
             </div>

             <div className="flex items-center justify-end gap-3 mb-6 pr-1">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onShowRoomRank}
                  className="relative h-7 flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 rounded-full px-3 border border-pink-400/30 shadow-lg shadow-rose-900/20 active:scale-90"
                >
                   <Trophy size={14} className="text-yellow-400" fill="currentColor" />
                   <span className="text-[10px] font-black text-white tracking-tighter">{roomContribution.toLocaleString()}</span>
                </motion.button>
                <div className="flex flex-col items-center gap-1"><LevelBadge level={wealthLvl} type="wealth" /></div>
                <div className="flex flex-col items-center gap-1"><LevelBadge level={rechargeLvl} type="recharge" /></div>
                {user.isVip && <div className="h-7 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-full px-2 flex items-center justify-center border border-amber-400/30 shadow-lg"><span className="text-[10px] font-black text-black">VIP {user.vipLevel}</span></div>}
             </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-end gap-3 py-2">
             {(user.achievements && user.achievements.length > 0) ? user.achievements.map((medal, i) => (<motion.div key={i} whileHover={{ scale: 1.1, y: -2 }} className="w-16 h-16 flex items-center justify-center shrink-0"><img src={medal} className="max-w-full max-h-full object-contain filter drop-shadow-md" /></motion.div>)) : <div className="w-full text-right py-2 text-[9px] text-slate-600 italic px-1">لا توجد أوسمة معروضة حالياً</div>}
          </div>

          <div className="flex flex-col gap-2.5 mt-auto pointer-events-auto">
             {!isCurrentUser ? (
                <div className="flex gap-2.5">
                   <button onClick={() => { onClose(); onAction('message', user); }} className="w-12 h-12 bg-white/5 border border-white/10 rounded-[1.4rem] flex items-center justify-center text-slate-400 active:scale-90 transition-all"><MessageCircle size={20}/></button>
                   <button onClick={() => { onClose(); onAction('gift'); }} className="flex-1 h-12 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-800 text-white font-black rounded-[1.4rem] shadow-lg flex items-center justify-center gap-2.5 active:scale-95 transition-all"><Gift size={18} fill="currentColor" /> <span className="text-xs tracking-wide font-black">إرسال هدية</span></button>
                </div>
             ) : <button onClick={() => onAction('editProfile')} className="w-full py-3.5 bg-white/5 border border-white/10 rounded-[1.4rem] text-white font-black text-xs active:scale-95">تعديل الملف الشخصي</button>}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserProfileSheet;
