
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, ShieldCheck, Activity, Gift as GiftIcon, ShoppingBag, 
  Crown, Smartphone, Eraser, X, Medal, IdCard, Layout, Zap
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { User, Room, Gift, StoreItem, GameSettings, VIPPackage } from '../types';

// استيراد المكونات الفرعية
import AdminUsers from './Admin/AdminUsers';
import AdminGames from './Admin/AdminGames';
import AdminGifts from './Admin/AdminGifts';
import AdminStore from './Admin/AdminStore';
import AdminVIP from './Admin/AdminVIP';
import AdminIdentity from './Admin/AdminIdentity';
import AdminMaintenance from './Admin/AdminMaintenance';
import AdminBadges from './Admin/AdminBadges';
import AdminIdBadges from './Admin/AdminIdBadges';
import AdminMicSkins from './Admin/AdminMicSkins';
import AdminAgency from './Admin/AdminAgency'; // القسم الجديد

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  onUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  onUpdateRoom: (roomId: string, data: Partial<Room>) => Promise<void>;
  gifts: Gift[];
  setGifts: (gifts: Gift[]) => void;
  storeItems: StoreItem[];
  setStoreItems: (items: StoreItem[]) => void;
  vipLevels: VIPPackage[];
  setVipLevels: (levels: VIPPackage[]) => void;
  gameSettings: GameSettings;
  setGameSettings: (settings: GameSettings) => void;
  appBanner: string;
  onUpdateAppBanner: (url: string) => void;
  appLogo: string;
  onUpdateAppLogo: (url: string) => void;
  appName: string;
  onUpdateAppName: (name: string) => void;
}

type AdminTab = 'users' | 'badges' | 'id_badges' | 'mic_skins' | 'agency' | 'games' | 'gifts' | 'store' | 'vip' | 'identity' | 'maintenance';

const compressImage = (base64: string, maxWidth: number, maxHeight: number, quality: number = 0.4): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
      } else {
        if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/webp', quality));
    };
  });
};

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  if (!props.isOpen || !props.currentUser.isAdmin) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const result = ev.target?.result as string;
        if (file.type === 'image/gif') {
          callback(result);
        } else {
          const compressed = await compressImage(result, w, h, 0.5);
          callback(compressed);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateGameSettings = async (updates: Partial<GameSettings>) => {
    const newSettings = { ...props.gameSettings, ...updates };
    props.setGameSettings(newSettings);
    await setDoc(doc(db, 'appSettings', 'global'), { gameSettings: newSettings }, { merge: true });
  };

  const saveGiftsToDb = async (newGifts: Gift[]) => {
    props.setGifts(newGifts);
    await setDoc(doc(db, 'appSettings', 'gifts'), { gifts: newGifts });
  };

  const saveStoreToDb = async (newItems: StoreItem[]) => {
    props.setStoreItems(newItems);
    await setDoc(doc(db, 'appSettings', 'store'), { items: newItems });
  };

  const saveVipToDb = async (newVips: VIPPackage[]) => {
    props.setVipLevels(newVips);
    await setDoc(doc(db, 'appSettings', 'vip'), { levels: newVips });
  };

  const menuItems = [
    { id: 'users', label: 'الأعضاء', icon: Users, color: 'text-blue-400' },
    { id: 'badges', label: 'أوسمة الشرف', icon: Medal, color: 'text-yellow-500' },
    { id: 'id_badges', label: 'أوسمة الـ ID', icon: IdCard, color: 'text-blue-500' },
    { id: 'mic_skins', label: 'أشكال المايكات', icon: Layout, color: 'text-indigo-500' },
    { id: 'agency', label: 'الوكالات', icon: Zap, color: 'text-orange-500' },
    { id: 'games', label: 'مركز الحظ', icon: Activity, color: 'text-orange-400' },
    { id: 'gifts', label: 'الهدايا', icon: GiftIcon, color: 'text-pink-400' },
    { id: 'store', label: 'المتجر', icon: ShoppingBag, color: 'text-cyan-400' },
    { id: 'vip', label: 'الـ VIP', icon: Crown, color: 'text-amber-400' },
    { id: 'identity', label: 'الهوية', icon: Smartphone, color: 'text-emerald-400' },
    { id: 'maintenance', label: 'الصيانة', icon: Eraser, color: 'text-red-500' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <AdminUsers users={props.users} vipLevels={props.vipLevels} onUpdateUser={props.onUpdateUser} />;
      case 'badges':
        return <AdminBadges users={props.users} onUpdateUser={props.onUpdateUser} />;
      case 'id_badges':
        return <AdminIdBadges users={props.users} onUpdateUser={props.onUpdateUser} />;
      case 'mic_skins':
        return <AdminMicSkins handleFileUpload={handleFileUpload} />;
      case 'agency':
        return <AdminAgency users={props.users} onUpdateUser={props.onUpdateUser} />;
      case 'games':
        return <AdminGames gameSettings={props.gameSettings} onUpdateGameSettings={handleUpdateGameSettings} handleFileUpload={handleFileUpload} />;
      case 'gifts':
        return <AdminGifts gifts={props.gifts} saveGiftsToDb={saveGiftsToDb} handleFileUpload={handleFileUpload} />;
      case 'store':
        return <AdminStore storeItems={props.storeItems} saveStoreToDb={saveStoreToDb} handleFileUpload={handleFileUpload} />;
      case 'vip':
        return <AdminVIP vipLevels={props.vipLevels} saveVipToDb={saveVipToDb} />;
      case 'identity':
        return <AdminIdentity appLogo={props.appLogo} appBanner={props.appBanner} appName={props.appName} onUpdateAppLogo={props.onUpdateAppLogo} onUpdateAppBanner={props.onUpdateAppBanner} onUpdateAppName={props.onUpdateAppName} handleFileUpload={handleFileUpload} />;
      case 'maintenance':
        return <AdminMaintenance currentUser={props.currentUser} />;
      default:
        return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-[#020617] flex flex-col md:flex-row font-cairo overflow-hidden text-right" dir="rtl">
      
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-slate-950 border-l border-white/5 flex flex-col shrink-0 shadow-2xl z-10">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-lg shadow-lg"><ShieldCheck size={20} className="text-white" /></div>
            <span className="font-black text-white">لوحة الإدارة</span>
          </div>
          <button onClick={props.onClose} className="md:hidden text-slate-400 p-2"><X size={24}/></button>
        </div>
        <nav className="flex md:flex-col p-3 gap-1 overflow-x-auto md:overflow-y-auto custom-scrollbar">
          {menuItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as AdminTab)} 
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all whitespace-nowrap ${activeTab === item.id ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:bg-white/5'}`}
            >
              <item.icon size={18} className={activeTab === item.id ? item.color : ''} />
              <span className="text-xs font-black">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-900/40 overflow-y-auto p-6 md:p-10 custom-scrollbar">
        {renderContent()}
      </div>

    </motion.div>
  );
};

export default AdminPanel;
