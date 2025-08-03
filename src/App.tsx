import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';
import { storageUtils } from './utils/storage';
import { auth, db } from './config/firebase';
import Onboarding from './components/Onboarding';
import Home from './components/Home';
import Chat from './components/Chat';
import VersionDisplay from './components/VersionDisplay';
import ToastContainer from './components/ToastContainer';
import { Language } from './types';
import './App.css';

type AppState = 'loading' | 'onboarding' | 'home' | 'chat';

interface ChatState {
  friendId: string;
  friendUsername: string;
  friendFirebaseUid?: string;
}

function App() {
  const { user, loading, signInAnonymous, updateUsername, updateUserLanguage, signOut, setUser } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { toasts, showToast, removeToast } = useToast();
  const [appState, setAppState] = useState<AppState>('loading');
  const [chatState, setChatState] = useState<ChatState | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        handleSignIn();
      } else if (!user.username) {
        setAppState('onboarding');
      } else {
        setAppState('home');
      }
    }
  }, [user, loading]);

  const handleSignIn = async () => {
    try {
      await signInAnonymous();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleOnboardingComplete = async (username: string, language: string, existingUser?: any) => {
    try {
      if (existingUser) {
        // For existing users, update current Firebase user document to use existing user's ID
        if (user && auth.currentUser) {
          // Update the current Firebase user document with existing user's data
          await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
            id: existingUser.id, // Use existing user's ID
            username: existingUser.username,
            language: existingUser.language || language,
            isOnline: true,
            lastSeen: new Date()
          });
          
          // Manually update the local user state to avoid auth state race condition
          setUser({
            ...user,
            id: existingUser.id,
            username: existingUser.username,
            language: existingUser.language || language,
            isOnline: true,
            lastSeen: new Date()
          });
        }
      } else {
        // New user flow
        await updateUsername(username);
        await updateUserLanguage(language);
      }
      
      // The useEffect will handle state change when user updates
    } catch (error) {
      console.error('Onboarding failed:', error);
    }
  };

  const handleConnectFriend = (friendId: string, friendUsername: string, friendFirebaseUid?: string) => {
    // Add to recent friends
    storageUtils.addRecentFriend({
      id: friendId,
      username: friendUsername,
      lastConnected: new Date()
    });

    setChatState({ friendId, friendUsername, friendFirebaseUid });
    setAppState('chat');
  };

  const handleBackToHome = () => {
    setChatState(null);
    setAppState('home');
  };

  const handleLanguageChange = async (language: Language) => {
    try {
      await updateUserLanguage(language);
    } catch (error) {
      console.error('Language update failed:', error);
      throw error; // Re-throw so Chat component can handle the error
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setChatState(null);
      setAppState('loading');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div data-testid="loading-spinner" className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
        <VersionDisplay />
      </div>
    );
  }

  if (appState === 'onboarding' && user) {
    return (
      <Onboarding
        userId={user.id}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  if (appState === 'home' && user) {
    return (
      <>
        <Home
          user={user}
          onConnectFriend={handleConnectFriend}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleTheme}
          onSignOut={handleSignOut}
          showToast={showToast}
        />
        <VersionDisplay />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  if (appState === 'chat' && user && chatState) {
    return (
      <>
        <Chat
          currentUserId={user.id}
          currentUsername={user.username}
          friendId={chatState.friendId}
          friendUsername={chatState.friendUsername}
          friendFirebaseUid={chatState.friendFirebaseUid}
          userLanguage={user.language}
          onBack={handleBackToHome}
          onLanguageChange={handleLanguageChange}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleTheme}
        />
        <VersionDisplay />
      </>
    );
  }

  return null;
}

export default App;
