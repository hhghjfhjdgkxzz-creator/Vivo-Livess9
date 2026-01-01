
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../../services/firebase';
import { doc, collection, addDoc, updateDoc, increment, serverTimestamp, writeBatch, onSnapshot, getDoc, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { Gift, Room, User } from '../../types';
import { EconomyEngine } from '../../services/economy';

// استيراد المكونات
import RoomBackground from './RoomBackground';
import RoomHeader from './RoomHeader';
import GiftAnimationLayer from './GiftAnimationLayer';
import Seat from './Seat';
import ComboButton from './ComboButton';
import ControlBar from './ControlBar';
import GiftModal from '../GiftModal';
import RoomSettingsModal from '../RoomSettingsModal';
import RoomRankModal from '../RoomRankModal';
import RoomToolsModal from './RoomToolsModal'; 
import LuckyBagModal from '../LuckyBagModal';
import UserProfileSheet from '../UserProfileSheet';
import { AnimatePresence, motion } from 'framer-motion';

// مكون شارة الليفل الملكية المصغر للدردشة
const ChatLevelBadge: React.FC<{ level: number; type: 'wealth' | 'recharge' }> = ({ level, type }) => {
  const isWealth = type === 'wealth';
  return (
    <div className="relative h-4 min-w-[55px] flex items-center shrink-0">
      <div className={`absolute inset-0 rounded-l-sm rounded-r-xl border-y border-r shadow-sm ${
        isWealth 
          ? 'bg-gradient-to-r from-[#6a29e3] via-[#8b5cf6] to-[#6a29e3] border-[#a78bfa]/30' 
          : 'bg-gradient-to-r from-[#1a1a1a] via-[#333] to-[#1a1a1a] border-amber-500/30'
      }`}></div>
      <div className="relative z-10 -ml-1 h-5 w-5 flex items-center justify-center shrink-0">
        <div className={`absolute inset-0 rounded-sm transform rotate-45 border ${
          isWealth ? 'bg-[#5b21b6] border-[#fbbf24]' : 'bg-[#000] border-amber-500'
        }`}></div>
        <span className="relative z-20 text-[10px] mb-0.5">👑</span>
      </div>
      <div className="relative z-10 flex-1 pr-1.5 text-center">
        <span className="text-[8px] font-black italic text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
          {isWealth ? 'W' : 'R'}.{level}
        </span>
      </div>
    </div>
  );
};

const VoiceRoom: React.FC<any> = ({ 
  room, onLeave, onMinimize, currentUser, gifts, gameSettings, onUpdateRoom, 
  isMuted, onToggleMute, onUpdateUser, users, onEditProfile, onAnnouncement, onOpenPrivateChat
}) => {
  const [showGifts, setShowGifts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showRank, setShowRank] = useState(false);
  const [showLuckyBag, setShowLuckyBag] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [showMicLayoutSelector, setShowMicLayoutSelector] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<User | null>(null);
  const [micSkins, setMicSkins] = useState<Record<number, string>>({});
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [comboState, setComboState] = useState<{gift: Gift, recipients: string[], count: number} | null>(null);
  
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // تسجيل وقت الدخول للغرفة لمنع ظهور الرسائل القديمة
  const sessionStartTime = useRef(Timestamp.now());

  const isHost = room.hostId === currentUser.id;

  // دالة تنظيف المتحدثين لمنع undefined
  const sanitizeSpeakers = (speakers: any[]) => {
    return speakers.map(s => ({
      id: s.id || '',
      name: s.name || 'مستخدم',
      avatar: s.avatar || '',
      seatIndex: s.seatIndex ?? 0,
      isMuted: s.isMuted ?? false,
      charm: Number(s.charm || 0)
    }));
  };

  useEffect(() => {
    // جلب الرسائل التي أُرسلت بعد وقت دخول المستخدم الحالي فقط
    const q = query(
      collection(db, 'rooms', room.id, 'messages'),
      where('timestamp', '>=', sessionStartTime.current),
      orderBy('timestamp', 'asc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [room.id]);

  useEffect(() => {
    const fetchSkins = async () => {
      const docRef = doc(db, 'appSettings', 'micSkins');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setMicSkins(snap.data() as Record<number, string>);
      }
    };
    fetchSkins();
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    try {
      await addDoc(collection(db, 'rooms', room.id, 'messages'), {
        userId: currentUser.id,
        userName: currentUser.name,
        userWealthLevel: currentUser.wealthLevel || 1,
        userRechargeLevel: currentUser.rechargeLevel || 1,
        userAchievements: currentUser.achievements || [],
        userBubble: currentUser.activeBubble || null,
        userVip: currentUser.isVip || false,
        content: text,
        type: 'text',
        timestamp: serverTimestamp()
      });
    } catch (err) {}
  };

  const handleResetRoomCharms = async () => {
    if (!room.speakers || room.speakers.length === 0) return;
    try {
      const updatedSpeakers = sanitizeSpeakers(room.speakers.map((s: any) => ({
        ...s,
        charm: 0
      })));
      await onUpdateRoom(room.id, { speakers: updatedSpeakers });
      alert('تم تصفير كاريزما جميع المتواجدين على المايك بنجاح ✅');
    } catch (err) {
      alert('فشل تصفير الكاريزما');
    }
  };

  const handleOpenAllMics = async () => {
    if (!room.speakers || room.speakers.length === 0) return;
    try {
      const updatedSpeakers = sanitizeSpeakers(room.speakers.map((s: any) => ({
        ...s,
        isMuted: false
      })));
      await onUpdateRoom(room.id, { speakers: updatedSpeakers });
      alert('تم فتح جميع المايكات بنجاح 🎙️');
    } catch (err) {
      alert('فشل فتح المايكات');
    }
  };

  const handleUpdateMicCount = async (count: number) => {
    try {
      const newSpeakers = sanitizeSpeakers((room.speakers || []).filter((s: any) => s.seatIndex < count));
      await onUpdateRoom(room.id, { 
        micCount: count,
        speakers: newSpeakers
      });
      alert(`تم تحويل الغرفة إلى ${count} مقعد بنجاح ✅`);
      setShowMicLayoutSelector(false);
    } catch (err) {
      alert('فشل تحديث عدد المقاعد');
    }
  };

  const handleSeatClick = (index: number) => {
    const speakerAtSeat = seats[index];
    if (speakerAtSeat) {
      setSelectedUserForProfile(speakerAtSeat);
      setShowProfileSheet(true);
    } else {
      const currentOnMic = (room.speakers || []).find((s: any) => s.id === currentUser.id);
      const newSpeaker = {
        id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar,
        seatIndex: index, isMuted: isMuted, charm: currentOnMic ? (Number(currentOnMic.charm) || 0) : 0
      };
      const otherSpeakers = (room.speakers || []).filter((s: any) => s.id !== currentUser.id);
      onUpdateRoom(room.id, { speakers: sanitizeSpeakers([...otherSpeakers, newSpeaker]) });
    }
  };

  const handleProfileAction = (action: string, payload?: any) => {
    if (action === 'gift' && selectedUserForProfile) {
        setSelectedRecipientIds([selectedUserForProfile.id]);
        setShowGifts(true);
    } else if (action === 'message') {
      onOpenPrivateChat(payload);
    } else if (action === 'editProfile') {
      onEditProfile();
    }
    setShowProfileSheet(false);
  };

  const executeGiftSend = async (gift: Gift, recipientIds: string[], qty: number = 1, isFromCombo: boolean = false) => {
    const totalCost = Number(gift.cost) * qty * recipientIds.length;
    const currentCoins = Number(currentUser.coins || 0);
    if (currentCoins < totalCost) {
       alert('رصيدك لا يكفي! 🪙');
       setComboState(null);
       return false;
    }
    EconomyEngine.spendCoins(currentUser.id, currentCoins, currentUser.wealth || 0, totalCost, (data) => {
       onUpdateUser({ id: currentUser.id, ...data });
    });
    if (!isFromCombo) {
      setComboState({ gift, recipients: recipientIds, count: qty });
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => { setComboState(null); }, 5000);
    }
    try {
      const batch = writeBatch(db);
      recipientIds.forEach(rid => {
        const roomContribRef = doc(db, 'rooms', room.id, 'contributors', currentUser.id);
        batch.set(roomContribRef, {
          userId: currentUser.id, name: currentUser.name, avatar: currentUser.avatar,
          amount: increment(totalCost), timestamp: serverTimestamp()
        }, { merge: true });
      });
      const eventRef = doc(collection(db, 'rooms', room.id, 'gift_events'));
      batch.set(eventRef, {
        giftId: gift.id, giftName: gift.name, giftIcon: gift.icon,
        giftAnimation: gift.animationType || 'pop',
        senderId: currentUser.id, senderName: currentUser.name,
        recipientIds, quantity: qty, timestamp: serverTimestamp()
      });
      await batch.commit();
      const updatedSpeakers = sanitizeSpeakers((room.speakers || []).map((s: any) => {
         if (recipientIds.includes(s.id)) return { ...s, charm: (Number(s.charm) || 0) + (Number(gift.cost) * qty) };
         return s;
      }));
      await onUpdateRoom(room.id, { speakers: updatedSpeakers });
    } catch (err) {}
    return true;
  };

  const seatsCount = room.micCount || 8;
  const currentSkin = micSkins[seatsCount] || undefined;
  const seats = Array.from({ length: seatsCount }).map((_, i) => (room.speakers || []).find((s: any) => s.seatIndex === i) || null);

  // وظيفة رندر المقاعد مع ضبط الأبعاد المحسنة والتمركز
  const renderSeatsLayout = () => {
    if (seatsCount === 10) {
      return (
        <div className="flex flex-col gap-y-9 items-center w-full max-w-sm mx-auto">
          {/* الصف الأول: 2 مقعد */}
          <div className="flex justify-center gap-6">
            {seats.slice(0, 2).map((s, i) => (
              <Seat key={i} index={i} speaker={s} currentUser={currentUser} sizeClass="w-14 h-14" customSkin={currentSkin} onClick={() => handleSeatClick(i)} />
            ))}
          </div>
          {/* الصف الثاني: 4 مقاعد */}
          <div className="grid grid-cols-4 gap-4 w-full justify-items-center">
            {seats.slice(2, 6).map((s, i) => (
              <Seat key={i+2} index={i+2} speaker={s} currentUser={currentUser} sizeClass="w-14 h-14" customSkin={currentSkin} onClick={() => handleSeatClick(i+2)} />
            ))}
          </div>
          {/* الصف الثالث: 4 مقاعد */}
          <div className="grid grid-cols-4 gap-4 w-full justify-items-center">
            {seats.slice(6, 10).map((s, i) => (
              <Seat key={i+6} index={i+6} speaker={s} currentUser={currentUser} sizeClass="w-14 h-14" customSkin={currentSkin} onClick={() => handleSeatClick(i+6)} />
            ))}
          </div>
        </div>
      );
    }

    if (seatsCount === 20) {
      return (
        <div className="grid grid-cols-5 gap-x-2 gap-y-8 w-full max-w-[340px] mx-auto justify-items-center items-center">
          {seats.map((speaker, i) => (
            <Seat key={i} index={i} speaker={speaker} currentUser={currentUser} sizeClass="w-11 h-11" customSkin={currentSkin} onClick={() => handleSeatClick(i)} />
          ))}
        </div>
      );
    }

    if (seatsCount === 15) {
      return (
        <div className="grid grid-cols-5 gap-x-2 gap-y-10 w-full max-w-[350px] mx-auto justify-items-center items-center">
          {seats.map((speaker, i) => (
            <Seat key={i} index={i} speaker={speaker} currentUser={currentUser} sizeClass="w-[52px] h-[52px]" customSkin={currentSkin} onClick={() => handleSeatClick(i)} />
          ))}
        </div>
      );
    }

    // النمط الافتراضي (8 مقاعد) - تم تصغيره قليلاً ليتناسب مع الغرف الملكية
    return (
      <div className="grid grid-cols-4 gap-x-4 gap-y-12 w-full max-w-sm mx-auto justify-items-center items-center">
        {seats.map((speaker, i) => (
          <Seat key={i} index={i} speaker={speaker} currentUser={currentUser} sizeClass="w-[72px] h-[72px]" customSkin={currentSkin} onClick={() => handleSeatClick(i)} />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-slate-950 font-cairo overflow-hidden text-right">
      <RoomBackground background={room.background} />
      <RoomHeader room={room} onLeave={onLeave} onMinimize={onMinimize} />
      
      <div className="flex-1 relative flex flex-col overflow-hidden">
        <GiftAnimationLayer roomId={room.id} speakers={room.speakers || []} />
        
        {/* حاوية المقاعد - justify-center تضمن التمركز العمودي المثالي */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-4 overflow-hidden">
           {renderSeatsLayout()}
        </div>

        {/* منطقة الدردشة - ثابتة في الأسفل */}
        <div className="h-64 px-4 mb-4 pointer-events-none overflow-hidden relative" dir="rtl">
           <div className="h-full overflow-y-auto scrollbar-hide space-y-4 flex flex-col justify-end pb-4">
              {messages.map((msg) => (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={msg.id} className="flex items-start gap-2 pointer-events-auto">
                   <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                         <ChatLevelBadge level={msg.userWealthLevel || 1} type="wealth" />
                         <ChatLevelBadge level={msg.userRechargeLevel || 1} type="recharge" />
                         <span className={`text-[12px] font-black drop-shadow-lg shrink-0 ${msg.userVip ? 'text-amber-400' : 'text-blue-300'}`}>
                            {msg.userName}
                         </span>
                         <div className="flex items-center gap-1.5 mr-1">
                            {msg.userAchievements?.slice(0, 5).map((medal: string, idx: number) => (
                               <img key={idx} src={medal} className="w-8 h-8 object-contain filter drop-shadow-md brightness-110" style={{ imageRendering: 'auto' }} alt="medal" />
                            ))}
                         </div>
                      </div>
                      <div 
                         className={`relative min-h-[42px] w-fit max-w-[260px] px-7 py-3 flex items-center justify-center text-center shadow-2xl transition-all ${!msg.userBubble ? 'bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl rounded-tr-none' : ''}`}
                         style={msg.userBubble ? { backgroundImage: `url(${msg.userBubble})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', minWidth: '95px' } : {}}
                      >
                         <p className="text-[13px] font-black text-white leading-relaxed break-words drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                            {msg.content}
                         </p>
                      </div>
                   </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
           </div>
        </div>

        {comboState && <ComboButton gift={comboState.gift} count={comboState.count} onHit={() => executeGiftSend(comboState.gift, comboState.recipients, 1, true)} duration={5000} />}
        
        <ControlBar isMuted={isMuted} onToggleMute={onToggleMute} onShowGifts={() => { setSelectedRecipientIds([]); setShowGifts(true); }} onShowGames={() => {}} onShowRoomTools={() => setShowTools(true)} onSendMessage={handleSendMessage} userCoins={Number(currentUser.coins)} />
      </div>

      <AnimatePresence>
        {showMicLayoutSelector && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMicLayoutSelector(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-xs bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
               <h4 className="text-center text-white font-black text-lg mb-6">تبديل نمط المقاعد</h4>
               <div className="grid grid-cols-2 gap-4">
                  {[8, 10, 15, 20].map(num => (
                    <button 
                      key={num} 
                      onClick={() => handleUpdateMicCount(num)}
                      className={`py-6 rounded-2xl border-2 font-black transition-all active:scale-95 flex flex-col items-center gap-2 ${room.micCount === num ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                    >
                       <span className="text-2xl">{num}</span>
                       <span className="text-[10px] uppercase opacity-60 font-bold">مقعد</span>
                    </button>
                  ))}
               </div>
               <button onClick={() => setShowMicLayoutSelector(false)} className="w-full mt-6 py-3 text-slate-500 font-bold text-sm">إلغاء</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <GiftModal isOpen={showGifts} onClose={() => setShowGifts(false)} gifts={gifts} userCoins={Number(currentUser.coins)} speakers={room.speakers || []} selectedRecipientIds={selectedRecipientIds} onSelectRecipient={setSelectedRecipientIds} onSend={(gift, qty) => { executeGiftSend(gift, selectedRecipientIds, qty); setShowGifts(false); }} />
      <RoomSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} room={room} onUpdate={onUpdateRoom} />
      <RoomRankModal isOpen={showRank} onClose={() => setShowRank(false)} roomId={room.id} roomTitle={room.title} />
      <RoomToolsModal 
        isOpen={showTools} 
        onClose={() => setShowTools(false)} 
        isHost={isHost}
        onAction={(a) => { 
          if (a === 'settings') setShowSettings(true); 
          if (a === 'rank') setShowRank(true); 
          if (a === 'luckybag') setShowLuckyBag(true); 
          if (a === 'mic_layout') setShowMicLayoutSelector(true);
          if (a === 'reset_charm') { if(confirm('هل تريد تصفير كاريزما الجميع؟')) handleResetRoomCharms(); }
          if (a === 'open_mics') { if(confirm('هل تريد فتح جميع المايكات؟')) handleOpenAllMics(); }
          setShowTools(false); 
        }} 
      />
      <LuckyBagModal isOpen={showLuckyBag} onClose={() => setShowLuckyBag(false)} userCoins={currentUser.coins} onSend={(a, r) => {}} />

      <AnimatePresence>
        {showProfileSheet && selectedUserForProfile && (
          <UserProfileSheet user={selectedUserForProfile} onClose={() => setShowProfileSheet(false)} isCurrentUser={selectedUserForProfile.id === currentUser.id} onAction={handleProfileAction} currentUser={currentUser} allUsers={users} currentRoom={room} onShowRoomRank={() => { setShowProfileSheet(false); setShowRank(true); }} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceRoom;
