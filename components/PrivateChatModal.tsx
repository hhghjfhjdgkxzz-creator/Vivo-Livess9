
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User as UserIcon, Shield, Smile, Paperclip } from 'lucide-react';
import { User } from '../types';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, limit, doc, setDoc } from 'firebase/firestore';

interface PrivateChatModalProps {
  partner: User;
  currentUser: User;
  onClose: () => void;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
}

const PrivateChatModal: React.FC<PrivateChatModalProps> = ({ partner, currentUser, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate a consistent ID for the chat regardless of who starts it
  const chatId = [currentUser.id, partner.id].sort().join('_');

  useEffect(() => {
    const q = query(
      collection(db, 'private_chats', chatId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText('');

    try {
      // 1. Add message to subcollection
      await addDoc(collection(db, 'private_chats', chatId, 'messages'), {
        senderId: currentUser.id,
        text,
        timestamp: serverTimestamp()
      });

      // 2. Update conversation metadata for the Messages List
      await setDoc(doc(db, 'private_chats', chatId), {
        participants: [currentUser.id, partner.id],
        lastMessage: text,
        lastTimestamp: serverTimestamp(),
        [`user_${currentUser.id}`]: {
          name: currentUser.name,
          avatar: currentUser.avatar
        },
        [`user_${partner.id}`]: {
          name: partner.name,
          avatar: partner.avatar
        }
      }, { merge: true });

    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-md h-[80vh] bg-slate-900 border border-white/10 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 bg-slate-800/50 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="relative">
                <img src={partner.avatar} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
             </div>
             <div className="text-right">
                <h3 className="text-white font-bold text-sm leading-tight">{partner.name}</h3>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                   نشط الآن <Shield size={10} className="text-blue-400" />
                </span>
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2 opacity-50">
               <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-2">
                 <Shield size={32} />
               </div>
               <p className="text-xs font-bold">ابدأ المحادثة مع {partner.name}</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMine 
                      ? 'bg-amber-500 text-black rounded-tr-none shadow-lg shadow-amber-900/20 font-medium' 
                      : 'bg-slate-800 text-white rounded-tl-none border border-white/5 shadow-md'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 bg-slate-800/30 border-t border-white/5 flex items-center gap-3">
           <button type="button" className="p-2 text-slate-500 hover:text-white transition-colors"><Paperclip size={20} /></button>
           <div className="flex-1 relative">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="اكتب رسالتك..."
                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-3 px-5 pr-12 text-sm text-white outline-none focus:border-amber-500/50 transition-all text-right"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-500"><Smile size={20} /></button>
           </div>
           <button 
              type="submit"
              disabled={!inputText.trim()}
              className="w-11 h-11 bg-amber-500 text-black rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/40 active:scale-95 transition-all disabled:opacity-50"
           >
              <Send size={20} fill="currentColor" className="rotate-180" />
           </button>
        </form>
      </motion.div>
    </div>
  );
};

export default PrivateChatModal;
