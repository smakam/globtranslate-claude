const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account key
// Make sure you have the service account key file
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function clearChatsCollection() {
  try {
    console.log('Starting to clear chats collection...');
    
    // Get all documents in the chats collection
    const chatsSnapshot = await db.collection('chats').get();
    
    if (chatsSnapshot.empty) {
      console.log('No chats found to delete.');
      return;
    }
    
    console.log(`Found ${chatsSnapshot.size} chat documents to delete.`);
    
    // Delete each chat document and its subcollections
    for (const chatDoc of chatsSnapshot.docs) {
      console.log(`Deleting chat: ${chatDoc.id}`);
      
      // Delete all messages in this chat
      const messagesSnapshot = await chatDoc.ref.collection('messages').get();
      console.log(`Found ${messagesSnapshot.size} messages in chat ${chatDoc.id}`);
      
      // Delete messages in batches
      const batch = db.batch();
      messagesSnapshot.docs.forEach(messageDoc => {
        batch.delete(messageDoc.ref);
      });
      
      if (messagesSnapshot.size > 0) {
        await batch.commit();
        console.log(`Deleted ${messagesSnapshot.size} messages from chat ${chatDoc.id}`);
      }
      
      // Delete the chat document itself
      await chatDoc.ref.delete();
      console.log(`Deleted chat document: ${chatDoc.id}`);
    }
    
    console.log('Successfully cleared all chats!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing chats:', error);
    process.exit(1);
  }
}

clearChatsCollection();