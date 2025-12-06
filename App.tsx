import React, { useState, useEffect, useRef } from 'react';
import { GenerateContentResponse } from "@google/genai";
import { AppMode, Attachment, ChatConfig, ChatMessage, MessageRole, ImageGenerationConfig } from './types';
import { streamChatResponse, generateImage, editImage, analyzeMedia, transcribeAudio } from './services/geminiService';
import ChatMessageBubble from './components/ChatMessageBubble';
import InputArea from './components/InputArea';
import ModeSelector from './components/ModeSelector';
import { SparkleIcon } from './components/Icons';

const generateId = () => Math.random().toString(36).substring(2, 9);

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.Chat);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatConfig, setChatConfig] = useState<ChatConfig>({
    enableThinking: false,
    enableSearch: false,
    enableFast: false
  });
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Smooth scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const updateLastMessage = (text: string, isThinking: boolean = false, imageUrl?: string, sources?: any[]) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg.role === MessageRole.Model) {
          lastMsg.text = text;
          lastMsg.isThinking = isThinking;
          if (imageUrl) lastMsg.imageUrl = imageUrl;
          if (sources) lastMsg.sources = sources;
          return newMessages;
        }
      }
      return prev;
    });
  };

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    // Add user message
    const userMsg: ChatMessage = {
      id: generateId(),
      role: MessageRole.User,
      text: text || (attachments.length ? (attachments[0].type === 'audio' ? 'Audio uploaded' : 'Image uploaded') : ''),
      attachments: attachments,
      timestamp: Date.now()
    };
    addMessage(userMsg);
    setIsLoading(true);

    // Create placeholder for model response
    const modelMsgId = generateId();
    addMessage({
      id: modelMsgId,
      role: MessageRole.Model,
      text: '',
      timestamp: Date.now(),
      isThinking: chatConfig.enableThinking
    });

    try {
      if (mode === AppMode.Chat) {
        // Prepare history (simple text history for context)
        const history = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

        const result = await streamChatResponse(history, text, chatConfig, attachments);
        
        let fullText = '';
        for await (const chunk of result) {
            const content = chunk as GenerateContentResponse;
            if (content.text) {
                fullText += content.text;
                updateLastMessage(fullText, false, undefined, content.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web ? c.web : c.maps));
            }
        }
      } 
      else if (mode === AppMode.GenerateImage) {
        updateLastMessage("Generating high-quality image...", true);
        const result = await generateImage(text, { size: imageSize });
        
        // Find image part
        let imgUrl = '';
        let caption = '';

        if (result.candidates && result.candidates[0].content.parts) {
            for (const part of result.candidates[0].content.parts) {
                if (part.inlineData) {
                    imgUrl = `data:image/png;base64,${part.inlineData.data}`;
                } else if (part.text) {
                    caption = part.text;
                }
            }
        }
        
        updateLastMessage(caption || "Here is your generated image.", false, imgUrl);
      }
      else if (mode === AppMode.EditImage) {
        if (attachments.length === 0 || attachments[0].type !== 'image') {
            throw new Error("Please attach an image to edit.");
        }
        updateLastMessage("Editing image...", true);
        const result = await editImage(text, attachments[0]);
        
        let imgUrl = '';
        let caption = '';
        if (result.candidates && result.candidates[0].content.parts) {
            for (const part of result.candidates[0].content.parts) {
                if (part.inlineData) {
                    imgUrl = `data:image/png;base64,${part.inlineData.data}`;
                } else if (part.text) {
                    caption = part.text;
                }
            }
        }
        updateLastMessage(caption || "Here is your edited image.", false, imgUrl);
      }
      else if (mode === AppMode.Analyze) {
        if (attachments.length === 0) {
             throw new Error("Please attach media to analyze.");
        }
        updateLastMessage("Analyzing content...", true);
        
        // Check if it is purely audio transcription request or general analysis
        let result;
        if (attachments[0].type === 'audio' && text.toLowerCase().includes('transcribe')) {
             result = await transcribeAudio(attachments[0]);
        } else {
             result = await analyzeMedia(text, attachments[0]);
        }

        const responseText = result.text || "Analysis complete.";
        updateLastMessage(responseText, false);
      }

    } catch (error: any) {
      console.error(error);
      updateLastMessage(`Error: ${error.message || "Something went wrong."}`, false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
      
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-slate-800/50 backdrop-blur-md sticky top-0 z-20 bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur opacity-30 group-hover:opacity-75 transition duration-1000"></div>
            <img 
              src="https://i.ibb.co/6y18H20/aether-logo.png" 
              alt="Aether" 
              className="relative w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]" 
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Aether
          </h1>
        </div>
        
        {/* Placeholder for settings or user profile if needed */}
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 hover:border-cyan-500/50 transition-colors"></div>
      </header>

      {/* Mode Switcher */}
      <div className="bg-slate-950/90 z-10">
        <ModeSelector currentMode={mode} onModeChange={(m) => { setMode(m); setMessages([]); }} />
      </div>

      {/* Additional Controls for Specific Modes */}
      {mode === AppMode.GenerateImage && (
        <div className="flex justify-center pb-2">
            <select 
                value={imageSize} 
                onChange={(e) => setImageSize(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-300 focus:border-cyan-500 outline-none"
            >
                <option value="1K">1K Resolution</option>
                <option value="2K">2K Resolution (Pro)</option>
                <option value="4K">4K Resolution (Pro)</option>
            </select>
        </div>
      )}

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 opacity-50 animate-fade-in-up">
              <img 
                src="https://i.ibb.co/6y18H20/aether-logo.png" 
                alt="Aether" 
                className="w-16 h-16 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-700" 
              />
              <p className="text-lg">How can I help you today?</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <InputArea 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading} 
        config={chatConfig}
        onConfigChange={(newConf) => setChatConfig(prev => ({ ...prev, ...newConf }))}
        placeholder={
            mode === AppMode.GenerateImage ? "Describe the image to generate..." :
            mode === AppMode.EditImage ? "Describe how to edit the attached image..." :
            mode === AppMode.Analyze ? "Ask about the media..." :
            "Type a message..."
        }
        acceptAudio={mode !== AppMode.GenerateImage}
      />
    </div>
  );
};

export default App;