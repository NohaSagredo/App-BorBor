import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAEm-aWQjkaNl148cwqE4JC76L0Pc3G5HA",
  authDomain: "borbor-app-hub.firebaseapp.com",
  projectId: "borbor-app-hub",
  storageBucket: "borbor-app-hub.firebasestorage.app",
  messagingSenderId: "858721278355",
  appId: "1:858721278355:web:3c3a6f513c2d516fdf3066"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
export const auth = getAuth(app);
export const storage = getStorage(app);

export const sendNotification = async (partnerUid, title, body, icon, actionUrl = null) => {
  const notifRef = collection(db, 'users', partnerUid, 'notifications');
  await addDoc(notifRef, {
    title,
    body,
    icon,
    actionUrl,
    read: false,
    timestamp: new Date().toISOString()
  });
};
