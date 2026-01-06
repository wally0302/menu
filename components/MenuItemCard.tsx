import React, { useState } from 'react';
import { MenuItem } from '../types';
import { PlusIcon, MinusIcon, InfoIcon } from './Icons';
import { explainDish } from '../services/geminiService';

interface Props {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  showConversion: boolean;
  apiKey: string;
}

const EXCHANGE_RATE = 0.0012;

export const MenuItemCard: React.FC<Props> = ({ item, quantity, onAdd, onRemove, showConversion, apiKey }) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const handleExplain = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (explanation) return;
    
    setIsExplaining(true);
    const text = await explainDish(item.originalName, apiKey);
    setExplanation(text);
    setIsExplaining(false);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return (price / 1000).toFixed(0) + 'k';
    }
    return price.toString();
  };

  const priceTWD = Math.round(item.price * EXCHANGE_RATE);

  return (
    <div className={`
      relative p-4 rounded-xl border border-amber-500/20 bg-slate-800/50 backdrop-blur-sm 
      transition-all duration-200 
      ${quantity > 0 ? 'ring-1 ring-amber-500 bg-slate-800' : ''}
    `}>
      <div className="flex justify-between items-start gap-3">
        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-amber-400 leading-tight mb-1">
            {item.translatedName}
          </h3>
          
          <div className="mb-2 flex flex-col gap-0.5">
            <p className="text-sm text-slate-400 font-mono font-bold truncate">
              {item.originalName}
            </p>
            {item.englishName && (
              <p className="text-xs text-slate-500 font-medium italic truncate">
                {item.englishName}
              </p>
            )}
          </div>

          <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed opacity-90">
            {item.description}
          </p>
          
          {/* Explanation Box */}
          {explanation && (
            <div className="mt-2 p-2 bg-slate-900/80 rounded border border-amber-500/10 text-xs text-amber-200/80 italic">
              AI: {explanation}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between pr-2">
            <div className="flex flex-col items-start">
              <span className="text-lg font-semibold text-white leading-none">
                {formatPrice(item.price)}
              </span>
              {showConversion && (
                <span className="text-xs text-slate-500 font-medium mt-1">
                  ≈ NT$ {priceTWD}
                </span>
              )}
            </div>
            
            <button 
              onClick={handleExplain}
              className="flex items-center gap-1 text-xs text-amber-500/70 hover:text-amber-400 transition-colors px-2 py-1 rounded-full bg-amber-950/30"
            >
              <InfoIcon className="w-3 h-3" />
              {isExplaining ? 'Analyzing...' : '這是什麼?'}
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-700">
          <button 
            onClick={onAdd}
            className="w-8 h-8 flex items-center justify-center bg-amber-500 text-slate-900 rounded shadow-sm hover:bg-amber-400 active:scale-95 transition-all"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
          
          <span className={`text-lg font-bold font-mono w-6 text-center ${quantity > 0 ? 'text-white' : 'text-slate-600'}`}>
            {quantity}
          </span>
          
          <button 
            onClick={onRemove}
            disabled={quantity === 0}
            className="w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-30 active:scale-95 transition-all"
          >
            <MinusIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};