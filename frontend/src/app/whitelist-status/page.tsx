'use client';

import React, { useState } from 'react';
import { Search, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

export default function WhitelistStatusPage() {
    const [steamId, setSteamId] = useState('');
    const [result, setResult] = useState<'approved' | 'pending' | 'rejected' | null>(null); // 'approved', 'pending', 'rejected', null
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!steamId) return;

        setLoading(true);
        setResult(null);
        try {
            const res = await apiFetch(`/api/whitelist/status?steam_id=${encodeURIComponent(steamId)}`);
            if (res.ok) {
                const data = await res.json();
                setResult(data.status);
            } else if (res.status === 404) {
                toast.error('Application not found');
            } else {
                toast.error('Failed to fetch status');
            }
        } catch (error) {
            console.error('Error fetching status:', error);
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center pt-24 pb-12 sm:px-6 lg:px-8 font-sans">
            <div className="w-full max-w-2xl text-center mb-10">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
                    Check Application Status
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400">
                    Enter your SteamID below to view the current status of your whitelist application.
                </p>
            </div>

            <div className="w-full max-w-xl">
                <form onSubmit={handleSearch} className="relative flex items-center shadow-lg shadow-slate-200/50 dark:shadow-none rounded-2xl group focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <Input
                        value={steamId}
                        onChange={e => setSteamId(e.target.value)}
                        placeholder="Enter SteamID (e.g. STEAM_0:1:12345)"
                        className="w-full h-14 pl-12 pr-[120px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-lg font-mono focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:font-sans"
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center">
                        <Button type="submit" disabled={!steamId || loading} className="h-10 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition-colors">
                            {loading ? 'Checking...' : 'Check'}
                        </Button>
                    </div>
                </form>

                {/* Result Card */}
                {result && (
                    <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-0 shadow-xl overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
                            <div className={`h-2 w-full ${result === 'approved' ? 'bg-emerald-500' : result === 'rejected' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                            <CardContent className="p-8 pb-10">
                                <div className="flex flex-col items-center text-center">
                                    {result === 'approved' && (
                                        <>
                                            <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-6">
                                                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Application Approved</h3>
                                            <p className="text-slate-500 dark:text-slate-400">Congratulations! Your whitelist application has been approved. You can now connect to our servers.</p>
                                        </>
                                    )}
                                    {result === 'pending' && (
                                        <>
                                            <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mb-6">
                                                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Under Review</h3>
                                            <p className="text-slate-500 dark:text-slate-400">Your application is currently being reviewed by our administration team. Please check back later.</p>
                                        </>
                                    )}
                                    {result === 'rejected' && (
                                        <>
                                            <div className="h-16 w-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-6">
                                                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Application Denied</h3>
                                            <p className="text-slate-500 dark:text-slate-400">Unfortunately, your application did not meet our requirements at this time.</p>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
