
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Home, User as UserIcon, Plus, Bell, Crown, Gem, Settings, ChevronRight, Edit3, Share2, LogOut, Shield, Database, ShoppingBag, Camera, Trophy, Flame, Sparkles, UserX, Star, ShieldCheck, MapPin, Download, Smartphone, MessageCircle, Languages, Smartphone as MobileIcon, Wallet, Medal, Lock, AlertCircle, Key, X, Zap, BadgeCheck } from 'lucide-react';
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
import AgencyRechargeModal from './components/AgencyRechargeModal';
import { DEFAULT_VIP_LEVELS, DEFAULT_GIFTS, DEFAULT_STORE_ITEMS } from './constants';
import { Room, User, VIPPackage, UserLevel, Gift, StoreItem, GameSettings, GlobalAnnouncement, LuckyBag } from './types';
import { AnimatePresence, motion } from 'framer-motion';
import { db, auth } from './services/firebase';
import { EconomyEngine } from './services/economy'; 
import { collection, onSnapshot, doc, setDoc, query, orderBy, addDoc, getDoc, serverTimestamp, deleteDoc, updateDoc, arrayUnion, arrayRemove, increment, limit, where, writeBatch } from 'firebase/firestore';
import { deleteUser, signOut } from 'firebase/auth';

const translations = {
  ar: { home: "الرئيسية", messages: "الرسائل", profile: "حسابي", createRoom: "إنشاء غرفة", topSupporters: "كبار الداعمين", activeRooms: "الغرف النشطة", noRooms: "لا توجد غرف نشطة حالياً", coinsBalance: "رصيد العملات", adminPanel: "لوحة الإدارة", editAccount: "تعديل الحساب", storeBag: "المتجر والحقيبة", vipMembership: "عضوية الـ VIP", myWallet: "المحفظة", logout: "خروج", deleteAccount: "حذف الحساب نهائياً", agencyCenter: "مركز الوكالة", agencyDesc: "شحن كوينز للمستخدمين بالآيدي", appVersion: "نسخة الجوال متوفرة!", installNow: "تثبيت التطبيق الآن", search: "بحث في المحادثات...", id: "ID", lvl: "Lv.", confirmDelete: "هل أنت متأكد من حذف حسابك نهائياً؟" },
  en: { home: "Home", messages: "Messages", profile: "Profile", createRoom: "Create", topSupporters: "Top Supporters", activeRooms: "Active Rooms", noRooms: "No active rooms now", coinsBalance: "Coins Balance", adminPanel: "Admin Panel", editAccount: "Edit Profile", storeBag: "Store & Bag", vipMembership: "VIP Membership", myWallet: "Wallet", logout: "Logout", deleteAccount: "Delete Account Forever", agencyCenter: "Agency Center", agencyDesc: "Recharge coins for users by ID", appVersion: "Mobile Version Available!", installNow: "Install App Now", search: "Search conversations...", id: "ID", lvl: "Lv.", confirmDelete: "Are you sure you want delete your account?" }
};

const PERMANENT_LOGO_URL = 'https://storage.googleapis.com/static.aistudio.google.com/stables/2025/03/06/f0e64906-e7e0-4a87-af9b-029e2467d302/f0e64906-e7e0-4a87-af9b-029e2467d302.png';

