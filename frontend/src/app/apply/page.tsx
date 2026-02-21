'use client';

import React, { useState } from 'react';
import { FileSignature, ShieldCheck, SearchCode, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

export default function WhitelistApplyPage() {
    const [loading, setLoading] = useState(false);

    const [steamInput, setSteamInput] = useState('');
    const [name, setName] = useState('');
    const [fetchingInfo, setFetchingInfo] = useState(false);

    const handleFetchInfo = async () => {
        if (!steamInput) return;
        setFetchingInfo(true);
        try {
            const res = await apiFetch(`/api/whitelist/player-info?steam_id=${encodeURIComponent(steamInput)}`);
            if (res.ok) {
                const data = await res.json();
                setName(data.personaname);
                toast.success('Player info fetched successfully!');
            } else {
                toast.error('Could not find player. Please check the SteamID/URL.');
            }
        } catch (error) {
            console.error('Error fetching info:', error);
            toast.error('Failed to connect to server.');
        } finally {
            setFetchingInfo(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await apiFetch('/api/whitelist/apply', {
                method: 'POST',
                body: JSON.stringify({ steam_id: steamInput, name })
            });

            if (res.ok) {
                toast.success('Application submitted successfully! Please wait for admin approval.');
                setSteamInput('');
                setName('');
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(`Submit failed: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error submitting application:', error);
            toast.error('Network error during submission.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10 text-center mb-8">
                <div className="inline-flex items-center justify-center p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-800 mb-6 relative">
                    <div className="absolute inset-0 bg-emerald-400 dark:bg-emerald-500 blur-xl opacity-20 rounded-full"></div>
                    <FileSignature className="w-10 h-10 text-emerald-600 dark:text-emerald-400 relative z-10" />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
                    Whitelist Application
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
                    Apply for access to our private communities. Applications are reviewed manually by administrators and usually take 24-48 hours.
                </p>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-xl">
                <Card className="border-0 shadow-2xl shadow-emerald-900/5 bg-white xl:bg-white/80 dark:bg-slate-900 xl:dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-200 dark:ring-slate-800">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-6">
                        <CardTitle>Application Form</CardTitle>
                        <CardDescription>All fields are required unless marked otherwise.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="steamid">SteamID / Profile URL <span className="text-xs text-slate-400 font-normal">(Any format works)</span></Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="steamid"
                                            required
                                            value={steamInput}
                                            onChange={(e) => setSteamInput(e.target.value)}
                                            placeholder="STEAM_0:1:123456 or Profile Link"
                                            className="bg-slate-50 dark:bg-slate-950 font-mono focus:ring-emerald-500"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={handleFetchInfo}
                                            disabled={!steamInput || fetchingInfo}
                                            className="shrink-0"
                                        >
                                            {fetchingInfo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SearchCode className="h-4 w-4 mr-2" />}
                                            Fetch Info
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nickname">In-game Name</Label>
                                    <Input
                                        id="nickname"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Auto-filled via Fetch or type manually"
                                        className="bg-slate-50 dark:bg-slate-950 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex gap-3">
                                <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-800 dark:text-amber-300">
                                    <p className="font-semibold mb-1">Before you submit</p>
                                    <p>By submitting this application, you agree to follow all community rules. Any previous VAC or Game bans on record will result in an automatic rejection.</p>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25 transition-all text-base font-semibold"
                                disabled={loading}
                            >
                                {loading ? 'Submitting...' : 'Submit Application'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 pt-6 justify-center">
                        <a href="/whitelist-status" className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 text-center">
                            Already applied? Check your status here &rarr;
                        </a>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
