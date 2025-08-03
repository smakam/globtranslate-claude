const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Load Firebase configuration from environment variables
require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Validate required environment variables
const requiredVars = ['REACT_APP_FIREBASE_API_KEY', 'REACT_APP_FIREBASE_PROJECT_ID'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('Please ensure .env file is properly configured');
  process.exit(1);
}

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