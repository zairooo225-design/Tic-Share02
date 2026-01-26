import { FIREBASE_CONFIG } from '../constants';

// Initialize Firebase if not already initialized
export const initFirebase = () => {
  if (window.firebase && !window.firebase.apps.length) {
    window.firebase.initializeApp(FIREBASE_CONFIG);
  }
};

export const getDatabase = () => {
  if (!window.firebase) throw new Error("Firebase SDK not loaded");
  return window.firebase.database();
};

export const dbRef = (path: string) => {
  return getDatabase().ref(path);
};

export const saveData = async (path: string, data: any) => {
  try {
    await dbRef(path).set(data);
  } catch (error) {
    console.error(`Error saving to ${path}:`, error);
    throw error;
  }
};