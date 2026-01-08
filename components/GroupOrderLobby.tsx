import React, { useEffect, useState } from 'react';
import { Participant, Room } from '../types';
import { CloseIcon, ShareIcon } from './Icons';

interface GroupOrderLobbyProps {
    roomId: string;
    participants: Participant[];
    onClose: () => void;
}

export function GroupOrderLobby({ roomId, participants, onClose }: GroupOrderLobbyProps) {
    const [copied, setCopied] = useState(false);
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join my order!',
                    text: 'Click to join the group order and pick your food.',
                    url: shareUrl,
                });
            } catch (e) {
                // ignore
            }
        } else {
            handleCopy();
        }
    };

    return (
        <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-amber-500">Group Order Lobby</h2>
                <button onClick={onClose} className="p-2 -mr-2 text-slate-400"><CloseIcon className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 p-6 flex flex-col items-center">
                <div className="w-full max-w-sm bg-slate-900 rounded-xl p-6 border border-slate-700 text-center mb-8">
                    <p className="text-slate-400 mb-2">Share this link with your friends</p>
                    <div className="font-mono text-2xl font-bold text-white mb-6 tracking-wider">{roomId}</div>

                    <button
                        onClick={handleNativeShare}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <ShareIcon className="w-5 h-5" />
                        {copied ? 'Link Copied!' : 'Share Link'}
                    </button>
                </div>

                <div className="w-full max-w-sm">
                    <h3 className="text-slate-400 font-bold mb-4 flex items-center justify-between">
                        <span>Participants</span>
                        <span className="bg-slate-800 text-xs px-2 py-1 rounded-full">{participants.length}</span>
                    </h3>

                    <div className="space-y-3">
                        {participants.length === 0 ? (
                            <p className="text-center text-slate-600 italic py-4">Waiting for others to join...</p>
                        ) : (
                            participants.map(p => (
                                <div key={p.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-slate-900">
                                            {p.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-white flex items-center gap-2">
                                            {p.name}
                                            {p.isHost && (
                                                <span className="bg-amber-500/20 text-amber-500 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-amber-500/30">Host</span>
                                            )}
                                        </span>
                                    </div>
                                    <span className="text-slate-400 text-sm">{Object.values(p.cart).reduce((a, b) => a + b, 0)} items</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-900/50 border-t border-white/5 text-center text-xs text-slate-500">
                Leave this screen open to manage the session.
            </div>
        </div>
    );
}
