import React from 'react';
import { ChatMessage, MessageRole } from '../types';
import { SparkleIcon } from './Icons';

interface Props {
  message: ChatMessage;
}

const ChatMessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === MessageRole.User;

  return (
    <div className={`flex w-full mb-6 animate-fade-in-up ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-indigo-600' : 'bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(34,211,238,0.5)]'}`}>
          {isUser ? (
            <span className="text-xs font-bold text-white">U</span>
          ) : (
            <SparkleIcon className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col gap-2`}>
          <div className={`p-4 rounded-2xl backdrop-blur-md shadow-lg border border-opacity-20 ${
            isUser 
              ? 'bg-indigo-600/20 border-indigo-500/30 text-white rounded-tr-sm' 
              : 'bg-slate-800/40 border-slate-600/30 text-slate-100 rounded-tl-sm'
          }`}>
            
            {/* Attached Images (User) */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {message.attachments.map((att, i) => (
                  att.type === 'image' && (
                    <img key={i} src={`data:${att.mimeType};base64,${att.base64}`} alt="Attachment" className="max-w-[200px] rounded-lg border border-slate-700" />
                  )
                ))}
              </div>
            )}

            {/* Thinking Indicator */}
            {message.isThinking && (
              <div className="flex items-center gap-2 mb-2 text-xs text-cyan-400 font-mono opacity-80">
                <span className="animate-pulse">Thinking...</span>
              </div>
            )}

            {/* Text Content */}
            <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
              {message.text}
            </div>

            {/* Generated Image (Model) */}
            {message.imageUrl && (
              <div className="mt-3">
                <img src={message.imageUrl} alt="Generated Content" className="rounded-lg max-w-full shadow-md border border-slate-700" />
              </div>
            )}
            
            {/* Grounding Sources */}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">Sources:</p>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 bg-slate-900/50 px-2 py-1 rounded border border-cyan-900/30 truncate max-w-[200px]"
                    >
                      {source.title || source.uri}
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
          
          <div className={`text-[10px] text-slate-500 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageBubble;