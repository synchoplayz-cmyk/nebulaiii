import React, { useRef, useState } from 'react';
import { Attachment, ChatConfig } from '../types';
import { SendIcon, PaperClipIcon, CloseIcon, MicIcon, BrainIcon, SearchIcon, BoltIcon } from './Icons';
import { fileToBase64, getFileType } from '../services/utils';

interface Props {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  config: ChatConfig;
  onConfigChange: (newConfig: Partial<ChatConfig>) => void;
  placeholder?: string;
  acceptAudio?: boolean;
}

const InputArea: React.FC<Props> = ({ onSendMessage, isLoading, config, onConfigChange, placeholder = "Type a message...", acceptAudio = true }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    onSendMessage(text, attachments);
    setText('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAttachments: Attachment[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const base64 = await fileToBase64(file);
        newAttachments.push({
          file,
          base64,
          mimeType: file.type,
          type: getFileType(file.type)
        });
      }
      setAttachments([...attachments, ...newAttachments]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'audio/wav' }); // simplistic type assumption for demo
            // Convert blob to base64
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                 const att: Attachment = {
                    file: new File([blob], "recording.wav", { type: 'audio/wav' }),
                    base64: base64String,
                    mimeType: 'audio/wav',
                    type: 'audio'
                };
                setAttachments(prev => [...prev, att]);
            };
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone access denied", err);
        alert("Microphone access needed for audio.");
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sticky bottom-0 z-10">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-3 shadow-2xl relative">
        
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto p-2">
            {attachments.map((att, i) => (
              <div key={i} className="relative group shrink-0">
                {att.type === 'image' ? (
                  <img src={`data:${att.mimeType};base64,${att.base64}`} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-slate-600" />
                ) : (
                  <div className="h-16 w-16 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-600 text-xs text-slate-300">
                    {att.type.toUpperCase()}
                  </div>
                )}
                <button 
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <CloseIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Row */}
        <div className="flex items-end gap-2">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-full transition-colors"
                title="Attach file"
            >
                <PaperClipIcon className="w-6 h-6" />
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange} 
                multiple 
                accept="image/*,video/*,audio/*"
            />

            {acceptAudio && (
                 <button 
                    onClick={toggleRecording}
                    className={`p-3 rounded-full transition-colors ${isRecording ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800'}`}
                    title="Record Audio"
                >
                    <MicIcon className="w-6 h-6" />
                </button>
            )}

            <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700/50 focus-within:border-cyan-500/50 focus-within:bg-slate-800 transition-all">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isRecording ? "Listening..." : placeholder}
                    className="w-full bg-transparent text-slate-100 p-3 max-h-32 min-h-[50px] resize-none focus:outline-none placeholder-slate-500"
                    rows={1}
                />
            </div>

            <button 
                onClick={handleSend}
                disabled={(!text && attachments.length === 0) || isLoading}
                className={`p-3 rounded-full transition-all duration-300 ${
                    (!text && attachments.length === 0) || isLoading
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_25px_rgba(6,182,212,0.7)]'
                }`}
            >
                <SendIcon className="w-6 h-6" />
            </button>
        </div>

        {/* Tools Toggle Bar */}
        <div className="flex items-center gap-2 mt-2 px-2">
            <button 
                onClick={() => onConfigChange({ enableThinking: !config.enableThinking, enableFast: false, enableSearch: false })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    config.enableThinking 
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/50' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
            >
                <BrainIcon className="w-4 h-4" /> Thinking
            </button>

            <button 
                onClick={() => onConfigChange({ enableSearch: !config.enableSearch, enableThinking: false, enableFast: false })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    config.enableSearch 
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
            >
                <SearchIcon className="w-4 h-4" /> Search
            </button>

             <button 
                onClick={() => onConfigChange({ enableFast: !config.enableFast, enableThinking: false, enableSearch: false })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    config.enableFast 
                    ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/50' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
            >
                <BoltIcon className="w-4 h-4" /> Fast
            </button>
        </div>
      </div>
    </div>
  );
};

export default InputArea;