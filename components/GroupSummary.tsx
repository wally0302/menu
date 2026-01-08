import React from 'react';
import { Participant, MenuItem, CartItem } from '../types';
import { CloseIcon, UserIcon } from './Icons';

interface GroupSummaryProps {
    participants: Participant[];
    items: MenuItem[];
    onClose: () => void;
    currentUserId: string | null;
    currency: string;
}

export function GroupSummary({ participants, items, onClose, currentUserId, currency }: GroupSummaryProps) {
    // Calculate totals
    const totalByParticipant = participants.map(p => {
        let total = 0;
        const pItems: CartItem[] = [];
        Object.entries(p.cart).forEach(([itemId, qty]) => {
            if (qty > 0) {
                const item = items.find(i => i.id === itemId);
                if (item) {
                    total += item.price * qty;
                    pItems.push({ ...item, quantity: qty });
                }
            }
        });
        return { ...p, total, items: pItems };
    });

    const grandTotal = totalByParticipant.reduce((acc, p) => acc + p.total, 0);

    // State for display tab
    const [activeTab, setActiveTab] = React.useState<'local' | 'english'>('local');
    const exchangeRate = 0.0012; // 1 VND = 0.0012 TWD (Example)

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-white">Group Order Summary</h2>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
            </div>

            {/* Language Tabs */}
            <div className="flex border-b border-white/10 bg-slate-900">
                <button
                    onClick={() => setActiveTab('local')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'local' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    Vietnamese (Local)
                </button>
                <button
                    onClick={() => setActiveTab('english')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'english' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    English
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {totalByParticipant.map(participant => (
                    <div key={participant.id} className={`bg-slate-900 rounded-xl border ${participant.id === currentUserId ? 'border-amber-500/50' : 'border-slate-800'} overflow-hidden`}>
                        <div className="p-4 bg-slate-800/50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <UserIcon className={`w-5 h-5 ${participant.isHost ? 'text-amber-500' : 'text-slate-400'}`} />
                                <span className="font-bold text-white flex items-center gap-2">
                                    {participant.name}
                                    {participant.id === currentUserId && '(You)'}
                                    {participant.isHost && <span className="bg-amber-500/20 text-amber-500 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-amber-500/30">Host</span>}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="font-mono text-amber-500 font-bold">{currency === 'VN' ? (participant.total / 1000).toFixed(0) + 'k' : participant.total}</div>
                                <div className="text-xs text-slate-500 font-mono">NT$ {Math.round(participant.total * exchangeRate)}</div>
                            </div>
                        </div>

                        {participant.items.length === 0 ? (
                            <div className="p-4 text-xs text-slate-500 italic">No items yet</div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {participant.items.map(item => (
                                    <div key={item.id} className="p-3 flex justify-between text-sm">
                                        <div className="flex gap-2">
                                            <span className="text-amber-500 font-bold w-4">{item.quantity}x</span>
                                            <div className="flex flex-col">
                                                <span className="text-slate-200 font-medium">
                                                    {activeTab === 'local' ? item.originalName : item.englishName}
                                                </span>
                                                {activeTab === 'local' && (
                                                    <span className="text-slate-500 text-xs">{item.translatedName} / {item.englishName}</span>
                                                )}
                                                {activeTab === 'english' && (
                                                    <span className="text-slate-500 text-xs">{item.translatedName}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-slate-400">{currency === 'VN' ? (item.price / 1000).toFixed(0) + 'k' : item.price}</div>
                                            <div className="text-xs text-slate-600 font-mono">NT$ {Math.round(item.price * exchangeRate)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-6 bg-slate-900 border-t border-white/10 safe-area-pb">
                <div className="flex justify-between items-end mb-4">
                    <span className="text-slate-400">Total Amount</span>
                    <span className="text-3xl font-bold text-white font-mono">
                        {currency === 'VN' ? (grandTotal / 1000).toFixed(0) + 'k' : grandTotal}
                        <span className="text-sm text-slate-500 ml-1">{currency}</span>
                        <div className="text-sm text-slate-500 text-right mt-1 font-normal">
                            ≈ NT$ {Math.round(grandTotal * 0.0012)}
                        </div>
                    </span>
                </div>

                <button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-amber-900/20 text-lg">
                    Proceed to Order
                </button>
            </div>
        </div>
    );
}
