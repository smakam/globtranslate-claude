import React, { useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Message } from '../types';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
  userLanguage?: string;
  friendLanguage?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isOwn, userLanguage = 'en', friendLanguage = 'en' }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const { isSpeaking, speak, stop } = useSpeechSynthesis();
  
  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handlePlayText = () => {
    if (isSpeaking) {
      stop();
    } else {
      const textToSpeak = isOwn ? message.originalText : message.translatedText;
      // For own messages, use the user's language (original text)
      // For friend messages, use the user's language (translated text is in user's language)
      const language = userLanguage;
      console.log('🔊 ChatBubble TTS:', {
        isOwn,
        textToSpeak,
        language,
        userLanguage,
        friendLanguage,
        originalText: message.originalText,
        translatedText: message.translatedText
      });
      speak(textToSpeak, language);
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwn 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
      }`}>
        {!isOwn && (
          <p className="text-xs font-semibold mb-1 opacity-70">
            {message.senderUsername}
          </p>
        )}
        
        <div className="space-y-1">
          <div className="flex items-start justify-between">
            <p className="text-sm leading-relaxed flex-1 mr-2">
              {isOwn ? message.originalText : message.translatedText}
            </p>
            
            {/* Text-to-speech button */}
            <button
              onClick={handlePlayText}
              className={`flex-shrink-0 p-1 rounded-full transition-colors ${
                isOwn 
                  ? 'hover:bg-blue-500 text-blue-100 hover:text-white' 
                  : 'hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400'
              }`}
              title="Play text-to-speech"
            >
              {isSpeaking ? (
                <Pause size={14} />
              ) : (
                <Volume2 size={14} />
              )}
            </button>
          </div>
          
          {/* Voice message indicator */}
          {message.type === 'voice' && (
            <div className="flex items-center space-x-1 text-xs opacity-70">
              <Volume2 size={12} />
              <span>Voice message</span>
            </div>
          )}
          
          {/* Show original text for received messages */}
          {!isOwn && message.originalText !== message.translatedText && (
            <p className="text-xs opacity-70 italic border-t border-gray-300 dark:border-gray-600 pt-1 mt-1">
              Original: {message.originalText}
            </p>
          )}
          
          {/* Show translated text for sent messages */}
          {isOwn && message.originalText !== message.translatedText && (
            <p className="text-xs opacity-70 italic border-t border-blue-400 pt-1 mt-1">
              Translated: {message.translatedText}
            </p>
          )}
        </div>
        
        <p className={`text-xs mt-1 ${
          isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default ChatBubble;