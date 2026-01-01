
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Zap, LogIn, UserPlus, Download, ShieldCheck } from 'lucide-react';
import { UserLevel, User as UserType } from '../types';
import { auth, db } from '../services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';

interface AuthScreenProps {
  onAuth: (user: UserType) => void;
  appLogo?: string;
  canInstall?: boolean;
  onInstall?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuth, appLogo, canInstall, onInstall }) => {
  const [showSplash, setShowSplash] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const LOGO = appLogo || 'https://storage.googleapis.com/static.aistudio.google.com/stables/2025/03/06/f0e64906-e7e0-4a87-af9b-029e2467d302/f0e64906-e7e0-4a87-af9b-029e2467d302.png';

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      setError('الرجاء ملء جميع الحقول');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) onAuth(userDoc.data() as UserType);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userData: UserType = {
          id: userCredential.user.uid,
          customId: Math.floor(100000 + Math.random() * 899999),
          name: name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userCredential.user.uid}`,
          level: UserLevel.NEW,
          coins: 5000,
          diamonds: 0,
          wealth: 0, 
          charm: 0, 
          isVip: false,
          stats: { likes: 0, visitors: 0, following: 0, followers: 0 },
          ownedItems: []
        };
        await setDoc(doc(db, 'users', userCredential.user.uid), { ...userData, createdAt: serverTimestamp() });
        onAuth(userData);
      }
    } catch (err: any) {
      setError('خطأ في البيانات أو الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#020617] flex flex-col items-center justify-center overflow-hidden font-cairo select-none relative px-6">
      <AnimatePresence>
        {showSplash && (
          <motion.div exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-[#020617] flex flex-col items-center justify-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[1.8rem] overflow-hidden shadow-2xl border-4 border-white/10 p-0.5">
                <img src={LOGO} className="w-full h-full object-cover rounded-[1.6rem]" />
              </div>
            </motion.div>
            <h1 className="mt-4 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-600">فـيـفـو لايف</h1>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: showSplash ? 0 : 1, scale: showSplash ? 0.95 : 1 }} 
        className="w-full max-w-[320px] flex flex-col items-center gap-4"
      >
        <div className="text-center shrink-0">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[1.4rem] mx-auto mb-2 border-2 border-white/10 p-0.5 shadow-xl">
            <img src={LOGO} className="w-full h-full object-cover rounded-[1.2rem]" />
          </div>
          <h1 className="text-lg font-black text-white leading-none">فـيـفـو لايف</h1>
          <p className="text-slate-500 text-[8px] font-black mt-1 tracking-widest uppercase">VIVO LIVE OFFICIAL</p>
        </div>

        {/* زر تثبيت التطبيق الرسمي الاحترافي */}
        <AnimatePresence>
          {canInstall && (
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              onClick={onInstall}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 p-3 rounded-2xl flex items-center justify-between border border-white/10 shadow-lg active:scale-95 transition-all mb-2"
            >
              <div className="flex items-center gap-3">
                 <div className="bg-white/10 p-2 rounded-xl"><Download size={18} className="text-white" /></div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-white leading-tight">تثبيت التطبيق الرسمي</p>
                    <p className="text-[8px] text-white/60">للحصول على كامل المميزات</p>
                 </div>
              </div>
              <ShieldCheck size={20} className="text-emerald-400" />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="w-full bg-slate-900/60 backdrop-blur-2xl border border-white/5 rounded-[1.8rem] p-4 shadow-2xl shrink-0">
          <div className="flex bg-black/40 p-1 rounded-xl mb-4 border border-white/5">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${isLogin ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500'}`}>دخول</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${!isLogin ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500'}`}>تسجيل</button>
          </div>

          <form onSubmit={handleAuth} className="space-y-2.5">
            {!isLogin && (
              <div className="space-y-0.5">
                <label className="text-[8px] font-black text-slate-500 pr-1">الاسم</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pr-9 text-white text-[11px] outline-none focus:border-amber-500/30" placeholder="اسمك" />
                </div>
              </div>
            )}
            <div className="space-y-0.5">
              <label className="text-[8px] font-black text-slate-500 pr-1">البريد</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pr-9 text-white text-[11px] outline-none focus:border-amber-500/30" placeholder="email@test.com" />
              </div>
            </div>
            <div className="space-y-0.5">
              <label className="text-[8px] font-black text-slate-500 pr-1">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pr-9 text-white text-[11px] outline-none focus:border-amber-500/30" placeholder="••••••" />
              </div>
            </div>

            {error && <p className="text-red-500 text-[8px] text-center font-bold">{error}</p>}

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 rounded-xl text-black font-black text-[11px] shadow-lg active:scale-95 transition-all mt-2">
              {loading ? '...' : (isLogin ? 'دخول' : 'بدء')}
            </button>
          </form>
          <div className="mt-4 pt-2 border-t border-white/5 text-center">
            <p className="text-[6px] text-slate-600 font-bold uppercase tracking-widest">VIVO NETWORK SYSTEM</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
