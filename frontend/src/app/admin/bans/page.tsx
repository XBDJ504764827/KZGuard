'use client';

import React, { useState } from 'react';
import { Search, ShieldBan, Trash, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
// We will just use standard HTML table with shadcn styling if this fails

// Mock Bans Data
const MOCK_BANS = [
    { id: 1, name: 'Hacker123', steamId: 'STEAM_0:1:1234567', steam64: '76561198000000001', ip: '192.168.1.5', status: 'active', banType: 'game', reason: 'Aimbot detected by Anticheat', adminName: 'Admin', expiresAt: null, createTime: '2026-02-20T10:00:00Z' },
    { id: 2, name: 'ToxicPlayer', steamId: 'STEAM_0:1:7654321', steam64: '76561198000000002', ip: '10.0.0.12', status: 'expired', banType: 'community', reason: 'Excessive toxicity in voice chat', adminName: 'System', expiresAt: '2026-02-19T10:00:00Z', createTime: '2026-02-12T10:00:00Z' },
];

export default function BanListPage() {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">封禁管理</h2>
                    <p className="text-slate-500 dark:text-slate-400">管理游戏服务器的玩家封禁记录，包含自动检测与手动封禁。</p>
                </div>
                <Button className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
                    <ShieldBan className="mr-2 h-4 w-4" />
                    手动封禁玩家
                </Button>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-80">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search by IP, SteamID, Name..."
                        className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">ID</th>
                                <th className="px-6 py-4 whitespace-nowrap">Player Info</th>
                                <th className="px-6 py-4 whitespace-nowrap">IP Address</th>
                                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {MOCK_BANS.map((ban) => (
                                <tr key={ban.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4 font-mono text-slate-500">#{ban.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold text-slate-900 dark:text-white">{ban.name}</span>
                                            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{ban.steamId}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">{ban.ip}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={ban.status === 'active' ? 'destructive' : 'secondary'} className={ban.status === 'active' ? 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400' : ''}>
                                                {ban.status === 'active' ? 'Active' : 'Expired'}
                                            </Badge>
                                            <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900">
                                                {ban.banType}
                                            </Badge>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {ban.status === 'active' ? (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20" title="Lift Ban">
                                                    <RefreshCw className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800" title="Reban">
                                                    <ShieldBan className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
