'use client';

import React from 'react';
import { ShieldCheck, CheckSquare, XSquare, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const MOCK_VERIFICATIONS = [
    { id: 2001, steamId: 'STEAM_0:1:9999991', ip: '192.168.1.10', serverName: '北京 BGP 1服', time: '2026-02-20 12:45:00', status: 'pending', riskScore: 85 },
    { id: 2002, steamId: 'STEAM_0:1:9999992', ip: '10.0.0.42', serverName: '上海 BGP 2服', time: '2026-02-20 12:40:15', status: 'approved', riskScore: 10 },
    { id: 2003, steamId: 'STEAM_0:1:9999993', ip: '172.16.0.5', serverName: '北京 BGP 1服', time: '2026-02-20 12:35:22', status: 'rejected', riskScore: 95 },
];

export default function VerificationsPage() {
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
                <Button variant="outline" className="shrink-0">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    刷新列表
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-0 shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-100 uppercase tracking-wider">今日拦截</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">124 <span className="text-sm font-normal text-indigo-200">次请求</span></div>
                        <p className="text-xs text-indigo-200 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> +12% from yesterday</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-80">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search by IP, SteamID..."
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
                            {MOCK_VERIFICATIONS.map(v => (
                                <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400 text-xs">{v.time}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{v.steamId}</span>
                                            <span className="text-xs text-slate-500 font-mono">{v.ip}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{v.serverName}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold ${v.riskScore > 80 ? 'text-red-500' : v.riskScore > 50 ? 'text-amber-500' : 'text-green-500'}`}>{v.riskScore}</span>
                                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full ${v.riskScore > 80 ? 'bg-red-500' : v.riskScore > 50 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${v.riskScore}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {v.status === 'pending' && <Badge variant="secondary" className="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-900">审查中</Badge>}
                                        {v.status === 'approved' && <Badge variant="secondary" className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-900">通过</Badge>}
                                        {v.status === 'rejected' && <Badge variant="secondary" className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-900">拦截</Badge>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {v.status === 'pending' && (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="icon" variant="outline" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" title="Approve">
                                                    <CheckSquare className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="outline" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Reject">
                                                    <XSquare className="h-4 w-4" />
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
