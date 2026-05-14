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

export const incrementPageView = async () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;
  const dailyRef = ref(db, `daily_views/${today}`);
  const totalRef = ref(db, `daily_views/total`);

  try {
    await runTransaction(dailyRef, (currentViews) => {
      return (currentViews || 0) + 1;
    });

    await runTransaction(totalRef, (currentViews) => {
      return (currentViews || 0) + 1;
    });

  } catch (error) {
    console.error("Gagal menambah jumlah tayangan:", error);
  }
};

export const subscribeToDailyViews = (callback) => {
  const dailyRef = ref(db, 'daily_views');
  const unsubscribe = onValue(dailyRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
  return unsubscribe;
};
