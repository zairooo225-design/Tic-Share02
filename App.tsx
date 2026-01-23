import React, { useState, useEffect, useRef } from 'react';
import { User, Users, FileData, Note, NotificationState, VaultItem } from './types';
import { CONFIG, DEFAULT_USERS } from './constants';
import { initFirebase, dbRef, saveData } from './services/firebaseService';
import { 
  IconUpload, IconDownload, IconX, IconUser, IconMessage, IconFile, 
  IconLogOut, IconEdit, IconArrowLeft, IconWarning, IconLink, IconEye, IconPlus, IconKey 
} from './components/Icons';
import { Notification } from './components/Notifications';
import { 
  ModalBackdrop, PreviewModal, UploadModal, LinkModal, ConfirmationModal 
} from './components/Modals';

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
    // Using a more robust favicon service to prevent "Sony icon" fallback bugs
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
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
    const rotateX = ((y - centerY) / centerY) * -5; 
    const rotateY = ((x - centerX) / centerX) * 5;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`);
    setGlowPos({ x, y });
    setOpacity(1);
  };

  let animClass = '';
  if (isNew) {
    animClass = 'animate-fly-in';
  } else if (isInitialLoad) {
    animClass = 'animate-slide-up';
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
      onMouseLeave={() => { setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'); setOpacity(0); }}
      className={`relative group rounded-[2rem] p-6 h-60 flex flex-col justify-between overflow-hidden transition-all duration-500 ease-out ${animClass} cursor-pointer`}
      style={{ 
        transform,
        animationDelay: isNew ? '0s' : `${delay}s`,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
        willChange: 'transform'
      }}
    >
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-500" style={{ opacity, background: `radial-gradient(400px circle at ${glowPos.x}px ${glowPos.y}px, rgba(255,255,255,0.06), transparent 60%)` }} />
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-colors duration-700 ${isLink ? 'bg-green-500/10 group-hover:bg-green-500/20' : 'bg-gradient-to-br from-blue-500/5 to-purple-500/5 group-hover:bg-blue-500/10'}`}></div>

      <div className="relative z-10">
         <div className="flex justify-between items-start mb-4">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-500 ${isLink ? 'bg-white p-1 overflow-hidden' : 'bg-gradient-to-br from-white/10 to-white/5'}`}>
                {isLink ? (
                  favicon ? <img src={favicon} className="w-full h-full object-contain" alt="icon" /> : <IconLink className="w-6 h-6 text-green-400" />
                ) : <IconFile className="w-6 h-6 opacity-80 group-hover:opacity-100" />}
             </div>
             {!isLink && (
                <button onClick={(e) => { e.stopPropagation(); onPreview(); }} className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/5 rounded-xl hover:bg-white hover:text-black transition-all text-white/70">
                    <IconEye />
                </button>
             )}
         </div>
         <h3 className="font-bold text-xl text-white line-clamp-1 mb-1 tracking-tight">{file.name}</h3>
         {file.note && <p className="text-xs text-gray-500 italic mb-1 line-clamp-1">"{file.note}"</p>}
         <p className="text-sm text-gray-400 font-medium font-mono">{isLink ? 'Secure Link' : formatSize(file.size)}</p>
      </div>

      <div className="flex gap-3 relative z-10 mt-auto opacity-80 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
         {!isLink && (
             <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className="flex-1 bg-white/10 border border-white/10 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 backdrop-blur-md">
                <IconDownload className="w-4 h-4" /> <span className="hidden sm:inline">Save</span>
             </button>
         )}
         {isLink && (
             <button onClick={(e) => { e.stopPropagation(); window.open(file.data, '_blank'); }} className="flex-1 bg-green-500/10 border border-green-500/20 text-green-400 py-2.5 rounded-xl font-bold text-sm hover:bg-green-500 hover:text-black transition-all flex items-center justify-center gap-2 backdrop-blur-md">
                <IconLink className="w-4 h-4" /> <span className="hidden sm:inline">Visit</span>
             </button>
         )}
         <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-10 h-10 flex items-center justify-center bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all backdrop-blur-md">
            <IconX className="w-5 h-5" />
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

  // Vault form state
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
        setTimeout(() => setView('login'), 2500);
      }, 2500);
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
      }, 2000);
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
      setView('files');
      loadFromFirebase(); 
      setLoginPassword('');
      setSelectedUser(null);
      showNotif('Access Granted', 'success');
    } else {
      showNotif('Access Denied', 'error');
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
          showNotif('Some files too large (>500MB)', 'error');
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
         showNotif(`${processedFiles.length} Item(s) Securely Stored`, 'success'); 
       } catch (err) { 
         showNotif('Upload Failed', 'error'); 
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
          showNotif('Secure Link Added', 'success');
      } catch {
          showNotif('Link Save Failed', 'error');
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
      showNotif('Credentials Secured', 'success');
    } catch { showNotif('Vault Save Failed', 'error'); }
  };

  const deleteVaultItem = async (id: number) => {
    if (!currentUser) return;
    const updated = vaultItems.filter(v => v.id !== id);
    setVaultItems(updated);
    try {
      const db = (window as any).firebase.database();
      await db.ref(`vault/${currentUser}/${id}`).remove();
      showNotif('Record Erased', 'success');
    } catch { showNotif('Erasure Failed', 'error'); }
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
    showNotif(`${label} Copied!`, 'success');
  };

  const handleDeleteRequest = (type: string, id: any) => { setDeleteTarget({ type, id }); setDeleteStep(1); setShowDeleteConfirm(true); };
  const proceedDelete = async () => {
    if (deleteStep === 1) { setDeleteStep(2); return; }
    if (!currentUser || !deleteTarget.id) return;
    if (deleteTarget.type === 'file') {
      const uFiles = files[currentUser] || [];
      const newUserFiles = uFiles.filter(f => f.id !== deleteTarget.id);
      setFiles({ ...files, [currentUser]: newUserFiles });
      try { await saveData(`files/${currentUser}`, newUserFiles); showNotif('Item Erased', 'success'); } catch { showNotif('Delete Failed', 'error'); }
    } else if (deleteTarget.type === 'note') {
      const updated = notes.filter(n => n.id !== deleteTarget.id);
      setNotes(updated);
      try { await saveData('notes', updated); showNotif('Item Erased', 'success'); } catch { showNotif('Delete Failed', 'error'); }
    }
    setShowDeleteConfirm(false); setDeleteTarget({ type: '', id: null }); setDeleteStep(1);
  };

  const handleAddNote = async () => {
    if (!currentUser || !newNote.trim()) return;
    const note: Note = { id: Date.now(), userId: currentUser, user: users[currentUser].name, text: newNote, date: new Date().toISOString() };
    const updated = [note, ...notes];
    setNotes(updated); setNewNote('');
    try { await saveData('notes', updated); showNotif('Message Encrypted', 'success'); } catch { showNotif('Error', 'error'); }
  };

  const handleUpdateNote = async () => {
    const updated = notes.map(n => n.id === editingNote ? { ...n, text: editNoteText } : n);
    setNotes(updated); setEditingNote(null);
    try { await saveData('notes', updated); showNotif('Record Updated', 'success'); } catch { showNotif('Update Failed', 'error'); }
  };

  const handleProfileSave = async () => {
    if (!currentUser) return;
    if (tempProfile.name.length > CONFIG.MAX_NAME_LENGTH) { showNotif('Name too long', 'error'); return; }
    const updated = { ...users, [currentUser]: { ...users[currentUser], ...tempProfile } };
    setUsers(updated); setEditingProfile(false);
    await saveData('users', updated); showNotif('Identity Updated', 'success');
  };

  const handleChangePassword = async () => {
    if (!currentUser) return;
    const user = users[currentUser];
    if (user.password !== passwordChange.current) { showNotif('Auth Failed', 'error'); return; }
    if (passwordChange.new !== passwordChange.confirm) { showNotif('Mismatch', 'error'); return; }
    const updated = { ...users, [currentUser]: { ...users[currentUser], password: passwordChange.new } };
    setUsers(updated); setChangingPassword(false); setPasswordChange({ current: '', new: '', confirm: '' });
    await saveData('users', updated); showNotif('Security Updated', 'success');
  };

  const handlePasswordReset = async () => {
    if (!resetUserId) return;
    if (resetKey !== CONFIG.SPECIAL_KEY) { showNotif('Invalid Key', 'error'); return; }
    if (newPasswordReset !== confirmPasswordReset) { showNotif('Mismatch', 'error'); return; }
    const updated = { ...users, [resetUserId]: { ...users[resetUserId], password: newPasswordReset } };
    setUsers(updated); await saveData('users', updated); setShowPasswordReset(false); setResetUserId(null); showNotif('Access Restored', 'success');
  };

  if (view === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20 animate-pulse"></div>
        <div className="text-center relative z-10 animate-morph px-4">
          <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-white mb-6 tracking-tighter animate-glow">PRIVATE CLOUD</h1>
          <div className="w-20 h-1 bg-white/20 mx-auto rounded-full overflow-hidden mt-6">
            <div className="w-full h-full bg-white animate-[translateX_1.5s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (showITShareLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center animate-morph p-8 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30"><div className="absolute top-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_#3b82f6] animate-scan"></div></div>
        <div className="z-10 text-center animate-morph w-full max-w-4xl">
          <div className="relative mb-8 inline-block rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.5)] border-2 border-blue-500/30 w-full">
            <img src={CONFIG.ITSHARE_LOADING_IMAGE_URL} alt="Loading" className="w-full h-auto object-contain" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">Loading...</h2>
          <p className="text-blue-400 font-mono tracking-widest text-lg md:text-xl">This wont take long..</p>
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="perspective-stage relative">
        <Notification notification={notification} />
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-white/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px]"></div>

        {showPasswordReset ? (
          <div className="w-full max-w-md animate-morph z-10">
            <div className="glass-card rounded-[2.5rem] p-6 md:p-10">
              <button onClick={() => { setShowPasswordReset(false); setResetKey(''); }} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"><IconArrowLeft /> Back</button>
              <h2 className="text-3xl font-black text-white mb-8">Override Protocol</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Admin Key" value={resetKey} onChange={e => setResetKey(e.target.value)} className="input-field w-full rounded-2xl px-6 py-4 outline-none font-bold text-black bg-white" />
                <input type="password" placeholder="New Sequence" value={newPasswordReset} onChange={e => setNewPasswordReset(e.target.value)} className="input-field w-full rounded-2xl px-6 py-4 outline-none font-bold text-black bg-white" />
                <input type="password" placeholder="Confirm Sequence" value={confirmPasswordReset} onChange={e => setConfirmPasswordReset(e.target.value)} className="input-field w-full rounded-2xl px-6 py-4 outline-none font-bold text-black bg-white" />
              </div>
              <button onClick={handlePasswordReset} className="w-full mt-8 bg-white text-black rounded-2xl py-4 font-bold hover:scale-[1.02] transition-transform">Execute Reset</button>
            </div>
          </div>
        ) : selectedUser ? (
          <div className="w-full max-w-md z-10">
            <div className="animate-flip-open" style={{transformStyle: 'preserve-3d'}}>
              <div className="glass-card rounded-[2.5rem] p-6 md:p-10">
                <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"><IconArrowLeft /> Back</button>
                <div className="flex flex-col items-center mb-8">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl mb-6 animate-float">
                    <img src={users[selectedUser].icon} alt="" className="w-full h-full object-cover" />
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight">{users[selectedUser].name}</h2>
                </div>
                <input type="password" placeholder="Enter Passkey" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleLogin()} autoFocus className="input-field w-full rounded-2xl px-6 py-4 text-lg outline-none font-bold text-center tracking-widest mb-6 text-black bg-white" />
                <button onClick={handleLogin} className="w-full bg-white text-black rounded-2xl py-4 font-bold text-lg hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-4">Authenticate</button>
                <button onClick={() => { setResetUserId(selectedUser); setShowPasswordReset(true); setSelectedUser(null); }} className="w-full text-gray-500 font-medium hover:text-white transition-colors text-sm">Lost Credentials?</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-6xl animate-morph z-10 p-4 relative">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
              <div className="lg:w-5/12 animate-slide-right hidden lg:block">
                <img src={CONFIG.LOBBY_IMAGE_URL} alt="Lobby" className="rounded-[2.5rem] border border-white/10 shadow-2xl w-full rotate-2 hover:rotate-0 transition-transform duration-700 ease-out" />
              </div>
              <div className="lg:w-7/12 w-full">
                <h1 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter animate-slide-up text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500">PRIVATE<br/>CLOUD</h1>
                <p className="text-xl md:text-2xl text-gray-400 mb-8 md:mb-12 font-light border-l-4 border-white pl-6 animate-slide-up" style={{animationDelay: '0.1s'}}>Secure Vault Access</p>
                <div className="grid gap-6">
                  {Object.entries(users).map(([uid, u], i) => (
                    <div key={uid} onClick={() => setSelectedUser(uid)} className="group glass p-4 rounded-3xl cursor-pointer flex items-center gap-6 hover-morph" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-white transition-colors flex-shrink-0">
                        <img src={u.icon} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl md:text-2xl font-bold text-white truncate">{u.name}</h2>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all flex-shrink-0">
                        <svg className="w-6 h-6 transform -rotate-45 group-hover:rotate-0 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-24 left-0 right-0 text-center animate-fade-in text-gray-500 font-mono text-xs md:text-sm">
               <p className="mb-1 opacity-70 tracking-widest">{CONFIG.CREDITS_TEXT}</p>
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
    <div className="min-h-screen bg-black p-4 md:p-8 relative selection:bg-white selection:text-black">
      <Notification notification={notification} />
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px]"></div>
      </div>

      {!showEditModal && (
        <button onClick={() => { setShowITShareLoading(true); setTimeout(() => { window.location.href = CONFIG.ITSHARE_URL }, 3400); }} className="fixed top-4 left-4 md:top-6 md:left-6 z-50 glass text-white px-4 py-2 md:px-6 md:py-3 rounded-2xl font-bold text-sm md:text-base hover:bg-white hover:text-black transition-all shadow-2xl animate-glow">
          ITSHARE Converter
        </button>
      )}

      <div className="max-w-7xl mx-auto relative z-10 pt-20 md:pt-24">
        <div className="glass-card rounded-[2.5rem] p-6 md:p-8 shadow-2xl mb-8 animate-slide-up flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto text-center md:text-left">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl animate-float">
              <img src={currentUserData.icon} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">{currentUserData.name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 font-medium bg-white/5 border border-white/10 px-4 py-1 rounded-full w-fit mx-auto md:mx-0">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                {(files[currentUser!] || []).length} Encrypted Files
              </div>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto justify-center">
             <button onClick={() => setView('vault')} className={`p-3 md:p-4 rounded-2xl border transition-all hover-morph ${view === 'vault' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white hover:bg-white hover:text-black'}`}><IconKey /></button>
             <button onClick={() => { setTempProfile({ name: currentUserData.name, icon: currentUserData.icon }); setEditingProfile(true); }} className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all hover-morph text-white"><IconUser /></button>
             <button onClick={() => { if (view === 'vault') setView('files'); else setView(view === 'files' ? 'notes' : 'files'); }} className={`p-3 md:p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all hover-morph text-white`}>{view === 'files' ? <IconMessage /> : <IconFile />}</button>
             <button onClick={() => setShowLogoutConfirm(true)} className="p-3 md:p-4 rounded-2xl bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all hover-morph"><IconLogOut /></button>
          </div>
        </div>

        <div className="animate-morph pb-20 md:pb-0" style={{animationDelay: '0.2s'}}>
          {view === 'files' && (
            <div className="space-y-6">
              <div className="animate-morph">
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} 
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }} 
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files); }} 
                    className={`relative group rounded-[2.5rem] border-2 border-dashed transition-all duration-300 w-full p-8 md:p-10 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden glass ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : 'border-white/20 hover:border-blue-500/50 hover:bg-blue-500/5 hover:scale-[1.02]'}`}
                  >
                    <input type="file" multiple onChange={(e) => handleFilesSelected(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                    <div className={`w-20 h-20 rounded-full bg-white text-black flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-transform duration-500 ${isDragging ? 'scale-125 rotate-6' : 'group-hover:scale-110'}`}>
                       <div className="w-8 h-8"><IconUpload /></div>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight relative z-10 transition-all">{isDragging ? 'INCOMING DATA...' : 'UPLOAD SECURE DATA'}</h3>
                    <p className="text-gray-400 font-medium relative z-10">{isDragging ? 'Release to Encrypt' : 'Drag Multi-Files or Click to Browse'}</p>
                    <div className={`absolute inset-0 bg-blue-500/10 blur-3xl transition-opacity duration-500 ${isDragging ? 'opacity-100' : 'opacity-0'}`}></div>
                    <div className="relative z-30 mt-4 pointer-events-none">
                        <div className="inline-flex items-center justify-center bg-white/10 rounded-xl px-4 py-2 pointer-events-auto hover:bg-white/20 transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLinkModal(true); }}>
                            <IconLink className="w-4 h-4 mr-2" /> <span className="text-sm font-bold text-white">Add Secure Link</span>
                        </div>
                    </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(files[currentUser!] || []).map((file, i) => (
                   <FileCard 
                     key={file.id} 
                     file={file} 
                     index={i}
                     isNew={newFileIds.has(file.id)}
                     isInitialLoad={isInitialLoad}
                     onDownload={() => { const link = document.createElement('a'); link.href = file.data; link.download = file.name; link.click(); showNotif('Decrypted & Downloaded', 'success'); }}
                     onDelete={() => handleDeleteRequest('file', file.id)}
                     onPreview={() => setPreviewFile(file)}
                   />
                ))}
                {(files[currentUser!] || []).length === 0 && (
                  <div className="col-span-full py-20 text-center text-gray-500 glass rounded-[3rem] border-dashed animate-morph">
                    <p className="text-xl tracking-widest">NO SECURE FILES FOUND</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'notes' && (
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 h-auto lg:h-[calc(100vh-300px)]">
               <div className="order-1 lg:order-none lg:col-span-4 glass-card rounded-[2.5rem] p-8 h-auto lg:h-full flex flex-col animate-slide-right border border-white/10 shrink-0">
                  <h3 className="text-2xl font-black mb-6 text-white">Encrypted Note</h3>
                  <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Type classified info..." className="flex-1 w-full bg-black/50 border border-white/10 focus:border-white rounded-2xl p-4 resize-none outline-none transition-all mb-4 text-lg text-white placeholder-gray-600 min-h-[150px] lg:min-h-0" />
                  <button onClick={handleAddNote} className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">SEND TO CLOUD</button>
               </div>
               <div className="order-2 lg:order-none lg:col-span-8 space-y-4 overflow-y-auto pr-2 pb-4 lg:pb-20 h-[60vh] lg:h-full custom-scrollbar">
                 {notes.length === 0 ? (
                    <div className="glass border-dashed rounded-[2.5rem] h-full flex items-center justify-center text-gray-600 tracking-widest min-h-[200px]">NO TRANSMISSIONS</div>
                 ) : (
                    notes.map((note, i) => (
                      <div key={note.id} className={`p-6 rounded-[2rem] animate-slide-up transition-all hover:translate-y-[-2px] border ${note.userId === currentUser ? 'bg-white text-black ml-4 md:ml-12 border-white' : 'bg-black/40 text-white mr-4 md:mr-12 border-white/10'}`} style={{ animationDelay: `${i * 0.05}s` }}>
                         <div className="flex items-center justify-between mb-2">
                           <span className="font-bold text-sm opacity-50 uppercase tracking-wider">{note.user}</span>
                           <span className="text-xs opacity-50">{formatDate(note.date)}</span>
                         </div>
                         {editingNote === note.id ? (
                           <div className="animate-morph">
                             <textarea value={editNoteText} onChange={e => setEditNoteText(e.target.value)} className="w-full bg-gray-100 text-black border-2 border-black rounded-xl p-3 mb-2 outline-none" autoFocus />
                             <div className="flex justify-end gap-2">
                               <button onClick={() => setEditingNote(null)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl">Cancel</button>
                               <button onClick={handleUpdateNote} className="px-4 py-2 text-sm font-bold bg-black text-white rounded-xl">Save</button>
                             </div>
                           </div>
                         ) : (
                           <p className="text-lg font-medium whitespace-pre-wrap leading-relaxed">{note.text}</p>
                         )}
                         {note.userId === currentUser && !editingNote && (
                           <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => { setEditingNote(note.id); setEditNoteText(note.text); }} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"><IconEdit /></button>
                             <button onClick={() => handleDeleteRequest('note', note.id)} className="text-red-600 hover:bg-red p-2 rounded-lg transition-colors"><IconX /></button>
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
              <div className="lg:col-span-4 glass-card rounded-[3rem] p-8 border border-white/10 shadow-2xl">
                <h3 className="text-3xl font-black mb-8 text-white tracking-tight">Vault Entry</h3>
                <div className="space-y-6 mb-8">
                   <div className="group">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 ml-2 font-black">Target Service</p>
                      <input type="text" placeholder="e.g. Roblox, Google" value={vSite} onChange={e => setVSite(e.target.value)} className="input-premium w-full rounded-2xl p-5 outline-none font-bold text-white text-lg" />
                   </div>
                   <div className="group">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 ml-2 font-black">Identity / ID</p>
                      <input type="text" placeholder="Username / Email" value={vUser} onChange={e => setVUser(e.target.value)} className="input-premium w-full rounded-2xl p-5 outline-none font-bold text-white text-lg" />
                   </div>
                   <div className="group">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 ml-2 font-black">Security Sequence</p>
                      <input type="password" placeholder="Passkey" value={vPass} onChange={e => setVPass(e.target.value)} className="input-premium w-full rounded-2xl p-5 outline-none font-bold text-white text-lg" />
                   </div>
                </div>
                <button onClick={handleAddVaultItem} className="w-full bg-white text-black py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.2)]">Vault Credentials</button>
              </div>
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar pr-4 pb-12">
                 {vaultItems.length === 0 ? (
                    <div className="col-span-full py-32 text-center text-gray-600 glass rounded-[3rem] border-dashed border-white/10 uppercase tracking-[0.3em] font-black animate-pulse">Vault Empty</div>
                 ) : (
                   vaultItems.map((item, i) => (
                     <div key={item.id} className="glass p-8 rounded-[2.5rem] border border-white/10 relative group hover-morph animate-stagger-fade" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'forwards' }}>
                        <button onClick={() => deleteVaultItem(item.id)} className="absolute top-6 right-6 text-red-500/40 opacity-0 group-hover:opacity-100 transition-all p-3 hover:bg-red-500/10 hover:text-red-500 rounded-xl">
                           <IconX className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-4 mb-8">
                           <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shadow-inner">
                              <IconKey className="w-7 h-7 text-blue-400 group-hover:rotate-12 transition-transform duration-500" />
                           </div>
                           <h4 className="text-2xl font-black text-white truncate tracking-tight">{item.site}</h4>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-center px-1">
                                 <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">User: {visibleUserIds.has(item.id) ? 'SHOWING' : 'HIDDEN'}</p>
                                 <button onClick={() => copyToClipboard(item.username, 'User')} className="text-[9px] text-blue-400/50 hover:text-blue-400 font-bold uppercase tracking-tighter transition-colors">Copy</button>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-black/60 p-4 rounded-2xl font-mono text-sm border border-white/5 truncate text-white/90 shadow-inner group-hover:border-white/10 transition-colors">
                                  {visibleUserIds.has(item.id) ? item.username : '••••••••••••'}
                                </div>
                                <button onClick={() => toggleUserVisibility(item.id)} className={`p-4 rounded-2xl border transition-all ${visibleUserIds.has(item.id) ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}>
                                   <IconEye className="w-5 h-5" />
                                </button>
                              </div>
                           </div>

                           <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-center px-1">
                                 <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Pass: {visiblePassIds.has(item.id) ? 'SHOWING' : 'HIDDEN'}</p>
                                 <button onClick={() => copyToClipboard(item.pass, 'Pass')} className="text-[9px] text-blue-400/50 hover:text-blue-400 font-bold uppercase tracking-tighter transition-colors">Copy</button>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-black/60 p-4 rounded-2xl font-mono text-sm border border-white/5 truncate text-white/90 shadow-inner group-hover:border-white/10 transition-colors">
                                  {visiblePassIds.has(item.id) ? item.pass : '••••••••••••'}
                                </div>
                                <button onClick={() => togglePassVisibility(item.id)} className={`p-4 rounded-2xl border transition-all ${visiblePassIds.has(item.id) ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}>
                                   <IconEye className="w-5 h-5" />
                                </button>
                              </div>
                           </div>
                        </div>
                        
                        <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center">
                           <span className="text-[8px] font-mono text-gray-600 uppercase tracking-[0.2em]">{formatDate(item.date)}</span>
                           <span className="text-[8px] font-black text-blue-500/30 uppercase tracking-widest">Secure Record</span>
                        </div>
                     </div>
                   ))
                 )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showLogoutConfirm && <ConfirmationModal title="Terminate Session?" message="Secure connection will be severed." confirmText="Log Off" onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} isDanger />}
      {showDeleteConfirm && <ConfirmationModal title="Confirm Deletion" message="This data cannot be recovered. Proceed?" confirmText="Obliterate" onConfirm={proceedDelete} onCancel={() => { setShowDeleteConfirm(false); setDeleteStep(1); }} isDanger />}
      {showStorageWarning && <ModalBackdrop onClose={() => setShowStorageWarning(false)}><div className="text-center text-white"><div className="text-6xl mb-4 animate-bounce">⚠️</div><h2 className="text-2xl font-bold mb-2">Capacity Critical</h2><p className="text-gray-400 mb-6">Storage Usage > 80%</p><button onClick={() => setShowStorageWarning(false)} className="w-full bg-white text-black py-3 rounded-2xl font-bold">Acknowledge</button></div></ModalBackdrop>}
      
      {showUploadModal && <UploadModal pendingFiles={pendingFiles} onClose={() => { setShowUploadModal(false); setPendingFiles([]); }} onUpload={processUploads} />}
      {showLinkModal && <LinkModal onClose={() => setShowLinkModal(false)} onAdd={handleAddLink} />}
      {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

      {showEditModal && (
        <ModalBackdrop onClose={() => { setEditingProfile(false); setChangingPassword(false); }}>
           {changingPassword ? (
             <div key="password-form" className="animate-morph text-white">
               <h2 className="text-2xl font-bold mb-6">Update Protocol</h2>
               <div className="space-y-4 mb-6">
                 <input type="password" placeholder="Current Key" value={passwordChange.current} onChange={e => setPasswordChange({...passwordChange, current: e.target.value})} className="input-field w-full rounded-2xl px-6 py-4 font-bold text-black bg-white" />
                 <input type="password" placeholder="New Key" value={passwordChange.new} onChange={e => setPasswordChange({...passwordChange, new: e.target.value})} className="input-field w-full rounded-2xl px-6 py-4 font-bold text-black bg-white" />
                 <input type="password" placeholder="Verify Key" value={passwordChange.confirm} onChange={e => setPasswordChange({...passwordChange, confirm: e.target.value})} className="input-field w-full rounded-2xl px-6 py-4 font-bold text-black bg-white" />
               </div>
               <div className="flex gap-4">
                 <button onClick={handleChangePassword} className="flex-1 bg-white text-black py-3 rounded-xl font-bold hover:scale-105 transition-transform">Update</button>
                 <button onClick={() => setChangingPassword(false)} className="flex-1 bg-transparent border border-white/20 text-white py-3 rounded-xl font-bold">Cancel</button>
               </div>
             </div>
           ) : (
             <div key="profile-form" className="animate-morph text-white">
                <h2 className="text-2xl font-bold mb-6">Modify Profile</h2>
                <div className="flex justify-center mb-6">
                   <div className="relative group">
                     <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20">
                       <img src={tempProfile.icon} alt="" className="w-full h-full object-cover" />
                     </div>
                     <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer font-bold tracking-widest backdrop-blur-sm">
                       UPLOAD
                       <input type="file" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTempProfile({...tempProfile, icon: ev.target?.result as string}); r.readAsDataURL(f); } }} className="hidden" />
                     </label>
                   </div>
                </div>
                <input type="text" value={tempProfile.name} onChange={e => setTempProfile({...tempProfile, name: e.target.value})} maxLength={CONFIG.MAX_NAME_LENGTH} className="input-field w-full p-4 rounded-xl mb-2 font-bold text-center text-xl text-black bg-white" />
                <p className="text-xs text-center text-gray-500 mb-6">{tempProfile.name.length}/{CONFIG.MAX_NAME_LENGTH}</p>
                <div className="flex gap-3">
                   <button onClick={handleProfileSave} className="flex-1 bg-white text-black py-3 rounded-xl font-bold hover:scale-105 transition-transform">Save</button>
                   <button onClick={() => { setEditingProfile(false); setChangingPassword(true); }} className="flex-1 bg-transparent border border-white/20 text-white py-3 rounded-xl font-bold hover:bg-white/5">Keys</button>
                </div>
             </div>
           )}
        </ModalBackdrop>
      )}
    </div>
  );
};

export default App;
