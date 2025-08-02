import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import { Message, Language } from '../types';
import { useChat } from '../hooks/useChat';
import { useTranslation } from '../hooks/useTranslation';
import { generateChatId } from '../utils/idGenerator';

interface ChatProps {
  currentUserId: string;
  currentUsername: string;
  friendId: string;
  friendUsername: string;
  friendFirebaseUid?: string;
  userLanguage: string;
  onBack: () => void;
  onLanguageChange: (language: Language) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Chat: React.FC<ChatProps> = ({
  currentUserId,
  currentUsername,
  friendId,
  friendUsername,
  friendFirebaseUid,
  userLanguage,
  onBack,
  onLanguageChange,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [friendLanguage, setFriendLanguage] = useState<string>('en');
  const [currentUserLanguage, setCurrentUserLanguage] = useState<string>(userLanguage);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Update local language state when prop changes
  useEffect(() => {
    setCurrentUserLanguage(userLanguage);
  }, [userLanguage]);
  
  // Monitor friend's language changes in real-time with retry mechanism
  useEffect(() => {
    let friendLanguageUnsubscribe = () => {};
    
    const setupFriendLanguageMonitoring = async () => {
      let retryCount = 0;
      const maxRetries = 3;
      
      const setupLanguageListener = async () => {
        try {
          console.log(`🔧 Language Monitor: Starting setup for friend ${friendId}, attempt ${retryCount + 1}`);
          const { userService } = await import('../services/userService');
          const { doc, onSnapshot } = await import('firebase/firestore');
          const { db } = await import('../config/firebase');
          
          // Get friend's current Firebase session
          const friendData = await userService.getUserById(friendId);
          
          console.log(`🔧 Language Monitor: Friend lookup result:`, friendData);
          
          if (friendData && friendData.firebaseUid) {
            const friendFirebaseUid = friendData.firebaseUid;
            console.log(`🔧 Found friend's current Firebase UID for language monitoring: ${friendFirebaseUid}`);
            const friendDocRef = doc(db, 'users', friendFirebaseUid);
            
            friendLanguageUnsubscribe = onSnapshot(friendDocRef, (doc) => {
              if (doc.exists()) {
                const data = doc.data();
                const language = data.language || 'en';
                const lastLanguageUpdate = data.lastLanguageUpdate?.toDate();
                console.log(`🔧 Friend's language monitor fired:`, {
                  friendId,
                  firebaseUid: friendFirebaseUid,
                  currentLanguage: language,
                  previousLanguage: friendLanguage,
                  lastLanguageUpdate,
                  rawData: data
                });
                
                // Always update, don't check for differences as it can cause race conditions
                setFriendLanguage(language);
                console.log(`🔧 Friend's language set to: ${language}`);
              } else {
                console.log(`🔧 Friend document not found for language monitoring`);
                setFriendLanguage('en'); // fallback
              }
            }, (error) => {
              console.error(`🔧 Error monitoring friend's language:`, error);
              if (retryCount < maxRetries) {
                retryCount++;
                console.log(`🔧 Retrying language monitoring (${retryCount}/${maxRetries})...`);
                setTimeout(setupLanguageListener, 2000 * retryCount);
              } else {
                console.error(`🔧 Failed to establish language monitoring after ${maxRetries} attempts`);
                setFriendLanguage('en'); // fallback
              }
            });
          } else {
            console.log(`🔧 Friend not found or no Firebase UID for language monitoring`);
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`🔧 Retrying friend lookup for language monitoring (${retryCount}/${maxRetries})...`);
              setTimeout(setupLanguageListener, 2000 * retryCount);
            } else {
              console.error(`🔧 Failed to find friend for language monitoring after ${maxRetries} attempts`);
              setFriendLanguage('en'); // fallback
            }
          }
        } catch (error) {
          console.error('🔧 Error setting up friend language monitoring:', error);
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`🔧 Retrying language monitoring setup (${retryCount}/${maxRetries})...`);
            setTimeout(setupLanguageListener, 2000 * retryCount);
          } else {
            console.error(`🔧 Failed to setup language monitoring after ${maxRetries} attempts`);
            setFriendLanguage('en'); // fallback
          }
        }
      };
      
      setupLanguageListener();
    };
    
    setupFriendLanguageMonitoring();
    
