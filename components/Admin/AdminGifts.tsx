
import React, { useState } from 'react';
import { Plus, Gift as GiftIcon, Edit3, Trash2, Wand2, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, GiftAnimationType } from '../../types';

interface AdminGiftsProps {
  gifts: Gift[];
  saveGiftsToDb: (newGifts: Gift[]) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const animationTypes: { id: GiftAnimationType; label: string }[] = [
  { id: 'pop', label: 'ظهور (Pop)' },
  { id: 'fly', label: 'طيران (Fly)' },
  { id: 'full-screen', label: 'ملء الشاشة' },
  { id: 'shake', label: 'اهتزاز' },
  { id: 'glow', label: 'توهج' },
  { id: 'bounce', label: 'قفز' },
  { id: 'rotate', label: 'دوران' },
  { id: 'slide-up', label: 'انزلاق للأعلى' },
];

const AdminGifts: React.FC<AdminGiftsProps> = ({ gifts, saveGiftsToDb, handleFileUpload }) => {
  const [editingGift, setEditingGift] = useState<Partial<Gift> | null>(null);

  const renderIcon = (icon: string) => {
    if (!icon) return <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500"><GiftIcon size={20}/></div>;
    const isImage = icon.includes('http') || icon.includes('data:image') || icon.includes('base64');
    return isImage ? <img src={icon} className="w-12 h-12 object-contain" alt="" /> : <span className="text-3xl">{icon}</span>;
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-white">إدارة الهدايا</h3>
        <button 
          onClick={() => setEditingGift({ id: Date.now().toString(), name: '', icon: '', cost: 10, animationType: 'pop', category: 'popular' })} 
          className="px-6 py-3 bg-pink-600 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl active:scale-95"
        >
          <Plus size={18}/> إضافة هدية
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {gifts.map(gift => (
          <div key={gift.id} className="bg-slate-950/60 p-4 rounded-[2rem] border border-white/10 flex flex-col items-center gap-2 group relative">
            <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEditingGift(gift)} className="p-1.5 bg-blue-600 rounded-lg text-white"><Edit3 size={12}/></button>
              <button onClick={() => { if(confirm('حذف؟')) saveGiftsToDb(gifts.filter(g => g.id !== gift.id)) }} className="p-1.5 bg-red-600 rounded-lg text-white"><Trash2 size={12}/></button>
            </div>
            {renderIcon(gift.icon || '')}
            <span className="text-xs font-black text-white truncate w-full text-center">{gift.name}</span>
            <span className="text-[10px] text-yellow-500 font-bold">🪙 {gift.cost}</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingGift && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white flex items-center gap-2 text-right"><Wand2 className="text-pink-500 ml-2"/> إعداد الهدية</h3>
                <button onClick={() => setEditingGift(null)}><X size={24} className="text-slate-500" /></button>
              </div>
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 p-6 bg-black/30 rounded-3xl border border-white/5 relative group">
                  <div className="w-24 h-24 flex items-center justify-center bg-slate-800 rounded-3xl border border-white/10 shadow-inner overflow-hidden">{renderIcon(editingGift.icon || '')}</div>
                  <label className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-xl text-xs font-black cursor-pointer flex items-center gap-2 transition-all">
                    <Upload size={14} /> رفع صورة الهدية
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, (url) => setEditingGift({...editingGift, icon: url}), 300, 300)} />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">اسم الهدية</label>
                    <input type="text" value={editingGift.name} onChange={e => setEditingGift({...editingGift, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none text-right" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">سعر الهدية</label>
                    <input type="number" value={editingGift.cost} onChange={e => setEditingGift({...editingGift, cost: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-yellow-500 font-black text-xs outline-none text-center" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">تأثير ظهور الهدية (Animation)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {animationTypes.map(type => (
                      <button 
                        key={type.id} 
                        onClick={() => setEditingGift({...editingGift, animationType: type.id})} 
                        className={`p-3 rounded-xl text-[10px] font-black text-center border transition-all ${editingGift.animationType === type.id ? 'bg-pink-600 border-pink-500 text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-500 hover:bg-black/40'}`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">التصنيف</label>
                  <select value={editingGift.category} onChange={e => setEditingGift({...editingGift, category: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-bold text-center appearance-none">
                    <option value="popular">شائع</option>
                    <option value="exclusive">مميز</option>
                    <option value="lucky">الحظ</option>
                    <option value="celebrity">مشاهير</option>
                    <option value="trend">ترند</option>
                  </select>
                </div>
                <button 
                  onClick={async () => { 
                    const newGifts = gifts.filter(g => g.id !== editingGift.id); 
                    await saveGiftsToDb([...newGifts, { ...editingGift, isLucky: editingGift.category === 'lucky' } as Gift]); 
                    setEditingGift(null); 
                  }} 
                  className="w-full py-4 bg-gradient-to-r from-pink-600 to-indigo-700 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all"
                >
                  حفظ الهدية
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminGifts;
