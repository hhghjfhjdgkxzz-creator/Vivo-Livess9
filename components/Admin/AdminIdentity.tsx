
import React, { useState } from 'react';
import { Smartphone, Camera, Image as ImageIcon, Edit3, Save } from 'lucide-react';

interface AdminIdentityProps {
  appLogo: string;
  appBanner: string;
  appName: string;
  onUpdateAppLogo: (url: string) => void;
  onUpdateAppBanner: (url: string) => void;
  onUpdateAppName: (name: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void, w: number, h: number) => void;
}

const AdminIdentity: React.FC<AdminIdentityProps> = ({ appLogo, appBanner, appName, onUpdateAppLogo, onUpdateAppBanner, onUpdateAppName, handleFileUpload }) => {
  const [localAppName, setLocalAppName] = useState(appName);

  const handleSaveName = () => {
    if (localAppName.trim()) {
      onUpdateAppName(localAppName);
      alert('تم تحديث اسم التطبيق بنجاح! ✅');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 text-right" dir="rtl">
      <h3 className="text-2xl font-black text-white flex items-center gap-3">
        <Smartphone className="text-emerald-500 ml-2"/> هوية التطبيق والبراند
      </h3>

      {/* قسم اسم التطبيق */}
      <div className="bg-slate-950/60 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-2">
           <Edit3 size={20} className="text-blue-400" />
           <h4 className="text-sm font-black text-white">إعدادات اسم الموقع/التطبيق</h4>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
           <div className="flex-1 relative">
              <input 
                type="text" 
                value={localAppName}
                onChange={(e) => setLocalAppName(e.target.value)}
                placeholder="أدخل اسم التطبيق الجديد هنا..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-black outline-none focus:border-blue-500/50 shadow-inner"
              />
           </div>
           <button 
             onClick={handleSaveName}
             className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
           >
              <Save size={18} /> حفظ الاسم الجديد
           </button>
        </div>
        <p className="text-[10px] text-slate-500 font-bold px-2">ملاحظة: هذا الاسم سيظهر في شريط عنوان المتصفح ولدى جميع المستخدمين عند تسجيل الدخول.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-950/60 p-8 rounded-[2.5rem] border border-white/10 space-y-4 text-center">
          <label className="text-xs font-black text-slate-500 uppercase block mb-2">شعار التطبيق (Logo)</label>
          <div className="relative aspect-square w-32 mx-auto rounded-3xl overflow-hidden border-2 border-dashed border-white/10 flex items-center justify-center bg-black/40 group">
            <img src={appLogo} className="w-full h-full object-cover group-hover:opacity-40" />
            <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
              <Camera size={24} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, onUpdateAppLogo, 400, 400)} />
            </label>
          </div>
        </div>
        <div className="bg-slate-950/60 p-8 rounded-[2.5rem] border border-white/10 space-y-4 text-center">
          <label className="text-xs font-black text-slate-500 uppercase block mb-2">بنر الواجهة (Banner)</label>
          <div className="relative h-32 w-full rounded-2xl overflow-hidden border-2 border-dashed border-white/10 flex items-center justify-center bg-black/40 group">
            <img src={appBanner} className="w-full h-full object-cover group-hover:opacity-40" />
            <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
              <ImageIcon size={24} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, onUpdateAppBanner, 800, 300)} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminIdentity;
