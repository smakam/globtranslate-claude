import { useState, useEffect } from 'react';
import { User as FirebaseUser, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';
import { generateUserId } from '../utils/idGenerator';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Skip fetching if we're in the middle of updating user data
          if (isUpdating) {
            setLoading(false);
            return;
          }
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser(userData);
            // Update online status
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              isOnline: true,
              lastSeen: new Date(),
              lastOnlineUpdate: new Date()
            });
            
            // Set up heartbeat to keep status fresh
            heartbeatInterval = setInterval(async () => {
              try {
                await updateDoc(doc(db, 'users', firebaseUser.uid), {
                  isOnline: true,
                  lastSeen: new Date(),
                  lastOnlineUpdate: new Date()
                });
              } catch (error) {
                console.error('Heartbeat update failed:', error);
              }
            }, 30000); // Update every 30 seconds
            
            // Handle page unload to set offline status
            const handleBeforeUnload = async () => {
              try {
                await updateDoc(doc(db, 'users', firebaseUser.uid), {
                  isOnline: false,
                  lastSeen: new Date()
                });
              } catch (error) {
                console.error('Failed to update offline status on unload:', error);
              }
            };
            
            window.addEventListener('beforeunload', handleBeforeUnload);
            window.addEventListener('unload', handleBeforeUnload);
          } else {
            // User document doesn't exist yet, wait for it to be created
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      // Clean up event listeners
      window.removeEventListener('beforeunload', () => {});
      window.removeEventListener('unload', () => {});
    };
  }, [isUpdating]);

  const signInAnonymous = async (): Promise<string> => {
    try {
      const result = await signInAnonymously(auth);
      
      // Check if this Firebase UID already has a user document
      const existingUserDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (existingUserDoc.exists()) {
        const userData = existingUserDoc.data() as User;
        setUser(userData);
        return userData.id;
      } else {
        // Create new user
        const userId = generateUserId();
        
        const newUser: User = {
          id: userId,
          username: '',
          isOnline: true,
          lastSeen: new Date(),
          language: 'en'
        };

        await setDoc(doc(db, 'users', result.user.uid), newUser);
        
        setUser(newUser);
        
        return userId;
      }
    } catch (error) {
      console.error('Anonymous sign-in failed:', error);
      throw error;
    }
  };

  const updateUsername = async (username: string): Promise<void> => {
    if (!auth.currentUser || !user) {
      return;
    }
    
    try {
      setIsUpdating(true);
      const updatedUser = { ...user, username };
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { username });
      
      // Update local state immediately to prevent race condition
      setUser(updatedUser);
      
      // Small delay to ensure Firestore propagation, then allow auth listener
      setTimeout(() => {
        setIsUpdating(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to update username:', error);
      setIsUpdating(false);
      throw error;
    }
  };

  const updateUserLanguage = async (language: string): Promise<void> => {
    if (!auth.currentUser || !user) {
      return;
    }
    
    try {
      const updatedUser = { ...user, language };
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
        language,
        lastLanguageUpdate: new Date()
      });
      
      // Update local state immediately
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update language:', error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    if (!auth.currentUser) return;
    
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        isOnline: false,
        lastSeen: new Date()
      });
      await auth.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signInAnonymous,
    updateUsername,
    updateUserLanguage,
    signOut,
    setUser
  };
};