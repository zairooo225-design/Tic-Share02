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
  note?: string;
}

export interface VaultItem {
  id: number;
  site: string;
  username: string;
  pass: string;
  date: string;
}

export interface Note {
  id: number;
  userId: string;
  user: string;
  text: string;
  date: string;
}

export interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | '';
}

declare global {
  interface Window {
    firebase: any;
  }
}