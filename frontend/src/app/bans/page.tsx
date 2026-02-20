'use client';

import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, AlertTriangle, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';

type PublicBan = {
    id: number;
    name: string | null;
    steam_id: string;
    steam_id_3: string | null;
    steam_id_64: string | null;
    reason: string | null;
    duration: number;
    status: string;
    admin_name: string | null;
    created_at: string;
    expires_at: string | null;
};

export default function PublicBanListPage() {
    const [search, setSearch] = useState('');
    const [bans, setBans] = useState<PublicBan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPublicBans = async () => {
            try {
                const res = await apiFetch('/api/bans/public');
                if (res.ok) {
                    const data = await res.json();
                    setBans(data);
                } else {
                    console.error('Failed to fetch public bans');
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchPublicBans();
    }, []);

    const filteredBans = bans.filter(ban => {
        const term = search.toLowerCase();
        return (
            (ban.name && ban.name.toLowerCase().includes(term)) ||
            ban.steam_id.toLowerCase().includes(term) ||
            (ban.reason && ban.reason.toLowerCase().includes(term))
        );
    });

    const getDurationText = (durationSecs: number, expiresAt: string | null) => {
        if (!expiresAt && durationSecs === 0) return 'Permanent';
        if (durationSecs > 0) return `${durationSecs} Minutes`;
        return 'Temporary';
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-500">KZGuard Global Bans</h1>
                    </div>
                    <nav className="flex items-center gap-4 text-sm font-medium">
                        <Link href="/" className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white transition-colors">Admin Login</Link>
                        <Link href="/apply" className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white transition-colors">Whitelist Application</Link>
                    </nav>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">Public Ban Registry</h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                        Search our global database of restricted players. We maintain a strict zero-tolerance policy for cheating and toxicity.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="bg-white dark:bg-slate-900 p-2 pl-4 pr-2 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                        <Search className="h-5 w-5 text-slate-400 shrink-0" />
                        <Input
                            placeholder="Enter SteamID, nickname, or reason to search..."
                            className="border-0 shadow-none focus-visible:ring-0 text-base h-12 bg-transparent w-full"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <Button className="shrink-0 h-10 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors">
                            Search
                        </Button>
                    </div>

                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <div className="flex justify-center flex-col items-center py-12 text-slate-400">
                                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                <p>Syncing recent ban records...</p>
                            </div>
                        ) : filteredBans.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                No public bans found.
                            </div>
                        ) : filteredBans.map(ban => (
                            <div key={ban.id} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group ${ban.status === 'expired' ? 'opacity-70' : ''}`}>
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${ban.status === 'active' ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>

                                <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between ml-2">
                                    <div className="space-y-1 block sm:flex sm:items-center gap-4">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            {ban.name || 'Unknown'}
                                            {ban.expires_at === null && ban.duration === 0 && <Badge variant="destructive" className="uppercase text-[10px] tracking-wider font-bold">Permaban</Badge>}
                                            {ban.status === 'expired' && <Badge variant="outline" className="text-slate-500 border-slate-300 dark:border-slate-700 uppercase text-[10px]">Expired</Badge>}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm font-mono text-slate-500 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800 shrink-0 w-max mt-2 sm:mt-0">
                                            {ban.steam_id}
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium text-slate-400 shrink-0 tabular-nums">
                                        {new Date(ban.created_at).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="mt-5 ml-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-2.5">
                                        <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${ban.status === 'active' ? 'text-orange-500' : 'text-slate-400'}`} />
                                        <div>
                                            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-0.5">Infraction Reason</p>
                                            <p className={`text-sm font-medium ${ban.status === 'active' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500'}`}>{ban.reason || 'No specific reason provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <MapPin className={`h-4 w-4 mt-0.5 shrink-0 ${ban.status === 'active' ? 'text-blue-500' : 'text-slate-400'}`} />
                                        <div>
                                            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-0.5">Duration</p>
                                            <p className={`text-sm font-medium ${ban.status === 'active' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500'}`}>{getDurationText(ban.duration, ban.expires_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
