const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBVc-00Ir8E7eo6EenDYndxuFh7KAuUp-w",
  authDomain: "trans-claude.firebaseapp.com",
  projectId: "trans-claude",
  storageBucket: "trans-claude.firebasestorage.app",
  messagingSenderId: "1012605251086",
  appId: "1:1012605251086:web:5057da611607a4e7d2965f",
  measurementId: "G-99XDVM4SD6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function queryUsers() {
  try {
    console.log('Querying users collection...');
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    
    console.log(`Found ${snapshot.size} users:`);
    console.log('='.repeat(50));
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Firebase UID: ${doc.id}`);
      console.log(`User ID: ${data.id}`);
      console.log(`Username: ${data.username}`);
      console.log(`Language: ${data.language}`);
      console.log(`Online: ${data.isOnline}`);
      console.log(`Last Seen: ${data.lastSeen?.toDate ? data.lastSeen.toDate() : data.lastSeen}`);
      console.log('-'.repeat(30));
    });
  } catch (error) {
    console.error('Error querying users:', error);
  }
}

queryUsers().then(() => {
  console.log('Query completed');
  process.exit(0);
});