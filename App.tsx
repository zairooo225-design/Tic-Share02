import React, { useState, useEffect, useRef } from 'react';

// --- CONSOLIDATED INTERFACES ---
interface User { name: string; password?: string; icon: string; }
interface Users { [key: string]: User; }
interface FileData { id: number; name: string; type: string; size: number; data: string; uploadDate: string; note?: string; }
interface VaultItem { id: number; site: string; username: string; pass: string; date: string; }
interface Note { id: number; userId: string; user: string; text: string; date: string; }
interface NotificationState { show: boolean; message: string; type: 'success' | 'error' | ''; }

// --- CONSOLIDATED CONSTANTS ---
const CONFIG = {
  CREDITS_TEXT: "All credits to Zairo & Spv",
  ITSHARE_URL: "https://imgur.com/a/3bfKVnz",
  ITSHARE_LOADING_IMAGE_URL: "https://i.imgur.com/OEiiTxw.png",
  LOBBY_IMAGE_URL: "https://i.imgur.com/pGB9giE.png",
  SPECIAL_KEY: '1233',
  MAX_NAME_LENGTH: 20,
};

const DEFAULT_USERS = {
  user1: { name: 'Zairo', password: 'zairo123', icon: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zairo' },
  user2: { name: 'stan și bran realitatea plus ❤', password: 'stan123', icon: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Stan' }
};

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBwkx6FZv_pcJr1xkWZ7AvjkPxZxdM2_3g",
  authDomain: "tic-share.firebaseapp.com",
  databaseURL: "https://tic-share-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tic-share",
  storageBucket: "tic-share.firebasestorage.app",
  messagingSenderId: "694169491730",
  appId: "1:694169491730:web:7ac8f7c82cdf471fcffbcb"
};

// --- CONSOLIDATED ICONS ---
const IconKey = ({ className = "w-6 h-6" }) => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>);
const IconUser = ({ className = "w-6 h-6" }) => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
const IconMessage = ({ className = "w-6 h-6" }) => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>);
const IconFile = ({ className = "w-6 h-6" }) => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>);
const IconLogOut = ({ className = "w-6 h-6" }) => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>);
const IconUpload = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>);
const IconDownload = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>);
const IconX = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>);
const IconEye = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
const IconArrowLeft = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>);
const IconWarning = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-16 h-16"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>);

// --- HELPERS ---
const formatSize = (bytes: number) => { if (!bytes) return ''; if (bytes < 1024) return bytes + ' B'; if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'; return (bytes / 1048576).toFixed(1) + ' MB'; };
const formatDate = (iso: string) => { if (!iso) return ''; const d = new Date(iso); return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`; };
const getFavicon = (url: string) => { try { const domain = new URL(url).hostname; return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`; } catch { return null; } };

