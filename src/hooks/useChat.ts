import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  updateDoc,
  getDoc,
  setDoc,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Message } from '../types';
import { generateChatId, generateMessageId } from '../utils/idGenerator';
import { storageUtils } from '../utils/storage';

export const useChat = (currentUserId: string, friendId: string, currentUsername: string, friendFirebaseUid?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState<boolean | 'connecting'>(false);
  const [friendOnline, setFriendOnline] = useState(false);
  const [friendLastSeen, setFriendLastSeen] = useState<Date | undefined>();
  
  const chatId = generateChatId(currentUserId, friendId);

  useEffect(() => {
    console.log(`🔧 Setting up chat for chatId: ${chatId}`);
    console.log(`🔧 Current user: ${currentUserId}, Friend: ${friendId}`);
    console.log(`🔧 Friend Firebase UID: ${friendFirebaseUid}`);
    
    let unsubscribe = () => {};
    let friendUnsubscribe = () => {};
    
    const setupChat = async () => {
      try {
        // Set connecting state immediately
        setIsConnected('connecting');
        
        // Check authentication status
        const currentUserFirebaseUid = auth.currentUser?.uid;
        if (!currentUserFirebaseUid) {
          console.error('🔧 User not authenticated! Cannot access Firestore.');
          setIsConnected(false);
          return;
        }
        console.log(`🔧 User authenticated with UID: ${currentUserFirebaseUid}`);
        
        // Initialize chat document if it doesn't exist
        const chatDocRef = doc(db, 'chats', chatId);
        console.log(`🔧 Attempting to read chat document: ${chatId}`);
        const chatDoc = await getDoc(chatDocRef);
        
        if (!chatDoc.exists()) {
          console.log(`🔧 Creating new chat document: ${chatId}`);
          // Get current user's Firebase UID
          const currentUserFirebaseUid = auth.currentUser?.uid;
          if (!currentUserFirebaseUid) {
            throw new Error('Current user not authenticated');
          }
          if (!friendFirebaseUid) {
            throw new Error('Friend Firebase UID not provided');
          }
          
          console.log(`🔧 Current user Firebase UID: ${currentUserFirebaseUid}`);
          console.log(`🔧 Friend Firebase UID: ${friendFirebaseUid}`);
          console.log(`🔧 Using Firebase UIDs for participants: [${currentUserFirebaseUid}, ${friendFirebaseUid}]`);
          
          const chatData = {
            participants: [currentUserFirebaseUid, friendFirebaseUid],
            userIds: [currentUserId, friendId], // Keep custom IDs for reference
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          console.log(`🔧 Creating chat document with data:`, chatData);
          await setDoc(chatDocRef, chatData);
          console.log(`🔧 Chat document created successfully in Firestore`);
        } else {
          console.log(`🔧 Chat document already exists`);
        }

        // Load local chat history
        const localHistory = storageUtils.getChatHistory(chatId);
        setMessages(localHistory);
        console.log(`🔧 Loaded ${localHistory.length} messages from local storage`);

        // Set up real-time listener for messages
        console.log(`🔧 Setting up Firestore listener for messages`);
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          console.log(`🔧 Messages snapshot received: ${snapshot.size} messages`);
          console.log('🔧 Snapshot metadata:', {
            hasPendingWrites: snapshot.metadata.hasPendingWrites,
            fromCache: snapshot.metadata.fromCache,
            isEqual: snapshot.metadata.isEqual
          });
          
          const newMessages: Message[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            console.log('🔧 Message doc data:', data);
            newMessages.push({
              id: doc.id,
              senderId: data.senderId,
              senderUsername: data.senderUsername,
              originalText: data.originalText,
              translatedText: data.translatedText,
              timestamp: data.timestamp?.toDate() || new Date(),
              chatId: chatId
            });
          });
          
          setMessages(newMessages);
          setIsConnected(true);
          console.log(`🔧 Successfully connected to chat. Updated messages state with ${newMessages.length} messages`);
        }, (error) => {
          console.error('🔧 Error listening to messages:', error);
          console.error('🔧 Error details:', error.code, error.message);
          setIsConnected(false);
        });

        // Monitor friend's online status with retry mechanism
        console.log(`🔧 Setting up friend status monitoring for friend ID: ${friendId}`);
        
        const monitorFriendStatus = async () => {
          let retryCount = 0;
          const maxRetries = 3;
          
          const setupMonitoring = async () => {
            try {
              console.log(`🔧 Status Monitor: Starting setup for friend ${friendId}, attempt ${retryCount + 1}`);
              const { userService } = await import('../services/userService');
              const friendData = await userService.getUserById(friendId);
              
              console.log(`🔧 Status Monitor: Friend lookup result:`, friendData);
              
              if (friendData && friendData.firebaseUid) {
                const friendFirebaseUid = friendData.firebaseUid;
                console.log(`🔧 Found friend's current Firebase UID: ${friendFirebaseUid}`);
                const friendDocRef = doc(db, 'users', friendFirebaseUid);
                
                friendUnsubscribe = onSnapshot(friendDocRef, (doc) => {
                  if (doc.exists()) {
                    const data = doc.data();
                    const isOnline = data.isOnline || false;
                    const lastSeen = data.lastSeen?.toDate();
                    const lastOnlineUpdate = data.lastOnlineUpdate?.toDate();
                    
                    // Consider user offline if no heartbeat for 2 minutes
                    const now = new Date();
                    const timeSinceLastUpdate = lastOnlineUpdate ? now.getTime() - lastOnlineUpdate.getTime() : Infinity;
                    const isReallyOnline = isOnline && timeSinceLastUpdate < 120000; // 2 minutes
                    
                    console.log(`🔧 Friend status update:`, {
                      friendId,
                      firebaseUid: friendFirebaseUid,
                      isOnline,
                      isReallyOnline,
                      lastSeen,
                      lastOnlineUpdate,
                      timeSinceLastUpdate: `${Math.round(timeSinceLastUpdate / 1000)}s`,
                      rawData: data
                    });
                    
                    setFriendOnline(isReallyOnline);
                    setFriendLastSeen(lastSeen);
                  } else {
                    console.log(`🔧 Friend document not found, they may be offline`);
                    setFriendOnline(false);
                  }
                }, (error) => {
                  console.error(`🔧 Error monitoring friend status:`, error);
                  if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`🔧 Retrying friend status monitoring (${retryCount}/${maxRetries})...`);
                    setTimeout(setupMonitoring, 2000 * retryCount);
                  } else {
                    setFriendOnline(false);
                  }
                });
              } else {
                console.log(`🔧 Friend not found or no Firebase UID available`);
                if (retryCount < maxRetries) {
                  retryCount++;
                  console.log(`🔧 Retrying friend lookup (${retryCount}/${maxRetries})...`);
                  setTimeout(setupMonitoring, 2000 * retryCount);
                } else {
                  setFriendOnline(false);
                }
              }
            } catch (error) {
              console.error(`🔧 Error setting up friend monitoring:`, error);
              if (retryCount < maxRetries) {
                retryCount++;
                console.log(`🔧 Retrying friend monitoring setup (${retryCount}/${maxRetries})...`);
                setTimeout(setupMonitoring, 2000 * retryCount);
              } else {
                setFriendOnline(false);
              }
            }
          };
          
          setupMonitoring();
        };
        
        monitorFriendStatus();

      } catch (error) {
        console.error('🔧 Error setting up chat:', error);
        setIsConnected(false);
      }
    };

    setupChat();

    return () => {
      unsubscribe();
      friendUnsubscribe();
    };
  }, [chatId, friendId, friendFirebaseUid]);

  useEffect(() => {
    // Save messages to local storage whenever they change
    if (messages.length > 0) {
      messages.forEach(message => {
        storageUtils.addMessageToHistory(chatId, message);
      });
    }
  }, [messages, chatId]);

  const sendMessage = async (originalText: string, translatedText: string) => {
    try {
      const messageData = {
        senderId: currentUserId,
        senderUsername: currentUsername,
        originalText,
        translatedText,
        timestamp: serverTimestamp(),
        chatId
      };

      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, messageData);

      // Update chat metadata
      const chatDocRef = doc(db, 'chats', chatId);
      const currentUserFirebaseUid = auth.currentUser?.uid;
      if (!currentUserFirebaseUid || !friendFirebaseUid) {
        console.error('Missing Firebase UIDs for chat update');
        return;
      }
      
      await updateDoc(chatDocRef, {
        lastMessage: {
          text: originalText,
          timestamp: serverTimestamp(),
          senderId: currentUserId
        },
        participants: [currentUserFirebaseUid, friendFirebaseUid],
        userIds: [currentUserId, friendId],
        updatedAt: serverTimestamp()
      }).catch(async () => {
        // Create chat document if it doesn't exist
        await setDoc(chatDocRef, {
          participants: [currentUserFirebaseUid, friendFirebaseUid],
          userIds: [currentUserId, friendId],
          createdAt: serverTimestamp(),
          lastMessage: {
            text: originalText,
            timestamp: serverTimestamp(),
            senderId: currentUserId
          },
          updatedAt: serverTimestamp()
        });
      });

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const clearChat = async () => {
    try {
      console.log(`🔧 Clearing chat messages for chatId: ${chatId}`);
      
      // Clear local state immediately for instant UI update
      setMessages([]);
      console.log(`🔧 UI cleared immediately`);
      
      // Clear from local storage
      storageUtils.clearChatHistory(chatId);
      console.log(`🔧 Cleared local chat history`);
      
      // Clear from Firestore (in background)
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      
      if (messagesSnapshot.size > 0) {
        const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log(`🔧 Deleted ${messagesSnapshot.size} messages from Firestore`);
      } else {
        console.log(`🔧 No messages to delete from Firestore`);
      }
      
      console.log(`🔧 Chat cleared successfully`);
    } catch (error) {
      console.error('Error clearing chat:', error);
      throw error;
    }
  };

  return {
    messages,
    sendMessage,
    clearChat,
    isConnected,
    friendOnline,
    friendLastSeen
  };
};