import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const userService = {
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      console.log('Checking username availability for:', username);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      console.log('Executing Firestore query...');
      const querySnapshot = await getDocs(q);
      console.log('Query completed. Empty:', querySnapshot.empty, 'Size:', querySnapshot.size);
      
      if (!querySnapshot.empty) {
        console.log('Found existing users with username:', querySnapshot.docs.map(doc => doc.data()));
      }
      
      return querySnapshot.empty;
    } catch (error) {
      console.error('Error checking username availability:', error);
      console.error('Error details:', error);
      throw error;
    }
  },

  async getUserById(userId: string): Promise<any | null> {
    try {
      console.log('🔧 UserService: Looking up user by ID:', userId);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('id', '==', userId));
      const querySnapshot = await getDocs(q);
      
      console.log(`🔧 UserService: Found ${querySnapshot.size} users with ID "${userId}"`);
      
      if (!querySnapshot.empty) {
        // Log all matching users to debug duplicates
        querySnapshot.docs.forEach((doc, index) => {
          const userData = doc.data();
          console.log(`🔧 UserService: User ${index + 1}:`, {
            firebaseUid: doc.id,
            id: userData.id,
            username: userData.username,
            language: userData.language,
            isOnline: userData.isOnline,
            lastSeen: userData.lastSeen?.toDate(),
            lastOnlineUpdate: userData.lastOnlineUpdate?.toDate()
          });
        });
        
        // Find the most recent online user
        let bestUser = null;
        let bestDoc = null;
        
        for (const doc of querySnapshot.docs) {
          const userData = doc.data();
          
          // Prefer online users first
          if (userData.isOnline) {
            if (!bestUser || !bestUser.isOnline) {
              bestUser = userData;
              bestDoc = doc;
              continue;
            }
            
            // Among online users, prefer the one with more recent activity
            const currentLastSeen = userData.lastSeen?.toDate() || new Date(0);
            const bestLastSeen = bestUser.lastSeen?.toDate() || new Date(0);
            
            if (currentLastSeen > bestLastSeen) {
              bestUser = userData;
              bestDoc = doc;
            }
          } else if (!bestUser || !bestUser.isOnline) {
            // If no online users, prefer the one with most recent activity
            const currentLastSeen = userData.lastSeen?.toDate() || new Date(0);
            const bestLastSeen = bestUser?.lastSeen?.toDate() || new Date(0);
            
            if (currentLastSeen > bestLastSeen) {
              bestUser = userData;
              bestDoc = doc;
            }
          }
        }
        
        // Fallback to first user if no selection logic worked
        if (!bestUser || !bestDoc) {
          bestDoc = querySnapshot.docs[0];
          bestUser = bestDoc.data();
        }
        
        bestUser.firebaseUid = bestDoc.id;
        console.log(`🔧 UserService: Selected user (out of ${querySnapshot.size}):`, {
          firebaseUid: bestUser.firebaseUid,
          username: bestUser.username,
          language: bestUser.language,
          isOnline: bestUser.isOnline
        });
        return bestUser;
      }
      console.log('🔧 UserService: No user found with ID:', userId);
      return null;
    } catch (error) {
      console.error('🔧 UserService: Error getting user by ID:', error);
      throw error;
    }
  },

  async getUserByUsername(username: string): Promise<any | null> {
    try {
      console.log('Looking up user by username:', username);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      console.log(`Found ${querySnapshot.size} users with username "${username}"`);
      
      if (!querySnapshot.empty) {
        // Log all matching users to debug duplicates
        querySnapshot.docs.forEach((doc, index) => {
          const userData = doc.data();
          console.log(`User ${index + 1}:`, {
            firebaseUid: doc.id,
            ...userData
          });
        });
        
        const doc = querySnapshot.docs[0];
        const userData = doc.data();
        // Include the Firebase document ID (Auth UID) for monitoring online status
        userData.firebaseUid = doc.id;
        console.log('Returning first user found:', userData);
        return userData;
      }
      console.log('No user found with username:', username);
      return null;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }
};