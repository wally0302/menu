import React, { useState } from 'react';
import { toPng } from 'html-to-image';
import { AppState } from './types';
import { useMenuLogic } from './hooks/useMenuLogic';
import { MenuItemCard } from './components/MenuItemCard';
import { StaffView } from './components/StaffView';
import { HiddenShareView } from './components/HiddenShareView';
import { CameraIcon, ReceiptIcon, TrashIcon, SearchIcon, ShareIcon, CloseIcon, HomeIcon, KeyIcon } from './components/Icons';

const ITEMS_PER_PAGE = 8;
const EXCHANGE_RATE = 0.0012;

export default function App() {
  const { state, actions } = useMenuLogic();
  const { appState, country, items, cart, error, searchQuery, filteredItems, apiKey } = state;

  // Share UI State
  const [isSharing, setIsSharing] = useState(false);
  const [shareImages, setShareImages] = useState<string[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKey, setTempKey] = useState('');

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

  const saveApiKey = () => {
    if (tempKey.trim().length > 0) {
      actions.updateApiKey(tempKey.trim());
      setShowKeyInput(false);
    }
  };

  const cartTotalItems = (Object.values(cart) as number[]).reduce((a: number, b: number) => a + b, 0);
  const cartTotalPrice = items.reduce((total, item) => total + (item.price * (cart[item.id] || 0)), 0);
  const showConversion = country === 'VN';
  const cartTotalPriceTWD = Math.round(cartTotalPrice * EXCHANGE_RATE);

  const renderContent = () => {
    // Force Key Input if no key is present and not viewing settings
    if (!apiKey && !showKeyInput && appState !== AppState.ERROR) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="w-20 h-20 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 border border-amber-500/30">
            <KeyIcon className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to MenuLingo</h1>
          <p className="text-slate-400 max-w-xs mb-8">To get started, please enter your Google Gemini API Key.</p>

          <button
            onClick={() => setShowKeyInput(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-8 rounded-full shadow-lg transition-transform active:scale-95"
          >
            Enter API Key
          </button>
          <button onClick={actions.loadDemoData} className="mt-8 text-xs text-slate-600 hover:text-slate-400">Skip & Try Demo Data</button>
        </div>
      );
    }

    switch (appState) {
      case AppState.IDLE:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/30 animate-pulse">
              <CameraIcon className="w-12 h-12 text-amber-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">MenuLingo</h1>
            <p className="text-slate-400 max-w-xs mb-8">Take a photo of a menu to instantly translate and order.</p>

            <div className="flex bg-slate-800 p-1 rounded-xl mb-8 border border-slate-700">
              {(['VN', 'TW'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => actions.setCountry(c)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${country === c ? 'bg-amber-500 text-slate-900 shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  {c === 'VN' ? '🇻🇳 越南 Vietnam' : '🇹🇼 台灣 Taiwan'}
                </button>
              ))}
            </div>

            <label className="relative group cursor-pointer">
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={actions.handleFileSelect} />
              <div className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-4 px-8 rounded-full shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-2 text-lg">
                <CameraIcon className="w-6 h-6" />
                <span>Scan Menu</span>
              </div>
            </label>
            <div className="mt-8 flex gap-4">
              <button onClick={actions.loadDemoData} className="text-xs text-slate-700 hover:text-slate-500">Try Demo Data</button>
              <button onClick={() => { setTempKey(apiKey); setShowKeyInput(true); }} className="text-xs text-slate-700 hover:text-slate-500 flex items-center gap-1">
                <KeyIcon className="w-3 h-3" /> API Key
              </button>
            </div>
          </div>
        );

      case AppState.ANALYZING:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <div className="relative w-20 h-20 mb-8">
              <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{items.length > 0 ? "Analyzing Page..." : "Analyzing Menu..."}</h2>
            <p className="text-slate-400 text-sm">{country === 'VN' ? 'Translating Vietnamese...' : 'Scanning Taiwan Menu...'}</p>
          </div>
        );

      case AppState.ERROR:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <div className="text-red-500 mb-4 text-5xl">!</div>
            <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button onClick={actions.resetApp} className="px-6 py-2 border border-slate-600 rounded-full text-slate-300 hover:bg-slate-800">Try Again</button>
            <button onClick={() => { setTempKey(apiKey); setShowKeyInput(true); }} className="mt-4 text-sm text-slate-600 hover:text-slate-400 underline">Check API Key</button>
          </div>
        );

      case AppState.BROWSING:
        return (
          <div className="pb-32 px-4 pt-4 space-y-4">
            <div className="relative sticky top-[72px] z-10 shadow-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-10 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-800/95 backdrop-blur text-slate-100 placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                placeholder="Search English / 中文..."
                value={searchQuery}
                onChange={(e) => actions.setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => actions.setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300">
                  <div className="bg-slate-700 rounded-full p-0.5">
                    <CloseIcon className="w-3 h-3" />
                  </div>
                </button>
              )}
            </div>

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
                    quantity={cart[item.id] || 0}
                    onAdd={() => actions.updateCart(item.id, 1)}
                    onRemove={() => actions.updateCart(item.id, -1)}
                    showConversion={showConversion}
                  />
                ))}
                <div className="py-4 text-center text-slate-500 text-xs italic opacity-50">Translated by MenuLingo AI</div>
              </div>
            )}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-amber-500/30">
      <HiddenShareView items={items} country={country} itemsPerPage={ITEMS_PER_PAGE} />

      {appState === AppState.BROWSING && (
        <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex justify-between items-center">
          <div className="font-bold text-amber-500 text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            MenuLingo <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">{country === 'VN' ? 'Vietnam' : 'Taiwan'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={actions.resetApp} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><HomeIcon className="w-5 h-5" /></button>
            <button onClick={handleShareAsImages} disabled={isSharing} className="p-2 bg-slate-800 rounded-full hover:bg-amber-500/20 hover:text-amber-400 text-slate-400 transition-colors disabled:opacity-50">
              {isSharing ? <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <ShareIcon className="w-5 h-5" />}
            </button>
            <button onClick={actions.clearCart} className="p-2 bg-slate-800 rounded-full hover:bg-red-900/30 hover:text-red-400 text-slate-400 transition-colors"><TrashIcon className="w-5 h-5" /></button>
            <label className="cursor-pointer p-2 bg-amber-500 text-slate-900 rounded-full hover:bg-amber-400 transition-colors shadow-lg shadow-amber-900/20 active:scale-95">
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={actions.handleFileSelect} />
              <CameraIcon className="w-5 h-5" />
            </label>
          </div>
        </header>
      )}

      <main className="max-w-md mx-auto relative">{renderContent()}</main>

      {/* Cart Button */}
      {appState === AppState.BROWSING && cartTotalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-30">
          <div className="max-w-md mx-auto">
            <button onClick={() => actions.setAppState(AppState.STAFF_VIEW)} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl p-4 shadow-lg shadow-amber-900/50 flex items-center justify-between transition-transform active:scale-98 group">
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm">{cartTotalItems}</div>
                <div className="text-left leading-tight"><div className="font-bold text-lg">View Order</div><div className="text-xs text-slate-800 font-medium opacity-80">Show to staff</div></div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xl leading-none">{(country === 'VN' && cartTotalPrice >= 1000) ? (cartTotalPrice / 1000).toFixed(0) + 'k' : cartTotalPrice}</span>
                  <ReceiptIcon className="w-6 h-6 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                {showConversion && <span className="text-xs text-slate-700 font-bold opacity-70">≈ NT${cartTotalPriceTWD}</span>}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Views */}
      {appState === AppState.STAFF_VIEW && (
        <StaffView cartItems={items.filter(i => cart[i.id]).map(i => ({ ...i, quantity: cart[i.id]! }))} onClose={() => actions.setAppState(AppState.BROWSING)} showConversion={showConversion} />
      )}

      {/* API Key Modal */}
      {showKeyInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><KeyIcon className="w-5 h-5 text-amber-500" /> API Key Setup</h3>
              {apiKey && <button onClick={() => setShowKeyInput(false)}><CloseIcon className="w-6 h-6 text-slate-400" /></button>}
            </div>
            <p className="text-sm text-slate-400 mb-4">Your key is stored locally in your browser and never sent to our servers.</p>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white mb-4 focus:ring-1 focus:ring-amber-500 outline-none font-mono text-sm"
              placeholder="AIzaSy..."
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
            />
            <button
              onClick={saveApiKey}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-lg transition-colors"
            >
              Save Key
            </button>
            <div className="mt-4 text-xs text-slate-600 text-center">
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-slate-400">Get a Gemini API Key</a>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
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
                  <div className="border border-slate-700 rounded overflow-hidden"><img src={imgUrl} alt={`Menu Part ${idx + 1}`} className="w-full h-auto" /></div>
                  <a href={imgUrl} download={`menulingo-menu-part-${idx + 1}.png`} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors">Download Image {idx + 1}</a>
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-amber-500 mb-2 animate-pulse">Download images to share</p>
          </div>
        </div>
      )}
    </div>
  );
}