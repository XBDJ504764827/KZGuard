'use client';

import React, { useState, useEffect } from 'react';
import { ListChecks, UserPlus, FileCheck, CheckCircle2, XCircle, Loader2, Search, SearchCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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

type WhitelistUser = {
    id: number;
    steam_id: string;
    steam_id_64?: string;
    steam_id_3?: string;
    name: string;
    status: string;
    reject_reason: string | null;
    admin_name: string | null;
    created_at: string | null;
};

export default function WhitelistPage() {
    const [whitelist, setWhitelist] = useState<WhitelistUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Dialog States
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newSteamId, setNewSteamId] = useState('');
    const [newName, setNewName] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const [isApproveAllOpen, setIsApproveAllOpen] = useState(false);
    const [removeId, setRemoveId] = useState<number | null>(null);

    const fetchWhitelist = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/api/whitelist');
            if (res.ok) {
                const data = await res.json();
                setWhitelist(data);
            } else {
                console.error('Failed to fetch whitelist');
            }
        } catch (error) {
            console.error('Error fetching whitelist:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWhitelist();
    }, []);

    const submitAddWhitelist = async () => {
        if (!newSteamId || !newName) {
            toast.error('SteamID 和 昵称 不能为空');
            return;
        }

        try {
            const res = await apiFetch('/api/whitelist', {
                method: 'POST',
                body: JSON.stringify({ steam_id: newSteamId, name: newName })
            });
            if (res.ok) {
                fetchWhitelist();
                toast.success('白名单添加成功');
                setIsAddOpen(false);
                setNewSteamId('');
                setNewName('');
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(`添加失败: ${data.error || '未知错误'}`);
            }
        } catch (error) {
            console.error('Error adding whitelist:', error);
            toast.error('发生网络错误');
        }
    };

    const handleVerifySteamId = async () => {
        if (!newSteamId) return;
        setIsVerifying(true);
        try {
            // Using the public endpoint to resolve SteamID and get Player Info
            const res = await apiFetch(`/api/whitelist/player-info?steam_id=${encodeURIComponent(newSteamId)}`);
            if (res.ok) {
                const data = await res.json();
                setNewName(data.personaname);
                toast.success('已自动获取玩家名称');
            } else {
                toast.error('无法解析此 SteamID 或获取信息');
            }
        } catch (err) {
            console.error(err);
            toast.error('与服务器通信时发生错误');
        } finally {
            setIsVerifying(false);
        }
    };

    const submitApproveAll = async () => {
        const pendingList = whitelist.filter(u => u.status === 'pending');
        let count = 0;
        for (const user of pendingList) {
            try {
                const res = await apiFetch(`/api/whitelist/${user.id}/approve`, { method: 'PUT' });
                if (res.ok) count++;
            } catch (error) {
                console.error(error);
            }
        }

        toast.success(`成功通过了 ${count} 个白名单申请`);
        setIsApproveAllOpen(false);
        fetchWhitelist();
    };

    const handleApproveAllClick = () => {
        const pendingList = whitelist.filter(u => u.status === 'pending');
        if (pendingList.length === 0) {
            toast.info('没有待审核的白名单申请');
            return;
        }
        setIsApproveAllOpen(true);
    };

    const handleAction = async (id: number, action: 'approve' | 'reject', rejectReason = '') => {
        try {
            setActionLoading(`${action}-${id}`);
            const body = action === 'reject' ? JSON.stringify({ reason: rejectReason || 'Denied by admin' }) : undefined;

            const res = await apiFetch(`/api/whitelist/${id}/${action}`, {
                method: 'PUT',
                body
            });

            if (res.ok) {
                toast.success(`操作成功: ${action === 'approve' ? '已通过' : '已拒绝'}`);
                fetchWhitelist();
            } else {
                toast.error(`操作失败`);
            }
        } catch (error) {
            console.error(`Error ${action} whitelist:`, error);
            toast.error(`发生网络错误`);
        } finally {
            setActionLoading(null);
        }
    };

    const submitRemove = async () => {
        if (!removeId) return;
        try {
            setActionLoading(`remove-${removeId}`);
            const res = await apiFetch(`/api/whitelist/${removeId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('已删除白名单记录');
                fetchWhitelist();
            } else {
                toast.error('删除白名单失败');
            }
        } catch (error) {
            console.error('Error deleting whitelist:', error);
            toast.error('发生网络错误');
        } finally {
            setActionLoading(null);
            setRemoveId(null);
        }
    };

    const filteredWhitelist = whitelist.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.steam_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <Button onClick={handleApproveAllClick} variant="outline" className="shrink-0">
                        <FileCheck className="mr-2 h-4 w-4 text-emerald-500" />
                        一键审核所有
                    </Button>
                    <Button onClick={() => setIsAddOpen(true)} className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20">
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
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex justify-center flex-col items-center">
                                            <Loader2 className="h-8 w-8 animate-spin mb-4 text-emerald-500" />
                                            <p>Loading whitelist...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredWhitelist.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No whitelist records found.
                                    </td>
                                </tr>
                            ) : filteredWhitelist.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold text-slate-900 dark:text-white">{user.name}</span>
                                            <span className="text-xs font-mono text-slate-500">ID2: {user.steam_id}</span>
                                            {user.steam_id_3 && <span className="text-xs font-mono text-slate-400">ID3: {user.steam_id_3}</span>}
                                            {user.steam_id_64 && <span className="text-xs font-mono text-slate-400">ID64: {user.steam_id_64}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {user.admin_name ? (
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                            )}
                                            <span className="text-slate-700 dark:text-slate-300">{user.admin_name || 'Self Application'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm font-mono flex flex-col gap-1">
                                        <span>{user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</span>
                                        {user.reject_reason && <span className="text-xs text-red-500 w-32 truncate" title={user.reject_reason}> Reason: {user.reject_reason}</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.status === 'pending' && <Badge variant="secondary" className="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-900 text-xs">审核中</Badge>}
                                        {user.status === 'approved' && <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 text-xs">已通过</Badge>}
                                        {user.status === 'rejected' && <Badge variant="secondary" className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-900 text-xs">已拒绝</Badge>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {user.status === 'pending' ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                                    title="Approve"
                                                    disabled={actionLoading !== null}
                                                    onClick={() => handleAction(user.id, 'approve')}
                                                >
                                                    {actionLoading === `approve-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    title="Reject"
                                                    disabled={actionLoading !== null}
                                                    onClick={() => handleAction(user.id, 'reject')}
                                                >
                                                    {actionLoading === `reject-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs h-8"
                                                    disabled={actionLoading !== null}
                                                    onClick={() => setRemoveId(user.id)}
                                                >
                                                    {actionLoading === `remove-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : 'Remove'}
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

            {/* Add Whitelist Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>添加白名单</DialogTitle>
                        <DialogDescription>
                            手动将玩家添加至白名单，跳过申请步骤直接生效。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="steamId" className="text-right">
                                SteamID
                            </Label>
                            <div className="col-span-3 flex gap-2">
                                <Input
                                    id="steamId"
                                    value={newSteamId}
                                    onChange={(e) => setNewSteamId(e.target.value)}
                                    className="font-mono text-sm"
                                    placeholder="任意格式均可解析"
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleVerifySteamId}
                                    disabled={!newSteamId || isVerifying}
                                    className="shrink-0"
                                >
                                    {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchCode className="h-4 w-4" />}
                                    <span className="sr-only">Verify</span>
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                玩家昵称
                            </Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="col-span-3"
                                placeholder="输入玩家昵称"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>取消</Button>
                        <Button type="submit" onClick={submitAddWhitelist}>确定添加</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve All Dialog */}
            <AlertDialog open={isApproveAllOpen} onOpenChange={setIsApproveAllOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认一键审核所有？</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作将把当前处于“待审核”状态的所有白名单申请批量标记为“已通过”。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsApproveAllOpen(false)}>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={submitApproveAll} className="bg-emerald-600 hover:bg-emerald-700 text-white">确认通过</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Remove Entry Dialog */}
            <AlertDialog open={removeId !== null} onOpenChange={(open) => !open && setRemoveId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确定要删除该记录吗？</AlertDialogTitle>
                        <AlertDialogDescription>
                            如果删除，玩家将失去相关的访问权限。如有需要可让玩家重新申请或手动添加。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRemoveId(null)}>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={submitRemove} className="bg-red-600 hover:bg-red-700 text-white">确定删除</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
