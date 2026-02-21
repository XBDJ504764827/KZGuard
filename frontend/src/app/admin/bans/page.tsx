'use client';

import React, { useState, useEffect } from 'react';
import { Search, ShieldBan, Trash, RefreshCw, Plus, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type BanInfo = {
    id: number;
    name: string;
    steam_id: string;
    ip: string | null;
    ban_type: string;
    reason: string | null;
    duration: number;
    status: string;
    admin_name: string | null;
    created_at: string;
    expires_at: string | null;
};

export default function BanListPage() {
    const [bans, setBans] = useState<BanInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isCreateBanOpen, setIsCreateBanOpen] = useState(false);
    const [isCheckingSteam, setIsCheckingSteam] = useState(false);
    const [deleteBanId, setDeleteBanId] = useState<number | null>(null);
    const [banForm, setBanForm] = useState({
        name: '',
        steam_id: '',
        ip: '',
        ban_type: 'account',
        reason: '',
        duration: 0,
        admin_name: 'Web Admin'
    });

    const fetchBans = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/bans');
            if (res.ok) {
                const data = await res.json();
                setBans(data);
            } else {
                toast.error('Failed to fetch bans');
                setBans([]);
            }
        } catch (error) {
            console.error('Error fetching bans:', error);
            toast.error('Network error while fetching bans');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBans();
    }, []);

    const handleCreateBan = async () => {
        try {
            const payload = {
                ...banForm,
                duration: banForm.duration.toString(),
                ip: banForm.ip || null,
                reason: banForm.reason || null
            };

            const res = await apiFetch('/api/bans', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success('Ban created successfully');
                setIsCreateBanOpen(false);
                setBanForm({
                    name: '',
                    steam_id: '',
                    ip: '',
                    ban_type: 'account',
                    reason: '',
                    duration: 0,
                    admin_name: 'Web Admin'
                });
                fetchBans();
            } else {
                toast.error('Failed to create ban');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error creating ban');
        }
    };

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            const res = await apiFetch(`/api/bans/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                toast.success(`Ban marked as ${newStatus}`);
                fetchBans();
            } else {
                toast.error('Failed to update ban status');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error updating ban');
        }
    };

    const submitDeleteBan = async () => {
        if (!deleteBanId) return;
        try {
            const res = await apiFetch(`/api/bans/${deleteBanId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Ban deleted and unban queued');
                fetchBans();
            } else if (res.status === 403) {
                toast.error('Permission denied: Only super admins can delete bans.');
            } else {
                toast.error('Failed to delete ban');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error deleting ban');
        } finally {
            setDeleteBanId(null);
        }
    };

    const checkSteamId = async () => {
        if (!banForm.steam_id.trim()) return;

        setIsCheckingSteam(true);
        try {
            const res = await apiFetch(`/api/whitelist/player-info?steam_id=${encodeURIComponent(banForm.steam_id)}`);
            if (res.ok) {
                const data = await res.json();
                setBanForm(prev => ({ ...prev, name: data.personaname }));
                toast.success(`识别到玩家: ${data.personaname}`);
            } else {
                toast.error('未找到该玩家信息，请确认 SteamID 是否正确');
            }
        } catch (error) {
            console.error('Error checking SteamID:', error);
            toast.error('查询玩家信息时发生网络错误');
        } finally {
            setIsCheckingSteam(false);
        }
    };

    const filteredBans = bans.filter(ban => {
        const term = searchTerm.toLowerCase();
        return (ban.name?.toLowerCase().includes(term) ||
            ban.steam_id?.toLowerCase().includes(term) ||
            (ban.ip && ban.ip.toLowerCase().includes(term)) ||
            (ban.reason && ban.reason.toLowerCase().includes(term)));
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">封禁管理</h2>
                    <p className="text-slate-500 dark:text-slate-400">管理游戏服务器的玩家封禁记录，包含自动检测与手动封禁。</p>
                </div>

                <Dialog open={isCreateBanOpen} onOpenChange={setIsCreateBanOpen}>
                    <DialogTrigger asChild>
                        <Button className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
                            <Plus className="mr-2 h-4 w-4" />
                            手动封禁玩家
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>新建封禁</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>玩家昵称 (可选标识)</Label>
                                    <Input
                                        placeholder="Name"
                                        value={banForm.name}
                                        onChange={(e) => setBanForm({ ...banForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <Label>SteamID (自动识别多种格式)</Label>
                                        {isCheckingSteam && <RefreshCw className="h-3 w-3 animate-spin text-slate-500" />}
                                    </div>
                                    <Input
                                        placeholder="STEAM_0:... / 7656... / [U:1:...]"
                                        value={banForm.steam_id}
                                        onChange={(e) => setBanForm({ ...banForm, steam_id: e.target.value })}
                                        onBlur={checkSteamId}
                                    />
                                    <p className="text-[10px] text-slate-500">输入后点击空白处将自动查询并填入名称</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label>IP 地址 (可选)</Label>
                                <Input
                                    placeholder="0.0.0.0"
                                    value={banForm.ip}
                                    onChange={(e) => setBanForm({ ...banForm, ip: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>封禁时长 (分钟，0为永久)</Label>
                                    <Input
                                        type="number"
                                        value={banForm.duration}
                                        onChange={(e) => setBanForm({ ...banForm, duration: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>封禁类型</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                                        value={banForm.ban_type}
                                        onChange={(e) => setBanForm({ ...banForm, ban_type: e.target.value })}
                                    >
                                        <option value="account">Account (账号连坐封禁)</option>
                                        <option value="ip">IP (全网物理地址封禁)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label>封禁原因</Label>
                                <Input
                                    placeholder="例如：作弊 / 语言过激"
                                    value={banForm.reason}
                                    onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateBanOpen(false)}>取消</Button>
                            <Button onClick={handleCreateBan} disabled={!banForm.steam_id.trim() && !banForm.ip.trim()}>添加封禁</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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
                <Button variant="outline" size="icon" onClick={() => fetchBans()}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">玩家 (Player)</th>
                                <th className="px-6 py-4 whitespace-nowrap">封禁原因 (Reason)</th>
                                <th className="px-6 py-4 whitespace-nowrap">网络与类型 (Type & IP)</th>
                                <th className="px-6 py-4 whitespace-nowrap">状态与时间 (Status & Time)</th>
                                <th className="px-6 py-4 whitespace-nowrap text-right">操作 (Actions)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {loading && bans.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        加载中...
                                    </td>
                                </tr>
                            ) : filteredBans.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        暂无满足条件的封禁数据
                                    </td>
                                </tr>
                            ) : filteredBans.map((ban) => (
                                <tr key={ban.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                                <User className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-semibold text-slate-900 dark:text-white truncate">{ban.name || 'Unknown'}</span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                        {ban.steam_id || 'NO_STEAM_ID'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">#{ban.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 max-w-[240px]">
                                            <span className="text-slate-700 dark:text-slate-300 font-medium text-sm leading-snug">
                                                {ban.reason || '未提供具体封禁原因'}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                                                <span>Admin: {ban.admin_name || 'System'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <Badge variant="outline" className={`w-fit text-[10px] px-1.5 py-0 h-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${ban.ban_type === 'ip' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                {ban.ban_type.toUpperCase()}
                                            </Badge>
                                            {ban.ip ? (
                                                <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                                                    <span className="opacity-50">Addr:</span> {ban.ip}
                                                </div>
                                            ) : (
                                                <div className="text-[10px] italic text-slate-400">No IP recorded</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={ban.status === 'active' ? 'destructive' : 'secondary'} className={`text-[10px] px-2 py-0 h-4 ${ban.status === 'active' ? 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/50 hover:bg-red-500/10' : ''}`}>
                                                    {ban.status === 'active' ? 'Active' : 'Expired'}
                                                </Badge>
                                                <div className="flex items-center text-[10px] text-slate-400">
                                                    <Clock className="h-3 w-3 mr-1 opacity-60" />
                                                    {new Date(ban.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                {ban.expires_at ? (
                                                    <span className="flex items-center gap-1">
                                                        <span className="opacity-60">Expires:</span>
                                                        <span className={ban.status === 'active' ? 'text-amber-600 dark:text-amber-500' : ''}>
                                                            {new Date(ban.expires_at).toLocaleDateString()}
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span className="text-red-500 font-semibold tracking-wider text-[9px] uppercase">Permanent Ban</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {ban.status === 'active' ? (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20" title="Lift Ban" onClick={() => handleUpdateStatus(ban.id, 'expired')}>
                                                    <RefreshCw className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800" title="Reban" onClick={() => handleUpdateStatus(ban.id, 'active')}>
                                                    <ShieldBan className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Permanently Delete Ban" onClick={() => setDeleteBanId(ban.id)}>
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

            {/* Delete Ban Alert Dialog */}
            <AlertDialog open={deleteBanId !== null} onOpenChange={(open) => !open && setDeleteBanId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确定要永久删除此封禁吗？</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作不可逆。删除后将自动解除玩家的封禁。仅 Super Admin 能够执行此操作。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteBanId(null)}>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={submitDeleteBan} className="bg-red-600 hover:bg-red-700 text-white">确定删除</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
