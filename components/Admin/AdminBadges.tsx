
import React, { useState, useEffect } from 'react';
import { Search, Medal, Upload, Trash2, User as UserIcon, Plus, Sparkles, X, Send, CheckCircle2, UserMinus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../types';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';

interface AdminBadgesProps {
  users: User[];
  onUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
}

const compressImage = (base64: string, maxWidth: number, maxHeight: number, quality: number = 0.7): Promise<string> => {
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

const AdminBadges: React.FC<AdminBadgesProps> = ({ users, onUpdateUser }) => {
  const [globalMedals, setGlobalMedals] = useState<string[]>([]);
  
  // حالات البحث والمنح
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedMedal, setSelectedMedal] = useState<string | null>(null);
  
  // حالات البحث والسحب (إزالة الوسام)
  const [withdrawSearch, setWithdrawSearch] = useState('');
  const [userToWithdraw, setUserToWithdraw] = useState<User | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);

  useEffect(() => {
    const fetchMedals = async () => {
      const docRef = doc(db, 'appSettings', 'medals_library');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setGlobalMedals(snap.data().medals || []);
      }
    };
    fetchMedals();
  }, []);

  const filteredAwardUsers = searchQuery.trim() === '' ? [] : users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.customId?.toString() === searchQuery ||
    u.id === searchQuery
  ).slice(0, 5);

  const filteredWithdrawUsers = withdrawSearch.trim() === '' ? [] : users.filter(u => 
    u.name.toLowerCase().includes(withdrawSearch.toLowerCase()) || 
    u.customId?.toString() === withdrawSearch ||
    u.id === withdrawSearch
  ).slice(0, 5);

  const handleUploadToLibrary = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const result = ev.target?.result as string;
        const compressed = await compressImage(result, 400, 150);
        try {
          const docRef = doc(db, 'appSettings', 'medals_library');
          await setDoc(docRef, { medals: arrayUnion(compressed) }, { merge: true });
          setGlobalMedals(prev => [...prev, compressed]);
        } catch (err) { alert('فشل رفع الوسام للمكتبة'); } finally { setIsUploading(false); }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFromLibrary = async (url: string) => {
    if (!confirm('هل تريد حذف هذا الوسام من المكتبة؟ (لن يحذف من المستخدمين الذين يملكونه بالفعل)')) return;
    try {
      const docRef = doc(db, 'appSettings', 'medals_library');
      await updateDoc(docRef, { medals: arrayRemove(url) });
      setGlobalMedals(prev => prev.filter(m => m !== url));
    } catch (err) { alert('فشل الحذف من المكتبة'); }
  };

  const awardMedalToUser = async () => {
    if (!selectedUser || !selectedMedal) return;
    setIsAwarding(true);
    try {
      await onUpdateUser(selectedUser.id, { achievements: arrayUnion(selectedMedal) });
      alert(`تم منح الوسام لـ ${selectedUser.name} بنجاح! 🎖️`);
      setSelectedUser(null);
      setSelectedMedal(null);
      setSearchQuery('');
    } catch (err) { alert('حدث خطأ أثناء منح الوسام'); } finally { setIsAwarding(false); }
  };

  const removeUserBadge = async (userId: string, badgeUrl: string) => {
     if(!confirm('هل أنت متأكد من سحب هذا الوسام من العضو؟')) return;
     try {
        await onUpdateUser(userId, { achievements: arrayRemove(badgeUrl) });
        // تحديث الحالة محلياً للمشاهدة الفورية
        if(userToWithdraw && userToWithdraw.id === userId) {
            setUserToWithdraw({
                ...userToWithdraw,
                achievements: (userToWithdraw.achievements || []).filter(a => a !== badgeUrl)
            });
        }
        alert('تم سحب الوسام بنجاح ✅');
     } catch(e) { alert('فشل سحب الوسام'); }
  };

  return (
    <div className="space-y-10 text-right" dir="rtl">
      {/* القسم الأول: مكتبة الأوسمة */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
           <div>
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                 <Medal className="text-yellow-500" /> متجر الأوسمة المركزي
              </h3>
              <p className="text-slate-500 text-xs font-bold mt-1">ارفع الأوسمة هنا أولاً لتتمكن من توزيعها لاحقاً.</p>
           </div>
           <label className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-xs font-black cursor-pointer shadow-xl active:scale-95 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Plus size={18} />}
              رفع وسام جديد للمتجر
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadToLibrary} />
           </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
           {globalMedals.map((medal, idx) => (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                key={idx} 
                className={`relative group bg-slate-950/40 border-2 rounded-[2rem] p-4 flex items-center justify-center h-24 overflow-hidden transition-all ${selectedMedal === medal ? 'border-yellow-500 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'border-white/5 hover:border-white/20'}`}
                onClick={() => setSelectedMedal(medal)}
              >
                 <img src={medal} className="w-full h-full object-contain pointer-events-none" />
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedMedal(medal); }} title="اختيار للمنح" className="p-2 bg-yellow-500 text-black rounded-xl shadow-lg"><Send size={14}/></button>
                    <button onClick={(e) => { e.stopPropagation(); removeFromLibrary(medal); }} title="حذف من المتجر" className="p-2 bg-red-600 text-white rounded-xl shadow-lg"><Trash2 size={14}/></button>
                 </div>
                 {selectedMedal === medal && (
                   <div className="absolute top-2 right-2 text-yellow-500">
                      <CheckCircle2 size={16} fill="currentColor" className="text-black" />
                   </div>
                 )}
              </motion.div>
           ))}
           {globalMedals.length === 0 && (
             <div className="col-span-full py-12 text-center bg-black/20 rounded-[2rem] border-2 border-dashed border-white/5 text-slate-500 font-bold text-sm">
                المتجر فارغ.. ارفع صورة وسام للبدء
             </div>
           )}
        </div>
      </section>

      {/* القسم الثاني: منح الوسام */}
      <AnimatePresence>
        {selectedMedal && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="bg-slate-950/60 rounded-[3rem] border border-yellow-500/30 p-8 shadow-2xl overflow-hidden relative">
            <div className="max-w-xl relative z-10">
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                 <Sparkles className="text-yellow-500" /> منح الوسام المختار لعضو
              </h3>
              
              <div className="flex flex-col gap-6">
                 <div className="flex items-center gap-4 bg-black/40 p-4 rounded-3xl border border-white/5 w-fit">
                    <div className="w-28 h-10"><img src={selectedMedal} className="w-full h-full object-contain" /></div>
                    <button onClick={() => setSelectedMedal(null)} className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg"><X size={16}/></button>
                 </div>

                 <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 pr-2">ابحث عن العضو (بالاسم أو الـ ID):</label>
                    <div className="relative group">
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                      <input type="text" placeholder="ادخل ID المستخدم..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-900/80 border border-white/10 rounded-2xl py-4 pr-14 text-white text-sm outline-none focus:border-yellow-500/50 shadow-xl" />
                    </div>

                    <AnimatePresence>
                      {filteredAwardUsers.length > 0 && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-2 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
                          {filteredAwardUsers.map(u => (
                            <button key={u.id} onClick={() => { setSelectedUser(u); setSearchQuery(''); }} className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                              <img src={u.avatar} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                              <div className="flex flex-col text-right">
                                <span className="font-bold text-white text-sm">{u.name}</span>
                                <span className="text-[10px] text-slate-500">ID: {u.customId || u.id}</span>
                              </div>
                              {selectedUser?.id === u.id && <CheckCircle2 className="mr-auto text-emerald-500" size={20} />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>

                 {selectedUser && (
                    <div className="flex items-center gap-4 p-6 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20">
                       <div className="flex-1"><p className="text-white text-sm font-black">منح الوسام لـ <span className="text-emerald-400">{selectedUser.name}</span></p></div>
                       <button onClick={awardMedalToUser} disabled={isAwarding} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-xl active:scale-95 disabled:opacity-50">{isAwarding ? 'جاري المنح...' : 'تأكيد المنح'}</button>
                    </div>
                 )}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* القسم الثالث: سحب الأوسمة (تم تفعيله وتطويره) */}
      <section className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5">
         <div className="flex items-center gap-3 mb-6">
            <UserMinus className="text-red-500" />
            <h3 className="text-lg font-black text-white">إدارة وسحب أوسمة الأعضاء</h3>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <label className="text-xs font-black text-slate-500 pr-2">ابحث عن العضو لإدارة أوسمته:</label>
               <div className="relative group">
                 <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                 <input 
                   type="text" 
                   value={withdrawSearch}
                   onChange={(e) => setWithdrawSearch(e.target.value)}
                   placeholder="الاسم أو الـ ID..." 
                   className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pr-12 text-xs text-white outline-none focus:border-red-500/30"
                 />
               </div>

               <AnimatePresence>
                  {filteredWithdrawUsers.length > 0 && (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                        {filteredWithdrawUsers.map(u => (
                           <button key={u.id} onClick={() => { setUserToWithdraw(u); setWithdrawSearch(''); }} className="w-full p-3 flex items-center gap-3 hover:bg-white/5 border-b border-white/5 last:border-0">
                              <img src={u.avatar} className="w-8 h-8 rounded-lg object-cover" />
                              <div className="flex flex-col text-right">
                                 <span className="text-xs font-bold text-white">{u.name}</span>
                                 <span className="text-[9px] text-slate-500">ID: {u.customId || u.id}</span>
                              </div>
                           </button>
                        ))}
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
            
            <div className="bg-black/20 p-6 rounded-[2.5rem] border border-white/5 min-h-[120px] flex flex-col items-center justify-center">
               {userToWithdraw ? (
                  <div className="w-full space-y-4">
                     <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                        <img src={userToWithdraw.avatar} className="w-10 h-10 rounded-full border border-white/10" />
                        <div>
                           <h4 className="text-sm font-black text-white">{userToWithdraw.name}</h4>
                           <p className="text-[9px] text-slate-500">أوسمة العضو الحالية ({userToWithdraw.achievements?.length || 0})</p>
                        </div>
                        <button onClick={() => setUserToWithdraw(null)} className="mr-auto p-1 text-slate-500 hover:text-white"><X size={16}/></button>
                     </div>

                     <div className="flex flex-wrap gap-3">
                        {userToWithdraw.achievements && userToWithdraw.achievements.length > 0 ? (
                           userToWithdraw.achievements.map((badge, i) => (
                              <div key={i} className="relative group/badge w-24 h-9 bg-white/5 rounded-xl border border-white/5 p-1 flex items-center justify-center overflow-hidden">
                                 <img src={badge} className="w-full h-full object-contain" />
                                 <button 
                                    onClick={() => removeUserBadge(userToWithdraw.id, badge)}
                                    className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover/badge:opacity-100 transition-all font-black text-[10px] gap-1"
                                 >
                                    <Trash2 size={12} /> سحب
                                 </button>
                              </div>
                           ))
                        ) : (
                           <div className="w-full py-6 text-center text-slate-600 text-xs italic">لا يملك هذا العضو أي أوسمة حالياً</div>
                        )}
                     </div>
                  </div>
               ) : (
                  <div className="text-center text-slate-600">
                     <UserIcon size={32} className="mx-auto mb-2 opacity-20" />
                     <p className="text-xs font-bold">اختر عضواً لعرض أوسمته وسحبها</p>
                  </div>
               )}
            </div>
         </div>
      </section>
    </div>
  );
};

export default AdminBadges;
