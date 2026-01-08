import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion, serverTimestamp, deleteDoc, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { MenuItem, Room, Participant, FirebaseConfig } from '../types';

let app: any;
let db: any;
let auth: any;

export const initFirebase = (config: FirebaseConfig) => {
    if (!app) {
        app = initializeApp(config);
        db = getFirestore(app);
        auth = getAuth(app);
    }
    return { app, db, auth };
};

export const getDb = () => db;
export const getFirebaseAuth = () => auth;

// Helper to generate a random room ID (e.g., 6 chars)
export const generateRoomId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// --- API Service Methods ---

export const createRoom = async (items: MenuItem[], currency: string) => {
    if (!db || !auth) throw new Error("Firebase not initialized");

    // Ensure user is signed in anonymously
    let user = auth.currentUser;
    if (!user) {
        const userCred = await signInAnonymously(auth);
        user = userCred.user;
    }

    const roomId = generateRoomId();
    const roomRef = doc(db, 'rooms', roomId);

    const roomData: Room = {
        id: roomId,
        createdAt: serverTimestamp(),
        status: 'active',
        hostId: user.uid,
        items,
        currency
    };

    await setDoc(roomRef, roomData);
    return roomId;
};

export const joinRoom = async (roomId: string, name: string) => {
    if (!db || !auth) throw new Error("Firebase not initialized");

    let user = auth.currentUser;
    if (!user) {
        const userCred = await signInAnonymously(auth);
        user = userCred.user;
    }

    const participantRef = doc(db, 'rooms', roomId, 'participants', user.uid);

    // Check if already joined to avoid overwriting cart if re-joining
    const snap = await getDoc(participantRef);
    if (!snap.exists()) {
        const participantData: Participant = {
            id: user.uid,
            name,
            joinedAt: Date.now(),
            cart: {},
        };
        await setDoc(participantRef, participantData);
    } else {
        // Update name just in case
        await updateDoc(participantRef, { name });
    }

    return user.uid;
};

export const updateParticipantCart = async (roomId: string, cart: Record<string, number>) => {
    if (!db || !auth) throw new Error("Firebase not initialized");
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const participantRef = doc(db, 'rooms', roomId, 'participants', user.uid);
    await updateDoc(participantRef, { cart });
};

export const deleteRoom = async (roomId: string) => {
    if (!db || !auth) throw new Error("Firebase not initialized");

    // 1. Delete all participants in subcollection
    const participantsRef = collection(db, 'rooms', roomId, 'participants');
    const snapshot = await getDocs(participantsRef);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // 2. Delete the room document
    await deleteDoc(doc(db, 'rooms', roomId));
};
