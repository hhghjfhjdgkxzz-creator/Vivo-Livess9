
import React, { useState } from 'react';
import { Plus, Crown, Edit3, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VIPPackage } from '../../types';

interface AdminVIPProps {
  vipLevels: VIPPackage[];
  saveVipToDb: (newVips: VIPPackage[]) => Promise<void>;
}

const AdminVIP: React.FC<AdminVIPProps> = ({ vipLevels, saveVipToDb }) => {
  const [editingVip, setEditingVip] = useState<Partial<VIPPackage> | null>(null);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-white">عضويات VIP</h3>
        <button 
          onClick={() => setEditingVip({ level: (vipLevels.length + 1), name: '', cost: 1000, frameUrl: '', color: 'text-white', nameStyle: '' })} 
          className="px-6 py-3 bg-amber-600 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl active:scale-95"
        >
          <Plus size={18}/> إضافة رتبة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vipLevels.sort((a,b)=>a.level-b.level).map(vip => (
          <div key={vip.level} className="bg-slate-950/60 p-6 rounded-[2.5rem] border border-white/10 flex items-center gap-4 group relative">
            <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEditingVip(vip)} className="p-2 bg-blue-600 rounded-xl text-white"><Edit3 size={16}/></button>
              <button onClick={() => { if(confirm('حذف؟')) saveVipToDb(vipLevels.filter(v => v.level !== vip.level)) }} className="p-2 bg-red-600 rounded-xl text-white"><Trash2 size={16}/></button>
            </div>
            <img src={vip.frameUrl} className="w-14 h-14 object-contain scale-[1.3]" />
            <div className="text-right">
              <h4 className={`font-black text-lg ${vip.color}`}>{vip.name}</h4>
              <span className="text-[10px] text-yellow-500 font-bold">🪙 {vip.cost.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingVip && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white flex items-center gap-2 text-right"><Crown className="text-amber-500 ml-2"/> إعداد رتبة VIP</h3>
                <button onClick={() => setEditingVip(null)}><X size={24} className="text-slate-500" /></button>
              </div>
              <div className="space-y-6 text-right">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">اسم الرتبة</label>
                    <input type="text" value={editingVip.name} onChange={e => setEditingVip({...editingVip, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none text-right" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">المستوى</label>
                    <input type="number" value={editingVip.level} onChange={e => setEditingVip({...editingVip, level: parseInt(e.target.value) || 1})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-black text-xs outline-none text-center" />
                  </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase">تكلفة الترقية</label>
                   <input type="number" value={editingVip.cost} onChange={e => setEditingVip({...editingVip, cost: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-yellow-500 font-black text-sm outline-none text-center" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase">رابط الإطار (URL)</label>
                   <input type="text" value={editingVip.frameUrl} onChange={e => setEditingVip({...editingVip, frameUrl: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none text-left font-mono" />
                </div>
                <button 
                  onClick={async () => { 
                    const newVips = vipLevels.filter(v => v.level !== editingVip.level); 
                    await saveVipToDb([...newVips, editingVip as VIPPackage]); 
                    setEditingVip(null); 
                  }} 
                  className="w-full py-4 bg-gradient-to-r from-amber-600 to-yellow-600 text-black font-black rounded-2xl shadow-xl active:scale-95 transition-all"
                >
                  حفظ الرتبة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminVIP;
