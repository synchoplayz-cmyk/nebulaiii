export enum MessageRole {
  User = 'user',
  Model = 'model',
  System = 'system'
}

export enum AppMode {
  Chat = 'chat',
  GenerateImage = 'generate_image',
  EditImage = 'edit_image',
  Analyze = 'analyze'
}

export interface Attachment {
  file: File;
  base64: string;
  mimeType: string;
  type: 'image' | 'video' | 'audio';
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  attachments?: Attachment[];
  imageUrl?: string; // For generated images
  isThinking?: boolean;
  timestamp: number;
  sources?: { uri: string; title: string }[];
}

export interface ImageGenerationConfig {
  size: '1K' | '2K' | '4K';
}

export interface ChatConfig {
  enableThinking: boolean;
  enableSearch: boolean;
  enableFast: boolean;
}

// Global type for AI Studio Key Selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