const App = () => {
  const [view, setView] = useState('loading');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [users, setUsers] = useState<Users>(DEFAULT_USERS);
  const [files, setFiles] = useState<Record<string, FileData[]>>({});
  const [notes, setNotes] = useState<Note[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  
  const [loginPassword, setLoginPassword] = useState('');
  const [notification, setNotification] = useState<NotificationState>({ show: false, message: '', type: '' });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Vault form state
  const [vSite, setVSite] = useState('');
  const [vUser, setVUser] = useState('');
  const [vPass, setVPass] = useState('');
  const [visiblePassIds, setVisiblePassIds] = useState(new Set());
  const [visibleUserIds, setVisibleUserIds] = useState(new Set());

  // --- FIREBASE LOGIC ---
  const initFirebase = () => { if (window.firebase && !window.firebase.apps.length) { window.firebase.initializeApp(FIREBASE_CONFIG); } };
  const saveData = async (path: string, data: any) => { try { await window.firebase.database().ref(path).set(data); } catch (e) { console.error(e); } };

  const loadFromFirebase = async () => {
    try {
      const db = window.firebase.database();
      const [uSnap, fSnap, nSnap, vSnap] = await Promise.all([
        db.ref('users').once('value'), db.ref('files').once('value'),
        db.ref('notes').once('value'), db.ref('vault').once('value')
      ]);
      if (uSnap.exists()) setUsers(uSnap.val());
      if (fSnap.exists()) setFiles(fSnap.val());
      if (nSnap.exists()) setNotes((Object.values(nSnap.val()) as Note[]).sort((a, b) => b.id - a.id));
      if (vSnap.exists() && currentUser) {
          const vaultData = vSnap.val()[currentUser];
          if (vaultData) setVaultItems(Object.values(vaultData) as VaultItem[]);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    initFirebase();
    const sessionUser = sessionStorage.getItem('currentUser');
    if (sessionUser) { setCurrentUser(sessionUser); loadFromFirebase(); setView('files'); }
    else { setTimeout(() => { loadFromFirebase(); setTimeout(() => setView('login'), 2500); }, 2500); }
  }, []);

  const showNotif = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const handleLogin = () => {
    if (!selectedUser || users[selectedUser].password !== loginPassword) return showNotif('Auth Failed', 'error');
    setCurrentUser(selectedUser); sessionStorage.setItem('currentUser', selectedUser);
    setView('files'); loadFromFirebase(); setLoginPassword(''); setSelectedUser(null);
    showNotif('Access Granted', 'success');
  };

  const handleLogout = () => { setCurrentUser(null); sessionStorage.removeItem('currentUser'); setView('login'); setShowLogoutConfirm(false); };
  
  const handleAddVaultItem = async () => {
    if (!currentUser || !vSite || !vUser || !vPass) return;
    const item: VaultItem = { id: Date.now(), site: vSite, username: vUser, pass: vPass, date: new Date().toISOString() };
    const updated = [...vaultItems, item];
    setVaultItems(updated); setVSite(''); setVUser(''); setVPass('');
    await saveData(`vault/${currentUser}/${item.id}`, item);
    showNotif('Credentials Secured', 'success');
  };

  const deleteVaultItem = async (id: number) => {
    if (!currentUser) return;
    const updated = vaultItems.filter(v => v.id !== id);
    setVaultItems(updated);
    await window.firebase.database().ref(`vault/${currentUser}/${id}`).remove();
    showNotif('Record Erased', 'success');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showNotif(`${label} Copied!`, 'success');
  };

  const currentUserData = currentUser ? users[currentUser] : null;

  return (
    <div className="min-h-screen bg-black selection:bg-white selection:text-black">
      {/* NOTIFICATION UI */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-[9999] px-7 py-5 rounded-[1.5rem] font-black shadow-2xl animate-morph glass flex items-center gap-4 ${notification.type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
          <span className="text-xl">{notification.type === 'success' ? '✅' : '❌'}</span>
          <p className="text-sm uppercase tracking-widest">{notification.message}</p>
        </div>
      )}

      {/* LOADING SCREEN */}
      {view === 'loading' && (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-black to-purple-900/10 animate-pulse"></div>
          <div className="text-center relative z-10 animate-morph">
            <h1 className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-600 to-white mb-8 tracking-tighter">PRIVATE CLOUD</h1>
            <div className="w-24 h-1.5 bg-white/10 mx-auto rounded-full overflow-hidden mt-8">
              <div className="w-full h-full bg-white animate-shuttle"></div>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN VIEW */}
      {view === 'login' && (
        <div className="perspective-stage">
           {selectedUser ? (
             <div className="w-full max-w-md animate-reveal">
                <div className="glass-card rounded-[3.5rem] p-12 text-center">
                   <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-gray-500 hover:text-white mb-10 transition-colors uppercase font-black text-xs tracking-widest"><IconArrowLeft /> Back</button>
                   <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white/10 mx-auto mb-8 animate-float shadow-2xl">
                      <img src={users[selectedUser].icon} alt="" className="w-full h-full object-cover" />
                   </div>
                   <h2 className="text-4xl font-black mb-10 tracking-tight">{users[selectedUser].name}</h2>
                   <input type="password" placeholder="Passkey" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleLogin()} autoFocus className="input-premium w-full rounded-2xl p-6 text-center font-bold tracking-[0.6em] mb-8 text-xl" />
                   <button onClick={handleLogin} className="w-full bg-white text-black py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:scale-[1.03] transition-transform shadow-[0_15px_40px_rgba(255,255,255,0.15)]">Authenticate</button>
                </div>
             </div>
           ) : (
             <div className="w-full max-w-5xl text-center px-6">
                <h1 className="text-7xl md:text-[10rem] font-black text-white mb-20 tracking-tighter animate-morph">VAULT</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   {Object.entries(users).map(([uid, u], i) => (
                     <div key={uid} onClick={() => setSelectedUser(uid)} className="group glass p-10 rounded-[4rem] cursor-pointer flex items-center gap-10 hover-lift animate-reveal" style={{animationDelay: `${i*0.1}s`}}>
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/10 group-hover:border-white transition-colors shadow-2xl">
                           <img src={u.icon} alt="" className="w-full h-full object-cover" />
                        </div>
                        <h2 className="text-3xl font-black text-white text-left tracking-tight">{u.name}</h2>
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>
      )}

      {/* MAIN CONTENT */}
      {currentUserData && view !== 'login' && view !== 'loading' && (
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32 relative z-10">
          {/* NAVIGATION BAR */}
          <div className="glass-card rounded-[3.5rem] p-10 mb-16 flex flex-col md:flex-row items-center justify-between gap-10 animate-reveal">
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/10 animate-float shadow-2xl"><img src={currentUserData.icon} alt="" className="w-full h-full object-cover" /></div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tighter">{currentUserData.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px]">Active Session</p>
                </div>
              </div>
            </div>
            <div className="flex gap-5">
               <button onClick={() => setView('vault')} className={`p-5 rounded-2xl border transition-all hover-lift shadow-xl ${view === 'vault' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white'}`}><IconKey /></button>
               <button onClick={() => setView(view === 'files' ? 'notes' : 'files')} className={`p-5 rounded-2xl border transition-all hover-lift shadow-xl ${view !== 'vault' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white'}`}>{view === 'files' ? <IconMessage /> : <IconFile />}</button>
               <button onClick={() => setShowLogoutConfirm(true)} className="p-5 rounded-2xl bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all hover-lift shadow-xl"><IconLogOut /></button>
            </div>
          </div>

          <div className="animate-morph">
            {view === 'vault' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                {/* VAULT INPUT FORM */}
                <div className="lg:col-span-4 glass-card rounded-[3.5rem] p-12 border border-white/10 shadow-2xl animate-reveal">
                  <h3 className="text-3xl font-black mb-12 text-white tracking-tight">Vault Entry</h3>
                  <div className="space-y-8 mb-12">
                     <div className="group">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 ml-3 font-black">Service / Site</p>
                        <input type="text" placeholder="e.g. Roblox, Discord" value={vSite} onChange={e => setVSite(e.target.value)} className="input-premium w-full rounded-2xl p-6 font-bold text-white text-lg" />
                     </div>
                     <div className="group">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 ml-3 font-black">Identity / ID</p>
                        <input type="text" placeholder="Username" value={vUser} onChange={e => setVUser(e.target.value)} className="input-premium w-full rounded-2xl p-6 font-bold text-white text-lg" />
                     </div>
                     <div className="group">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 ml-3 font-black">Security Sequence</p>
                        <input type="password" placeholder="Passkey" value={vPass} onChange={e => setVPass(e.target.value)} className="input-premium w-full rounded-2xl p-6 font-bold text-white text-lg" />
                     </div>
                  </div>
                  <button onClick={handleAddVaultItem} className="w-full bg-white text-black py-7 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl">Vault Credentials</button>
                </div>

                {/* VAULT ITEMS LIST */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-10 h-[calc(100vh-450px)] overflow-y-auto custom-scrollbar pr-6 pb-24">
                   {vaultItems.length === 0 ? (
                      <div className="col-span-full py-48 text-center glass rounded-[4rem] border-dashed border-white/10 text-gray-700 font-black uppercase tracking-[0.8em] animate-pulse text-sm">Vault Empty</div>
                   ) : (
                     vaultItems.map((item, i) => (
                       <div key={item.id} className="glass p-12 rounded-[4rem] border border-white/10 relative group hover-lift animate-reveal" style={{animationDelay: `${i*0.1}s`, animationFillMode: 'forwards'}}>
                          <button onClick={() => deleteVaultItem(item.id)} className="absolute top-10 right-10 text-red-500/40 opacity-0 group-hover:opacity-100 transition-all p-4 hover:bg-red-500/10 hover:text-red-500 rounded-2xl shadow-lg"><IconX /></button>
                          
                          <div className="flex items-center gap-6 mb-12">
                             <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-inner">
                                <IconKey className="w-8 h-8 text-blue-400 group-hover:rotate-12 transition-transform duration-500" />
                             </div>
                             <h4 className="text-3xl font-black text-white tracking-tighter truncate">{item.site}</h4>
                          </div>
                          
                          <div className="space-y-8">
                             {/* MASKED USERNAME FIELD */}
                             <div className="space-y-3">
                                <div className="flex justify-between items-center px-2">
                                   <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">User: {visibleUserIds.has(item.id) ? 'Showing' : 'Hidden'}</p>
                                   <button onClick={() => copyToClipboard(item.username, 'Username')} className="text-[10px] text-blue-400 font-black hover:text-white transition-colors uppercase tracking-widest">Copy</button>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex-1 bg-black/60 p-6 rounded-[1.5rem] font-mono text-sm border border-white/5 truncate text-white/80 shadow-inner group-hover:border-white/10 transition-colors">
                                    {visibleUserIds.has(item.id) ? item.username : '••••••••••••'}
                                  </div>
                                  <button onClick={() => { const s = new Set(visibleUserIds); s.has(item.id) ? s.delete(item.id) : s.add(item.id); setVisibleUserIds(s); }} className={`p-6 rounded-[1.5rem] border transition-all shadow-lg ${visibleUserIds.has(item.id) ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}><IconEye /></button>
                                </div>
                             </div>

                             {/* MASKED PASSWORD FIELD */}
                             <div className="space-y-3">
                                <div className="flex justify-between items-center px-2">
                                   <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Pass: {visiblePassIds.has(item.id) ? 'Showing' : 'Hidden'}</p>
                                   <button onClick={() => copyToClipboard(item.pass, 'Pass')} className="text-[10px] text-blue-400 font-black hover:text-white transition-colors uppercase tracking-widest">Copy</button>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex-1 bg-black/60 p-6 rounded-[1.5rem] font-mono text-sm border border-white/5 truncate text-white/80 shadow-inner group-hover:border-white/10 transition-colors">
                                    {visiblePassIds.has(item.id) ? item.pass : '••••••••••••'}
                                  </div>
                                  <button onClick={() => { const s = new Set(visiblePassIds); s.has(item.id) ? s.delete(item.id) : s.add(item.id); setVisiblePassIds(s); }} className={`p-6 rounded-[1.5rem] border transition-all shadow-lg ${visiblePassIds.has(item.id) ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}><IconEye /></button>
                                </div>
                             </div>
                          </div>
                          <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center">
                             <span className="text-[10px] font-mono text-gray-700 uppercase tracking-[0.3em] font-black">{formatDate(item.date)}</span>
                             <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[8px] font-black text-blue-400 uppercase tracking-widest">Verified Vault</div>
                          </div>
                       </div>
                     ))
                   )}
                </div>
              </div>
            ) : view === 'files' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-reveal">
                 {/* UPLOAD CARD */}
                 <div onClick={() => setShowUploadModal(true)} className="glass-card rounded-[4rem] p-12 flex flex-col items-center justify-center text-center cursor-pointer hover-lift border-dashed border-2 border-white/10 min-h-[350px]">
                    <div className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center mb-8 shadow-2xl animate-float"><IconUpload /></div>
                    <h3 className="text-3xl font-black mb-3">Upload Data</h3>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Encrypt new assets</p>
                 </div>
                 {/* FILE LIST */}
                 {(files[currentUser!] || []).map((file, i) => (
                    <div key={file.id} className="glass-card rounded-[4rem] p-10 flex flex-col justify-between hover-lift min-h-[350px] animate-reveal shadow-2xl border border-white/5" style={{animationDelay: `${i*0.1}s`, animationFillMode: 'forwards'}}>
                       <div>
                          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-8 shadow-inner"><IconFile className="text-blue-500 w-8 h-8" /></div>
                          <h4 className="text-3xl font-black mb-2 truncate tracking-tight">{file.name}</h4>
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] text-gray-500 font-mono font-black uppercase tracking-widest">{formatSize(file.size)}</span>
                             <div className="w-1 h-1 rounded-full bg-white/20"></div>
                             <span className="text-[10px] text-gray-500 font-mono font-black uppercase tracking-widest">{formatDate(file.uploadDate)}</span>
                          </div>
                       </div>
                       <div className="flex gap-4 mt-12">
                          <button onClick={() => { const l = document.createElement('a'); l.href = file.data; l.download = file.name; l.click(); showNotif('Asset Decrypted', 'success'); }} className="flex-1 bg-white text-black py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:scale-[1.03] transition-transform flex items-center justify-center gap-3 shadow-xl"><IconDownload /> Save</button>
                          <button onClick={async () => { const u = files[currentUser!].filter(f => f.id !== file.id); setFiles({...files, [currentUser!]: u}); await saveData(`files/${currentUser!}`, u); showNotif('Erased', 'success'); }} className="w-16 h-16 bg-red-500/10 text-red-500 rounded-[1.5rem] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg border border-red-500/20"><IconX /></button>
                       </div>
                    </div>
                 ))}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-10 animate-reveal">
                 <div className="glass-card rounded-[4rem] p-12 border border-white/10 shadow-2xl">
                    <p className="text-[10px] text-gray-600 uppercase tracking-[0.4em] font-black mb-6 ml-2">Secure Broadcast</p>
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Intercept intel..." className="w-full bg-transparent border-none resize-none font-bold text-3xl outline-none mb-10 min-h-[180px] placeholder-gray-800" />
                    <div className="flex justify-end"><button onClick={async () => { if(!newNote.trim()) return; const n = { id: Date.now(), userId: currentUser!, user: currentUserData.name, text: newNote, date: new Date().toISOString() }; const u = [n, ...notes]; setNotes(u); setNewNote(''); await saveData('notes', u); showNotif('Message Transmitted', 'success'); }} className="bg-white text-black px-16 py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:scale-105 transition-transform shadow-[0_15px_40px_rgba(255,255,255,0.1)] text-xs">Transmit</button></div>
                 </div>
                 <div className="grid grid-cols-1 gap-8">
                    {notes.map((note, i) => (
                       <div key={note.id} className="glass-card rounded-[3rem] p-10 hover-lift animate-reveal" style={{animationDelay: `${i*0.05}s`, animationFillMode: 'forwards'}}>
                          <div className="flex justify-between items-center mb-6">
                             <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="text-xs font-black text-white uppercase tracking-widest">{note.user}</span>
                             </div>
                             <span className="text-[10px] text-gray-500 font-mono font-black">{formatDate(note.date)}</span>
                          </div>
                          <p className="text-2xl font-medium leading-relaxed text-gray-200">{note.text}</p>
                       </div>
                    ))}
                 </div>
              </div>
            )}
          </div>
          
          {/* VERSION FOOTER */}
          <div className="mt-32 text-center">
             <p className="text-[9px] font-black text-gray-800 uppercase tracking-[0.5em]">{CONFIG.CREDITS_TEXT}</p>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-6 animate-morph" onClick={() => setShowLogoutConfirm(false)}>
           <div className="glass-card rounded-[4rem] p-16 text-center max-w-md w-full border border-white/10" onClick={e => e.stopPropagation()}>
              <div className="w-24 h-24 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-8 shadow-inner"><IconWarning /></div>
              <h2 className="text-3xl font-black mb-6 tracking-tight">Terminate Session?</h2>
              <p className="text-gray-500 mb-10 font-bold text-sm leading-relaxed uppercase tracking-widest">Secure access will be revoked immediately.</p>
              <div className="flex gap-5">
                 <button onClick={handleLogout} className="flex-1 bg-red-600 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:scale-[1.03] transition-transform shadow-xl">Log Off</button>
                 <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 bg-white/5 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">Cancel</button>
              </div>
           </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-6 animate-morph" onClick={() => setShowUploadModal(false)}>
           <div className="glass-card rounded-[4rem] p-16 max-w-xl w-full border border-white/10" onClick={e => e.stopPropagation()}>
              <h2 className="text-4xl font-black mb-10 tracking-tight">Secure Upload</h2>
              <div className="relative group">
                 <input type="file" multiple onChange={async (e) => { 
                   const fl = e.target.files; if(!fl) return;
                   const pr = []; for(let i=0; i<fl.length; i++) {
                     const f = fl[i]; const r = new FileReader();
                     pr.push(new Promise(rs => { r.onload = ev => rs({ id: Date.now()+i, name: f.name, data: ev.target?.result as string, size: f.size, type: f.type, uploadDate: new Date().toISOString() }); r.readAsDataURL(f); }));
                   }
                   const res = await Promise.all(pr) as FileData[];
                   const u = [...(files[currentUser!] || []), ...res];
                   setFiles({...files, [currentUser!]: u}); await saveData(`files/${currentUser!}`, u);
                   setShowUploadModal(false); showNotif(`${res.length} assets encrypted`, 'success');
                 }} className="w-full bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] p-16 text-center cursor-pointer file:hidden hover:border-white/20 transition-all" />
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center mb-4"><IconUpload /></div>
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Drop multi-files here</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
