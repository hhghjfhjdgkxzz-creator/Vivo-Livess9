
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../services/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { User } from '../../types';

interface GiftEvent {
  id: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  giftAnimation: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientIds: string[];
  quantity: number;
  timestamp: any;
}

interface GiftAnimationLayerProps {
  roomId: string;
  speakers: User[];
}

const GiftAnimationLayer: React.FC<GiftAnimationLayerProps> = ({ roomId, speakers }) => {
  const [activeAnimations, setActiveAnimations] = useState<GiftEvent[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'rooms', roomId, 'gift_events'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const newEvent = { id: change.doc.id, ...change.doc.data() } as GiftEvent;
          const now = Date.now();
          const eventTime = newEvent.timestamp?.toMillis() || now;
          if (now - eventTime < 5000) {
            triggerAnimation(newEvent);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [roomId]);

  const triggerAnimation = (event: GiftEvent) => {
    setActiveAnimations(prev => [...prev, event]);
    const duration = event.giftAnimation === 'full-screen' ? 4000 : 2500;
    setTimeout(() => {
      setActiveAnimations(prev => prev.filter(a => a.id !== event.id));
    }, duration);
  };

  const renderGiftIcon = (icon: string) => {
    const isImage = icon.includes('http') || icon.includes('data:image') || icon.includes('base64');
    if (isImage) {
      return <img src={icon} className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]" alt="" />;
    }
    return <span className="text-8xl drop-shadow-2xl">{icon}</span>;
  };

  return (
    <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {activeAnimations.map((event) => {
          if (event.giftAnimation === 'full-screen') {
            return (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                <div className="relative w-80 h-80 flex items-center justify-center">
                   <motion.div 
                      animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-pink-500/10 rounded-full blur-3xl"
                   />
                   <div className="w-64 h-64 relative z-10">
                      {renderGiftIcon(event.giftIcon)}
                   </div>
                   {event.quantity > 1 && (
                      <motion.div 
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="absolute -right-4 top-1/2 bg-gradient-to-b from-yellow-400 to-orange-600 text-white font-black text-4xl px-4 py-1 rounded-2xl shadow-2xl border-2 border-white/20 italic"
                      >
                         X{event.quantity}
                      </motion.div>
                   )}
                </div>
              </motion.div>
            );
          }

          return (
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, y: 100, scale: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1.5 }}
              exit={{ opacity: 0, y: -100, scale: 2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
               <div className="flex flex-col items-center">
                  <div className="w-40 h-40 flex items-center justify-center">
                    {renderGiftIcon(event.giftIcon)}
                  </div>
                  {event.quantity > 1 && (
                     <div className="bg-amber-500 text-black px-6 py-1 rounded-full font-black text-3xl shadow-2xl mt-4 border-2 border-white/40 italic">
                        X{event.quantity}
                     </div>
                  )}
               </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default GiftAnimationLayer;
