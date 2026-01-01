
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Home, User as UserIcon, Plus, Bell, Crown, Gem, Settings, ChevronRight, Edit3, Share2, LogOut, Shield, Database, ShoppingBag, Camera, Trophy, Flame, Sparkles, UserX, Star, ShieldCheck, MapPin, Download, Smartphone, MessageCircle, Languages, Smartphone as MobileIcon, Wallet, Medal, Lock, AlertCircle, Key, X, Zap, BadgeCheck, ChevronLeft, Award, Coins, Users, UserPlus, Eye, Heart, Gamepad2 } from 'lucide-react';
import RoomCard from './components/RoomCard';
import VoiceRoom from './components/VoiceRoom';
import AuthScreen from './components/AuthScreen';
import Toast, { ToastMessage } from './components/Toast';
import VIPModal from './components/VIPModal';
import EditProfileModal from './components/EditProfileModal';
import BagModal from './components/BagModal';
import WalletModal from './components/WalletModal';
import CreateRoomModal from './components/CreateRoomModal';
import GlobalBanner from './components/GlobalBanner';
import GlobalLuckyBagBanner from './components/GlobalLuckyBagBanner';
import AdminPanel from './components/AdminPanel';
import MiniPlayer from './components/MiniPlayer';
import PrivateChatModal from './components/PrivateChatModal';
import MessagesTab from './components/MessagesTab';
import ActivitiesTab from './components/ActivitiesTab';
import AgencyRechargeModal from './components/AgencyRechargeModal';
import WheelGameModal from './components/WheelGameModal';
import SlotsGameModal from './components/SlotsGameModal';
import LionWheelGameModal from './components/LionWheelGameModal';
import CPModal from './components/CPModal';
import { DEFAULT_VIP_LEVELS, DEFAULT_GIFTS, DEFAULT_STORE_ITEMS } from './constants';
import { Room, User, VIPPackage, UserLevel, Gift, StoreItem, GameSettings, GlobalAnnouncement, LuckyBag, GameType } from './types';
import { AnimatePresence, motion } from 'framer-motion';
import { db, auth } from './services/firebase';
import { EconomyEngine } from './services/economy'; 
import { collection, onSnapshot, doc, setDoc, query, orderBy, addDoc, getDoc, serverTimestamp, deleteDoc, updateDoc, arrayUnion, arrayRemove, increment, limit, where, writeBatch, Timestamp } from 'firebase/firestore';
import { deleteUser, signOut } from 'firebase/auth';

const translations = {
  ar: { home: "غرفة", messages: "المحادثة", profile: "انا", activities: "النشاطات", createRoom: "إنشاء", activeRooms: "الغرف النشطة", wallet: "Wallet", vip: "VIP", store: "المتجر", bag: "حقيبة", level: "مستوى", agency: "وكالة", cp: "CP", invite: "دعوة", blacklist: "القائمة السوداء", privacy: "الخصوصية والسياسة", settings: "إعدادات", id: "ID", myWallet: "المحفظة", logout: "خروج" },
  en: { home: "Room", messages: "Chats", profile: "Me", activities: "Activities", createRoom: "Create", activeRooms: "Active Rooms", wallet: "Wallet", vip: "VIP", store: "Store", bag: "Bag", level: "Level", agency: "Agency", cp: "CP", invite: "Invite", blacklist: "Blacklist", privacy: "Privacy", settings: "Settings", id: "ID", myWallet: "Wallet", logout: "Logout" }
};

const PERMANENT_LOGO_URL = 'https://storage.googleapis.com/static.aistudio.google.com/stables/2025/03/06/f0e64906-e7e0-4a87-af9b-029e2467d302/f0e64906-e7e0-4a87-af9b-029e2467d302.png';

const calculateLvl = (pts: number) => {
  if (!pts || pts <= 0) return 1;
  const l = Math.floor(Math.sqrt(pts) / 200);
  return Math.max(1, Math.min(100, l));
};

