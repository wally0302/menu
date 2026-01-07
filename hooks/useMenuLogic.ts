import { useState, useEffect } from 'react';
import { MenuItem, AppState, CartState, Country } from '../types';
import { parseMenuImage } from '../services/geminiService';
import { resizeImage, stripBase64Prefix } from '../utils/imageUtils';


export function useMenuLogic() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [country, setCountry] = useState<Country>('VN');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartState>({});
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // API Key State
  const [apiKey, setApiKey] = useState('');

  // Load persistence (Cart + API Key)
  useEffect(() => {
    // 1. Try LocalStorage
    const savedCart = localStorage.getItem('menulingo_cart');
    const savedKey = localStorage.getItem('menulingo_api_key');

    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { console.error("Failed to load cart"); }
    }

    if (savedKey) {
      setApiKey(savedKey);
    } else {
      // 2. Try import.meta.env (Vite / Vercel Environment Variable)
      try {
        if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
          setApiKey(import.meta.env.VITE_GEMINI_API_KEY);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Save cart changes
  useEffect(() => {
    localStorage.setItem('menulingo_cart', JSON.stringify(cart));
  }, [cart]);

  // Save API Key changes
  const updateApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('menulingo_api_key', key);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear stale cart data if starting a fresh scan sequence
    if (items.length === 0) {
      setCart({});
    }

    setAppState(AppState.ANALYZING);
    setError(null);
    setSearchQuery('');

    try {
      const resizedBase64 = await resizeImage(file);
      const rawBase64 = stripBase64Prefix(resizedBase64);
      const menuItems = await parseMenuImage(rawBase64, country, apiKey);

      if (menuItems.length === 0) {
        throw new Error("No items found");
      }

      setItems(prev => [...prev, ...menuItems]);
      setAppState(AppState.BROWSING);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze menu. Please try again.");
      setAppState(AppState.ERROR);
    }
  };

  const updateCart = (id: string, delta: number) => {
    setCart((prev: CartState) => {
      const current: number = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const newCart = { ...prev };
      if (next === 0) {
        delete newCart[id];
      } else {
        newCart[id] = next;
      }
      return newCart;
    });
  };

  const clearCart = () => setCart({});

  const resetApp = () => {
    setItems([]);
    setCart({});
    setSearchQuery('');
    setAppState(AppState.IDLE);
  };



  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.englishName && item.englishName.toLowerCase().includes(q)) ||
      (item.translatedName && item.translatedName.toLowerCase().includes(q)) ||
      (item.originalName && item.originalName.toLowerCase().includes(q))
    );
  });

  return {
    state: { appState, country, items, cart, error, searchQuery, filteredItems, apiKey },
    actions: {
      setAppState,
      setCountry,
      setSearchQuery,
      handleFileSelect,
      updateCart,
      clearCart,
      resetApp,

    }
  };
}