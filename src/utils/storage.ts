import { Friend, Message } from '../types';

const STORAGE_KEYS = {
  RECENT_FRIENDS: 'globtranslate_recent_friends',
  CHAT_HISTORY: 'globtranslate_chat_history',
  USER_PREFERENCES: 'globtranslate_user_preferences',
  THEME: 'globtranslate_theme'
};

export const storageUtils = {
  getRecentFriends(): Friend[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECENT_FRIENDS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  addRecentFriend(friend: Friend): void {
    try {
      const recent = this.getRecentFriends();
      const filtered = recent.filter(f => f.id !== friend.id);
      const updated = [friend, ...filtered].slice(0, 5);
      localStorage.setItem(STORAGE_KEYS.RECENT_FRIENDS, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent friend:', error);
    }
  },

  getChatHistory(chatId: string): Message[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.CHAT_HISTORY}_${chatId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  addMessageToHistory(chatId: string, message: Message): void {
    try {
      const history = this.getChatHistory(chatId);
      const updated = [...history, message];
      localStorage.setItem(`${STORAGE_KEYS.CHAT_HISTORY}_${chatId}`, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save message to history:', error);
    }
  },

  clearChatHistory(chatId: string): void {
    try {
      localStorage.removeItem(`${STORAGE_KEYS.CHAT_HISTORY}_${chatId}`);
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  },

  getTheme(): 'light' | 'dark' {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME);
      return stored === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  },

  setTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }
};