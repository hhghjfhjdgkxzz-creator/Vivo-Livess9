
// Standard Firebase v9 modular imports
import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyC6jaJoEtdxOnnmVbk5HjWiuH9M_yWzrTk",
    authDomain: "bobo-live-bce54.firebaseapp.com",
    projectId: "bobo-live-bce54",
    storageBucket: "bobo-live-bce54.firebasestorage.app",
    messagingSenderId: "386288883998",
    appId: "1:386288883998:web:ce7c14d37dd7371552110f"
};

const app = initializeApp(firebaseConfig);

// تحسين Firestore للتعامل مع تحديثات الويب المكثفة وتجنب تراكم العمليات (Queued Writes)
// تم استخدام الذاكرة المؤقتة للتبويبات المتعددة وإدارة ذكية للطلبات
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
