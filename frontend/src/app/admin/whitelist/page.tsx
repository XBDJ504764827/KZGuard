'use client';

import React, { useState, useEffect } from 'react';
import { ListChecks, UserPlus, CheckCircle2, XCircle, Loader2, Search, SearchCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    ban_record?: { reason?: string } | null;
    global_ban_record?: { data?: { ban_type?: string; server_name?: string; created_on?: string; notes?: string; stats?: string }[] } | null;
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

    const [removeId, setRemoveId] = useState<number | null>(null);

    // Reject Dialog State
    const [rejectId, setRejectId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const fetchWhitelist = async () => {
        try {
            setLoading(true);
            const [approvedRes, pendingRes, rejectedRes] = await Promise.allSettled([
                apiFetch('/api/whitelist'),
                apiFetch('/api/whitelist/pending'),
                apiFetch('/api/whitelist/rejected')
            ]);

            let combinedList: WhitelistUser[] = [];

            if (approvedRes.status === 'fulfilled' && approvedRes.value.ok) {
                const data = await approvedRes.value.json();
                combinedList = [...combinedList, ...data];
            }
            if (pendingRes.status === 'fulfilled' && pendingRes.value.ok) {
                const data = await pendingRes.value.json();
                combinedList = [...combinedList, ...data];
            }
            if (rejectedRes.status === 'fulfilled' && rejectedRes.value.ok) {
                const data = await rejectedRes.value.json();
                combinedList = [...combinedList, ...data];
            }

            // Fetch ALL active bans once to avoid N+1 requests and 404 spam
            let activeBans: { steam_id?: string; steam_id_64?: string; steam_id_3?: string; status: string; reason?: string }[] = [];
            try {
                const bansRes = await apiFetch('/api/bans');
                if (bansRes.ok) {
                    const bansData = await bansRes.json();
                    activeBans = bansData.filter((b: { status: string }) => b.status === 'active');
                }
            } catch (e) {
                console.error('Error fetching bans list', e);
            }

            // Fetch Global Bans using bulk API
            let globalBansMap: Record<string, { data?: { ban_type?: string; server_name?: string; created_on?: string; notes?: string; stats?: string }[] }> = {};
            try {
                const steamIds64 = combinedList
                    .map(u => u.steam_id_64)
                    .filter(id => id && id.trim() !== '') as string[];

                if (steamIds64.length > 0) {
                    const globalRes = await apiFetch('/api/check_global_ban/bulk', {
                        method: 'POST',
                        body: JSON.stringify({ steam_ids: steamIds64 })
                    });
                    if (globalRes.ok) {
                        globalBansMap = await globalRes.json();
                    }
                }
            } catch (e) {
                console.error('Error fetching global bans', e);
            }

            const listWithBans = combinedList.map(user => {
                // Determine if user has any matching active local ban
                const userBan = activeBans.find(b =>
                    (b.steam_id && b.steam_id === user.steam_id) ||
                    (b.steam_id_64 && user.steam_id_64 && b.steam_id_64 === user.steam_id_64) ||
                    (b.steam_id_3 && user.steam_id_3 && b.steam_id_3 === user.steam_id_3)
                );

                // Determine if user has a global ban
                const globalBan = user.steam_id_64 ? globalBansMap[user.steam_id_64] : null;

                return { ...user, ban_record: userBan || null, global_ban_record: globalBan || null };
            });

            // Sort combined list by created_at descending just in case
            listWithBans.sort((a, b) => {
                if (!a.created_at) return 1;
                if (!b.created_at) return -1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            setWhitelist(listWithBans);
        } catch (error) {
            console.error('Error fetching whitelist:', error);
            toast.error('获取白名单数据失败');
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

    const handleAction = async (id: number, action: 'approve' | 'reject', providedReason = '') => {
        try {
            setActionLoading(`${action}-${id}`);
            const body = action === 'reject' ? JSON.stringify({ reason: providedReason || 'Denied by admin' }) : undefined;

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

    const submitReject = async () => {
        if (!rejectId) return;
        if (!rejectReason.trim()) {
            toast.error('请输入拒绝理由');
            return;
        }
        await handleAction(rejectId, 'reject', rejectReason);
        setRejectId(null);
        setRejectReason('');
    };

    const filteredWhitelist = whitelist.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.steam_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const approvedList = filteredWhitelist.filter(u => u.status === 'approved');
    const pendingList = filteredWhitelist.filter(u => u.status === 'pending');
    const rejectedList = filteredWhitelist.filter(u => u.status === 'rejected');

    const renderTable = (list: WhitelistUser[]) => (
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
                        ) : list.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    No records found for this category.
                                </td>
                            </tr>
                        ) : list.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-slate-900 dark:text-white">{user.name}</span>
                                            {user.ban_record && (
                                                <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase font-bold tracking-wider bg-purple-600 hover:bg-purple-700 border-purple-600">
                                                    Local Banned
                                                </Badge>
                                            )}
                                            {user.global_ban_record?.data && user.global_ban_record.data.length > 0 && (
                                                <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase font-bold tracking-wider bg-red-600 hover:bg-red-700">
                                                    Global Banned
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-xs font-mono text-slate-500">ID2: {user.steam_id}</span>
                                        {user.steam_id_3 && <span className="text-xs font-mono text-slate-400">ID3: {user.steam_id_3}</span>}
                                        {user.steam_id_64 && <span className="text-xs font-mono text-slate-400">ID64: {user.steam_id_64}</span>}

                                        {/* Display Global Ban details if present */}
                                        {user.global_ban_record?.data && user.global_ban_record.data.length > 0 && (
                                            <div className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-xs text-red-800 dark:text-red-300">
                                                <p className="font-semibold mb-0.5">Global Ban Details:</p>
                                                {user.global_ban_record.data.map((ban, idx: number) => (
                                                    <div key={idx} className="mb-2 last:mb-0 border-b border-red-200/50 dark:border-red-800/50 pb-2 last:border-0 last:pb-0">
                                                        <div className="flex gap-4 mb-1">
                                                            <div><span className="opacity-70">Type:</span> <span className="font-semibold">{ban.ban_type || 'Unknown'}</span></div>
                                                            <div><span className="opacity-70">Server:</span> <span className="font-medium">{ban.server_name || 'Global'}</span></div>
                                                            {ban.created_on && (
                                                                <div><span className="opacity-70">Date:</span> <span className="font-mono">{new Date(ban.created_on).toLocaleDateString()}</span></div>
                                                            )}
                                                        </div>
                                                        <div className="mb-0.5">
                                                            <span className="opacity-70">Reason / Notes:</span> <span className="font-medium">{ban.notes || 'No reason provided'}</span>
                                                        </div>
                                                        {ban.stats && (
                                                            <div>
                                                                <span className="opacity-70">Stats:</span> <span className="font-mono text-[10px] break-all opacity-90">{ban.stats}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Display Local Ban details if present */}
                                        {user.ban_record && (
                                            <div className="mt-1 p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md text-xs text-purple-800 dark:text-purple-300">
                                                <p className="font-semibold mb-0.5">Local Ban Record:</p>
                                                <div>
                                                    <span className="opacity-80">Reason: </span>
                                                    <span className="font-medium">{user.ban_record.reason || 'No reason provided'}</span>
                                                </div>
                                            </div>
                                        )}
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
                                                onClick={() => { setRejectId(user.id); setRejectReason(''); }}
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

            <Tabs defaultValue="approved" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="approved" className="flex gap-2">已通过 <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs font-mono">{approvedList.length}</Badge></TabsTrigger>
                    <TabsTrigger value="pending" className="flex gap-2">待审核 <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-400 rounded-full px-2 py-0.5 text-xs font-mono">{pendingList.length}</Badge></TabsTrigger>
                    <TabsTrigger value="rejected" className="flex gap-2">已拒绝 <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400 rounded-full px-2 py-0.5 text-xs font-mono">{rejectedList.length}</Badge></TabsTrigger>
                </TabsList>

                <TabsContent value="approved">
                    {renderTable(approvedList)}
                </TabsContent>
                <TabsContent value="pending">
                    {renderTable(pendingList)}
                </TabsContent>
                <TabsContent value="rejected">
                    {renderTable(rejectedList)}
                </TabsContent>
            </Tabs>

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

            {/* Reject Reason Dialog */}
            <Dialog open={rejectId !== null} onOpenChange={(open) => { if (!open) setRejectId(null); }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 dark:text-red-500">拒绝申请</DialogTitle>
                        <DialogDescription>
                            请输入拒绝该玩家加入白名单的理由。该理由将展示在玩家的数据列表中。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-4">
                            <Label htmlFor="rejectReason">
                                拒绝理由
                            </Label>
                            <Input
                                id="rejectReason"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="例如：疑似作弊、VAC封禁记录、不符合社区要求等"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        submitReject();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectId(null)}>取消</Button>
                        <Button onClick={submitReject} className="bg-red-600 hover:bg-red-700 text-white" disabled={!rejectReason.trim()}>
                            确认拒绝
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
