'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Clock, Server, Monitor, ShieldCheck, ShieldAlert, Cpu, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';

type AuditLog = {
    id: number;
    admin_username: string;
    action: string;
    target: string | null;
    details: string | null;
    created_at: string | null;
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/api/logs');
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            } else {
                console.error('Failed to fetch logs');
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);
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
                        {loading ? (
                            <div className="flex justify-center flex-col items-center py-12 text-slate-400">
                                <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
                                <p>Loading audit logs...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                No audit logs found.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {logs.map(log => {
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
                                                        <span className="font-semibold">{log.admin_username}</span> performed <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{log.action}</span> {log.target && <><span className="font-normal text-slate-500">on</span> <span className="font-medium text-slate-700 dark:text-slate-300">{log.target}</span></>}
                                                    </p>
                                                    {log.details && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{log.details}</p>}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0 sm:mt-0 mt-2 font-mono">
                                                    <Clock className="h-3 w-3" />
                                                    {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
