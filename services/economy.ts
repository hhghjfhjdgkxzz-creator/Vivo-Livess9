
import { db } from './firebase';
import { doc, updateDoc, increment, writeBatch, serverTimestamp } from 'firebase/firestore';

/**
 * محرك الاقتصاد الموحد - بوبو لايف (V3 - الفوري)
 * تم تصميمه ليعمل بسرعة الضوء عبر تحديث الواجهة قبل انتظار استجابة الخادم
 */

export const EconomyEngine = {
  
  // 1. صرف كوينز (هدايا، ألعاب، متجر)
  spendCoins: (userId: string, currentCoins: number, currentWealth: number, amount: number, updateLocalState: (data: any) => void) => {
    if (amount <= 0 || currentCoins < amount) return false;
    
    // حساب فوري للقيم الجديدة لضمان سلاسة الأرقام
    const newCoins = Number(currentCoins) - Number(amount);
    const newWealth = Number(currentWealth || 0) + Number(amount);

    // تحديث الواجهة فوراً
    updateLocalState({
      coins: newCoins,
      wealth: newWealth
    });

    // التنفيذ في الخلفية (Background Task)
    (async () => {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          coins: increment(-amount),
          wealth: increment(amount)
        });
      } catch (e) {
        console.error("Background Economy Error (Spend):", e);
      }
    })();

    return true;
  },

  // 2. استقبال هدايا
  receiveGift: (recipientId: string, currentDiamonds: number, currentCharm: number, amount: number, updateLocalState: (data: any) => void) => {
    const newDiamonds = Number(currentDiamonds || 0) + Number(amount);
    const newCharm = Number(currentCharm || 0) + Number(amount);

    updateLocalState({
      diamonds: newDiamonds,
      charm: newCharm
    });

    (async () => {
      try {
        const userRef = doc(db, 'users', recipientId);
        await updateDoc(userRef, {
          charm: increment(amount),
          diamonds: increment(amount)
        });
      } catch (e) {
        console.error("Background Economy Error (Receive):", e);
      }
    })();
  },

  // 3. استبدال الألماس بكوينز (فوري)
  exchangeDiamonds: (userId: string, currentCoins: number, currentDiamonds: number, amount: number, updateLocalState: (data: any) => void) => {
    if (currentDiamonds < amount) return false;
    
    const coinsGained = Math.floor(amount * 0.5);
    const newCoins = Number(currentCoins) + Number(coinsGained);
    const newDiamonds = Number(currentDiamonds) - Number(amount);
    
    // تحديث الواجهة فوراً
    updateLocalState({
      coins: newCoins,
      diamonds: newDiamonds
    });

    // التحديث في الخلفية
    (async () => {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          diamonds: increment(-amount),
          coins: increment(coinsGained)
        });
      } catch (e) {}
    })();

    return true;
  },

  // 4. شحن وكالة (فوري)
  agencyTransfer: (agentId: string, currentAgentBalance: number, targetId: string, currentTargetCoins: number, currentTargetPoints: number, amount: number, updateLocalState: (agentData: any, targetData: any) => void) => {
    const newAgentBalance = Number(currentAgentBalance) - Number(amount);
    const newTargetCoins = Number(currentTargetCoins) + Number(amount);
    const newTargetPoints = Number(currentTargetPoints) + Number(amount);

    // تحديث محلي فوري لكلا الطرفين (الوكيل والمستلم)
    updateLocalState(
      { agencyBalance: newAgentBalance },
      { coins: newTargetCoins, rechargePoints: newTargetPoints }
    );

    // التنفيذ الفعلي في الخلفية عبر Firestore Batch
    (async () => {
      try {
        const batch = writeBatch(db);
        const agentRef = doc(db, 'users', agentId);
        const targetRef = doc(db, 'users', targetId);

        batch.update(agentRef, { agencyBalance: increment(-amount) });
        batch.update(targetRef, { 
          coins: increment(amount), 
          rechargePoints: increment(amount) 
        });

        await batch.commit();
      } catch (e) {
        console.error("Background Agency Error:", e);
      }
    })();

    return true;
  }
};
