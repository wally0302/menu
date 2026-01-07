import { useState, useEffect } from 'react';
import { Participant, Room, MenuItem, CartState } from '../types';
import * as fbService from '../services/firebase';
import { firebaseConfig } from '../services/firebaseConfig';
import { doc, onSnapshot, collection } from 'firebase/firestore';

const STORAGE_KEY_USER_NAME = 'menulingo_user_name';

export function useGroupOrder() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [roomData, setRoomData] = useState<Room | null>(null);
    const [userName, setUserName] = useState<string>(localStorage.getItem(STORAGE_KEY_USER_NAME) || '');
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        // Check if config is valid
        if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
            setIsInitialized(true);
        }
    }, []);

    const createGroupOrder = async (items: MenuItem[], currency: string) => {
        if (!isInitialized) throw new Error("Firebase not configured");
        const roomId = await fbService.createRoom(items, currency);
        setCurrentRoomId(roomId);
        setIsHost(true);

        // Join as host immediately
        const uid = await fbService.joinRoom(roomId, "Host");
        setUserId(uid);
        return roomId;
    };

    const joinGroupOrder = async (roomId: string, name: string) => {
        if (!isInitialized) throw new Error("Firebase not configured");
        localStorage.setItem(STORAGE_KEY_USER_NAME, name);
        setUserName(name);

        const uid = await fbService.joinRoom(roomId, name);
        setUserId(uid);
        setCurrentRoomId(roomId);
        setIsHost(false);
    };

    const updateCart = async (cart: CartState) => {
        if (currentRoomId && isInitialized) {
            await fbService.updateParticipantCart(currentRoomId, cart);
        }
    };

    // Listen to Room Data
    useEffect(() => {
        if (!currentRoomId || !isInitialized) return;
        const db = fbService.getDb();
        if (!db) return;

        const unsubRoom = onSnapshot(doc(db, 'rooms', currentRoomId), (doc) => {
            if (doc.exists()) {
                setRoomData(doc.data() as Room);
            }
        });

        const unsubParticipants = onSnapshot(collection(db, 'rooms', currentRoomId, 'participants'), (snapshot) => {
            const parts: Participant[] = [];
            snapshot.forEach(doc => {
                parts.push(doc.data() as Participant);
            });
            setParticipants(parts);
        });

        return () => {
            unsubRoom();
            unsubParticipants();
        };
    }, [currentRoomId, isInitialized]);

    return {
        isInitialized,
        createGroupOrder,
        joinGroupOrder,
        currentRoomId,
        isHost,
        roomData,
        participants,
        userName,
        setUserName,
        updateCart,
        userId
    };
}
