import admin from 'firebase-admin';

// Use environment variable for the service account JSON
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (!serviceAccount) {
  throw new Error('❌ Missing Firebase service account. Set FIREBASE_SERVICE_ACCOUNT in your env.');
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();
