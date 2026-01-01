import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, Shield, ChevronLeft, Clock, ChevronRight } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { User } from '../types';

interface MessagesTabProps {
  currentUser: User;
  onOpenChat: (partner: User) => void;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastTimestamp: any;
  [key: string]: any;
}

const MessagesTab: React.FC<MessagesTabProps> = ({ currentUser, onOpenChat }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const isRtl = document.documentElement.dir === 'rtl';

  useEffect(() => {
    // تم إزالة orderBy لتجنب الحاجة إلى فهرس مركب يدوي (Manual Composite Index)
    const q = query(
      collection(db, 'private_chats'),
      where('participants', 'array-contains', currentUser.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conversation[];
      
      // فرز المحادثات برمجياً حسب الوقت (من الأحدث للأقدم)
      convs.sort((a, b) => {
        const timeA = a.lastTimestamp?.toMillis() || 0;
        const timeB = b.lastTimestamp?.toMillis() || 0;
        return timeB - timeA;
      });

      setConversations(convs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a]">
      {/* Header */}
      <div className="p-6 bg-gradient-to-b from-black/20 to-transparent">
        <h2 className="text-2xl font-black text-white mb-4">{isRtl ? 'الرسائل' : 'Messages'}</h2>
        <div className="relative">
          <Search className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-500`} size={18} />
          <input 
            type="text" 
            placeholder={isRtl ? "بحث في المحادثات..." : "Search chats..."} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-slate-900 border border-white/5 rounded-2xl py-3 ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm text-white outline-none focus:border-amber-500/30 transition-all`}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 scrollbar-hide">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
             <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 opacity-40">
             <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
                <MessageSquare size={40} className="text-slate-600" />
             </div>
             <p className="text-white font-black">{isRtl ? 'لا توجد رسائل بعد' : 'No messages yet'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations
              .filter(c => {
                const partnerId = c.participants.find(id => id !== currentUser.id);
                const partner = c[`user_${partnerId}`];
                return partner?.name?.toLowerCase().includes(searchQuery.toLowerCase());
              })
              .map((conv) => {
                const partnerId = conv.participants.find(id => id !== currentUser.id);
                const partnerData = conv[`user_${partnerId}`];
                
                return (
                  <motion.div 
                    key={conv.id}
                    initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => onOpenChat({ id: partnerId, ...partnerData } as any)}
                    className={`flex items-center gap-4 p-4 bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 rounded-3xl transition-all cursor-pointer group ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    <div className="relative shrink-0">
                      <img src={partnerData?.avatar} className="w-14 h-14 rounded-2xl object-cover border border-white/10 shadow-lg" alt="" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                    </div>
                    
                    <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
                      <div className={`flex justify-between items-center mb-1 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                        <h4 className="font-black text-white text-sm truncate">{partnerData?.name}</h4>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                           <Clock size={10} /> {formatTime(conv.lastTimestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate font-medium">
                        {conv.lastMessage}
                      </p>
                    </div>

                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                       {isRtl ? <ChevronLeft size={18} className="text-slate-600" /> : <ChevronRight size={18} className="text-slate-600" />}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;