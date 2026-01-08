import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { AppState } from './types';
import { useMenuLogic } from './hooks/useMenuLogic';
import { useGroupOrder } from './hooks/useGroupOrder';
import { MenuItemCard } from './components/MenuItemCard';
import { StaffView } from './components/StaffView';
import { HiddenShareView } from './components/HiddenShareView';
import { CameraIcon, ReceiptIcon, TrashIcon, SearchIcon, ShareIcon, CloseIcon, HomeIcon, KeyIcon, UsersIcon } from './components/Icons';
import { GroupOrderLobby } from './components/GroupOrderLobby';
import { GroupSummary } from './components/GroupSummary';
import { initFirebase } from './services/firebase';
import { firebaseConfig } from './services/firebaseConfig';

// Initialize Firebase immediately to ensure it's ready
try {
  initFirebase(firebaseConfig);
} catch (e) {
  console.error("Firebase Initialization Failed", e);
}

const ITEMS_PER_PAGE = 8;
const RATES = {
  VN: 0.0013, // VND to TWD
  EN: 32.5,   // USD to TWD
  TW: 1
};

export default function App() {
  const { state: localState, actions: localActions } = useMenuLogic();
  const groupOrder = useGroupOrder();

  // File Input Ref for programmatic clicking
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Decouple UI state... (keep)
  const isGroupMode = !!groupOrder.currentRoomId;
  const items = isGroupMode ? (groupOrder.roomData?.items || []) : localState.items;
  const currency = isGroupMode ? (groupOrder.roomData?.currency || 'VN') : localState.country;

  // Cart Logic... (keep)
  const myCart = isGroupMode
    ? (groupOrder.participants.find(p => p.id === groupOrder.userId)?.cart || {})
    : localState.cart;

  const handleUpdateCart = (itemId: string, delta: number) => {

    if (isGroupMode) {
      const newCart = { ...myCart };
      newCart[itemId] = (newCart[itemId] || 0) + delta;
      if (newCart[itemId] <= 0) delete newCart[itemId];
      groupOrder.updateCart(newCart);
    } else {
      localActions.updateCart(itemId, delta);
    }
  };

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareImages, setShareImages] = useState<string[]>([]);

  const [showLobby, setShowLobby] = useState(false);
  const [showGroupSummary, setShowGroupSummary] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false); // New State
  const [joinName, setJoinName] = useState('');
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);

  // Check URL... (keep)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setPendingRoomId(room);
    }
  }, []);

  // Filter items... (keep)
  const filteredItems = items.filter(item =>
    item.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.originalName.includes(searchQuery) ||
    item.translatedName.includes(searchQuery)
  );

  const cartTotalItems = Object.values(myCart).reduce((a, b) => a + b, 0);
  const cartTotalPrice = items.reduce((total, item) => total + (item.price * (myCart[item.id] || 0)), 0);

  const showConversion = currency !== 'TW';
  const exchangeRate = RATES[currency as keyof typeof RATES] || 1;
  const cartTotalPriceTWD = Math.round(cartTotalPrice * exchangeRate);

  // --- Actions ---

  const copyLanguageToClipboard = (lang: string) => {
    // Helper if needed
  };

  const onLanguageSelect = (lang: 'VN' | 'EN' | 'TW') => {
    localActions.setCountry(lang);
    setShowLanguageModal(false);
    // Trigger file input
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const handleStartGroupOrder = async () => {

    if (!groupOrder.isInitialized) {
      alert("Firebase not configured! Please open 'services/firebaseConfig.ts' and paste your config.");
      return;
    }

    // Use local items to start the room
    if (localState.items.length === 0) {
      alert("Please scan a menu or load demo data first!");
      return;
    }

    try {
      await groupOrder.createGroupOrder(localState.items, localState.country);
      localActions.setAppState(AppState.BROWSING); // Ensure we are in browsing mode
      setShowLobby(true);
    } catch (e) {
      console.error(e);
      alert(`Failed to create room: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleJoinRoom = async () => {

    if (!groupOrder.isInitialized) {
      alert("Firebase not configured! Please open 'services/firebaseConfig.ts' and paste your config.");
      return;
    }
    if (!joinName.trim() || !pendingRoomId) return;

    try {
      await groupOrder.joinGroupOrder(pendingRoomId, joinName);
      setPendingRoomId(null);
      localActions.setAppState(AppState.BROWSING);
    } catch (e) {
      console.error(e);
      alert(`Failed to join room: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleShareAsImages = async () => {

    if (items.length === 0) return;
    setIsSharing(true);
    setShareImages([]);

    try {
      const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
      const generatedFiles: File[] = [];
      const generatedUrls: string[] = [];

      for (let i = 0; i < totalPages; i++) {
        const node = document.getElementById(`share-chunk-${i}`);
        if (node) {
          if (i > 0) await new Promise(r => setTimeout(r, 100));
          const dataUrl = await toPng(node, {
            cacheBust: true,
            backgroundColor: '#0f172a',
            pixelRatio: 3,
            style: { fontSmoothing: 'antialiased', WebkitFontSmoothing: 'antialiased' } as any
          });
          generatedUrls.push(dataUrl);
          const blob = await (await fetch(dataUrl)).blob();
          generatedFiles.push(new File([blob], `menulingo-menu-part-${i + 1}.png`, { type: 'image/png' }));
        }
      }

      if (navigator.share && navigator.canShare && navigator.canShare({ files: generatedFiles })) {
        await navigator.share({
          files: generatedFiles,
          title: 'Translated Menu',
          text: 'Here is the translated menu from MenuLingo!',
        });
        setIsSharing(false);
      } else {
        setShareImages(generatedUrls);
        setShowShareModal(true);
        setIsSharing(false);
      }
    } catch (e) {
      console.error("Share failed", e);
      alert("Could not generate images. Please try again.");
      setIsSharing(false);
    }
  };

  // --- Renders ---

  // 1. Pending Join Screen (keep)
  if (pendingRoomId) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Join Group Order</h1>
        <p className="text-slate-400 mb-8">Enter your name to join the order.</p>

        <input
          type="text"
          className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-lg p-4 text-white mb-4 focus:ring-1 focus:ring-amber-500 outline-none text-center text-lg"
          placeholder="Your Name (e.g., Wally)"
          value={joinName}
          onChange={(e) => setJoinName(e.target.value)}
        />

        <button
          onClick={handleJoinRoom}
          disabled={!joinName.trim()}
          className="w-full max-w-xs bg-amber-500 disabled:opacity-50 hover:bg-amber-400 text-slate-900 font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95"
        >
          Join Order
        </button>

        {!groupOrder.isInitialized && (
          <div className="mt-8 text-xs text-slate-600 bg-slate-900 p-2 rounded">
            ⚠️ Firebase not configured.<br />Check <code>services/firebaseConfig.ts</code>
          </div>
        )}
      </div>
    );
  }

  // 2. Main App Content
  const renderContent = () => {
    // If browsing or synced
    if (localState.appState === AppState.BROWSING || isGroupMode) {
      return (
        <div className="pb-32 px-4 pt-4 space-y-4">
          {/* Search Bar */}
          <div className="relative sticky top-[72px] z-10 shadow-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-800/95 backdrop-blur text-slate-100 placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300">
                <div className="bg-slate-700 rounded-full p-0.5"><CloseIcon className="w-3 h-3" /></div>
              </button>
            )}
          </div>

          {/* Empty State */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
              <p>No dishes found matching <br /><span className="text-amber-500">"{searchQuery}"</span></p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map(item => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  quantity={myCart[item.id] || 0}
                  onAdd={() => handleUpdateCart(item.id, 1)}
                  onRemove={() => handleUpdateCart(item.id, -1)}
                  showConversion={showConversion}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    // Fallback to original flow logic
    if (!isGroupMode) {
      switch (localState.appState) {
        case AppState.IDLE:
          return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
              <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/30 animate-pulse">
                <CameraIcon className="w-12 h-12 text-amber-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">MenuLingo</h1>
              <p className="text-slate-400 max-w-xs mb-8">Select menu language & take a photo.</p>

              <button
                onClick={() => setShowLanguageModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-4 px-8 rounded-full shadow-lg flex items-center justify-center gap-2 text-lg w-full max-w-xs transition-transform active:scale-95"
              >
                <CameraIcon className="w-6 h-6" /> <span>Scan Menu</span>
              </button>

              <div className="text-slate-500 text-xs mb-8"></div>
            </div>
          );
        case AppState.ANALYZING:
          return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
              <div className="border-4 border-amber-500 rounded-full w-12 h-12 animate-spin border-t-transparent mb-4"></div>
              <p className="text-white font-bold">Analyzing...</p>
            </div>
          )
        case AppState.ERROR:
          return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
              <p className="text-red-500 mb-4">{localState.error}</p>
              <button onClick={localActions.resetApp} className="text-slate-400 underline">Try Again</button>
            </div>
          )
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-amber-500/30">
      <HiddenShareView items={items} country={currency as any} itemsPerPage={ITEMS_PER_PAGE} />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={localActions.handleFileSelect}
      />

      {/* Header */}
      {(localState.appState === AppState.BROWSING || isGroupMode) && (
        <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex justify-between items-center">
          <div className="font-bold text-amber-500 text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            MenuLingo
          </div>

          <div className="flex items-center gap-2">
            {!isGroupMode && localState.appState === AppState.BROWSING && (
              <button onClick={handleStartGroupOrder} className="p-2 bg-amber-500/10 text-amber-500 rounded-full hover:bg-amber-500/20">
                <UsersIcon className="w-5 h-5" />
              </button>
            )}
            {isGroupMode && (
              <button onClick={() => setShowLobby(true)} className="p-2 bg-amber-500/10 text-amber-500 rounded-full hover:bg-amber-500/20 animate-pulse">
                <UsersIcon className="w-5 h-5" />
              </button>
            )}

            {!isGroupMode && (
              <button
                onClick={() => setShowLanguageModal(true)}
                className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white cursor-pointer"
              >
                <CameraIcon className="w-5 h-5" />
              </button>
            )}

            {isGroupMode ? (
              groupOrder.isHost ? (
                <button
                  onClick={async () => {
                    if (confirm("Exit session? This will delete the room for everyone.")) {
                      await groupOrder.deleteGroupOrder();
                      localActions.resetApp();
                    }
                  }}
                  className="px-3 py-1.5 bg-red-500/10 text-red-500 text-xs font-bold rounded-lg border border-red-500/20 hover:bg-red-500/20 whitespace-nowrap"
                >
                  Exit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-slate-800 rounded text-[10px] text-slate-400 border border-slate-700 font-mono">
                    Room: {groupOrder.currentRoomId}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Leave this group order?")) {
                        groupOrder.leaveGroup();
                        localActions.resetApp();
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-700"
                  >
                    Leave
                  </button>
                </div>
              )
            ) : (
              <button onClick={() => localActions.resetApp()} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
                <HomeIcon className="w-5 h-5" />
              </button>
            )}

            <button onClick={handleShareAsImages} disabled={isSharing} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
              <ShareIcon className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      <main className="max-w-md mx-auto relative">{renderContent()}</main>

      {/* Cart Button */}
      {(localState.appState === AppState.BROWSING || isGroupMode) && (items.length > 0) && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-30">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => isGroupMode ? setShowGroupSummary(true) : localActions.setAppState(AppState.STAFF_VIEW)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl p-4 shadow-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm">
                  {isGroupMode ? Object.values(groupOrder.roomData ? (groupOrder.participants.find(p => p.id === groupOrder.userId)?.cart || {}) : {}).reduce((a, b) => a + b, 0) : cartTotalItems}
                </div>
                <div className="text-left leading-tight">
                  <div className="font-bold text-lg">{isGroupMode ? 'Group Order' : 'View Order'}</div>
                  <div className="text-xs text-slate-800 font-medium opacity-80">{isGroupMode ? 'View everyone' : 'Show to staff'}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xl leading-none">
                    {/* Currency Logic */}
                    {currency === 'VN' && (
                      <>
                        {((isGroupMode ? (items.reduce((t, i) => t + i.price * (myCart[i.id] || 0), 0)) : cartTotalPrice) / 1000).toFixed(0)}k
                      </>
                    )}
                    {currency === 'EN' && (
                      <>
                        ${(isGroupMode ? (items.reduce((t, i) => t + i.price * (myCart[i.id] || 0), 0)) : cartTotalPrice).toFixed(2)}
                      </>
                    )}
                    {currency === 'TW' && (
                      <>
                        NT${(isGroupMode ? (items.reduce((t, i) => t + i.price * (myCart[i.id] || 0), 0)) : cartTotalPrice)}
                      </>
                    )}
                  </span>
                  <ReceiptIcon className="w-6 h-6 opacity-60" />
                </div>
                {currency !== 'TW' && (
                  <div className="text-xs text-slate-800 font-bold opacity-75">
                    ≈ NT${cartTotalPriceTWD}
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}

      {/* Room Deleted Modal */}
      {groupOrder.isRoomDeleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl p-8 max-w-sm w-full text-center border border-red-500/30 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <HomeIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Session Ended</h3>
            <p className="text-slate-400 mb-6">The host has closed this group order room.</p>
            <button
              onClick={() => {
                groupOrder.leaveGroup();
                localActions.resetApp();
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      )}

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900/90 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center shadow-2xl border border-white/10 relative overflow-hidden">

            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-amber-300"></div>

            <h3 className="text-2xl font-bold text-white mb-2">Select Language</h3>
            <p className="text-slate-400 mb-8 text-center text-sm">Choose the menu's language to optimize translation results.</p>

            <div className="space-y-3 w-full">
              <button
                onClick={() => onLanguageSelect('VN')}
                className="w-full p-4 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all rounded-xl flex items-center gap-4 group border border-slate-700 hover:border-amber-500/50"
              >
                <div className="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🇻🇳</div>
                <div className="text-left">
                  <div className="font-bold text-white group-hover:text-amber-400">Vietnamese</div>
                  <div className="text-xs text-slate-500">Currency: VND (₫)</div>
                </div>
              </button>

              <button
                onClick={() => onLanguageSelect('EN')}
                className="w-full p-4 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all rounded-xl flex items-center gap-4 group border border-slate-700 hover:border-amber-500/50"
              >
                <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🇺🇸</div>
                <div className="text-left">
                  <div className="font-bold text-white group-hover:text-amber-400">English</div>
                  <div className="text-xs text-slate-500">Currency: USD ($)</div>
                </div>
              </button>

              <button
                onClick={() => onLanguageSelect('TW')}
                className="w-full p-4 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all rounded-xl flex items-center gap-4 group border border-slate-700 hover:border-amber-500/50"
              >
                <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🇹🇼</div>
                <div className="text-left">
                  <div className="font-bold text-white group-hover:text-amber-400">Chinese</div>
                  <div className="text-xs text-slate-500">Currency: TWD (NT$)</div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowLanguageModal(false)}
              className="mt-6 text-slate-500 text-sm hover:text-white py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {localState.appState === AppState.STAFF_VIEW && (
        <StaffView cartItems={items.filter(i => myCart[i.id]).map(i => ({ ...i, quantity: myCart[i.id]! }))} onClose={() => localActions.setAppState(AppState.BROWSING)} showConversion={showConversion} />
      )}

      {showGroupSummary && (
        <GroupSummary
          participants={groupOrder.participants}
          items={items}
          onClose={() => setShowGroupSummary(false)}
          currentUserId={groupOrder.userId}
          currency={currency}
        />
      )}

      {showLobby && groupOrder.currentRoomId && (
        <GroupOrderLobby roomId={groupOrder.currentRoomId} participants={groupOrder.participants} onClose={() => setShowLobby(false)} />
      )}

      {/* Share Modal (keep) */}
      {/* ... */}
      {showShareModal && shareImages.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl p-4 w-full max-w-sm flex flex-col items-center shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between w-full items-center mb-4 px-2">
              <h3 className="text-lg font-bold text-white">Save Images</h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
            </div>
            <div className="overflow-y-auto w-full rounded mb-4 space-y-4 px-1 custom-scrollbar">
              {shareImages.map((imgUrl, idx) => (
                <div key={idx} className="space-y-2">
                  <p className="text-xs text-slate-400 font-medium ml-1">Image {idx + 1}</p>
                  <div className="border border-slate-700 rounded overflow-hidden"><img src={imgUrl} alt="Menu" className="w-full h-auto" /></div>
                  <a href={imgUrl} download={`menu-part-${idx + 1}.png`} className="w-full py-2 bg-slate-800 text-slate-200 text-sm font-bold rounded-lg flex items-center justify-center">Download Image {idx + 1}</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}