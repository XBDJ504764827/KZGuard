'use client';

import React, { useState } from 'react';
import { ListChecks, UserPlus, FileCheck, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

const MOCK_WHITELIST = [
    { id: 1, steamId: 'STEAM_0:1:5555551', name: 'ProPlayer', status: 'approved', addedBy: 'SystemAdmin', addedAt: '2026-02-15 10:00:00' },
    { id: 2, steamId: 'STEAM_0:1:5555552', name: 'Newbie', status: 'pending', addedBy: 'Self (Application)', addedAt: '2026-02-20 11:20:00' },
    { id: 3, steamId: 'STEAM_0:1:5555553', name: 'TrollUser', status: 'rejected', addedBy: 'Moderator1', addedAt: '2026-02-19 14:10:00' },
];

export default function WhitelistPage() {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <ListChecks className="h-6 w-6 text-emerald-500" />
                        白名单管理
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">处理玩家的白名单申请与现有白名单用户管理。</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="shrink-0">
                        <FileCheck className="mr-2 h-4 w-4 text-emerald-500" />
                        一键审核所有
                    </Button>
                    <Button className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20">
                        <UserPlus className="mr-2 h-4 w-4" />
                        添加白名单
                    </Button>
                </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-80">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search SteamID or Name..."
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
                                <th className="px-6 py-4 whitespace-nowrap">Player Info</th>
                                <th className="px-6 py-4 whitespace-nowrap">Added By</th>
                                <th className="px-6 py-4 whitespace-nowrap">Time</th>
                                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {MOCK_WHITELIST.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold text-slate-900 dark:text-white">{user.name}</span>
                                            <span className="text-xs font-mono text-slate-500">{user.steamId}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {user.addedBy.includes('System') || user.addedBy.includes('Moderator') ? (
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                            )}
                                            <span className="text-slate-700 dark:text-slate-300">{user.addedBy}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm font-mono">{user.addedAt}</td>
                                    <td className="px-6 py-4">
                                        {user.status === 'pending' && <Badge variant="secondary" className="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-900 text-xs">审核中</Badge>}
                                        {user.status === 'approved' && <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 text-xs">已通过</Badge>}
                                        {user.status === 'rejected' && <Badge variant="secondary" className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-900 text-xs">已拒绝</Badge>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {user.status === 'pending' ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="icon" variant="outline" className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" title="Approve">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="outline" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Reject">
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end">
                                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs h-8">
                                                    Remove
                                                </Button>
                                            </div>
                                        )}
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
