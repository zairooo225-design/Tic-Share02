import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, User, FileStorage, Note, NotificationState, DeleteTarget, FileData
} from './types';
import { CONFIG, DEFAULT_USERS } from './constants';
import { initFirebase, dbRef, saveData } from './services/firebaseService';
import { 
  IconUpload, IconDownload, IconX, IconUser, IconMessage, IconFile, 
  IconLogOut, IconEdit, IconArrowLeft 
} from './components/Icons';
import { Notification } from './components/Notifications';
import { ConfirmationModal, ModalBackdrop } from './components/Modals';

// --- Helpers ---
const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

// --- Components ---

const FileCard = ({ file, onDownload, onDelete, index, isNew }: { file: FileData, onDownload: () => void, onDelete: () => void, index: number, isNew: boolean }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setTransform(`perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`);
    setGlowPos({ x, y });
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setTransform('');
    setOpacity(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative bg-white rounded-3xl p-6 shadow-xl transition-all duration-300 ease-out group"
      style={{ transform }}
    >
      <div 
        className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-300" 
        style={{ 
          opacity, 
          background: `radial-gradient(600px circle at ${glowPos.x}px ${glowPos.y}px, rgba(200,200,255,0.15), transparent 40%)` 
        }} 
      />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="p-3 bg-gray-50 rounded-2xl">
           <IconFile className="w-8 h-8 text-black" />
        </div>
        {isNew && <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">NEW</span>}
      </div>
      <h3 className="font-bold text-lg mb-2 truncate text-gray-800 relative z-10" title={file.name}>{file.name}</h3>
      <div className="flex justify-between items-center text-sm text-gray-500 mb-6 relative z-10">
        <span>{formatSize(file.size)}</span>
        <span>{formatDate(file.uploadDate)}</span>
      </div>
      <div className="flex gap-3 relative z-10">
        <button onClick={onDownload} className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
          <IconDownload className="w-4 h-4" /> <span className="text-sm">Download</span>
        </button>
        <button onClick={onDelete} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
          <IconX className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<NotificationState>({ show: false, message: '', type: '' });

  useEffect(() => {
    initFirebase();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ ...notification, show: false }), 3000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Notification notification={notification} />
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
           <div className="text-center mb-8">
             <h1 className="text-4xl font-black mb-2">TIC SHARE</h1>
             <p className="text-gray-500">{CONFIG.APP_VERSION}</p>
           </div>
           <div className="space-y-4">
             {Object.values(DEFAULT_USERS).map((u: any) => (
               <button 
                 key={u.name}
                 onClick={() => {
                   setUser(u);
                   showNotification(`Welcome back, ${u.name}!`, 'success');
                 }}
                 className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-black hover:bg-gray-50 transition-all duration-300 group"
               >
                 <img src={u.icon} alt={u.name} className="w-12 h-12 rounded-full object-cover group-hover:scale-110 transition-transform" />
                 <span className="font-bold text-lg">{u.name}</span>
               </button>
             ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Notification notification={notification} />
      <header className="bg-white sticky top-0 z-50 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src={user.icon} alt={user.name} className="w-10 h-10 rounded-full border border-gray-200" />
            <span className="font-bold text-lg hidden sm:block">{user.name}</span>
          </div>
          <h1 className="font-black text-xl tracking-tighter">TIC SHARE</h1>
          <button onClick={() => setUser(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <IconLogOut className="w-6 h-6" />
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <div className="col-span-full text-center py-20 text-gray-400">
             <IconFile className="w-16 h-16 mx-auto mb-4 opacity-20" />
             <p className="font-medium">Select a file to upload or view existing files</p>
           </div>
        </div>
      </main>
      
      <div className="fixed bottom-8 right-8">
         <button className="bg-black text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform">
           <IconUpload />
         </button>
      </div>
    </div>
  );
};

export default App;