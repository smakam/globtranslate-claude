import React, { useState, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  userLanguage?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled = false, 
  userLanguage = 'en' 
}) => {
  const [message, setMessage] = useState('');
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  // Add debug log function
  const addDebugLog = (log: string) => {
    setDebugLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${log}`]);
  };

  const {
    isListening,
    transcript,
    finalTranscript,
    error: speechError,
    isSupported: speechSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition(userLanguage);

  // Update message when speech recognition provides final transcript
  useEffect(() => {
    if (finalTranscript && finalTranscript !== lastProcessedTranscript) {
      // Clean up the transcript - remove extra spaces and punctuation issues
      const cleanTranscript = finalTranscript.trim().replace(/\s+/g, ' ');
      
      // Extract only NEW words (mobile sends cumulative results)
      let newWords = '';
      if (lastProcessedTranscript) {
        // If current transcript starts with the last processed transcript, extract only the new part
        if (cleanTranscript.startsWith(lastProcessedTranscript)) {
          newWords = cleanTranscript.substring(lastProcessedTranscript.length).trim();
        } else {
          // If it doesn't start with previous, use the whole thing (fresh start)
          newWords = cleanTranscript;
        }
      } else {
        // First transcript, use everything
        newWords = cleanTranscript;
      }
      
      addDebugLog(`Processing: "${finalTranscript}" -> NEW: "${newWords}"`);
      console.log('🎤 Processing transcript:', {
        finalTranscript,
        cleanTranscript,
        lastProcessed: lastProcessedTranscript,
        newWords,
        currentMessage: message
      });
      
      if (newWords && newWords.length > 0) {
        setMessage(prev => {
          const newMessage = prev + (prev ? ' ' : '') + newWords;
          addDebugLog(`ADDED: "${newWords}" to message`);
          console.log('🎤 Adding new words to message:', newWords);
          return newMessage.trim();
        });
        
        setLastProcessedTranscript(cleanTranscript);
      } else {
        addDebugLog(`NO NEW WORDS: "${cleanTranscript}" already processed`);
      }
      resetTranscript();
    }
  }, [finalTranscript, lastProcessedTranscript, message, resetTranscript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      // Reset processed transcript when starting new voice input
      setLastProcessedTranscript('');
      startListening();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
      {/* Mobile Debug Panel */}
      {/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
        <div className="mb-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs text-blue-600 dark:text-blue-400 underline"
          >
            {showDebug ? 'Hide' : 'Show'} Voice Debug Info
          </button>
          {showDebug && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
              <div className="font-bold mb-1">Voice Debug Log:</div>
              {debugLogs.length === 0 ? (
                <div className="text-gray-500">No debug logs yet. Try using voice input.</div>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index} className="text-gray-700 dark:text-gray-300">
                    {log}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Messages */}
      {speechError && (
        <div className="mb-2 p-2 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md text-red-700 dark:text-red-300 text-sm">
          {speechError}
        </div>
      )}

      {/* Voice not supported info */}
      {!speechSupported && !speechError && (
        <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md text-blue-700 dark:text-blue-300 text-sm">
          💡 Voice input not available in this browser.
        </div>
      )}

      {/* Listening Status */}
      {isListening && (
        <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">
              Listening... {transcript && `"${transcript}"`}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <div className="flex-1 relative">
          <textarea
            value={message + (transcript ? ` ${transcript}` : '')}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or use voice input..."
            disabled={disabled}
            rows={1}
            className="w-full resize-none px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          {/* Voice Button */}
          {speechSupported && (
            <button
              type="button"
              onClick={handleVoiceToggle}
              disabled={disabled}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-colors ${
                isListening
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
        </div>
        
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition duration-200 flex items-center justify-center"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;