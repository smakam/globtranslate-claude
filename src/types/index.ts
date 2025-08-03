export interface User {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen: Date;
  language: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderUsername: string;
  originalText: string;
  translatedText: string;
  timestamp: Date;
  chatId: string;
  type?: 'text' | 'voice';
  audioUrl?: string;
}

export interface Chat {
  id: string;
  participants: string[];
  createdAt: Date;
  lastMessage?: Message;
}

export interface Friend {
  id: string;
  username: string;
  lastConnected: Date;
}

export type Language = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'fr';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

export type Theme = 'light' | 'dark';