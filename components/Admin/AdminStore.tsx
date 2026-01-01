
import React, { useState } from 'react';
import { Plus, ShoppingBag, Edit3, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreItem } from '../../types';

interface AdminStoreProps {
  storeItems: StoreItem[];
  saveStoreToDb: (newItems: StoreItem[]) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const AdminStore: React.FC<AdminStoreProps> = ({ storeItems, saveStoreToDb, handleFileUpload }) => {
  const [editingStoreItem, setEditingStoreItem] = useState<Partial<StoreItem> | null>(null);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-white">إدارة المتجر</h3>
        <button 
          onClick={() => setEditingStoreItem({ id: Date.now().toString(), name: '', type: 'frame', price: 500, url: '' })} 
          className="px-6 py-3 bg-cyan-600 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl active:scale-95"
        >
          <Plus size={18}/> إضافة عنصر
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {storeItems.map(item => (
          <div key={item.id} className="bg-slate-950/60 p-4 rounded-[2rem] border border-white/10 flex flex-col items-center gap-2 group relative">
            <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEditingStoreItem(item)} className="p-1.5 bg-blue-600 rounded-lg text-white"><Edit3 size={12}/></button>
              <button onClick={() => { if(confirm('حذف؟')) saveStoreToDb(storeItems.filter(i => i.id !== item.id)) }} className="p-1.5 bg-red-600 rounded-lg text-white"><Trash2 size={12}/></button>
            </div>
            <img src={item.url} className="w-16 h-16 object-contain" />
            <span className="text-xs font-black text-white truncate w-full text-center">{item.name}</span>
            <span className="text-[10px] text-yellow-500 font-bold">🪙 {item.price}</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingStoreItem && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white flex items-center gap-2 text-right"><ShoppingBag className="text-cyan-500 ml-2"/> إعداد المتجر</h3>
                <button onClick={() => setEditingStoreItem(null)}><X size={24} className="text-slate-500" /></button>
              </div>
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 p-6 bg-black/30 rounded-3xl border border-white/5 relative group">
                  <div className="w-24 h-24 flex items-center justify-center bg-slate-800 rounded-3xl border border-white/10 shadow-inner overflow-hidden">
                    {editingStoreItem.url ? <img src={editingStoreItem.url} className="w-full h-full object-contain" /> : <ImageIcon className="text-slate-600" size={32} />}
                  </div>
                  <label className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-xl text-xs font-black cursor-pointer flex items-center gap-2 transition-all">
                    <Upload size={14} /> رفع صورة العنصر
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, (url) => setEditingStoreItem({...editingStoreItem, url: url}), 300, 300)} />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">اسم العنصر</label>
                    <input type="text" value={editingStoreItem.name} onChange={e => setEditingStoreItem({...editingStoreItem, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none text-right" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">السعر</label>
                    <input type="number" value={editingStoreItem.price} onChange={e => setEditingStoreItem({...editingStoreItem, price: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-yellow-500 font-black text-xs outline-none text-center" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">نوع العنصر</label>
                  <select value={editingStoreItem.type} onChange={e => setEditingStoreItem({...editingStoreItem, type: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-bold text-center appearance-none">
                    <option value="frame">إطار (Frame)</option>
                    <option value="bubble">فقاعة (Bubble)</option>
                  </select>
                </div>
                <button 
                  onClick={async () => { 
                    const newItems = storeItems.filter(i => i.id !== editingStoreItem.id); 
                    await saveStoreToDb([...newItems, editingStoreItem as StoreItem]); 
                    setEditingStoreItem(null); 
                  }} 
                  className="w-full py-4 bg-gradient-to-r from-cyan-600 to-indigo-700 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all"
                >
                  حفظ العنصر
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminStore;
