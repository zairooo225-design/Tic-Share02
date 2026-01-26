import React from 'react';
import { NotificationState } from '../types';

interface NotificationProps {
  notification: NotificationState;
}

export const Notification: React.FC<NotificationProps> = ({ notification }) => {
  if (!notification.show) return null;

  return (
    <div className={`fixed top-5 right-5 z-[9999] px-6 py-4 rounded-xl font-bold shadow-2xl animate-slide-in-right transform transition-all duration-300 ${
      notification.type === 'success' 
        ? 'bg-white text-black border-l-4 border-green-500' 
        : 'bg-white text-black border-l-4 border-red-500'
    }`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{notification.type === 'success' ? '✅' : '❌'}</span>
        <p>{notification.message}</p>
      </div>
    </div>
  );
};