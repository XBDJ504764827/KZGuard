'use client';

import React from 'react';
import { Activity, Clock, Server, Monitor, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MOCK_LOGS = [
    { id: 1001, admin: 'SystemAdmin', action: 'BANNED_PLAYER', target: 'STEAM_0:1:12345', time: '2026-02-20 12:05:33', detail: 'Aimbot detection (Automated)' },
    { id: 1002, admin: 'Moderator1', action: 'WHITELIST_APPROVED', target: 'PlayerX (765611)', time: '2026-02-20 11:30:10', detail: 'Approved application #55' },
    { id: 1003, admin: 'SystemAdmin', action: 'SERVER_ADDED', target: 'Server #102', time: '2026-02-19 18:22:00', detail: 'Added new BGP node' },
    { id: 1004, admin: 'SystemAdmin', action: 'CONFIG_UPDATED', target: 'Global Settings', time: '2026-02-18 09:15:00', detail: 'Changed max verification limit' },
];

export default function AuditLogsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="h-6 w-6 text-blue-500" />
                    操作日志
                </h2>
                <p className="text-slate-500 dark:text-slate-400">系统审计与操作追溯，记录管理员及系统的所有关键行为。</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="text-base flex items-center justify-between">
                            <span>近日操作时间线</span>
                            <Badge variant="secondary" className="font-normal text-xs text-slate-500 bg-white dark:bg-slate-800">Showing last 50 entries</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {MOCK_LOGS.map(log => {
                                let Icon = Monitor;
                                let iconColor = 'text-slate-500';
                                let bgColor = 'bg-slate-100 dark:bg-slate-800';

                                if (log.action.includes('BAN')) {
                                    Icon = ShieldAlert;
                                    iconColor = 'text-red-500';
                                    bgColor = 'bg-red-50 dark:bg-red-500/10';
                                } else if (log.action.includes('WHITELIST') || log.action.includes('APPROVED')) {
                                    Icon = ShieldCheck;
                                    iconColor = 'text-green-500';
                                    bgColor = 'bg-green-50 dark:bg-green-500/10';
                                } else if (log.action.includes('SERVER')) {
                                    Icon = Server;
                                    iconColor = 'text-blue-500';
                                    bgColor = 'bg-blue-50 dark:bg-blue-500/10';
                                } else if (log.action.includes('CONFIG')) {
                                    Icon = Cpu;
                                    iconColor = 'text-purple-500';
                                    bgColor = 'bg-purple-50 dark:bg-purple-500/10';
                                }

                                return (
                                    <div key={log.id} className="p-4 sm:px-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors flex gap-4 sm:gap-6 items-start group">
                                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${bgColor}`}>
                                            <Icon className={`h-4 w-4 ${iconColor}`} />
                                        </div>
                                        <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                    <span className="font-semibold">{log.admin}</span> performed <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{log.action}</span> on <span className="font-medium text-slate-700 dark:text-slate-300">{log.target}</span>
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{log.detail}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0 sm:mt-0 mt-2 font-mono">
                                                <Clock className="h-3 w-3" />
                                                {log.time}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
