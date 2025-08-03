// Run this in the Firebase console to clear chats collection
// Go to: https://console.firebase.google.com/project/trans-claude/firestore/data
// Then run this script in the browser console

const clearChats = async () => {
  const db = firebase.firestore();
  
  console.log('Starting to clear chats...');
  
  // Get all chats
  const chatsSnapshot = await db.collection('chats').get();
  
  console.log(`Found ${chatsSnapshot.size} chats to delete`);
  
  // Delete each chat and its messages
  for (const chatDoc of chatsSnapshot.docs) {
    console.log(`Deleting chat: ${chatDoc.id}`);
    
    // Delete all messages in this chat
    const messagesSnapshot = await chatDoc.ref.collection('messages').get();
    
    // Delete messages in batches
    const batch = db.batch();
    messagesSnapshot.docs.forEach(messageDoc => {
      batch.delete(messageDoc.ref);
    });
    
    if (messagesSnapshot.size > 0) {
      await batch.commit();
      console.log(`Deleted ${messagesSnapshot.size} messages`);
    }
    
    // Delete the chat document
    await chatDoc.ref.delete();
  }
  
  console.log('All chats cleared!');
};

clearChats();