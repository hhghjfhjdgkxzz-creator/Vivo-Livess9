
import React, { useState } from 'react';
import { Eraser, AlertTriangle, Layout, Users, ShieldAlert } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';

interface AdminMaintenanceProps {
  currentUser: any;
}

const AdminMaintenance: React.FC<AdminMaintenanceProps> = ({ currentUser }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFullWipe = async () => {
    if(confirm('سيتم مسح كافة البيانات (المستخدمين، الغرف، المحادثات، الحقائب)؟ هذه العملية لا يمكن التراجع عنها.')) {
      setIsProcessing(true); 
      try {
        const batch = writeBatch(db);
        (await getDocs(collection(db, 'users'))).forEach(d => { if (d.id !== currentUser.id) batch.delete(d.ref); });
        (await getDocs(collection(db, 'rooms'))).forEach(d => batch.delete(d.ref));
        (await getDocs(collection(db, 'private_chats'))).forEach(d => batch.delete(d.ref));
        (await getDocs(collection(db, 'lucky_bags'))).forEach(d => batch.delete(d.ref));
        await batch.commit(); 
        alert('تم تطهير قاعدة البيانات بالكامل ✅'); 
        window.location.reload();
      } catch(e) { 
        console.error(e);
        alert('فشلت العملية'); 
      } finally { 
        setIsProcessing(false); 
      }
    }
  };

  const handleClearRooms = async () => {
    if(confirm('حذف كافة الغرف النشطة الآن؟')) {
      setIsProcessing(true); 
      try {
        const batch = writeBatch(db); 
        (await getDocs(collection(db, 'rooms'))).forEach(d => batch.delete(d.ref));
        await batch.commit(); 
        alert('تم تنظيف قائمة الغرف ✅');
      } catch(e) { 
        console.error(e);
        alert('فشل تنظيف الغرف'); 
      } finally { 
        setIsProcessing(false); 
      }
    }
  };

  const handleDeleteAllUsers = async () => {
    if(confirm('هل أنت متأكد من حذف جميع حسابات الأعضاء؟ سيتم الإبقاء على حسابك (المدير) فقط.')) {
      setIsProcessing(true);
      try {
        const batch = writeBatch(db);
        const usersSnap = await getDocs(collection(db, 'users'));
        let count = 0;
        usersSnap.forEach(d => {
          if (d.id !== currentUser.id) {
            batch.delete(d.ref);
            count++;
          }
        });
        await batch.commit();
        alert(`تم حذف ${count} حساب بنجاح، والإبقاء على حساب المدير ✅`);
      } catch (e) {
        console.error(e);
        alert('حدث خطأ أثناء حذف الحسابات');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 text-right font-cairo" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-red-600/20 rounded-2xl">
          <Eraser className="text-red-500" size={28} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-white">مركز صيانة النظام</h3>
          <p className="text-slate-500 text-xs font-bold mt-1">عمليات حساسة لإدارة وتنظيف قاعدة البيانات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* مسح شامل */}
        <div className="bg-red-600/5 border border-red-600/20 p-6 rounded-[2.5rem] flex flex-col items-center text-center gap-4 shadow-xl hover:bg-red-600/10 transition-all">
          <AlertTriangle size={32} className="text-red-600" />
          <h4 className="text-white font-black text-sm">مسح شامل للبيانات</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed">حذف كل شيء (أعضاء، غرف، شات) باستثناء حسابك الحالي.</p>
          <button 
            onClick={handleFullWipe} 
            disabled={isProcessing} 
            className="w-full py-3 bg-red-600 text-white font-black rounded-xl text-xs shadow-lg disabled:opacity-50 active:scale-95 transition-transform"
          >
            تطهير شامل
          </button>
        </div>

        {/* تصفية الغرف */}
        <div className="bg-slate-950/60 p-6 rounded-[2.5rem] border border-white/10 flex flex-col items-center text-center gap-4 shadow-xl hover:bg-white/5 transition-all">
          <Layout size={32} className="text-blue-500" />
          <h4 className="text-white font-black text-sm">تصفية الغرف</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed">إغلاق وحذف كافة الغرف النشطة في التطبيق حالياً.</p>
          <button 
            onClick={handleClearRooms} 
            disabled={isProcessing} 
            className="w-full py-3 bg-slate-800 text-white font-black rounded-xl text-xs disabled:opacity-50 active:scale-95 transition-transform"
          >
            حذف كافة الغرف
          </button>
        </div>

        {/* حذف الحسابات */}
        <div className="bg-orange-600/5 p-6 rounded-[2.5rem] border border-orange-600/20 flex flex-col items-center text-center gap-4 shadow-xl hover:bg-orange-600/10 transition-all">
          <Users size={32} className="text-orange-500" />
          <h4 className="text-white font-black text-sm">حذف كافة الحسابات</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed">مسح جميع حسابات المستخدمين من النظام باستثناء حساب المدير.</p>
          <button 
            onClick={handleDeleteAllUsers} 
            disabled={isProcessing} 
            className="w-full py-3 bg-orange-600 text-white font-black rounded-xl text-xs shadow-lg shadow-orange-900/20 disabled:opacity-50 active:scale-95 transition-transform"
          >
            حذف جميع الأعضاء
          </button>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] flex items-start gap-4">
        <ShieldAlert className="text-amber-500 shrink-0" size={20} />
        <div className="text-right">
          <h5 className="text-amber-500 font-black text-xs mb-1">تنبيه أمني هام</h5>
          <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
            جميع العمليات في هذه الصفحة نهائية ولا يمكن التراجع عنها. يرجى التأكد تماماً قبل الضغط على أي زر. حذف الحسابات سيؤدي إلى فقدان الأعضاء لعملاتهم ومستوياتهم وإطاراتهم بشكل دائم.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminMaintenance;
