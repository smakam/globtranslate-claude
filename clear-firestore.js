const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: 'trans-claude'
};

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'trans-claude'
});

const db = admin.firestore();

async function deleteCollection(collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve, reject);
  });
}

async function deleteQueryBatch(db, query, resolve, reject) {
  try {
    const snapshot = await query.get();

    // When there are no documents left, we are done
    if (snapshot.size === 0) {
      resolve();
      return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${snapshot.size} documents`);

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
      deleteQueryBatch(db, query, resolve, reject);
    });
  } catch (error) {
    reject(error);
  }
}

async function deleteSubcollections(parentDocRef) {
  const subcollections = await parentDocRef.listCollections();
  
  for (const subcollection of subcollections) {
    console.log(`Deleting subcollection: ${subcollection.path}`);
    await deleteCollection(subcollection.path);
  }
}

async function clearChatData() {
  try {
    console.log('Starting to clear Firestore chat data...');
    
    // First, get all chat documents and delete their subcollections
    console.log('Fetching all chat documents...');
    const chatsSnapshot = await db.collection('chats').get();
    
    console.log(`Found ${chatsSnapshot.size} chat documents`);
    
    // Delete subcollections (messages) for each chat
    for (const chatDoc of chatsSnapshot.docs) {
      console.log(`Processing chat: ${chatDoc.id}`);
      await deleteSubcollections(chatDoc.ref);
    }
    
    // Now delete all chat documents
    console.log('Deleting all chat documents...');
    await deleteCollection('chats');
    
    // Optionally clear user data (uncomment if needed)
    // console.log('Deleting all user documents...');
    // await deleteCollection('users');
    
    console.log('✅ Successfully cleared all chat data from Firestore!');
    
  } catch (error) {
    console.error('❌ Error clearing Firestore data:', error);
  } finally {
    // Close the admin app
    admin.app().delete();
  }
}

// Run the cleanup
clearChatData();