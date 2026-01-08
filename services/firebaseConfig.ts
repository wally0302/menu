import { FirebaseConfig } from '../types';

// PASTE YOUR FIREBASE CONFIG HERE
// Get this from: Firebase Console -> Project Settings -> General -> Your Apps -> SDK Setup
// 
// SECURITY NOTE: These keys (apiKey, authDomain, etc.) are public-facing Firebase configuration keys.
// They are safe to expose in a client-side app IF you have configured security rules in Firebase Console.
// HOWEVER, do NOT use "Service Account" keys (admin SDK keys) here.
// 
// For Google Gemini API Key (used in other files):
// Ensure you restrict the API key in Google Cloud Console to only accept requests from your domain.
export const firebaseConfig: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};
