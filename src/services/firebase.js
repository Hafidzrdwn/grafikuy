import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, remove, set, get, onValue, runTransaction } from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const logoutGoogle = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

export const getDatasets = async () => {
  const snapshot = await get(ref(db, 'datasets'));
  if (snapshot.exists()) {
    const data = snapshot.val();
    return Object.keys(data).map(key => ({ id: key, ...data[key] }));
  }
  return [];
};

export const saveDataset = async (datasetObj) => {
  const newRef = push(ref(db, 'datasets'));
  await set(newRef, datasetObj);
  return newRef.key;
};

export const deleteDataset = async (id) => {
  await remove(ref(db, `datasets/${id}`));
};

export const setSelectedDatasetId = async (id) => {
  await set(ref(db, 'config/selectedDatasetId'), id);
};

export const getSelectedDatasetId = async () => {
  const snapshot = await get(ref(db, 'config/selectedDatasetId'));
  return snapshot.exists() ? snapshot.val() : null;
};

export const subscribeToDatasets = (callback) => {
  const datasetsRef = ref(db, 'datasets');
  const unsubscribe = onValue(datasetsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const arr = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      callback(arr.reverse());
    } else {
      callback([]);
    }
  });
  return unsubscribe;
};

export const updateDatasetConfig = async (id, config, configKey = 'dashboardConfig') => {
  await set(ref(db, `datasets/${id}/${configKey}`), config);
};

export const incrementPageView = async (pageKey) => {
  const pageRef = ref(db, `page_views/${pageKey}`);
  const today = new Date().toISOString().split('T')[0];
  const dailyRef = ref(db, `daily_views/${today}`);
  
  try {
    if (pageKey === 'main_dashboard') {
      const dailySnapshot = await get(ref(db, 'daily_views'));
      if (!dailySnapshot.exists()) {
        const pageSnapshot = await get(pageRef);
        const oldTotal = pageSnapshot.val() || 0;
        
        if (oldTotal > 0) {
          const updates = {};
          let remaining = oldTotal;
          for (let i = 13; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            if (i === 0) {
              updates[dateStr] = remaining; 
            } else {
              const avg = Math.floor(remaining / (i + 1));
              const randomVariance = Math.floor(Math.random() * avg);
              const val = Math.max(0, avg + (Math.random() > 0.5 ? randomVariance : -randomVariance));
              updates[dateStr] = val;
              remaining -= val;
            }
          }
          await set(ref(db, 'daily_views'), updates);
        }
      }
    }

    await runTransaction(pageRef, (currentViews) => {
      return (currentViews || 0) + 1;
    });
    
    await runTransaction(dailyRef, (currentViews) => {
      return (currentViews || 0) + 1;
    });

  } catch (error) {
    console.error("Gagal menambah jumlah tayangan:", error);
  }
};

export const subscribeToPageViews = (pageKey, callback) => {
  const pageRef = ref(db, `page_views/${pageKey}`);
  const unsubscribe = onValue(pageRef, (snapshot) => {
    callback(snapshot.val() || 0);
  });
  return unsubscribe;
};

export const subscribeToDailyViews = (callback) => {
  const dailyRef = ref(db, 'daily_views');
  const unsubscribe = onValue(dailyRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
  return unsubscribe;
};
