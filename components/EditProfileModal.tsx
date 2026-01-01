
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Save, User as UserIcon, FileText, Image as ImageIcon, MapPin } from 'lucide-react';
import { User } from '../types';

// Utility for image compression
const compressImage = (base64: string, maxWidth: number, maxHeight: number, quality: number = 0.4): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/webp', quality));
    };
  });
};

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSave: (updatedData: Partial<User>) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, currentUser, onSave }) => {
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [cover, setCover] = useState(currentUser.cover || '');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setBio(currentUser.bio || '');
      setLocation(currentUser.location || '');
      setAvatar(currentUser.avatar);
      setCover(currentUser.cover || '');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const raw = event.target.result as string;
          // Drastically reduce dimensions to avoid 1MB Firestore limit
          const compressed = type === 'avatar' 
            ? await compressImage(raw, 150, 150, 0.5) 
            : await compressImage(raw, 600, 300, 0.4);
          
          if (type === 'avatar') {
            setAvatar(compressed);
          } else {
            setCover(compressed);
          }
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (isProcessing) return;
    onSave({
      name,
      bio,
      location,
      avatar,
      cover
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-sm bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-white">تعديل الملف الشخصي</h2>
             <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition">
                <X size={20} className="text-slate-400" />
             </button>
          </div>

          <div className="flex flex-col gap-6">
             {/* Cover & Avatar Edit Section */}
             <div className="relative mb-6">
                {/* Cover Image */}
                <div className="w-full h-32 rounded-xl bg-slate-800 relative group overflow-hidden border border-white/10">
                   {cover ? (
                     <img src={cover} alt="Cover" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center">
                       <span className="text-xs text-white/50 flex items-center gap-1"><ImageIcon size={14}/> صورة الغلاف</span>
                     </div>
                   )}
                   <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm flex items-center gap-2 px-3">
                         <Camera size={16} className="text-white" />
                         <span className="text-xs text-white font-bold">تغيير الغلاف</span>
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} className="hidden" />
                   </label>
                </div>

                {/* Avatar Image (Overlapping) */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                   <div className="relative group cursor-pointer">
                      <div className="w-20 h-20 rounded-full p-1 bg-slate-900">
                         <img src={avatar} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-slate-700" />
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10">
                         <Camera size={24} className="text-white drop-shadow-md" />
                         <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} className="hidden" />
                      </label>
                   </div>
                </div>
             </div>

             {/* Inputs */}
             <div className="space-y-4 mt-4">
                <div>
                   <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <UserIcon size={12} /> الاسم المستعار
                   </label>
                   <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:border-amber-500 outline-none text-sm"
                      placeholder="أدخل اسمك"
                   />
                </div>

                <div>
                   <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <MapPin size={12} /> العنوان / الموقع
                   </label>
                   <input 
                      type="text" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:border-amber-500 outline-none text-sm"
                      placeholder="المدينة، الدولة"
                   />
                </div>

                <div>
                   <label className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <FileText size={12} /> السيرة الذاتية (التعليق)
                   </label>
                   <textarea 
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:border-amber-500 outline-none text-sm min-h-[80px] resize-none"
                      placeholder="اكتب شيئاً عن نفسك..."
                      maxLength={150}
                   />
                   <div className="text-left text-[10px] text-slate-500 mt-1">{bio.length}/150</div>
                </div>
             </div>

             <button 
                onClick={handleSave}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 transition-all active:scale-95 disabled:opacity-50"
             >
                {isProcessing ? 'جاري التحميل...' : <><Save size={18} /> حفظ التغييرات</>}
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EditProfileModal;
