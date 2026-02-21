'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckSquare, XSquare, Search, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';

type VerificationRecord = {
    steam_id: string;
    status: string;
    reason: string | null;
    steam_level: number | null;
    playtime_minutes: number | null;
    created_at: string | null;
    updated_at: string | null;
};

export default function VerificationsPage() {
    const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchVerifications = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/api/verifications');
            if (res.ok) {
                const data = await res.json();
                setVerifications(data);
            } else {
                console.error('Failed to fetch verifications');
            }
        } catch (error) {
            console.error('Error fetching verifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVerifications();
    }, []);

    const handleAction = async (steamId: string, status: 'allowed' | 'denied', buttonId: string) => {
        try {
            setActionLoading(buttonId);
            const res = await apiFetch(`/api/verifications/${steamId}`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchVerifications();
            }
        } catch (error) {
            console.error('Error updating verification:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredVerifications = verifications.filter(v =>
        v.steam_id.toLowerCase().includes(search.toLowerCase()) ||
        (v.reason && v.reason.toLowerCase().includes(search.toLowerCase()))
    );

    const pendingCount = verifications.filter(v => v.status === 'pending').length;
    const deniedCount = verifications.filter(v => ['denied', 'rejected'].includes(v.status.toLowerCase())).length;
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-indigo-500" />
                        进服验证列表
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">实时监控玩家进服验证请求与风险评估评分。</p>
                </div>
                <Button variant="outline" className="shrink-0" onClick={fetchVerifications} disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    刷新列表
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-0 shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-100 uppercase tracking-wider">今日拦截</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{deniedCount} <span className="text-sm font-normal text-indigo-200">次请求</span></div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-100 uppercase tracking-wider">待审核请求</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{pendingCount} <span className="text-sm font-normal text-amber-200">个玩家</span></div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-80">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search by SteamID, Reason..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">Timestamp</th>
                                <th className="px-6 py-4 whitespace-nowrap">Player Info</th>
                                <th className="px-6 py-4 whitespace-nowrap">Target Server</th>
                                <th className="px-6 py-4 whitespace-nowrap">Risk Score</th>
                                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex justify-center flex-col items-center">
                                            <Loader2 className="h-8 w-8 animate-spin mb-4 text-indigo-500" />
                                            <p>Loading verifications...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredVerifications.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        No verifications found.
                                    </td>
                                </tr>
                            ) : filteredVerifications.map((v, i) => {
                                const isPending = v.status === 'pending';
                                const isAllowed = ['allowed', 'approved', 'verified'].includes(v.status.toLowerCase());
                                const isDenied = ['denied', 'rejected'].includes(v.status.toLowerCase());
                                const riskLevel = v.steam_level !== null && v.steam_level < 5 ? 85 : 20;

                                return (
                                    <tr key={`${v.steam_id}-${i}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400 text-xs">{v.created_at ? new Date(v.created_at).toLocaleString() : 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{v.steam_id}</span>
                                                {v.reason && <span className="text-xs text-slate-500 w-48 truncate" title={v.reason}>{v.reason}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm">Lvl: {v.steam_level !== null ? v.steam_level : '?'}</span>
                                                <span className="text-xs text-slate-500">{v.playtime_minutes !== null ? `${Math.round(v.playtime_minutes / 60)} hrs` : 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${riskLevel > 80 ? 'text-red-500' : riskLevel > 50 ? 'text-amber-500' : 'text-green-500'}`}>{riskLevel}</span>
                                                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full ${riskLevel > 80 ? 'bg-red-500' : riskLevel > 50 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${riskLevel}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isPending && <Badge variant="secondary" className="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-900">审查中 ({v.status})</Badge>}
                                            {isAllowed && <Badge variant="secondary" className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-900">通过 ({v.status})</Badge>}
                                            {isDenied && <Badge variant="secondary" className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-900">拦截 ({v.status})</Badge>}
                                            {!isPending && !isAllowed && !isDenied && <Badge variant="outline">{v.status}</Badge>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {isPending && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                        title="Approve"
                                                        disabled={actionLoading !== null}
                                                        onClick={() => handleAction(v.steam_id, 'allowed', `approve-${v.steam_id}`)}
                                                    >
                                                        {actionLoading === `approve-${v.steam_id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        title="Reject"
                                                        disabled={actionLoading !== null}
                                                        onClick={() => handleAction(v.steam_id, 'denied', `reject-${v.steam_id}`)}
                                                    >
                                                        {actionLoading === `reject-${v.steam_id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <XSquare className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