    return () => {
      friendLanguageUnsubscribe();
    };
  }, [friendId]);
  
  const { messages, sendMessage, clearChat, isConnected, friendOnline, friendLastSeen } = useChat(
    currentUserId,
    friendId,
    currentUsername,
    friendFirebaseUid
  );
  
  const { translateText } = useTranslation();
  
  // Debug info
  const chatId = generateChatId(currentUserId, friendId);
  const [showDebug, setShowDebug] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    try {
      console.log(`🔧 Translation attempt: "${text}" from ${currentUserLanguage} to ${friendLanguage}`);
      
      // Translate the message to friend's language
      const translatedText = await translateText(text, currentUserLanguage, friendLanguage);
      
      console.log(`🔧 Translation result: "${translatedText}"`);
      await sendMessage(text, translatedText);
    } catch (error) {
      console.error('🔧 Translation failed:', error);
      // Send without translation as fallback
      await sendMessage(text, text);
    }
  };

  const handleLanguageChangeLocal = async (language: Language) => {
    try {
      console.log(`🔧 User changing language from "${currentUserLanguage}" to "${language}"`);
      setCurrentUserLanguage(language);
      await onLanguageChange(language);
      console.log(`🔧 Language change completed to: ${language}`);
    } catch (error) {
      console.error('🔧 Failed to change language:', error);
      // Revert local state if update failed
      setCurrentUserLanguage(userLanguage);
    }
  };


  const handleSettingsClick = () => {
    // TODO: Implement settings modal
    console.log('Settings clicked');
  };

  const handleClearChat = async () => {
    try {
      await clearChat();
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const testFriendLookup = async () => {
    try {
      console.log(`🔧 TEST: Manual friend lookup for ID: ${friendId}`);
      const { userService } = await import('../services/userService');
      const friendData = await userService.getUserById(friendId);
      setDebugInfo({ 
        lastLookup: new Date().toLocaleTimeString(),
        friendData,
        friendId,
        currentUserId 
      });
    } catch (error) {
      console.error('🔧 TEST: Friend lookup failed:', error);
      setDebugInfo({ 
        lastLookup: new Date().toLocaleTimeString(),
        error: error instanceof Error ? error.message : String(error),
        friendId,
        currentUserId 
      });
    }
  };

  const forceOnlineStatus = async () => {
    try {
      console.log('🔧 TEST: Forcing current user online status...');
      const { auth, db } = await import('../config/firebase');
      const { updateDoc, doc } = await import('firebase/firestore');
      
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          isOnline: true,
          lastSeen: new Date(),
          lastOnlineUpdate: new Date()
        });
        console.log('🔧 TEST: Forced online status updated');
      }
    } catch (error) {
      console.error('🔧 TEST: Force online failed:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <ChatHeader
        friendUsername={friendUsername}
        friendOnline={friendOnline}
        friendLastSeen={friendLastSeen}
        onBack={onBack}
        onSettingsClick={handleSettingsClick}
        onClearChat={handleClearChat}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
        userLanguage={currentUserLanguage}
        onLanguageChange={handleLanguageChangeLocal}
      />
      
      {/* Debug Panel */}
      {showDebug && (
        <div className="bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 dark:border-yellow-400 p-3 m-2 text-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-yellow-800 dark:text-yellow-200">Debug Info</span>
            <button 
              onClick={() => setShowDebug(false)}
              className="text-yellow-600 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-100"
            >
              ✕
            </button>
          </div>
          <div className="text-yellow-800 dark:text-yellow-200">
            <p><strong>Chat ID:</strong> {chatId}</p>
            <p><strong>Your ID:</strong> {currentUserId}</p>
            <p><strong>Friend ID:</strong> {friendId}</p>
            <p><strong>Friend Firebase UID:</strong> {friendFirebaseUid || 'Not available'}</p>
            <p><strong>Connection Status:</strong> 
              <span className={
                isConnected === true ? 'text-green-600' : 
                isConnected === 'connecting' ? 'text-yellow-600' : 'text-red-600'
              }>
                {isConnected === true ? ' ✓ Connected' : 
                 isConnected === 'connecting' ? ' 🔄 Connecting...' : ' ✗ Disconnected'}
              </span>
            </p>
            <p><strong>Friend Online:</strong> 
              <span className={friendOnline ? 'text-green-600' : 'text-red-600'}>
                {friendOnline ? ' ✓ Online' : ' ✗ Offline'}
              </span>
            </p>
            <p><strong>Messages Count:</strong> {messages.length}</p>
            <p><strong>Your Language:</strong> {currentUserLanguage}</p>
            <p><strong>Friend Language:</strong> {friendLanguage}</p>
            <p><strong>Translation Direction:</strong> {currentUserLanguage} → {friendLanguage}</p>
            <div className="flex gap-2 mt-2">
              <button 
                onClick={testFriendLookup}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                Test Friend Lookup
              </button>
              <button 
                onClick={forceOnlineStatus}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm"
              >
                Force Online
              </button>
            </div>
            {debugInfo.lastLookup && (
              <div className="mt-2 p-2 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                <p><strong>Last Test:</strong> {debugInfo.lastLookup}</p>
                {debugInfo.error ? (
                  <p className="text-red-600"><strong>Error:</strong> {debugInfo.error}</p>
                ) : (
                  <div>
                    <p><strong>Found Friend:</strong> {debugInfo.friendData ? 'Yes' : 'No'}</p>
                    {debugInfo.friendData && (
                      <>
                        <p><strong>Firebase UID:</strong> {debugInfo.friendData.firebaseUid}</p>
                        <p><strong>Username:</strong> {debugInfo.friendData.username}</p>
                        <p><strong>Language:</strong> {debugInfo.friendData.language}</p>
                        <p><strong>Online:</strong> {debugInfo.friendData.isOnline ? 'Yes' : 'No'}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No messages yet. Start the conversation!
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Messages will be automatically translated
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
                userLanguage={currentUserLanguage}
                friendLanguage={friendLanguage}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isConnected !== true}
        userLanguage={currentUserLanguage}
      />
      
      {isConnected !== true && (
        <div className={`border-t px-4 py-2 ${
          isConnected === 'connecting' 
            ? 'bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800'
            : 'bg-yellow-100 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800'
        }`}>
          <p className={`text-sm text-center ${
            isConnected === 'connecting'
              ? 'text-blue-800 dark:text-blue-200'
              : 'text-yellow-800 dark:text-yellow-200'
          }`}>
            {isConnected === 'connecting' ? 'Connecting to chat...' : 'Disconnected from chat'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Chat;