const calculateLvl = (pts: number) => {
  if (!pts || pts <= 0) return 1;
  const l = Math.floor(Math.sqrt(pts) / 200);
  return Math.max(1, Math.min(100, l));
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
  const [pendingRoom, setPendingRoom] = useState<Room | null>(null);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [appLogo, setAppLogo] = useState(() => {
    return localStorage.getItem('vivo_live_fixed_logo') || PERMANENT_LOGO_URL;
  });

  const t = translations[language];

  const updateBrowserIcons = (logoUrl: string) => {
    const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = logoUrl;
    document.getElementsByTagName('head')[0].appendChild(link);

    const appleLink: HTMLLinkElement = document.querySelector("link[rel='apple-touch-icon']") || document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    appleLink.href = logoUrl;
    document.getElementsByTagName('head')[0].appendChild(appleLink);
  };

  useEffect(() => {
    updateBrowserIcons(appLogo);
  }, [appLogo]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  useEffect(() => {
    document.title = appName;
  }, [appName]);

  const [gameSettings, setGameSettings] = useState<GameSettings>({
     slotsWinRate: 35, wheelWinRate: 45, luckyGiftWinRate: 30, luckyXEnabled: true,
     luckyMultipliers: [{ label: 'X10', value: 10, chance: 70 }, { label: 'X50', value: 50, chance: 20 }, { label: 'X100', value: 100, chance: 8 }, { label: 'X500', value: 500, chance: 2 }],
     wheelJackpotX: 8, wheelNormalX: 2, slotsSevenX: 20, slotsFruitX: 5, availableEmojis: [], emojiDuration: 1.5,
     luckyGiftRefundPercent: 200
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showBagModal, setShowBagModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAgencyModal, setShowAgencyModal] = useState(false);

  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => {
        setAnnouncement(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  const roomsWithLatestUserData = useMemo(() => {
    return rooms.map(room => ({
      ...room,
      speakers: (room.speakers || []).map(speaker => {
        const latestInfo = users.find(u => u.id === speaker.id);
        return latestInfo ? { ...speaker, ...latestInfo } : speaker;
      })
    }));
  }, [rooms, users]);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'appSettings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.appBanner) setAppBanner(data.appBanner);
        if (data.appLogo && data.appLogo !== appLogo) {
            setAppLogo(data.appLogo);
            localStorage.setItem('vivo_live_fixed_logo', data.appLogo);
        }
        if (data.appName) setAppName(data.appName);
        if (data.gameSettings) setGameSettings(data.gameSettings);
      }
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersData = snapshot.docs.map(doc => {
          const d = doc.data();
          const wPts = typeof d.wealth === 'number' ? d.wealth : 0;
          const rPts = typeof d.rechargePoints === 'number' ? d.rechargePoints : 0;

          return { 
            id: doc.id, 
            ...d,
            wealthLevel: calculateLvl(wPts),
            rechargeLevel: calculateLvl(rPts),
            coins: Number(d.coins || 0),
            diamonds: Number(d.diamonds || 0),
            wealth: wPts,
            rechargePoints: rPts,
            charm: Number(d.charm || 0),
            ownedItems: Array.isArray(d.ownedItems) ? d.ownedItems : []
          } as User;
        });
        setUsers(usersData);
        
        if (user) {
          const currentInDb = usersData.find(u => u.id === user.id);
          if (currentInDb) {
             setUser(currentInDb);
          }
        }
    });

    const qRooms = query(collection(db, 'rooms'), orderBy('listeners', 'desc'));
    const unsubRooms = onSnapshot(qRooms, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      setRooms(roomsData);
    });

    const unsubGifts = onSnapshot(doc(db, 'appSettings', 'gifts'), (docSnap) => {
      if (docSnap.exists()) setGifts(docSnap.data().gifts || DEFAULT_GIFTS);
      else setGifts(DEFAULT_GIFTS);
    });

    const unsubStore = onSnapshot(doc(db, 'appSettings', 'store'), (docSnap) => {
      if (docSnap.exists()) setStoreItems(docSnap.data().items || DEFAULT_STORE_ITEMS);
      else setStoreItems(DEFAULT_STORE_ITEMS);
    });

    const unsubVip = onSnapshot(doc(db, 'appSettings', 'vip'), (docSnap) => {
      if (docSnap.exists()) setVipLevels(docSnap.data().levels || DEFAULT_VIP_LEVELS);
    });

    const savedUser = localStorage.getItem('voice_chat_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      getDoc(doc(db, 'users', parsedUser.id)).then((docSnap) => {
        if (docSnap.exists()) {
           const d = docSnap.data();
           setUser({
              ...d,
              id: docSnap.id,
              coins: Number(d?.coins || 0),
              ownedItems: Array.isArray(d?.ownedItems) ? d.ownedItems : []
           } as User);
        }
        setTimeout(() => setInitializing(false), 800);
      }).catch(() => setInitializing(false));
    } else {
      setTimeout(() => setInitializing(false), 800);
    }
    
    return () => { unsubSettings(); unsubRooms(); unsubUsers(); unsubGifts(); unsubStore(); unsubVip(); };
  }, []);

  const handleUpdateUser = async (updatedData: any) => {
    if (!user) return;
    const userId = updatedData.id || user.id;
    const { id, ...cleanData } = updatedData;
    
    // إزالة أي خصائص undefined لمنع أخطاء Firestore
    const firestoreData = Object.fromEntries(
      Object.entries(cleanData).filter(([_, v]) => v !== undefined)
    );

    setUser(prev => prev ? { ...prev, ...firestoreData } : null);

    try {
      await updateDoc(doc(db, 'users', userId), firestoreData);
    } catch (error) {
      console.error("Database background sync failed:", error);
    }
  };

  const activeRoomWithLatestData = useMemo(() => {
    if (!currentRoom) return null;
    const latest = roomsWithLatestUserData.find(r => r.id === currentRoom.id);
    return latest || currentRoom;
  }, [currentRoom, roomsWithLatestUserData]);

  // استبدال الألماس بشكل فوري
  const handleExchangeDiamonds = async (diamondsAmount: number) => {
    if (!user) return;
    EconomyEngine.exchangeDiamonds(user.id, user.coins, user.diamonds, diamondsAmount, (data) => {
       handleUpdateUser(data);
    });
    setShowWalletModal(false); // إغلاق النافذة فوراً
  };

  // شحن الوكالة بشكل فوري
  const handleAgencyCharge = async (targetId: string, amount: number) => {
    if (!user || !user.isAgency) return;
    if (Number(user.agencyBalance || 0) < amount) return alert('رصيد الوكالة لا يكفي!');

    const target = users.find(u => u.id === targetId);
    if (!target) return alert('المستخدم غير موجود!');

    EconomyEngine.agencyTransfer(
      user.id, user.agencyBalance!,
      targetId, target.coins, target.rechargePoints || 0,
      amount, 
      (agentData, targetData) => {
        setUser(prev => prev ? { ...prev, ...agentData } : null);
        setUsers(prev => prev.map(u => u.id === targetId ? { ...u, ...targetData } : u));
      }
    );
    setShowAgencyModal(false); // إغلاق النافذة فوراً
  };

  const onUpdateAppBanner = async (url: string) => {
    setAppBanner(url);
    await setDoc(doc(db, 'appSettings', 'global'), { appBanner: url }, { merge: true });
  };

  const onUpdateAppLogo = async (url: string) => {
    setAppLogo(url);
    localStorage.setItem('vivo_live_fixed_logo', url);
    await setDoc(doc(db, 'appSettings', 'global'), { appLogo: url }, { merge: true });
    updateBrowserIcons(url);
  };

  const onUpdateAppName = async (name: string) => {
    setAppName(name);
    await setDoc(doc(db, 'appSettings', 'global'), { appName: name }, { merge: true });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null); setCurrentRoom(null);
      localStorage.removeItem('voice_chat_user');
      setActiveTab('home');
    } catch (err) { console.error(err); }
  };

  const handleCreateRoom = async (roomData: any) => {
    if (!user || !user.customId) return;
    const roomId = user.customId.toString();
    const newRoom = { ...roomData, id: roomId, hostId: user.id, listeners: 1, speakers: [{ id: user.id, name: user.name, avatar: user.avatar, seatIndex: 0, charm: 0, isMuted: false }], createdAt: serverTimestamp() };
    await setDoc(doc(db, 'rooms', roomId), newRoom);
    setShowCreateRoomModal(false);
  };

  const handleRoomJoin = (room: Room) => {
    if (room.isLocked && room.hostId !== user?.id) {
       setPendingRoom(room);
       return;
    }
    joinRoomDirectly(room);
  };

  const joinRoomDirectly = (room: Room) => {
    setCurrentRoom(room);
    setIsRoomMinimized(false);
    updateDoc(doc(db, 'rooms', room.id), { listeners: increment(1) });
  };

  const handleRoomLeave = async () => {
    if (!currentRoom || !user) return;
    const roomId = currentRoom.id;
    const hostId = currentRoom.hostId;
    setCurrentRoom(null);
    setIsRoomMinimized(false);
    try {
      if (user.id === hostId) {
        await deleteDoc(doc(db, 'rooms', roomId));
      } else {
        const cleanedSpeakers = (currentRoom.speakers || [])
          .filter(s => s.id !== user.id)
          .map(s => ({
            id: s.id || '',
            name: s.name || 'مستخدم',
            avatar: s.avatar || '',
            seatIndex: s.seatIndex || 0,
            isMuted: s.isMuted || false,
            charm: Number(s.charm || 0)
          })) as any[];
        await updateDoc(doc(db, 'rooms', roomId), { speakers: cleanedSpeakers, listeners: increment(-1) });
      }
    } catch (err) { console.error("Error leaving room:", err); }
  };

  const handleUpdateRoom = async (roomId: string, data: Partial<Room>) => {
    const cleanedData: any = {};
    
    // تنظيف الحقول الأساسية
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanedData[key] = value;
      }
    });

    // تنظيف مصفوفة المتحدثين بشكل خاص لمنع undefined
    if (cleanedData.speakers) {
      cleanedData.speakers = cleanedData.speakers.map((s: any) => ({
        id: s.id || '',
        name: s.name || 'مستخدم',
        avatar: s.avatar || '',
        seatIndex: s.seatIndex ?? 0,
        isMuted: s.isMuted ?? false,
        charm: Number(s.charm || 0)
      })) as any[];
    }
    
    try {
      await updateDoc(doc(db, 'rooms', roomId), cleanedData);
    } catch (e) {
      console.error("Firestore Update Error:", e);
    }
  };

  if (initializing) return (
    <div className="h-[100dvh] w-full bg-[#020617] flex flex-col items-center justify-center font-cairo">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
        <div className="w-40 h-40 bg-yellow-400 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/20">
          <img src={appLogo} className="w-full h-full object-cover" />
        </div>
      </motion.div>
    </div>
  );

  if (!user) return <AuthScreen onAuth={(u) => { setUser(u); localStorage.setItem('voice_chat_user', JSON.stringify(u)); }} appLogo={appLogo} canInstall={!!deferredPrompt} onInstall={handleInstallClick} />;

  return (
    <div className={`h-[100dvh] w-full bg-[#0f172a] text-white relative md:max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col font-cairo ${language === 'en' ? 'text-left' : 'text-right'}`}>
      <Toast toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <AnimatePresence>{announcement && <GlobalBanner announcement={announcement} />}</AnimatePresence>
      
      <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
        {activeTab === 'home' && (
           <div className="mt-2 space-y-3">
              <div className="px-4 flex justify-between items-center mb-2">
                 <div className="flex items-center gap-2">
                    <img src={appLogo} className="w-8 h-8 rounded-lg shadow-lg border border-white/10" />
                    <div className="text-xs font-black tracking-widest text-white/40 uppercase">VIVO LIVE</div>
                 </div>
              </div>
              <div className="px-4">
                 <div className="relative w-full h-28 rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-slate-800">
                   {appBanner ? <img src={appBanner} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 animate-pulse"></div>}
                 </div>
              </div>
              <div className="px-4">
                 <div className="flex justify-between items-center mb-2">
                   <h2 className="text-xs font-bold text-white flex items-center gap-1.5"><Trophy size={14} className="text-yellow-500" /> {t.topSupporters}</h2>
                 </div>
                 <div className="bg-slate-900/50 p-2 rounded-xl border border-white/5 overflow-x-auto">
                   <div className="flex gap-3 min-w-max">
                     {[...users].filter(u => Number(u.wealth || 0) > 0).sort((a, b) => Number(b.wealth || 0) - Number(a.wealth || 0)).slice(0, 10).map((contributor, idx) => (
                       <div key={contributor.id} className="flex flex-col items-center gap-1 min-w-[60px]">
                          <img src={contributor.avatar} className={`w-12 h-12 rounded-full border-2 ${idx === 0 ? 'border-yellow-500' : 'border-slate-700'}`} />
                          <span className="text-[9px] font-bold text-white max-w-[60px] truncate">{contributor.name}</span>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>
              <div className="px-4">
                 <h2 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5"><Flame size={14} className="text-orange-500" /> {t.activeRooms}</h2>
                 <div className="grid gap-2.5">
                   {roomsWithLatestUserData.map(room => ( <RoomCard key={room.id} room={room} onClick={handleRoomJoin} /> ))}
                   {rooms.length === 0 && <div className="text-center text-slate-500 py-10 text-xs">{t.noRooms}</div>}
                 </div>
              </div>
           </div>
        )}
        {activeTab === 'messages' && <MessagesTab currentUser={user} onOpenChat={(partner) => setPrivateChatPartner(partner)} />}
        {activeTab === 'profile' && user && (
           <div className="relative">
              <div className="h-40 bg-slate-900 relative overflow-hidden">
                {user.cover ? <img src={user.cover} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-r from-indigo-900 to-slate-900"></div>}
              </div>
              <div className="px-5 pb-10">
                 <div className="relative -mt-10 mb-4 flex justify-between items-end text-right" dir="rtl">
                    <div className="relative w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center">
                        <img src={user.avatar} className="w-full h-full rounded-full object-cover" />
                        {user.frame && <img src={user.frame} className="absolute inset-0 w-full h-full object-contain scale-[1.15]" />}
                    </div>
                 </div>
                 <div className="flex items-center gap-2 mb-1">
                    <h2 className={`text-2xl ${user.nameStyle || 'font-bold text-white'}`}>{user.name}</h2>
                    {user.isAgency && (
                      <div className="bg-orange-500 text-black px-2 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-1 shadow-lg shadow-orange-900/40">
                         <BadgeCheck size={10} /> وكيل
                      </div>
                    )}
                 </div>
                 <span className="font-mono text-xs text-slate-400 block mb-5">{t.id}: {user.customId || user.id}</span>
                 
                 <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
                    <div onClick={() => setShowWalletModal(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                      <ChevronRight size={18} className="text-slate-600 rotate-180" />
                      <div className="flex items-center gap-3"><span className="text-sm font-medium text-white">{t.myWallet}</span><Wallet size={18} className="text-indigo-500" /></div>
                    </div>
                    {user.isAgency && (
                      <div onClick={() => setShowAgencyModal(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-orange-500/5 cursor-pointer">
                        <ChevronRight size={18} className="text-slate-600 rotate-180" />
                        <div className="flex items-center gap-3"><span className="text-sm font-black text-orange-500">{t.agencyCenter}</span><Zap size={18} className="text-orange-500" /></div>
                      </div>
                    )}
                    {user.isAdmin && (
                      <div onClick={() => setShowAdminPanel(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-red-500/5 cursor-pointer">
                        <ChevronRight size={18} className="text-slate-600 rotate-180" />
                        <div className="flex items-center gap-3"><span className="text-sm font-black text-red-500">{t.adminPanel}</span><ShieldCheck size={18} className="text-red-500" /></div>
                      </div>
                    )}
                    <div onClick={() => setShowEditProfileModal(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                      <ChevronRight size={18} className="text-slate-600 rotate-180" />
                      <div className="flex items-center gap-3"><span className="text-sm font-medium text-white">{t.editAccount}</span><Edit3 size={18} className="text-emerald-500" /></div>
                    </div>
                    <div onClick={() => setShowBagModal(true)} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                      <ChevronRight size={18} className="text-slate-600 rotate-180" />
                      <div className="flex items-center gap-3"><span className="text-sm font-medium text-white">{t.storeBag}</span><ShoppingBag size={18} className="text-blue-500" /></div>
                    </div>
                    <div onClick={handleLogout} className="flex items-center justify-between p-4 hover:bg-red-900/10 cursor-pointer">
                      <ChevronRight size={18} className="text-slate-600 rotate-180" />
                      <div className="flex items-center gap-3"><span className="text-sm font-medium text-red-500">{t.logout}</span><LogOut size={18} className="text-red-500" /></div>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>

      <AnimatePresence>{isRoomMinimized && activeRoomWithLatestData && (<MiniPlayer room={activeRoomWithLatestData} onExpand={() => setIsRoomMinimized(false)} onLeave={handleRoomLeave} isMuted={isUserMuted} onToggleMute={() => setIsUserMuted(!isUserMuted)} />)}</AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-lg border-t border-white/5 flex justify-around items-center h-20 pb-2 z-20">
         <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'home' ? 'text-amber-400' : 'text-slate-500'}`}><Home size={24} /><span className="text-[10px] font-medium">{t.home}</span></button>
         <button onClick={() => setActiveTab('messages')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'messages' ? 'text-amber-400' : 'text-slate-500'}`}><MessageCircle size={24} /><span className="text-[10px] font-medium">{t.messages}</span></button>
         <button onClick={() => setShowCreateRoomModal(true)} className="flex flex-col items-center gap-1 p-2 -mt-8"><div className="bg-gradient-to-br from-amber-400 to-orange-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-slate-900"><Plus size={28} className="text-white" /></div></button>
         <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'profile' ? 'text-amber-400' : 'text-slate-500'}`}><UserIcon size={24} /><span className="text-[10px] font-medium">{t.profile}</span></button>
      </div>

      <AnimatePresence>
        {activeRoomWithLatestData && !isRoomMinimized && (
          <VoiceRoom 
            room={activeRoomWithLatestData} 
            currentUser={user!} 
            onUpdateUser={handleUpdateUser} 
            onLeave={handleRoomLeave} 
            onMinimize={() => setIsRoomMinimized(true)} 
            gifts={gifts} 
            onEditProfile={() => setShowEditProfileModal(true)} 
            gameSettings={gameSettings} 
            onUpdateRoom={handleUpdateRoom} 
            isMuted={isUserMuted} 
            onToggleMute={() => setIsUserMuted(!isUserMuted)} 
            onAnnouncement={(a) => setAnnouncement(a)} 
            users={users} 
            onOpenPrivateChat={(p) => setPrivateChatPartner(p)} 
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {privateChatPartner && (
          <PrivateChatModal 
            partner={privateChatPartner} 
            currentUser={user!} 
            onClose={() => setPrivateChatPartner(null)} 
          />
        )}
      </AnimatePresence>
      {showVIPModal && user && <VIPModal user={user} vipLevels={vipLevels} onClose={() => setShowVIPModal(false)} onBuy={(v) => handleUpdateUser({ isVip: true, vipLevel: v.level, coins: Number(user.coins) - v.cost, frame: v.frameUrl, nameStyle: v.nameStyle })} />}
      {showEditProfileModal && user && <EditProfileModal isOpen={showEditProfileModal} onClose={() => setShowEditProfileModal(false)} currentUser={user} onSave={handleUpdateUser} />}
      {showBagModal && user && <BagModal isOpen={showBagModal} onClose={() => setShowBagModal(false)} items={storeItems} user={user} onBuy={(item) => EconomyEngine.spendCoins(user.id, user.coins, user.wealth, item.price, (data) => handleUpdateUser({ ...data, ownedItems: arrayUnion(item.id) }))} onEquip={(item) => handleUpdateUser(item.type === 'frame' ? { frame: item.url } : { activeBubble: item.url })} />}
      {showWalletModal && user && <WalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} user={user} onExchange={handleExchangeDiamonds} />}
      {showAgencyModal && user && <AgencyRechargeModal isOpen={showAgencyModal} onClose={() => setShowAgencyModal(false)} agentUser={user} users={users} onCharge={handleAgencyCharge} />}
      {showCreateRoomModal && <CreateRoomModal isOpen={showCreateRoomModal} onClose={() => setShowCreateRoomModal(false)} onCreate={handleCreateRoom} />}
      {showAdminPanel && user && (<AdminPanel isOpen={showAdminPanel} onClose={() => setShowAdminPanel(false)} currentUser={user} users={users} onUpdateUser={async (id, data) => await handleUpdateUser({ ...data, id })} rooms={rooms} setRooms={setRooms} onUpdateRoom={handleUpdateRoom} gifts={gifts} setGifts={setGifts} storeItems={storeItems} setStoreItems={setStoreItems} vipLevels={vipLevels} setVipLevels={setVipLevels} gameSettings={gameSettings} setGameSettings={setGameSettings} appBanner={appBanner} onUpdateAppBanner={onUpdateAppBanner} appLogo={appLogo} onUpdateAppLogo={onUpdateAppLogo} appName={appName} onUpdateAppName={onUpdateAppName} />)}
    </div>
  );
}
