import React, { useState, useEffect } from 'react';
import { IconUpload, IconX, IconWarning, IconFile, IconLink, IconEye } from './Icons';
import { FileData } from '../types';

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

export const ModalBackdrop: React.FC<ModalProps> = ({ onClose, children }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in" onClick={onClose}>
    <div className="glass-card rounded-[2rem] p-6 md:p-8 shadow-2xl max-w-sm w-full animate-flip-open relative overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-[40px] pointer-events-none"></div>
      {children}
    </div>
  </div>
);

export const PreviewModal = ({ file, onClose }: { file: FileData | null, onClose: () => void }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (!file) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };
  
  const renderContent = () => {
    if (file.type === 'link') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <IconLink className="w-16 h-16 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold mb-1">External Link</h3>
                <p className="text-xs text-gray-400 mb-6 break-all">{file.data}</p>
                <a href={file.data} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-500 transition-colors">
                    Open Website
                </a>
            </div>
        );
    }
    if (file.type.startsWith('image/')) {
      return <img src={file.data} alt={file.name} className="max-w-full max-h-[60vh] object-contain rounded-xl mx-auto" />;
    }
    if (file.type === 'application/pdf') {
      return <iframe src={file.data} className="w-full h-[60vh] rounded-xl bg-white" title={file.name}></iframe>;
    }
    if (file.type.startsWith('video/')) {
        return <video src={file.data} controls className="w-full max-h-[60vh] rounded-xl" />;
    }
    if (file.type.startsWith('audio/')) {
        return (
            <div className="flex items-center justify-center h-[120px] w-full px-6">
                <audio src={file.data} controls className="w-full" />
            </div>
        );
    }
    if (file.type.startsWith('text/') || !file.type) {
        try {
          const content = atob(file.data.split(',')[1]);
          return (
              <div className="bg-white/5 p-4 rounded-xl overflow-auto max-h-[60vh] w-full">
                  <pre className="text-xs font-mono whitespace-pre-wrap text-white/80">{content}</pre>
              </div>
          );
        } catch(e) {
          return <div className="text-center py-10 text-gray-400 text-xs">Preview Not Support</div>;
        }
    }
    return (
        <div className="text-center py-10 text-gray-400 text-xs">
            <p>Direct preview restricted.</p>
        </div>
    );
  };

  return (
    <div 
        className={`fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[99999] p-4 transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`} 
        onClick={handleClose}
    >
        <div 
            className={`relative w-full max-w-4xl bg-[#080808] border border-white/5 rounded-3xl p-4 md:p-5 shadow-2xl flex flex-col transition-transform duration-200 ${isClosing ? 'scale-95' : 'scale-100'}`} 
            onClick={e => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-4 px-1">
                <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-white truncate max-w-[150px] md:max-w-md">{file.name}</h3>
                    {file.note && <p className="text-[10px] text-gray-500 italic">"{file.note}"</p>}
                </div>
                <button onClick={handleClose} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"><IconX className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-black/20 rounded-2xl min-h-[200px]">
                {renderContent()}
            </div>
        </div>
    </div>
  );
};

