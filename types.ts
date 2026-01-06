export interface User {
  name: string;
  password?: string;
  icon: string;
}

export interface Users {
  [key: string]: User;
}

export interface FileData {
  id: number;
  name: string;
  type: string;
  size: number;
  data: string;
  uploadDate: string;
}

export interface Note {
  id: number;
  userId: string;
  user: string;
  text: string;
  date: string;
}

export interface FileStorage {
  [userId: string]: FileData[];
}

export interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | '';
}

export interface DeleteTarget {
  type: 'file' | 'note' | '';
  id: number | null;
}

// Global declaration for Firebase (loaded via CDN)
declare global {
  interface Window {
    firebase: any;
  }
}