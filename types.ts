
export interface MenuItem {
  id: string;
  originalName: string;
  translatedName: string;
  englishName: string;
  description: string;
  price: number;
  currency: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type CartState = Record<string, number>;

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  BROWSING = 'BROWSING',
  STAFF_VIEW = 'STAFF_VIEW',
  ERROR = 'ERROR'
}

export type Country = 'VN' | 'TW';

export interface Participant {
  id: string;
  name: string;
  joinedAt: number;
  cart: Record<string, number>;
  isHost?: boolean;
}

export interface Room {
  id: string;
  createdAt: any;
  status: 'active' | 'closed';
  hostId: string;
  items: MenuItem[];
  currency: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}
