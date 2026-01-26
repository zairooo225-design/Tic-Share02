import React, { useState, useEffect, useRef } from 'react';
import { User, Users, FileData, Note, NotificationState, VaultItem } from './types.ts';
import { CONFIG, DEFAULT_USERS } from './constants.ts';
import { initFirebase, saveData } from './services/firebaseService.ts';
import { 
  IconUpload, IconDownload, IconX, IconUser, IconMessage, IconFile, 
  IconLogOut, IconEdit, IconArrowLeft, IconWarning, IconLink, IconEye, IconKey 
} from './components/Icons.tsx';
import { Notification } from './components/Notifications.tsx';
import { 
  ModalBackdrop, PreviewModal, UploadModal, LinkModal, ConfirmationModal 
} from './components/Modals.tsx';

// --- HELPERS ---
const formatSize = (bytes: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

const formatDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

const getFavicon = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch { return null; }
};

const FileCard = ({ file, onDownload, onDelete, onPreview, index, isNew, isInitialLoad }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: any) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4; 
    const rotateY = ((x - centerX) / centerX) * 4;
    setTransform(`perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`);
    setGlowPos({ x, y });
    setOpacity(1);
  };

  let animClass = '';
  if (isNew) {
    animClass = 'animate-fly-in';
  } else if (isInitialLoad) {
    animClass = 'animate-stagger-fade';
  }

  const delay = index * 0.05;
  const isLink = file.type === 'link';
  const favicon = isLink ? getFavicon(file.data) : null;

  const handleMainClick = (e: any) => {
    if (isLink) {
        window.open(file.data, '_blank');
    } else {
        onPreview();
    }
  };

  return (
    <div 
      ref={cardRef}
      onClick={handleMainClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setTransform('perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)'); setOpacity(0); }}
      className={`relative group rounded-[1.75rem] p-5 h-52 flex flex-col justify-between overflow-hidden transition-all duration-500 ease-out ${animClass} cursor-pointer`}
      style={{ 
        transform,
        animationDelay: isNew ? '0s' : `${delay}s`,
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
        willChange: 'transform'
      }}
    >
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-500" style={{ opacity, background: `radial-gradient(400px circle at ${glowPos.x}px ${glowPos.y}px, rgba(255,255,255,0.05), transparent 70%)` }} />
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] -mr-8 -mt-8 pointer-events-none transition-all duration-700 ${isLink ? 'bg-green-500/5 group-hover:bg-green-500/15' : 'bg-blue-500/5 group-hover:bg-blue-500/10'}`}></div>

      <div className="relative z-10">
         <div className="flex justify-between items-start mb-3">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white border border-white/5 transition-all duration-500 ${isLink ? 'bg-white/90 p-1' : 'bg-white/5'}`}>
                {isLink ? (
                  favicon ? <img src={favicon} className="w-full h-full object-contain" alt="icon" /> : <IconLink className="w-5 h-5 text-green-600" />
                ) : <IconFile className="w-5 h-5 opacity-60 group-hover:opacity-100" />}
             </div>
             {!isLink && (
                <button onClick={(e) => { e.stopPropagation(); onPreview(); }} className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/5 rounded-xl hover:bg-white hover:text-black transition-all duration-300 text-white/40 shadow-sm">
                    <IconEye className="w-4 h-4" />
                </button>
             )}
         </div>
         <h3 className="font-bold text-lg text-white line-clamp-1 mb-1 tracking-tight">{file.name}</h3>
         {file.note && <p className="text-xs text-gray-500 italic mb-1 line-clamp-1 opacity-70">"{file.note}"</p>}
         <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase opacity-60">{isLink ? 'Redirect' : formatSize(file.size)}</p>
      </div>

      <div className="flex gap-2 relative z-10 mt-auto opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
         {!isLink && (
             <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className="flex-1 bg-white/10 border border-white/5 text-white py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                Export
             </button>
         )}
         {isLink && (
             <button onClick={(e) => { e.stopPropagation(); window.open(file.data, '_blank'); }} className="flex-1 bg-green-500/10 border border-green-500/10 text-green-400 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all">
                Launch
             </button>
         )}
         <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-8 h-8 flex items-center justify-center bg-red-500/5 border border-red-500/10 text-red-500/60 rounded-xl hover:bg-red-500 hover:text-white transition-all">
            <IconX className="w-4 h-4" />
         </button>
      </div>
    </div>
  );
};