// مكون شارة المستوى الصغير للاستخدام في الهيدر
const HeaderLevelBadge: React.FC<{ level: number; type: 'wealth' | 'recharge' }> = ({ level, type }) => {
  const isWealth = type === 'wealth';
  return (
    <div className="relative h-4 min-w-[42px] flex items-center group cursor-default">
      <div className={`absolute inset-0 rounded-l-sm rounded-r-lg border border-amber-500/30 ${
        isWealth ? 'bg-gradient-to-r from-[#6a29e3] to-[#8b5cf6]' : 'bg-[#121212]'
      }`}></div>
      <div className="relative z-10 flex-1 text-center pr-1">
        <span className="text-[7px] font-black italic text-white drop-shadow-md">{level}</span>
      </div>
      <div className="relative z-20 w-4 h-4 flex items-center justify-center -ml-1">
        <div className={`absolute inset-0 rounded-sm transform rotate-45 border border-amber-500/50 ${
          isWealth ? 'bg-[#7c3aed]' : 'bg-black'
        }`}></div>
        <span className="relative z-30 text-[6px] mb-0.5">👑</span>
      </div>
    </div>
  );
};

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'messages' | 'profile' | 'rank'>('home');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isRoomMinimized, setIsRoomMinimized] = useState(false);
  const [isUserMuted, setIsUserMuted] = useState(true);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]); 
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [vipLevels, setVipLevels] = useState<VIPPackage[]>(DEFAULT_VIP_LEVELS);
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null);
  const [appBanner, setAppBanner] = useState('');
  const [appName, setAppName] = useState('فيفو لايف - Vivo Live');
  const [privateChatPartner, setPrivateChatPartner] = useState<User | null>(null);
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    slotsWinRate: 35,
    wheelWinRate: 45,
    lionWinRate: 30,
    luckyGiftWinRate: 30,
    luckyGiftRefundPercent: 0,
    luckyXEnabled: false,
    luckyMultipliers: [],
    wheelJackpotX: 8,
    wheelNormalX: 2,
    slotsSevenX: 20,
    slotsFruitX: 5,
    availableEmojis: [],
    emojiDuration: 4,
    wheelChips: [10000, 1000000, 5000000, 20000000],
    slotsChips: [10000, 1000000, 5000000, 20000000],
    lionChips: [100, 1000, 10000, 100000]
  });

  const lastAnnouncementId = useRef<string | null>(null);
  const [appLogo, setAppLogo] = useState(() => localStorage.getItem('vivo_live_fixed_logo') || PERMANENT_LOGO_URL);

  const t = translations[language];

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const qAnnouncements = query(
      collection(db, 'global_announcements'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    const unsubAnnouncements = onSnapshot(qAnnouncements, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as GlobalAnnouncement;
        const id = snapshot.docs[0].id;
        if (id !== lastAnnouncementId.current) {
          lastAnnouncementId.current = id;
          setAnnouncement({ id, ...data });
          const duration = data.type === 'lucky_win' ? 10000 : 8000;
          setTimeout(() => setAnnouncement(null), duration);
        }
      }
    });

    const unsubSettings = onSnapshot(doc(db, 'appSettings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.appBanner) setAppBanner(data.appBanner);
        if (data.appLogo) setAppLogo(data.appLogo);
        if (data.appName) setAppName(data.appName);
        if (data.gameSettings) setGameSettings(prev => ({...prev, ...data.gameSettings}));
      }
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersData = snapshot.docs.map(doc => {
          const d = doc.data();
          return { id: doc.id, ...d, wealthLevel: calculateLvl(d.wealth || 0), rechargeLevel: calculateLvl(d.rechargePoints || 0), coins: Number(d.coins || 0), diamonds: Number(d.diamonds || 0) } as User;
        });
        setUsers(usersData);
        if (user) {
          const currentInDb = usersData.find(u => u.id === user.id);
          if (currentInDb) setUser(currentInDb);
        }
    });

    const qRooms = query(collection(db, 'rooms'), orderBy('listeners', 'desc'));
    const unsubRooms = onSnapshot(qRooms, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      setRooms(roomsData);
      
      setCurrentRoom(prev => {
        if (!prev) return null;
        const updated = roomsData.find(r => r.id === prev.id);
        return updated || null;
      });
    });

    const unsubGifts = onSnapshot(doc(db, 'appSettings', 'gifts'), (docSnap) => {
      if (docSnap.exists()) setGifts(docSnap.data().gifts || DEFAULT_GIFTS);
    });

    const unsubStore = onSnapshot(doc(db, 'appSettings', 'store'), (docSnap) => {
      if (docSnap.exists()) setStoreItems(docSnap.data().items || DEFAULT_STORE_ITEMS);
    });

    const savedUser = localStorage.getItem('voice_chat_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      getDoc(doc(db, 'users', parsedUser.id)).then((docSnap) => {
        if (docSnap.exists()) setUser({ id: docSnap.id, ...docSnap.data() } as User);
        setInitializing(false);
      });
    } else { setInitializing(false); }
    
    return () => { 
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      unsubAnnouncements();
      unsubSettings(); 
      unsubRooms(); 
      unsubUsers(); 
      unsubGifts(); 
      unsubStore(); 
    };
  }, []);

  const handleUpdateUser = async (updatedData: any) => {
    if (!user) return;
    const firestoreData = Object.fromEntries(Object.entries(updatedData).filter(([_, v]) => v !== undefined));
    setUser(prev => prev ? { ...prev, ...firestoreData } : null);
    try { await updateDoc(doc(db, 'users', user.id), firestoreData); } catch (e) {}
  };

  const handleLogout = async () => {
    await signOut(auth); setUser(null); setCurrentRoom(null);
    localStorage.removeItem('voice_chat_user');
  };

  const handleRoomJoin = async (room: Room) => {
    setCurrentRoom(room); 
    setIsRoomMinimized(false);
    try {
      await updateDoc(doc(db, 'rooms', room.id), { listeners: increment(1) });
    } catch (e) {}
  };

  const handleRoomLeave = async (forceRoomId?: string) => {
    const roomIdToLeave = forceRoomId || currentRoom?.id;
    if (!roomIdToLeave || !user) return;
    
    const isHost = currentRoom?.hostId === user.id;
    setCurrentRoom(null);
    try {
      if (isHost) {
        await deleteDoc(doc(db, 'rooms', roomIdToLeave));
      } else {
        const speakers = (currentRoom?.speakers || []).filter(s => s.id !== user.id);
        await updateDoc(doc(db, 'rooms', roomIdToLeave), { 
          speakers: speakers, 
          listeners: increment(-1) 
        });
      }
    } catch (e) {}
  };

  const executeCreateRoom = async (data: any) => {
    if (!user) return;
    try {
      const hostAsSpeaker = { 
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        seatIndex: 0, 
        isMuted: false, 
        charm: 0,
        frame: user.frame || null
      };

      const roomDocRef = doc(db, 'rooms', user.id);
      const roomData = { 
        ...data, 
        hostId: user.id, 
        hostCustomId: user.customId, 
        listeners: 1, 
        speakers: [hostAsSpeaker],
        micCount: 8 
      };

      await setDoc(roomDocRef, roomData);

      await updateDoc(doc(db, 'users', user.id), {
        roomTemplate: {
          title: data.title,
          category: data.category,
          thumbnail: data.thumbnail,
          background: data.background,
          isLocked: !!data.isLocked,
          password: data.password || ''
        }
      });

      handleRoomJoin({ id: user.id, ...roomData } as any);

    } catch (e) {
      alert('فشل إنشاء الغرفة');
    }
  };

  const handlePlusClick = () => {
    if (user?.roomTemplate) {
      executeCreateRoom(user.roomTemplate);
    } else {
      setShowCreateRoomModal(true);
    }
  };

  const [showVIPModal, setShowVIPModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showBagModal, setShowBagModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [showCPModal, setShowCPModal] = useState(false);

  if (initializing) return (
    <div className="h-[100dvh] w-full bg-[#020617] flex flex-col items-center justify-center">
      <div className="w-32 h-32 bg-yellow-400 rounded-full overflow-hidden shadow-2xl"><img src={appLogo} className="w-full h-full object-cover" /></div>
    </div>
  );

  if (!user) return <AuthScreen onAuth={(u) => { setUser(u); localStorage.setItem('voice_chat_user', JSON.stringify(u)); }} appLogo={appLogo} deferredPrompt={deferredPrompt} onInstall={() => setDeferredPrompt(null)} />;

  return (
    <div className={`h-[100dvh] w-full bg-[#030816] text-white relative md:max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col font-cairo`}>
      
      <div className="absolute top-0 left-0 right-0 z-[10000] pointer-events-none">
        <AnimatePresence>
          {announcement && ( <GlobalBanner announcement={announcement} /> )}
        </AnimatePresence>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        {activeTab === 'home' && (
           <div className="mt-2 space-y-3 px-4">
              <div className="flex justify-between items-center mb-4"><div className="flex items-center gap-2"><img src={appLogo} className="w-8 h-8 rounded-lg" /><span className="text-xs font-black text-white/40 uppercase tracking-widest">VIVO LIVE</span></div></div>
              <div className="relative w-full h-28 rounded-2xl overflow-hidden bg-slate-800 border border-white/5 shadow-lg">{appBanner && <img src={appBanner} className="w-full h-full object-cover" />}</div>
              <h2 className="text-xs font-bold text-white flex items-center gap-1.5"><Flame size={14} className="text-orange-500" /> {t.activeRooms}</h2>
              <div className="grid gap-2.5">{rooms.map(room => ( <RoomCard key={room.id} room={room} onClick={handleRoomJoin} /> ))}</div>
           </div>
        )}

        {activeTab === 'messages' && <MessagesTab currentUser={user} onOpenChat={(p) => setPrivateChatPartner(p)} />}

        {activeTab === 'rank' && <ActivitiesTab onOpenGame={setActiveGame} />}

        {activeTab === 'profile' && (
          <div className="flex flex-col bg-[#030816] min-h-full" dir="rtl">
            <div className="relative w-full h-44 md:h-48 shrink-0 overflow-hidden">
               {user.cover ? <img src={user.cover} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-blue-900 via-indigo-950 to-black"></div>}
               <div className="absolute inset-0 bg-gradient-to-t from-[#030816] via-transparent to-black/30"></div>
               
               <div className="absolute bottom-3 right-5 flex items-center gap-3">
                  <div className="relative w-16 h-16 md:w-20 md:h-20">
                     <div className="w-full h-full rounded-full border-2 border-white/20 overflow-hidden bg-slate-900 shadow-2xl">
                        <img src={user.avatar} className="w-full h-full object-cover" />
                     </div>
                     {user.frame && <img src={user.frame} className="absolute inset-0 scale-[1.3] pointer-events-none" />}
                  </div>
                  <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-1.5">
                        <span className="bg-red-600 px-1 rounded-sm text-[9px] font-bold">🇪🇬</span>
                        <span className="bg-blue-500 p-0.5 rounded-full"><Smartphone size={9} /></span>
                        <h2 className="text-base md:text-lg font-black text-white">{user.name}</h2>
                     </div>
                     <div className="flex items-center gap-2">
                        {/* عرض الـ ID بشكل احترافي مع دعم الوسام المخصص */}
                        <div className="relative inline-flex items-center justify-center group cursor-pointer" onClick={() => navigator.clipboard.writeText(user.customId?.toString() || user.id)}>
                           {user.badge ? (
                             <div className="relative flex items-center justify-center h-6 min-w-[70px] px-2.5">
                               <img src={user.badge} className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0" />
                               <span className="relative z-10 text-white font-black text-[8px] drop-shadow-md">ID:{user.customId || user.id}</span>
                             </div>
                           ) : (
                             <div className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 flex items-center gap-1">
                               <span className="text-[9px] font-black text-white">ID:{user.customId || user.id}</span>
                               <Edit3 size={9} className="text-white/50" />
                             </div>
                           )}
                        </div>
                        {/* إضافة مستويات الفيلات (ثروة وشحن) */}
                        <div className="flex gap-1.5 items-center">
                           <HeaderLevelBadge level={user.wealthLevel || calculateLvl(user.wealth || 0)} type="wealth" />
                           <HeaderLevelBadge level={user.rechargeLevel || calculateLvl(user.rechargePoints || 0)} type="recharge" />
                        </div>
                     </div>
                  </div>
               </div>
               
               <button onClick={() => setShowEditProfileModal(true)} className="absolute top-10 left-5 p-2 bg-black/40 rounded-full border border-white/10 backdrop-blur-sm active:scale-90 transition-transform"><Camera size={16} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 px-4 mt-5">
               <button onClick={() => setShowWalletModal(true)} className="relative h-20 md:h-24 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-400 to-cyan-500 shadow-lg active:scale-95 transition-all">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                  <div className="absolute top-2 right-2 p-1 bg-white/20 rounded-full border border-white/20"><Wallet size={16} className="text-white" /></div>
                  <div className="absolute bottom-2 left-4"><span className="text-xl md:text-2xl font-black text-white italic opacity-80 uppercase">wallet</span></div>
               </button>
               <button onClick={() => setShowVIPModal(true)} className="relative h-20 md:h-24 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg active:scale-95 transition-all">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                  <div className="absolute top-2 right-2 p-1 bg-blue-400/30 rounded-full border border-blue-400/30"><Crown size={16} className="text-white" /></div>
                  <div className="absolute bottom-2 left-4"><span className="text-2xl md:text-3xl font-black text-amber-400 italic opacity-80 uppercase tracking-tighter">VIP</span></div>
               </button>
            </div>

            <div className="mx-4 mt-5 p-1 bg-gradient-to-b from-blue-900/40 to-black rounded-[2rem] border border-blue-800/30 shadow-2xl overflow-hidden">
               <div className="bg-[#030816]/90 rounded-[1.9rem] p-5">
                  <div className="grid grid-cols-4 gap-y-6">
                     <button onClick={() => setActiveTab('home')} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-active:scale-90 transition-all border border-blue-400/20"><ShoppingBag size={20} className="text-white" /></div>
                        <span className="text-[10px] font-black text-slate-300">المتجر</span>
                     </button>
                     <button onClick={() => setShowBagModal(true)} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-active:scale-90 transition-all border border-blue-400/20"><ShoppingBag size={20} className="text-white" /></div>
                        <span className="text-[10px] font-black text-slate-300">حقيبة</span>
                     </button>
                     <button className="flex flex-col items-center gap-1.5 group">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-2xl flex items-center justify-center shadow-lg group-active:scale-90 transition-all border border-blue-400/20"><Trophy size={20} className="text-white" /></div>
                        <span className="text-[10px] font-black text-slate-300">مستوى</span>
                     </button>
                     <button onClick={() => user.isAgency && setShowAgencyModal(true)} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-800 to-blue-950 rounded-2xl flex items-center justify-center shadow-lg group-active:scale-90 transition-all border border-blue-400/20"><Zap size={20} className="text-white" /></div>
                        <span className="text-[10px] font-black text-slate-300">وكالة</span>
                     </button>
                  </div>
                  
                  <div className="flex justify-start mt-6 pr-2">
                     <button onClick={() => setShowCPModal(true)} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-cyan-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-active:scale-90 transition-all border border-blue-400/20"><Heart size={20} className="text-white" /></div>
                        <span className="text-[10px] font-black text-slate-300">CP</span>
                     </button>
                  </div>
               </div>
            </div>

            <div className="mt-6 px-6 grid grid-cols-4 gap-y-6 pb-10">
               <button className="flex flex-col items-center gap-2 active:scale-90 transition-all">
                  <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-white/5"><UserPlus size={16} className="text-slate-400" /></div>
                  <span className="text-[9px] font-bold text-slate-400">دعوة</span>
               </button>
               <button className="flex flex-col items-center gap-2 active:scale-90 transition-all">
                  <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-white/5"><UserX size={16} className="text-slate-400" /></div>
                  <span className="text-[9px] font-bold text-slate-400">القائمة السوداء</span>
               </button>
               <button className="flex flex-col items-center gap-2 active:scale-90 transition-all">
                  <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-white/5"><ShieldCheck size={16} className="text-slate-400" /></div>
                  <span className="text-[9px] font-bold text-slate-400 text-center leading-tight">الخصوصية</span>
               </button>
               <button onClick={() => setShowAdminPanel(user.isAdmin || false)} className="flex flex-col items-center gap-2 active:scale-90 transition-all">
                  <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-white/5"><Settings size={16} className="text-slate-400" /></div>
                  <span className="text-[9px] font-bold text-slate-400">إعدادات</span>
               </button>
            </div>
            
            <button onClick={handleLogout} className="mx-8 mb-24 py-3.5 bg-red-600/10 text-red-500 rounded-xl border border-red-500/20 font-black text-xs active:scale-95 transition-all">تسجيل الخروج</button>
          </div>
        )}
      </div>

      <AnimatePresence>{isRoomMinimized && currentRoom && (<MiniPlayer room={currentRoom} onExpand={() => setIsRoomMinimized(false)} onLeave={() => handleRoomLeave()} isMuted={isUserMuted} onToggleMute={() => setIsUserMuted(!isUserMuted)} />)}</AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 bg-[#030816] border-t border-blue-900/30 h-20 flex items-center px-4 z-20 pb-[env(safe-area-inset-bottom)]">
         <div className="relative w-full h-14 bg-gradient-to-r from-blue-900/40 via-blue-800/20 to-blue-900/40 rounded-full border border-blue-800/30 flex items-center justify-around overflow-visible shadow-2xl">
            <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center transition-all ${activeTab === 'home' ? 'text-cyan-400 scale-110' : 'text-slate-500'}`}>
               <Home size={20} fill={activeTab === 'home' ? "currentColor" : "none"} />
               <span className="text-[9px] font-bold mt-0.5">{t.home}</span>
            </button>
            <button onClick={() => setActiveTab('messages')} className={`flex flex-col items-center transition-all ${activeTab === 'messages' ? 'text-cyan-400 scale-110' : 'text-slate-500'}`}>
               <MessageCircle size={20} fill={activeTab === 'messages' ? "currentColor" : "none"} />
               <span className="text-[9px] font-bold mt-0.5">{t.messages}</span>
            </button>
            
            <button onClick={handlePlusClick} className="absolute -top-5 left-1/2 -translate-x-1/2">
               <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-700 rounded-full flex items-center justify-center border-4 border-[#030816] shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-90 transition-all">
                  <Plus size={28} className="text-white" strokeWidth={3} />
               </div>
            </button>

            <button onClick={() => setActiveTab('rank')} className={`flex flex-col items-center transition-all ${activeTab === 'rank' ? 'text-cyan-400 scale-110' : 'text-slate-500'}`}>
               <Gamepad2 size={20} fill={activeTab === 'rank' ? "currentColor" : "none"} />
               <span className="text-[9px] font-bold mt-0.5">{t.activities}</span>
            </button>
            <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center transition-all ${activeTab === 'profile' ? 'text-cyan-400 scale-110' : 'text-slate-500'}`}>
               <UserIcon size={20} fill={activeTab === 'profile' ? "currentColor" : "none"} />
               <span className="text-[9px] font-bold mt-0.5">{t.profile}</span>
            </button>
         </div>
      </div>

      <AnimatePresence>
        {currentRoom && !isRoomMinimized && (
          <VoiceRoom 
            room={currentRoom} 
            currentUser={user!} 
            onUpdateUser={handleUpdateUser} 
            onLeave={() => handleRoomLeave()} 
            onMinimize={() => setIsRoomMinimized(true)} 
            gifts={gifts} 
            onEditProfile={() => setShowEditProfileModal(true)} 
            gameSettings={gameSettings} 
            onUpdateRoom={async (id, data) => {
              await updateDoc(doc(db, 'rooms', id), data);
              if (currentRoom.hostId === user?.id) {
                await updateDoc(doc(db, 'users', user.id), {
                  roomTemplate: {
                    title: data.title || currentRoom.title,
                    category: data.category || currentRoom.category,
                    thumbnail: data.thumbnail || currentRoom.thumbnail,
                    background: data.background || currentRoom.background,
                    isLocked: data.isLocked !== undefined ? data.isLocked : !!currentRoom.isLocked,
                    password: data.password !== undefined ? data.password : (currentRoom.password || '')
                  }
                });
              }
            }} 
            isMuted={isUserMuted} 
            onToggleMute={() => setIsUserMuted(!isUserMuted)} 
            users={users} 
            onOpenPrivateChat={setPrivateChatPartner} 
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>{privateChatPartner && ( <PrivateChatModal partner={privateChatPartner} currentUser={user!} onClose={() => setPrivateChatPartner(null)} /> )}</AnimatePresence>

      <AnimatePresence>
        {activeGame === 'wheel' && (
          <WheelGameModal 
            isOpen={true} 
            onClose={() => setActiveGame(null)} 
            userCoins={Number(user.coins)} 
            onUpdateCoins={(c) => handleUpdateUser({ coins: c })} 
            winRate={gameSettings.wheelWinRate} 
            gameSettings={gameSettings} 
          />
        )}
        {activeGame === 'slots' && (
          <SlotsGameModal 
            isOpen={true} 
            onClose={() => setActiveGame(null)} 
            userCoins={Number(user.coins)} 
            onUpdateCoins={(c) => handleUpdateUser({ coins: c })} 
            winRate={gameSettings.slotsWinRate} 
            gameSettings={gameSettings} 
          />
        )}
        {activeGame === 'lion' && (
          <LionWheelGameModal 
            isOpen={true} 
            onClose={() => setActiveGame(null)} 
            userCoins={Number(user.coins)} 
            onUpdateCoins={(c) => handleUpdateUser({ coins: c })} 
            gameSettings={gameSettings}
          />
        )}
      </AnimatePresence>

      {showVIPModal && (
        <VIPModal 
          user={user} 
          vipLevels={vipLevels} 
          onClose={() => setShowVIPModal(false)} 
          onBuy={(v) => {
            if (user.coins < v.cost) return alert('رصيدك لا يكفي!');
            handleUpdateUser({ 
              isVip: true, 
              vipLevel: v.level, 
              coins: Number(user.coins) - v.cost, 
              wealth: Number(user.wealth || 0) + v.cost,
              frame: v.frameUrl 
            });
            alert(`مبروك! تم تفعيل باقة ${v.name} بنجاح ✅`);
            setShowVIPModal(false);
          }} 
        />
      )}
      {showEditProfileModal && <EditProfileModal isOpen={showEditProfileModal} onClose={() => setShowEditProfileModal(false)} currentUser={user} onSave={handleUpdateUser} />}
      {showBagModal && <BagModal isOpen={showBagModal} onClose={() => setShowBagModal(false)} items={storeItems} user={user} onBuy={(item) => EconomyEngine.spendCoins(user.id, user.coins, user.wealth, item.price, handleUpdateUser)} onEquip={(item) => handleUpdateUser(item.type === 'frame' ? { frame: item.url } : { activeBubble: item.url })} />}
      {showWalletModal && <WalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} user={user} onExchange={(amt) => EconomyEngine.exchangeDiamonds(user.id, user.coins, user.diamonds, amt, handleUpdateUser)} />}
      {showAdminPanel && <AdminPanel isOpen={showAdminPanel} onClose={() => setShowAdminPanel(false)} currentUser={user} users={users} onUpdateUser={async (id, data) => await updateDoc(doc(db, 'users', id), data)} rooms={rooms} setRooms={setRooms} onUpdateRoom={(id, data) => updateDoc(doc(db, 'rooms', id), data)} gifts={gifts} setGifts={setGifts} storeItems={storeItems} setStoreItems={setStoreItems} vipLevels={vipLevels} setVipLevels={setVipLevels} gameSettings={gameSettings} setGameSettings={setGameSettings} appBanner={appBanner} onUpdateAppBanner={(url) => setDoc(doc(db, 'appSettings', 'global'), { appBanner: url }, { merge: true })} appLogo={appLogo} onUpdateAppLogo={(url) => setDoc(doc(db, 'appSettings', 'global'), { appLogo: url }, { merge: true })} appName={appName} onUpdateAppName={(name) => setDoc(doc(db, 'appSettings', 'global'), { appName: name }, { merge: true })} />}
      {showCreateRoomModal && <CreateRoomModal isOpen={showCreateRoomModal} onClose={() => setShowCreateRoomModal(false)} onCreate={executeCreateRoom} />}
      {user.isAgency && showAgencyModal && <AgencyRechargeModal isOpen={showAgencyModal} onClose={() => setShowAgencyModal(false)} agentUser={user} users={users} onCharge={(tid, amt) => EconomyEngine.agencyTransfer(user.id, user.agencyBalance!, tid, users.find(u => u.id === tid)?.coins || 0, users.find(u => u.id === tid)?.rechargePoints || 0, amt, (ad, td) => { handleUpdateUser(ad); updateDoc(doc(db, 'users', tid), td); })} />}
      {showCPModal && <CPModal isOpen={showCPModal} onClose={() => setShowCPModal(false)} currentUser={user} users={users} gameSettings={gameSettings} onUpdateUser={handleUpdateUser} />}
    </div>
  );
}