export const UploadModal = ({ pendingFiles, onClose, onUpload }: { pendingFiles: File[], onClose: () => void, onUpload: (metadata: any[]) => void }) => {
    const [metadata, setMetadata] = useState(
        pendingFiles.map(f => ({ name: f.name, note: '' }))
    );

    const handleUpdate = (index: number, field: string, value: string) => {
        const newMeta = [...metadata];
        newMeta[index] = { ...newMeta[index], [field]: value };
        setMetadata(newMeta);
    };

    return (
        <ModalBackdrop onClose={onClose}>
            <h2 className="text-xl font-black text-white mb-6 uppercase italic">Process Payload</h2>
            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 -mr-2 mb-6">
                {pendingFiles.map((file, i) => (
                    <div key={i} className="mb-4 bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                            <IconFile className="w-4 h-4 text-blue-500" />
                            <p className="text-[10px] text-gray-500 font-mono truncate">{file.name}</p>
                        </div>
                        <div className="space-y-2">
                            <input 
                                type="text" 
                                placeholder="Alias" 
                                value={metadata[i].name}
                                onChange={(e) => handleUpdate(i, 'name', e.target.value)}
                                className="w-full rounded-lg px-4 py-2 text-xs font-bold outline-none text-white bg-black/40 border border-white/5" 
                            />
                            <input 
                                type="text" 
                                placeholder="Secure Note" 
                                value={metadata[i].note}
                                onChange={(e) => handleUpdate(i, 'note', e.target.value)}
                                className="w-full rounded-lg px-4 py-2 text-[10px] outline-none text-white bg-black/40 border border-white/5" 
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-3 mt-auto">
                <button onClick={() => onUpload(metadata)} className="flex-1 bg-white text-black rounded-xl py-3 text-[10px] font-black uppercase tracking-widest">Encrypt</button>
                <button onClick={onClose} className="px-5 bg-transparent border border-white/10 text-white rounded-xl text-[10px] font-bold uppercase">Cancel</button>
            </div>
        </ModalBackdrop>
    );
};

export const LinkModal = ({ onClose, onAdd }: { onClose: () => void, onAdd: (data: any) => void }) => {
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [note, setNote] = useState('');

    const handleSubmit = () => {
        if (!url) return;
        let finalUrl = url;
        if (!/^https?:\/\//i.test(finalUrl)) {
            finalUrl = 'https://' + finalUrl;
        }
        onAdd({ url: finalUrl, name: name || url, note });
    };

    return (
        <ModalBackdrop onClose={onClose}>
            <h2 className="text-xl font-black text-white mb-6 uppercase italic">Pointer</h2>
            <div className="space-y-4 mb-8">
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"><IconLink className="w-4 h-4" /></div>
                    <input 
                        type="text" 
                        placeholder="Link" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full rounded-xl pl-10 pr-4 py-3.5 text-xs font-bold outline-none text-white bg-black/40 border border-white/5" 
                        autoFocus
                    />
                </div>
                <input 
                    type="text" 
                    placeholder="Alias" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl px-4 py-3.5 outline-none font-bold text-xs text-white bg-black/40 border border-white/5" 
                />
                <input 
                    type="text" 
                    placeholder="Secure Note" 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-xl px-4 py-3.5 outline-none text-[10px] text-white bg-black/40 border border-white/5" 
                />
            </div>
            <div className="flex gap-3">
                <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-[10px] font-black uppercase tracking-widest">Store</button>
                <button onClick={onClose} className="flex-1 bg-transparent border border-white/10 text-white rounded-xl py-3 text-[10px] font-bold uppercase">Cancel</button>
            </div>
        </ModalBackdrop>
    );
};

export const ConfirmationModal = ({ 
  title, 
  message, 
  confirmText, 
  cancelText = "Abort", 
  onConfirm, 
  onCancel,
  isDanger = false 
}: { 
  title: string; 
  message: string; 
  confirmText: string; 
  cancelText?: string; 
  onConfirm: () => void; 
  onCancel: () => void;
  isDanger?: boolean;
}) => (
  <ModalBackdrop onClose={onCancel}>
    <div className="text-center mb-8 relative z-10">
      <div className="flex justify-center mb-4 text-white/20">
        <IconWarning className="w-12 h-12" />
      </div>
      <h2 className="text-xl font-black text-white mb-2 tracking-tight uppercase italic">{title}</h2>
      <p className="text-xs text-gray-500 font-medium leading-relaxed">{message}</p>
    </div>
    <div className="flex gap-3">
      <button onClick={onConfirm} className={`flex-1 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all ${isDanger ? 'bg-red-600 text-white' : 'bg-white text-black'}`}>
        {confirmText}
      </button>
      <button onClick={onCancel} className="flex-1 bg-transparent border border-white/10 text-white rounded-xl py-3 text-[10px] font-bold uppercase">
        {cancelText}
      </button>
    </div>
  </ModalBackdrop>
);