import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Attachment, ChatConfig, ImageGenerationConfig } from "../types";

// Helper to get client (standard or dynamic for Pro Image)
const getClient = async (needsUserKey: boolean = false) => {
  if (needsUserKey) {
    // For Veo/Pro Image, we need to ensure a key is selected
    if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
       // Re-instantiate with the injected key from the environment (which is updated by the selection)
       return new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    throw new Error("API_KEY_REQUIRED");
  }
  // Always create a new client to ensure we use the latest injected API_KEY
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const streamChatResponse = async (
  history: { role: string; parts: any[] }[],
  lastMessage: string,
  config: ChatConfig,
  attachments: Attachment[] = []
) => {
  let modelName = 'gemini-2.5-flash'; // Default
  let geminiConfig: any = {};

  if (config.enableFast) {
    modelName = 'gemini-flash-lite-latest';
  } else if (config.enableThinking) {
    modelName = 'gemini-3-pro-preview';
    geminiConfig.thinkingConfig = { thinkingBudget: 32768 };
  } else if (config.enableSearch) {
    modelName = 'gemini-2.5-flash';
    geminiConfig.tools = [{ googleSearch: {} }];
  } else {
    // Default chat behavior - slightly more capable
    modelName = 'gemini-3-pro-preview'; 
  }

  const client = await getClient();
  
  // Construct content parts
  const parts: any[] = [];
  
  for (const att of attachments) {
    parts.push({
      inlineData: {
        mimeType: att.mimeType,
        data: att.base64
      }
    });
  }
  
  if (lastMessage) {
    parts.push({ text: lastMessage });
  }

  const chat = client.chats.create({
    model: modelName,
    history: history.map(h => ({
        role: h.role,
        parts: h.parts
    })),
    config: geminiConfig
  });

  return chat.sendMessageStream({
      message: parts
  }); 
};

export const generateImage = async (prompt: string, config: ImageGenerationConfig) => {
  try {
    const client = await getClient(true); // Requires user selected key
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          imageSize: config.size,
          aspectRatio: "1:1" // Default square
        }
      }
    });
    return response;
  } catch (e: any) {
    if (e.message === "API_KEY_REQUIRED") {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // Retry once after selection
        const client = await getClient(true);
        return await client.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { imageSize: config.size } }
        });
      }
    }
    throw e;
  }
};

export const editImage = async (prompt: string, imageAttachment: Attachment) => {
  const client = await getClient();
  // Nano Banana (Flash Image)
  const model = 'gemini-2.5-flash-image';
  
  const response = await client.models.generateContent({
    model: model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: imageAttachment.mimeType,
            data: imageAttachment.base64
          }
        },
        { text: prompt }
      ]
    }
  });
  return response;
};

export const analyzeMedia = async (prompt: string, attachment: Attachment) => {
  const client = await getClient();
  let model = 'gemini-3-pro-preview'; // Default for heavy analysis
  
  if (attachment.type === 'audio') {
    model = 'gemini-2.5-flash'; // Flash is great for audio transcription/analysis
  }

  const response = await client.models.generateContent({
    model: model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: attachment.mimeType,
            data: attachment.base64
          }
        },
        { text: prompt || "Analyze this content." }
      ]
    }
  });
  return response;
};

export const transcribeAudio = async (audioAttachment: Attachment) => {
  const client = await getClient();
  const model = 'gemini-2.5-flash';

  const response = await client.models.generateContent({
    model: model,
    contents: {
      parts: [
        {
            inlineData: {
                mimeType: audioAttachment.mimeType,
                data: audioAttachment.base64
            }
        },
        { text: "Transcribe this audio file." }
      ]
    }
  });
  return response;
};
