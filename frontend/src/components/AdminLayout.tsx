'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Users,
    Shield,
    ShieldAlert,
    FileText,
    List,
    CheckSquare,
    Menu,
    Moon,
    Sun,
    LogOut,
    Key,
    ExternalLink
} from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';

const navigation = [
    { name: '社区组管理', href: '/admin/community', icon: Users },
    { name: '封禁管理', href: '/admin/bans', icon: ShieldAlert },
    { name: '管理员管理', href: '/admin/admins', icon: Shield },
    { name: '操作日志', href: '/admin/logs', icon: FileText, requiresSuperAdmin: true },
    { name: '进服列表', href: '/admin/verifications', icon: CheckSquare, requiresSuperAdmin: true },
    { name: '白名单管理', href: '/admin/whitelist', icon: List },
];

const quickLinks = [
    { name: '白名单申请', href: '/apply', icon: FileText },
    { name: '封禁公示', href: '/bans', icon: ShieldAlert },
    { name: '白名单公示', href: '/whitelist-status', icon: List },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);

    // Mocking auth for now
    const currentUser = { username: 'Admin', role: 'super_admin' };
    const isSystemAdmin = currentUser?.role === 'super_admin';

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle('dark');
    };

    const currentRoute = pathname;

    return (
        <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300 ${isDark ? 'dark' : ''}`}>
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out transform lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
                        KZGuard
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto w-full">
                    {/* Nav */}
                    <nav className="p-4 space-y-2 mt-4">
                        {navigation.map((item) => {
                            if (item.requiresSuperAdmin && !isSystemAdmin) return null;
                            const active = currentRoute.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${active ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-600/20 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
                                >
                                    <item.icon className={`mr-3 h-5 w-5 transition-colors ${active ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400'}`} />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Quick Links */}
                    <div className="px-6 mt-6 mb-2">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">快速跳转</h3>
                    </div>
                    <nav className="px-4 space-y-2 mb-20">
                        {quickLinks.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                target="_blank"
                                className="flex items-center px-4 py-2 text-sm rounded-lg transition-colors duration-200 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white group"
                            >
                                <item.icon className="mr-3 h-4 w-4 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
                                {item.name}
                                <ExternalLink className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-50" />
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* User Info Footer */}
                <div className="mt-auto shrink-0 w-full p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    {currentUser ? (
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm ${isSystemAdmin ? 'bg-purple-600' : 'bg-blue-600'}`}>
                                    {currentUser.username.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-700 dark:text-white truncate">{currentUser.username}</p>
                                    <p className="text-xs text-slate-500 truncate">{isSystemAdmin ? 'System Admin' : 'Admin'}</p>
                                </div>
                            </div>
                            <div className="flex shrink-0">
                                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors" title="修改密码">
                                    <Key className="h-5 w-5" />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors" title="退出登录">
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <p className="text-xs text-slate-500">Not Logged In</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Top Header (Mobile Toggle & Title) */}
                <header className="h-16 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 backdrop-blur-md lg:hidden sticky top-0 z-30">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="text-lg font-bold text-slate-800 dark:text-white">KZGuard Dashboard</span>
                    <div className="w-6"></div>
                </header>

                {/* Desktop Header for premium feel */}
                <header className="hidden lg:flex h-16 bg-white/50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 items-center justify-between px-8 backdrop-blur-md sticky top-0 z-30">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        KZGuard Admin
                    </h2>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        >
                            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 p-6 lg:p-8 relative">
                    {/* Mobile theme toggle floating */}
                    <div className="absolute top-6 right-6 z-10 lg:hidden">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
                            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>
                    </div>
                    <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-500">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <Toaster position="top-center" />
        </div>
    );
}