const App = () => {
  const [view, setView] = useState('loading');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [users, setUsers] = useState<Users>(DEFAULT_USERS);
  const [files, setFiles] = useState<Record<string, FileData[]>>({});
  const [notes, setNotes] = useState<Note[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  
  const [loginPassword, setLoginPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetKey, setResetKey] = useState('');
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPasswordReset, setNewPasswordReset] = useState('');
  const [confirmPasswordReset, setConfirmPasswordReset] = useState('');
  
  const [notification, setNotification] = useState<NotificationState>({ show: false, message: '', type: '' });
  const [showStorageWarning, setShowStorageWarning] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ type: '', id: null as any });
  const [deleteStep, setDeleteStep] = useState(1);
  const [showITShareLoading, setShowITShareLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);

  const [newFileIds, setNewFileIds] = useState(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [editingProfile, setEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState({ name: '', icon: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChange, setPasswordChange] = useState({ current: '', new: '', confirm: '' });
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [editNoteText, setEditNoteText] = useState('');

  const [vSite, setVSite] = useState('');
  const [vUser, setVUser] = useState('');
  const [vPass, setVPass] = useState('');
  const [visiblePassIds, setVisiblePassIds] = useState(new Set());
  const [visibleUserIds, setVisibleUserIds] = useState(new Set());

  useEffect(() => {
    initFirebase();
    const sessionUser = sessionStorage.getItem('currentUser');
    if (sessionUser) {
      setCurrentUser(sessionUser);
      loadFromFirebase();
      setView('files');
    } else {
      setTimeout(() => {
        loadFromFirebase();
        setTimeout(() => setView('login'), 1500);
      }, 1500);
    }
    setTimeout(() => setIsInitialLoad(false), 1500);
  }, []);

  useEffect(() => { 
    if (currentUser) {
        const userFiles = files[currentUser] || [];
        const totalBytes = userFiles.reduce((acc, file) => acc + (file.size || 0), 0);
        if ((totalBytes / (1024 * 1024 * 1024)) >= 0.80) setShowStorageWarning(true);
    }
  }, [currentUser, files]);

  useEffect(() => {
    if (newFileIds.size > 0) {
      const timer = setTimeout(() => {
        setNewFileIds(new Set());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [newFileIds]);

  const showNotif = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const loadFromFirebase = async () => {
    try {
      const db = (window as any).firebase.database();
      const [uSnap, fSnap, nSnap, vSnap] = await Promise.all([
        db.ref('users').once('value'),
        db.ref('files').once('value'),
        db.ref('notes').once('value'),
        db.ref('vault').once('value')
      ]);
      if (uSnap.exists()) setUsers(uSnap.val() as Users);
      if (fSnap.exists()) setFiles(fSnap.val() as Record<string, FileData[]>);
      if (nSnap.exists()) {
          const notesData = nSnap.val();
          setNotes((Object.values(notesData) as Note[]).sort((a: Note, b: Note) => b.id - a.id));
      }
      if (vSnap.exists() && currentUser) {
          const vaultData = vSnap.val()[currentUser];
          if (vaultData) setVaultItems(Object.values(vaultData) as VaultItem[]);
      }
    } catch (e) { console.error(e); }
  };

  const handleLogin = () => {
    if (!selectedUser) return;
    if (users[selectedUser].password === loginPassword) {
      setCurrentUser(selectedUser);
      sessionStorage.setItem('currentUser', selectedUser);
      loadFromFirebase(); 
      setLoginPassword('');
      setSelectedUser(null);
      setView('files');
      showNotif('Access Authorized', 'success');
    } else {
      showNotif('Incorrect Passkey', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
    setView('login');
    setShowLogoutConfirm(false);
  };

  const handleFilesSelected = (fileList: FileList | null) => {
      if (!currentUser || !fileList || !fileList.length) return;
      const filesArray = Array.from(fileList);
      const validFiles = filesArray.filter(f => f.size <= 500 * 1024 * 1024);
      if (validFiles.length < filesArray.length) {
          showNotif('Payload Limit Exceeded (>500MB)', 'error');
      }
      if (validFiles.length > 0) {
          setPendingFiles(validFiles);
          setShowUploadModal(true);
      }
  };

  const processUploads = async (metadata: any[]) => {
    setShowUploadModal(false);
    if (!currentUser || !pendingFiles.length) return;

    const processedFiles: FileData[] = [];
    const ids = new Set();

    await Promise.all(pendingFiles.map((file, i) => new Promise<void>((resolve) => {
       const reader = new FileReader();
       reader.onload = (ev) => {
         const id = Date.now() + Math.random(); 
         ids.add(id);
         processedFiles.push({
           id: id,
           name: metadata[i].name || file.name,
           note: metadata[i].note || '',
           type: file.type,
           size: file.size,
           data: ev.target?.result as string,
           uploadDate: new Date().toISOString()
         });
         resolve();
       };
       reader.readAsDataURL(file);
    })));

    if (processedFiles.length > 0) {
       const uFiles = files[currentUser] || [];
       const newUserFiles = [...uFiles, ...processedFiles];
       setFiles({ ...files, [currentUser]: newUserFiles });
       setNewFileIds(ids); 
       try { 
         await saveData(`files/${currentUser}`, newUserFiles); 
         showNotif(`${processedFiles.length} Object(s) Stored`, 'success'); 
       } catch (err) { 
         showNotif('Encryption Failed', 'error'); 
       }
    }
    setPendingFiles([]);
  };

  const handleAddLink = async (linkData: any) => {
      setShowLinkModal(false);
      if(!currentUser) return;
      const id = Date.now() + Math.random();
      const newLink: FileData = {
          id,
          name: linkData.name,
          note: linkData.note,
          type: 'link',
          size: 0,
          data: linkData.url,
          uploadDate: new Date().toISOString()
      };
      const uFiles = files[currentUser] || [];
      const newUserFiles = [...uFiles, newLink];
      setFiles({ ...files, [currentUser]: newUserFiles });
      setNewFileIds(new Set([id]));
      try {
          await saveData(`files/${currentUser}`, newUserFiles);
          showNotif('Pointer Stored', 'success');
      } catch {
          showNotif('Storage Failed', 'error');
      }
  };

  const handleAddVaultItem = async () => {
    if (!currentUser || !vSite || !vUser || !vPass) return;
    const item: VaultItem = {
      id: Date.now(),
      site: vSite,
      username: vUser,
      pass: vPass,
      date: new Date().toISOString()
    };
    const updated = [...vaultItems, item];
    setVaultItems(updated);
    setVSite(''); setVUser(''); setVPass('');
    try {
      await saveData(`vault/${currentUser}/${item.id}`, item);
      showNotif('Credentials Isolated', 'success');
    } catch { showNotif('Vault Error', 'error'); }
  };

  const deleteVaultItem = async (id: number) => {
    if (!currentUser) return;
    const updated = vaultItems.filter(v => v.id !== id);
    setVaultItems(updated);
    try {
      const db = (window as any).firebase.database();
      await db.ref(`vault/${currentUser}/${id}`).remove();
      showNotif('Data Purged', 'success');
    } catch { showNotif('Deletion Blocked', 'error'); }
  };

  const togglePassVisibility = (id: number) => {
    const newSet = new Set(visiblePassIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setVisiblePassIds(newSet);
  };

  const toggleUserVisibility = (id: number) => {
    const newSet = new Set(visibleUserIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setVisibleUserIds(newSet);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showNotif(`${label} Copied`, 'success');
  };

  const handleDeleteRequest = (type: string, id: any) => { setDeleteTarget({ type, id }); setDeleteStep(1); setShowDeleteConfirm(true); };
  const proceedDelete = async () => {
    if (deleteStep === 1) { setDeleteStep(2); return; }
    if (!currentUser || !deleteTarget.id) return;
    if (deleteTarget.type === 'file') {
      const uFiles = files[currentUser] || [];
      const newUserFiles = uFiles.filter(f => f.id !== deleteTarget.id);
      setFiles({ ...files, [currentUser]: newUserFiles });
      try { await saveData(`files/${currentUser}`, newUserFiles); showNotif('Payload Destroyed', 'success'); } catch { showNotif('Failure', 'error'); }
    } else if (deleteTarget.type === 'note') {
      const updated = notes.filter(n => n.id !== deleteTarget.id);
      setNotes(updated);
      try { await saveData('notes', updated); showNotif('Log Erased', 'success'); } catch { showNotif('Failure', 'error'); }
    }
    setShowDeleteConfirm(false); setDeleteTarget({ type: '', id: null }); setDeleteStep(1);
  };

  const handleAddNote = async () => {
    if (!currentUser || !newNote.trim()) return;
    const note: Note = { id: Date.now(), userId: currentUser, user: users[currentUser].name, text: newNote, date: new Date().toISOString() };
    const updated = [note, ...notes];
    setNotes(updated); setNewNote('');
    try { await saveData('notes', updated); showNotif('Log Injected', 'success'); } catch { showNotif('Transmission Failed', 'error'); }
  };

  const handleUpdateNote = async () => {
    const updated = notes.map(n => n.id === editingNote ? { ...n, text: editNoteText } : n);
    setNotes(updated); setEditingNote(null);
    try { await saveData('notes', updated); showNotif('Log Modified', 'success'); } catch { showNotif('Update Denied', 'error'); }
  };

  const handleProfileSave = async () => {
    if (!currentUser) return;
    if (tempProfile.name.length > CONFIG.MAX_NAME_LENGTH) { showNotif('Identity String Oversize', 'error'); return; }
    const updated = { ...users, [currentUser]: { ...users[currentUser], ...tempProfile } };
    setUsers(updated); setEditingProfile(false);
    await saveData('users', updated); showNotif('Profile Updated', 'success');
  };

  const handleChangePassword = async () => {
    if (!currentUser) return;
    const user = users[currentUser];
    if (user.password !== passwordChange.current) { showNotif('Verification Failed', 'error'); return; }
    if (passwordChange.new !== passwordChange.confirm) { showNotif('Bit Mismatch', 'error'); return; }
    const updated = { ...users, [currentUser]: { ...users[currentUser], password: passwordChange.new } };
    setUsers(updated); setChangingPassword(false); setPasswordChange({ current: '', new: '', confirm: '' });
    await saveData('users', updated); showNotif('Security Hardened', 'success');
  };

  const handlePasswordReset = async () => {
    if (!resetUserId) return;
    if (resetKey !== CONFIG.SPECIAL_KEY) { showNotif('Invalid Override Key', 'error'); return; }
    if (newPasswordReset !== confirmPasswordReset) { showNotif('Mismatch', 'error'); return; }
    const updated = { ...users, [resetUserId]: { ...users[resetUserId], password: newPasswordReset } };
    setUsers(updated); await saveData('users', updated); setShowPasswordReset(false); setResetUserId(null); showNotif('Access Restored', 'success');
  };

  if (view === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-black to-purple-950/20 animate-pulse"></div>
        <div className="text-center relative z-10 animate-fade-in px-6">
          <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter animate-glow uppercase italic">PRIVATE CLOUD</h1>
          <div className="w-16 h-1 bg-white/5 mx-auto rounded-full overflow-hidden mt-6">
            <div className="w-full h-full bg-white/40 animate-shuttle"></div>
          </div>
        </div>
      </div>
    );
  }

  if (showITShareLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center animate-fade-in p-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20"><div className="absolute top-0 w-full h-1 bg-blue-500/50 animate-scan"></div></div>
        <div className="z-10 text-center animate-morph w-full max-w-4xl">
          <div className="relative mb-8 inline-block rounded-3xl overflow-hidden shadow-2xl border border-white/5 w-full max-w-2xl mx-auto">
            <img src={CONFIG.ITSHARE_LOADING_IMAGE_URL} alt="Loading" className="w-full h-auto object-contain" />
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white mb-3 tracking-tighter animate-glow">BRIDGE SYNCING...</h2>
          <p className="text-blue-500 font-mono tracking-widest text-xs opacity-60 uppercase">Connecting to ITSHARE DB</p>
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="perspective-stage relative overflow-hidden">
        <Notification notification={notification} />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/[0.03] rounded-full blur-[100px]"></div>

        {showPasswordReset ? (
          <div className="w-full max-w-sm animate-flip-open z-10">
            <div className="glass-card rounded-[2rem] p-6 md:p-10 border border-white/5 shadow-2xl">
              <button onClick={() => { setShowPasswordReset(false); setResetKey(''); }} className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-all font-bold text-[10px] uppercase tracking-widest group"><IconArrowLeft className="w-4 h-4" /> Return</button>
              <h2 className="text-2xl font-black text-white mb-8 tracking-tight uppercase italic">Bypass</h2>
              <div className="space-y-4">
                <input type="text" placeholder="ADMIN MASTER KEY" value={resetKey} onChange={e => setResetKey(e.target.value)} className="input-premium w-full rounded-xl px-5 py-4 outline-none font-bold text-white uppercase text-xs" />
                <input type="password" placeholder="NEW SEQUENCE" value={newPasswordReset} onChange={e => setNewPasswordReset(e.target.value)} className="input-premium w-full rounded-xl px-5 py-4 outline-none font-bold text-white uppercase text-xs" />
                <input type="password" placeholder="VERIFY SEQUENCE" value={confirmPasswordReset} onChange={e => setConfirmPasswordReset(e.target.value)} className="input-premium w-full rounded-xl px-5 py-4 outline-none font-bold text-white uppercase text-xs" />
              </div>
              <button onClick={handlePasswordReset} className="w-full mt-8 bg-white text-black rounded-2xl py-4 font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl">Execute Override</button>
            </div>
          </div>
        ) : selectedUser ? (
          <div className="w-full max-w-sm z-10">
            <div className="animate-flip-open">
              <div className="glass-card rounded-[2rem] p-6 md:p-10 border border-white/5 shadow-2xl">
                <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-all font-bold text-[10px] uppercase tracking-widest group"><IconArrowLeft className="w-4 h-4" /> Exit</button>
                <div className="flex flex-col items-center mb-8">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/5 shadow-xl mb-6">
                    <img src={users[selectedUser].icon} alt="" className="w-full h-full object-cover" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">{users[selectedUser].name}</h2>
                </div>
                <input type="password" placeholder="Passkey" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleLogin()} autoFocus className="input-premium w-full rounded-2xl px-6 py-4 text-lg outline-none font-black text-center tracking-[0.4em] mb-6 text-white uppercase shadow-inner" />
                <button onClick={handleLogin} className="w-full bg-white text-black rounded-2xl py-4 font-black text-[10px] uppercase tracking-[0.3em] transition-all mb-4">Authenticate</button>
                <button onClick={() => { setResetUserId(selectedUser); setShowPasswordReset(true); setSelectedUser(null); }} className="w-full text-gray-600 font-bold uppercase text-[9px] tracking-widest hover:text-red-500 transition-colors">Emergency Restore</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-5xl animate-fade-in z-10 p-4 relative">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              <div className="lg:w-1/2 animate-fly-in hidden lg:block">
                <img src={CONFIG.LOBBY_IMAGE_URL} alt="Lobby" className="rounded-[2rem] border border-white/5 shadow-2xl w-full rotate-2 hover:rotate-0 transition-all duration-1000 ease-out hover:scale-[1.02]" />
              </div>
              <div className="lg:w-1/2 w-full">
                <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase italic leading-none">PRIVATE<br/><span className="text-gray-600">CLOUD</span></h1>
                <p className="text-sm text-gray-500 mb-8 font-bold border-l-2 border-blue-500 pl-6 uppercase tracking-widest">Vault Infrastructure</p>
                <div className="grid gap-4">
                  {(Object.entries(users) as [string, User][]).map(([uid, u], i) => (
                    <div key={uid} onClick={() => setSelectedUser(uid)} className="group glass p-4 rounded-[1.5rem] cursor-pointer flex items-center gap-6 hover-morph border border-white/5" style={{ animationDelay: `${0.1 + (i * 0.1)}s` }}>
                      <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 group-hover:border-blue-500 transition-all duration-500 flex-shrink-0 shadow-lg">
                        <img src={u.icon} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-black text-white truncate tracking-tight uppercase italic">{u.name}</h2>
                        <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">Secure Sector</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all flex-shrink-0">
                        <svg className="w-5 h-5 transform -rotate-45 group-hover:rotate-0 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-20 left-0 right-0 text-center text-gray-700 font-bold uppercase text-[9px] tracking-[0.6em]">
               {CONFIG.CREDITS_TEXT}
            </div>
          </div>
        )}
      </div>
    );
  }

  const currentUserData = currentUser ? users[currentUser] : null;
  if (!currentUserData) return null;
  const showEditModal = editingProfile || changingPassword;

  return (
    <div className="min-h-screen bg-black p-4 md:p-8 relative selection:bg-blue-500 selection:text-white">
      <Notification notification={notification} />
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/[0.01] rounded-full blur-[100px]"></div>
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/[0.01] rounded-full blur-[100px]"></div>
      </div>

      {!showEditModal && (
        <button onClick={() => { setShowITShareLoading(true); setTimeout(() => { window.location.href = CONFIG.ITSHARE_URL }, 3000); }} className="fixed top-4 left-4 md:top-6 md:left-6 z-50 glass text-white px-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-white hover:text-black transition-all animate-glow">
          BRIDGE
        </button>
      )}

      <div className="max-w-6xl mx-auto relative z-10 pt-16 md:pt-20">
        <div className="glass-card rounded-[2rem] p-5 md:p-8 shadow-2xl mb-8 animate-fade-in flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 text-center md:text-left">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/5 shadow-xl">
              <img src={currentUserData.icon} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1 uppercase italic">{currentUserData.name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 font-bold bg-white/5 px-4 py-1.5 rounded-full text-[8px] uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                {(files[currentUser!] || []).length} Encrypted Streams
              </div>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => setView('vault')} className={`p-3.5 rounded-xl border transition-all duration-300 ${view === 'vault' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white hover:bg-white/10'}`}><IconKey className="w-5 h-5" /></button>
             <button onClick={() => { setTempProfile({ name: currentUserData.name, icon: currentUserData.icon }); setEditingProfile(true); }} className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white hover:text-black transition-all duration-300 text-white"><IconUser className="w-5 h-5" /></button>
             <button onClick={() => { if (view === 'vault') setView('files'); else setView(view === 'files' ? 'notes' : 'files'); }} className={`p-3.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white hover:text-black transition-all duration-300 text-white`}>{view === 'files' ? <IconMessage className="w-5 h-5" /> : <IconFile className="w-5 h-5" />}</button>
             <button onClick={() => setShowLogoutConfirm(true)} className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"><IconLogOut className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="animate-fade-in pb-12">
          {view === 'files' && (
            <div className="space-y-8">
              <div className="animate-stagger-fade">
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} 
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }} 
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files); }} 
                    className={`relative group rounded-[2rem] border-2 border-dashed transition-all duration-500 p-8 md:p-14 flex flex-col items-center justify-center text-center cursor-pointer glass shadow-xl ${isDragging ? 'border-blue-500 bg-blue-500/5 scale-[1.01]' : 'border-white/5 hover:border-white/20'}`}
                  >
                    <input type="file" multiple onChange={(e) => handleFilesSelected(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                    <div className={`w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center mb-6 shadow-xl transition-all duration-500 ${isDragging ? 'scale-110 bg-blue-500 text-white' : ''}`}>
                       <div className="w-6 h-6"><IconUpload /></div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-white mb-2 tracking-tight uppercase italic">{isDragging ? 'SYNCING...' : 'DEPOSIT DATA'}</h3>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{isDragging ? 'Release Now' : 'Drag or Click'}</p>
                    <div className="mt-6 pointer-events-none">
                        <button className="inline-flex items-center bg-white/5 border border-white/5 rounded-xl px-6 py-2.5 pointer-events-auto hover:bg-white hover:text-black transition-all shadow-md" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLinkModal(true); }}>
                            <IconLink className="w-4 h-4 mr-2" /> <span className="text-[9px] font-black uppercase tracking-widest">Add Link</span>
                        </button>
                    </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(files[currentUser!] || []).map((file, i) => (
                   <FileCard 
                     key={file.id} 
                     file={file} 
                     index={i}
                     isNew={newFileIds.has(file.id)}
                     isInitialLoad={isInitialLoad}
                     onDownload={() => { const link = document.createElement('a'); link.href = file.data; link.download = file.name; link.click(); showNotif('Decrypted', 'success'); }}
                     onDelete={() => handleDeleteRequest('file', file.id)}
                     onPreview={() => setPreviewFile(file)}
                   />
                ))}
                {(files[currentUser!] || []).length === 0 && (
                  <div className="col-span-full py-20 text-center text-gray-700 glass rounded-[2rem] border-dashed border-white/5">
                    <p className="text-sm font-black uppercase tracking-[0.5em] animate-pulse">EMPTY SECTOR</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'notes' && (
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">
               <div className="lg:col-span-4 glass-card rounded-[2rem] p-6 w-full animate-stagger-fade shadow-xl border border-white/5">
                  <h3 className="text-xl font-black mb-6 text-white uppercase italic tracking-tight">Log Stream</h3>
                  <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Encrypted string..." className="w-full bg-black/40 border border-white/5 focus:border-blue-500/20 rounded-xl p-5 resize-none outline-none transition-all mb-6 text-sm text-white placeholder-gray-700 min-h-[120px] shadow-inner" />
                  <button onClick={handleAddNote} className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md">Inject</button>
               </div>
               <div className="lg:col-span-8 w-full space-y-5">
                 {notes.length === 0 ? (
                    <div className="glass border-dashed rounded-[2rem] py-16 flex items-center justify-center text-gray-700 font-bold uppercase tracking-widest text-xs">NULL LOGS</div>
                 ) : (
                    notes.map((note, i) => (
                      <div key={note.id} className={`p-5 rounded-[1.5rem] animate-stagger-fade transition-all border group ${note.userId === currentUser ? 'bg-white text-black ml-8 border-white shadow-lg' : 'bg-white/[0.03] text-white mr-8 border-white/5 shadow-md'}`} style={{ animationDelay: `${i * 0.05}s` }}>
                         <div className="flex items-center justify-between mb-2">
                           <span className="font-bold text-[8px] opacity-40 uppercase tracking-widest">{note.user}</span>
                           <span className="text-[7px] font-bold opacity-30 uppercase font-mono tracking-widest">{formatDate(note.date)}</span>
                         </div>
                         {editingNote === note.id ? (
                           <div>
                             <textarea value={editNoteText} onChange={e => setEditNoteText(e.target.value)} className="w-full bg-gray-50 text-black border border-black/10 rounded-xl p-4 mb-3 outline-none font-bold text-sm" autoFocus />
                             <div className="flex justify-end gap-3">
                               <button onClick={() => setEditingNote(null)} className="px-4 py-2 text-[8px] font-black uppercase text-gray-400">Abort</button>
                               <button onClick={handleUpdateNote} className="px-5 py-2 text-[8px] font-black bg-black text-white rounded-lg uppercase">Save</button>
                             </div>
                           </div>
                         ) : (
                           <p className="text-sm font-bold whitespace-pre-wrap leading-relaxed tracking-tight">{note.text}</p>
                         )}
                         {note.userId === currentUser && !editingNote && (
                           <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-black/5 opacity-0 group-hover:opacity-100 transition-all">
                             <button onClick={() => { setEditingNote(note.id); setEditNoteText(note.text); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><IconEdit className="w-4 h-4" /></button>
                             <button onClick={() => handleDeleteRequest('note', note.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"><IconX className="w-4 h-4" /></button>
                           </div>
                         )}
                      </div>
                    ))
                 )}
               </div>
            </div>
          )}

          {view === 'vault' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
              <div className="lg:col-span-4 glass-card rounded-[2rem] p-6 border border-white/5 shadow-xl w-full">
                <h3 className="text-xl font-black mb-8 text-white uppercase tracking-tight italic">Vault Entry</h3>
                <div className="space-y-5 mb-8">
                   <div className="group">
                      <p className="text-[8px] text-gray-600 uppercase tracking-widest mb-1.5 ml-1 font-bold">Target Service</p>
                      <input type="text" placeholder="Service" value={vSite} onChange={e => setVSite(e.target.value)} className="input-premium w-full rounded-xl p-4 outline-none font-bold text-white text-sm uppercase" />
                   </div>
                   <div className="group">
                      <p className="text-[8px] text-gray-600 uppercase tracking-widest mb-1.5 ml-1 font-bold">Identity</p>
                      <input type="text" placeholder="Username" value={vUser} onChange={e => setVUser(e.target.value)} className="input-premium w-full rounded-xl p-4 outline-none font-bold text-white text-sm" />
                   </div>
                   <div className="group">
                      <p className="text-[8px] text-gray-600 uppercase tracking-widest mb-1.5 ml-1 font-bold">Passkey</p>
                      <input type="password" placeholder="Sequence" value={vPass} onChange={e => setVPass(e.target.value)} className="input-premium w-full rounded-xl p-4 outline-none font-bold text-white text-sm" />
                   </div>
                </div>
                <button onClick={handleAddVaultItem} className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md">Store Record</button>
              </div>
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                 {vaultItems.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-700 glass rounded-[2rem] border-dashed border-white/5 uppercase tracking-widest font-black text-xs">Sector Empty</div>
                 ) : (
                   vaultItems.map((item, i) => (
                     <div key={item.id} className="glass p-6 rounded-[1.75rem] border border-white/5 relative group hover-morph shadow-lg" style={{ animationDelay: `${i * 0.08}s` }}>
                        <button onClick={() => deleteVaultItem(item.id)} className="absolute top-4 right-4 text-red-500/20 opacity-0 group-hover:opacity-100 transition-all p-2 hover:text-red-500">
                           <IconX className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                              <IconKey className="w-5 h-5 text-blue-500" />
                           </div>
                           <h4 className="text-xl font-black text-white truncate uppercase italic">{item.site}</h4>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="space-y-1">
                              <div className="flex justify-between items-center px-1">
                                 <p className="text-[7px] text-gray-600 uppercase tracking-widest font-bold">Identity</p>
                                 <button onClick={() => copyToClipboard(item.username, 'ID')} className="text-[7px] text-blue-500 font-bold hover:text-white transition-colors">Copy</button>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-black/40 p-3 rounded-lg font-mono text-[9px] border border-white/5 truncate text-white/60">
                                  {visibleUserIds.has(item.id) ? item.username : '••••••••'}
                                </div>
                                <button onClick={() => toggleUserVisibility(item.id)} className={`p-2.5 rounded-lg border transition-all ${visibleUserIds.has(item.id) ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white/20'}`}>
                                   <IconEye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                           </div>

                           <div className="space-y-1">
                              <div className="flex justify-between items-center px-1">
                                 <p className="text-[7px] text-gray-600 uppercase tracking-widest font-bold">Passkey</p>
                                 <button onClick={() => copyToClipboard(item.pass, 'Key')} className="text-[7px] text-blue-500 font-bold hover:text-white transition-colors">Copy</button>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-black/40 p-3 rounded-lg font-mono text-[9px] border border-white/5 truncate text-white/60">
                                  {visiblePassIds.has(item.id) ? item.pass : '••••••••'}
                                </div>
                                <button onClick={() => togglePassVisibility(item.id)} className={`p-2.5 rounded-lg border transition-all ${visiblePassIds.has(item.id) ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white/20'}`}>
                                   <IconEye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                           </div>
                        </div>
                     </div>
                   ))
                 )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showLogoutConfirm && <ConfirmationModal title="Sever?" message="Terminate session?" confirmText="Log Off" onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} isDanger />}
      {showDeleteConfirm && <ConfirmationModal title="Purge?" message="Destroy permanent payload?" confirmText="Obliterate" onConfirm={proceedDelete} onCancel={() => { setShowDeleteConfirm(false); setDeleteStep(1); }} isDanger />}
      
      {showUploadModal && <UploadModal pendingFiles={pendingFiles} onClose={() => { setShowUploadModal(false); setPendingFiles([]); }} onUpload={processUploads} />}
      {showLinkModal && <LinkModal onClose={() => setShowLinkModal(false)} onAdd={handleAddLink} />}
      {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

      {showEditModal && (
        <ModalBackdrop onClose={() => { setEditingProfile(false); setChangingPassword(false); }}>
           {changingPassword ? (
             <div className="animate-morph">
               <h2 className="text-xl font-black mb-6 uppercase italic">Protocol</h2>
               <div className="space-y-4 mb-8">
                 <input type="password" placeholder="Current" value={passwordChange.current} onChange={e => setPasswordChange({...passwordChange, current: e.target.value})} className="input-premium w-full rounded-xl px-5 py-3 font-bold text-xs" />
                 <input type="password" placeholder="New Sequence" value={passwordChange.new} onChange={e => setPasswordChange({...passwordChange, new: e.target.value})} className="input-premium w-full rounded-xl px-5 py-3 font-bold text-xs" />
                 <input type="password" placeholder="Verify" value={passwordChange.confirm} onChange={e => setPasswordChange({...passwordChange, confirm: e.target.value})} className="input-premium w-full rounded-xl px-5 py-3 font-bold text-xs" />
               </div>
               <div className="flex gap-3">
                 <button onClick={handleChangePassword} className="flex-1 bg-white text-black py-4 rounded-xl font-black text-[9px] uppercase tracking-widest">Modify</button>
                 <button onClick={() => setChangingPassword(false)} className="flex-1 bg-transparent border border-white/10 py-4 rounded-xl font-black text-[9px] uppercase">Abort</button>
               </div>
             </div>
           ) : (
             <div className="animate-morph">
                <h2 className="text-xl font-black mb-8 uppercase italic">Identity</h2>
                <div className="flex justify-center mb-8">
                   <div className="relative group/avatar">
                     <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/5 shadow-xl group-hover/avatar:border-blue-500 transition-all duration-500">
                       <img src={tempProfile.icon} alt="" className="w-full h-full object-cover" />
                     </div>
                     <label className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-full cursor-pointer font-bold text-[8px] uppercase tracking-widest backdrop-blur-md">
                       Upload
                       <input type="file" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTempProfile({...tempProfile, icon: ev.target?.result as string}); r.readAsDataURL(f); } }} className="hidden" />
                     </label>
                   </div>
                </div>
                <input type="text" value={tempProfile.name} onChange={e => setTempProfile({...tempProfile, name: e.target.value})} maxLength={CONFIG.MAX_NAME_LENGTH} className="input-premium w-full p-4 rounded-xl mb-2 font-black text-center text-xl uppercase tracking-tight" />
                <p className="text-[7px] text-center text-gray-600 mb-8 font-bold uppercase tracking-widest">{tempProfile.name.length}/{CONFIG.MAX_NAME_LENGTH}</p>
                <div className="flex gap-3">
                   <button onClick={handleProfileSave} className="flex-1 bg-white text-black py-4 rounded-xl font-black text-[9px] uppercase tracking-widest">Confirm</button>
                   <button onClick={() => { setEditingProfile(false); setChangingPassword(true); }} className="flex-1 bg-transparent border border-white/10 py-4 rounded-xl font-black text-[9px] uppercase">Security</button>
                </div>
             </div>
           )}
        </ModalBackdrop>
      )}
    </div>
  );
};

export default App;