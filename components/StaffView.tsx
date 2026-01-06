import React from 'react';
import { CartItem } from '../types';
import { CloseIcon } from './Icons';

interface Props {
  cartItems: CartItem[];
  onClose: () => void;
  showConversion: boolean;
}

const EXCHANGE_RATE = 0.0012;

export const StaffView: React.FC<Props> = ({ cartItems, onClose, showConversion }) => {
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalTWD = Math.round(total * EXCHANGE_RATE);
  
  const formatPriceFull = (price: number) => {
    return price.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 text-slate-900 flex flex-col">
      {/* Header - Fixed */}
      <div className="flex-none bg-white px-5 py-4 flex justify-between items-center border-b border-slate-200 shadow-sm z-20">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">Order List</h2>
          <p className="text-xs text-slate-500 font-medium">Show this screen to staff</p>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors active:scale-95"
          aria-label="Close"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cartItems.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-1">
            <div className="flex justify-between items-start gap-4">
              
              {/* Dish Name */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-slate-900 leading-snug break-words">
                  {item.originalName}
                </h3>
                <div className="mt-1 flex flex-col gap-0.5">
                  <p className="text-base text-slate-700 font-bold">
                    {item.translatedName}
                  </p>
                  <p className="text-sm text-slate-500 font-medium italic">
                    {item.englishName}
                  </p>
                </div>
              </div>

              {/* Quantity: "x4" format */}
              <div className="flex-none flex items-baseline pl-2">
                 <span className="text-xl font-bold text-slate-400 mr-0.5">x</span>
                 <span className="text-4xl font-black text-slate-900 tracking-tighter">{item.quantity}</span>
              </div>
            </div>
            
            {/* Price Line (Right Aligned) */}
            <div className="flex justify-end border-t border-slate-50 border-dashed mt-2 pt-2 text-right">
               <div className="text-base font-mono font-bold text-slate-500">
                 {formatPriceFull(item.price * item.quantity)}
               </div>
               {showConversion && (
                 <div className="text-xs font-mono text-slate-400 mt-0.5">
                   ≈ NT${Math.round(item.price * item.quantity * EXCHANGE_RATE)}
                 </div>
               )}
            </div>
          </div>
        ))}
        {/* Spacer to ensure last item clears footer */}
        <div className="h-32"></div>
      </div>

      {/* Footer - Fixed */}
      <div className="flex-none bg-white border-t border-slate-200 p-6 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-20 pb-10">
        <div className="flex justify-between items-end">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Total Amount</span>
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-4xl font-black text-slate-900 tracking-tight">
                {formatPriceFull(total)}
              </span>
              <span className="text-sm font-bold text-slate-400 mb-1">
                {showConversion ? 'VND' : 'TWD'}
              </span>
            </div>
            {showConversion && (
              <div className="text-sm font-bold text-slate-400 mt-1">
                 ≈ NT$ {totalTWD}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};