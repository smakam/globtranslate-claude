import React, { useState } from 'react';
import { ArrowLeft, Settings, Moon, Sun, Globe, Trash2 } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { Language } from '../types';

interface ChatHeaderProps {
  friendUsername: string;
  friendOnline: boolean;
  friendLastSeen?: Date;
  onBack: () => void;
  onSettingsClick: () => void;
  onClearChat: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  userLanguage: string;
  onLanguageChange: (language: Language) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  friendUsername,
  friendOnline,
  friendLastSeen,
  onBack,
  onSettingsClick,
  onClearChat,
  isDarkMode,
  onToggleDarkMode,
  userLanguage,
  onLanguageChange
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
              friendOnline ? 'bg-green-500' : 'bg-gray-500'
            }`}>
              {friendUsername.charAt(0).toUpperCase()}
            </div>
            
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {friendUsername}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {friendOnline ? (
                  <span className="text-green-600">Online</span>
                ) : (
                  friendLastSeen && `Last seen ${formatLastSeen(friendLastSeen)}`
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={userLanguage}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Clear chat messages"
          >
            <Trash2 size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
          
          <button
            onClick={onToggleDarkMode}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isDarkMode ? (
              <Sun size={18} className="text-gray-600 dark:text-gray-300" />
            ) : (
              <Moon size={18} className="text-gray-600 dark:text-gray-300" />
            )}
          </button>
          
          <button
            onClick={onSettingsClick}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
      
      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowClearConfirm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Clear Chat Messages
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to clear all messages in this chat? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearChat();
                  setShowClearConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;