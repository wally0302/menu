import React from 'react';
import { MenuItem, Country } from '../types';

interface Props {
  items: MenuItem[];
  itemsPerPage: number;
  country: Country;
}

export const HiddenShareView: React.FC<Props> = ({ items, itemsPerPage, country }) => {
  if (items.length === 0) return null;

  // Helper to chunk items
  const itemChunks = [];
  for (let i = 0; i < items.length; i += itemsPerPage) {
    itemChunks.push(items.slice(i, i + itemsPerPage));
  }

  const formatPriceSimple = (price: number) => {
    if (country === 'VN' && price >= 1000) {
      return (price / 1000).toFixed(0) + 'k';
    }
    return price.toString();
  };

  const EXCHANGE_RATE = 0.0012;
  const showConversion = country === 'VN';

  return (
    <div className="absolute left-[-9999px] top-0 pointer-events-none">
      {itemChunks.map((chunk, index) => (
        <div 
          key={`chunk-${index}`}
          id={`share-chunk-${index}`} 
          className="absolute top-0 left-0 w-[450px] bg-slate-950 p-6 text-white border-2 border-amber-500/50 rounded-xl"
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-amber-500/30">
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-amber-500"></div>
               <h2 className="text-2xl font-bold text-amber-500">MenuLingo</h2>
            </div>
            <div className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded">
              Page {index + 1}/{itemChunks.length}
            </div>
          </div>

          <div className="space-y-4">
            {chunk.map(item => (
              <div key={item.id} className="flex justify-between items-start gap-4 border-b border-slate-800 pb-3 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-bold text-amber-50 leading-tight mb-1">
                    {item.translatedName}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-sm text-slate-400 font-bold">
                      {item.originalName}
                    </div>
                    {item.englishName && (
                      <div className="text-xs text-slate-500 font-medium italic">
                        {item.englishName}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-mono font-bold text-amber-500/90 whitespace-nowrap">
                    {formatPriceSimple(item.price)}
                  </div>
                  {showConversion && (
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                       ≈ NT${item.price ? Math.round(item.price * EXCHANGE_RATE) : 0}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-600">
            <span>AI Translated Menu</span>
            <span>menulingo.app</span>
          </div>
        </div>
      ))}
    </div>
  );
};