'use client';

import React from 'react';
import { UserPlus, ShieldPlus, ShieldCheck, Mail, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MOCK_ADMINS = [
    { id: 1, username: 'SystemAdmin', email: 'admin@kzguard.com', role: 'super_admin', status: 'active', lastLogin: '2026-02-20 12:00:00' },
    { id: 2, username: 'Moderator1', email: 'mod1@kzguard.com', role: 'admin', status: 'active', lastLogin: '2026-02-19 15:30:00' },
    { id: 3, username: 'TrialAdmin', email: 'trial@kzguard.com', role: 'admin', status: 'suspended', lastLogin: '2026-01-10 09:12:00' }
];

export default function AdminsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">管理员管理</h2>
                    <p className="text-slate-500 dark:text-slate-400">管理系统管理员及权限分配，维护社区安全基线。</p>
                </div>
                <Button className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
                    <UserPlus className="mr-2 h-4 w-4" />
                    添加管理员
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_ADMINS.map(admin => (
                    <Card key={admin.id} className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-full h-1 ${admin.role === 'super_admin' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${admin.role === 'super_admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                                        {admin.username.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{admin.username}</CardTitle>
                                        <CardDescription className="flex items-center gap-1 mt-0.5">
                                            <Mail className="h-3 w-3" />
                                            {admin.email}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge variant="outline" className={admin.status === 'active' ? 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : 'text-slate-500'}>
                                    {admin.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        {admin.role === 'super_admin' ? <ShieldPlus className="h-3.5 w-3.5 text-purple-500" /> : <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />}
                                        Role
                                    </span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Last Login</span>
                                    <span className="font-mono text-slate-600 dark:text-slate-400 text-xs">{admin.lastLogin}</span>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                                <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                                    <Key className="mr-1.5 h-3.5 w-3.5 text-slate-400" /> 重置密码
                                </Button>
                                <Button variant="outline" size="sm" className="w-full h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                    停用账号
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
