'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Server, Trash2, Edit, Cpu, RefreshCw, LogOut, ShieldBan } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type ServerInfo = {
    id: number;
    group_id: number;
    name: string;
    ip: string;
    port: number;
    rcon_password?: string;
    verification_enabled: boolean;
    required_rating: number;
    required_level: number;
    whitelist_only: boolean;
    status?: string;
};

type GroupWithServers = {
    id: number;
    name: string;
    servers: ServerInfo[];
};

type Player = {
    userid: number;
    name: string;
    steam_id: string;
    time: string;
    ping: number;
};

export default function CommunityManagementPage() {
    const [groups, setGroups] = useState<GroupWithServers[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    const [isCreateServerOpen, setIsCreateServerOpen] = useState(false);
    const [isCheckingRcon, setIsCheckingRcon] = useState(false);
    const [serverForm, setServerForm] = useState({
        group_id: 0,
        name: '',
        ip: '',
        port: 27015,
        rcon_password: '',
        verification_enabled: false,
        required_rating: 3.0,
        required_level: 1,
        whitelist_only: false,
    });

    const [isManageServerOpen, setIsManageServerOpen] = useState(false);
    const [activeServer, setActiveServer] = useState<ServerInfo | null>(null);
    const [manageTab, setManageTab] = useState<'details' | 'players'>('details');
    const [players, setPlayers] = useState<Player[]>([]);
    const [editForm, setEditForm] = useState<Partial<ServerInfo>>({});

    // Cooldown state for player refresh
    const [refreshCooldown, setRefreshCooldown] = useState(0);

    // Dialogs States
    const [deleteGroupId, setDeleteGroupId] = useState<number | null>(null);
    const [deleteServerId, setDeleteServerId] = useState<number | null>(null);
    const [kickPlayerUserid, setKickPlayerUserid] = useState<number | null>(null);

    const [banPlayerUserid, setBanPlayerUserid] = useState<number | null>(null);
    const [banDuration, setBanDuration] = useState(0);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/server-groups');
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
            } else {
                toast.error('Failed to fetch server groups');
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
            toast.error('Network error while fetching groups');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (refreshCooldown > 0) {
            timer = setTimeout(() => setRefreshCooldown(prev => prev - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [refreshCooldown]);

    const fetchPlayers = async (serverId: number) => {
        if (refreshCooldown > 0) return;
        setRefreshCooldown(5); // 5 seconds cooldown
        try {
            const res = await apiFetch(`/api/servers/${serverId}/players`);
            if (res.ok) {
                const data = await res.json();
                setPlayers(data);
            } else {
                toast.error("Failed to fetch players");
                setPlayers([]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (isManageServerOpen && manageTab === 'players' && activeServer) {
            fetchPlayers(activeServer.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isManageServerOpen, manageTab, activeServer]);

    const handleCreateGroup = async () => {
        try {
            const res = await apiFetch('/api/server-groups', {
                method: 'POST',
                body: JSON.stringify({ name: newGroupName }),
            });
            if (res.ok) {
                toast.success('Group created successfully');
                setIsCreateGroupOpen(false);
                setNewGroupName('');
                fetchGroups();
            } else {
                toast.error('Failed to create group');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error creating group');
        }
    };

    const submitDeleteGroup = async () => {
        if (!deleteGroupId) return;
        try {
            const res = await apiFetch(`/api/server-groups/${deleteGroupId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Group deleted');
                fetchGroups();
            } else {
                toast.error('Failed to delete group');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error deleting group');
        } finally {
            setDeleteGroupId(null);
        }
    };

    const openCreateServer = (groupId: number) => {
        setServerForm({ ...serverForm, group_id: groupId, name: '', ip: '', port: 27015, rcon_password: '', verification_enabled: false, required_rating: 3.0, required_level: 1, whitelist_only: false });
        setIsCreateServerOpen(true);
    };

    const handleCreateServer = async () => {
        setIsCheckingRcon(true);
        try {
            const checkRes = await apiFetch('/api/servers/check', {
                method: 'POST',
                body: JSON.stringify({
                    ip: serverForm.ip,
                    port: serverForm.port,
                    rcon_password: serverForm.rcon_password || ''
                }),
            });

            if (!checkRes.ok) {
                let errorMsg = '连接失败。请检查IP、端口和RCON密码。';
                try {
                    const errorData = await checkRes.json();
                    if (typeof errorData === 'string') {
                        errorMsg = errorData;
                    } else if (errorData.error) {
                        errorMsg = errorData.error;
                    }
                } catch {
                    const text = await checkRes.text();
                    if (text) errorMsg = text;
                }
                toast.error(`RCON 验证失败: ${errorMsg}`);
                return;
            }

            const res = await apiFetch('/api/servers', {
                method: 'POST',
                body: JSON.stringify(serverForm),
            });

            if (res.ok) {
                toast.success('Server verified and added successfully');
                setIsCreateServerOpen(false);
                fetchGroups();
            } else {
                toast.error('Failed to save server to database after verification');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error verifying or adding server');
        } finally {
            setIsCheckingRcon(false);
        }
    };

    const openManageServer = (server: ServerInfo) => {
        setActiveServer(server);
        setEditForm({ ...server });
        setManageTab('details');
        setIsManageServerOpen(true);
    };

    const handleUpdateServer = async () => {
        if (!activeServer) return;
        try {
            const res = await apiFetch(`/api/servers/${activeServer.id}`, {
                method: 'PUT',
                body: JSON.stringify(editForm),
            });
            if (res.ok) {
                toast.success('Server updated');
                fetchGroups();
                setActiveServer({ ...activeServer, ...editForm });
            } else {
                toast.error('Failed to update server');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error updating server');
        }
    };

    const submitDeleteServer = async () => {
        if (!deleteServerId) return;
        try {
            const res = await apiFetch(`/api/servers/${deleteServerId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Server removed');
                if (activeServer?.id === deleteServerId) setIsManageServerOpen(false);
                fetchGroups();
            } else {
                toast.error('Failed to remove server');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error removing server');
        } finally {
            setDeleteServerId(null);
        }
    };

    const submitKickPlayer = async () => {
        if (!activeServer || !kickPlayerUserid) return;
        try {
            const res = await apiFetch(`/api/servers/${activeServer.id}/kick`, {
                method: 'POST',
                body: JSON.stringify({ userid: kickPlayerUserid, reason: "Kicked via Web Dash" })
            });
            if (res.ok) {
                toast.success('Player kicked');
                fetchPlayers(activeServer.id);
            } else {
                toast.error('Failed to kick player');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error kicking player');
        } finally {
            setKickPlayerUserid(null);
        }
    };

    const submitBanPlayer = async () => {
        if (!activeServer || !banPlayerUserid) return;
        try {
            const res = await apiFetch(`/api/servers/${activeServer.id}/ban`, {
                method: 'POST',
                body: JSON.stringify({ userid: banPlayerUserid, duration: banDuration, reason: "Banned via Web Dash" })
            });
            if (res.ok) {
                toast.success('Player banned');
                fetchPlayers(activeServer.id);
            } else {
                toast.error('Failed to ban player');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error banning player');
        } finally {
            setBanPlayerUserid(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">社区组管理</h2>
                    <p className="text-slate-500 dark:text-slate-400">管理您的服务器分组与具体实例，包含节点监控与状态同步。</p>
                </div>

                <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                    <DialogTrigger asChild>
                        <Button className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
                            <Plus className="mr-2 h-4 w-4" />
                            新建服务器组
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>新建服务器组</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Label>分组名称</Label>
                            <Input
                                placeholder="输入分组名字 (例如: 新手服)"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                className="mt-2"
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>取消</Button>
                            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>创建</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500">加载中...</div>
            ) : (
                <div className="grid gap-6">
                    {groups.length === 0 && (
                        <div className="text-center py-12 text-slate-500 border border-dashed rounded-lg">
                            暂无服务器组数据，请先创建一个分组。
                        </div>
                    )}
                    {groups.map((group) => (
                        <Card key={group.id} className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
                                        <CardTitle className="text-lg">{group.name}</CardTitle>
                                        <Badge variant="outline" className="font-mono text-xs">ID: {group.id}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" className="h-8 border-dashed" onClick={() => openCreateServer(group.id)}>
                                            <Plus className="mr-2 h-3.5 w-3.5" />
                                            添加服务器
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setDeleteGroupId(group.id)}>
                                            删除组
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {group.servers.length === 0 ? (
                                    <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-900/20 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                                        <Server className="mx-auto h-8 w-8 text-slate-400 mb-3 opacity-50" />
                                        <p className="text-sm text-slate-500 dark:text-slate-400">该组下暂无服务器，请点击右上角添加</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {group.servers.map((server) => (
                                            <div
                                                key={server.id}
                                                className="group relative flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-colors"
                                            >
                                                <div className="absolute top-5 right-5 flex items-center gap-2">
                                                    {server.verification_enabled && (
                                                        <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/30 text-[10px] uppercase font-semibold">
                                                            Shield
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                                                        <Cpu className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                    </div>
                                                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate pr-14">{server.name}</h4>
                                                </div>

                                                <div className="flex flex-col gap-1 mb-5">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-slate-500 w-12 shrink-0">Server ID</span>
                                                        <span className="font-mono text-slate-700 dark:text-slate-300">{server.id}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-slate-500 w-12 shrink-0">Address</span>
                                                        <span className="font-mono text-slate-700 dark:text-slate-300">{server.ip}:{server.port}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                    <Button variant="outline" size="sm" className="w-full text-xs h-8 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => openManageServer(server)}>
                                                        <Edit className="h-3 w-3 mr-1.5" /> 管理
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="w-full text-xs h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setDeleteServerId(server.id)}>
                                                        <Trash2 className="h-3 w-3 mr-1.5" /> 删除
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Server Dialog */}
            <Dialog open={isCreateServerOpen} onOpenChange={setIsCreateServerOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>添加新服务器</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>服务器名称</Label>
                            <Input placeholder="例如: 某某专线1区" value={serverForm.name} onChange={(e) => setServerForm({ ...serverForm, name: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>IP 地址</Label>
                                <Input placeholder="192.168.1.1" value={serverForm.ip} onChange={(e) => setServerForm({ ...serverForm, ip: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>端口 (默认27015)</Label>
                                <Input type="number" value={serverForm.port} onChange={(e) => setServerForm({ ...serverForm, port: parseInt(e.target.value) || 0 })} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>RCON 密码 (极度重要)</Label>
                            <Input type="password" value={serverForm.rcon_password} onChange={(e) => setServerForm({ ...serverForm, rcon_password: e.target.value })} />
                            <p className="text-xs text-slate-500">添加服务器前系统将通过RCON尝试连接服务器以验证连通性。</p>
                        </div>
                        <div className="flex flex-col gap-3 mt-4 border-t pt-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="verifyEn"
                                    checked={serverForm.verification_enabled}
                                    onChange={(e) => setServerForm({ ...serverForm, verification_enabled: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <Label htmlFor="verifyEn" className="font-medium">启用进服前验证 (Shield)</Label>
                            </div>

                            {serverForm.verification_enabled && (
                                <div className="pl-6 space-y-4 border-l-2 border-slate-200 dark:border-slate-800 ml-2 mt-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="whitelistOnly"
                                            checked={serverForm.whitelist_only}
                                            onChange={(e) => setServerForm({ ...serverForm, whitelist_only: e.target.checked })}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <Label htmlFor="whitelistOnly" className="text-sm font-medium">仅限白名单进入</Label>
                                    </div>
                                    <p className="text-xs text-slate-500 ml-6 -mt-3">开启后进服不检测Rating和Level，只有在白名单内的玩家才能进入。</p>

                                    {!serverForm.whitelist_only && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label className="text-sm">进入所需最低 Rating</Label>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    value={serverForm.required_rating}
                                                    onChange={(e) => setServerForm({ ...serverForm, required_rating: parseFloat(e.target.value) || 0 })}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-sm">进入所需最低 Steam 等级</Label>
                                                <Input
                                                    type="number"
                                                    value={serverForm.required_level}
                                                    onChange={(e) => setServerForm({ ...serverForm, required_level: parseInt(e.target.value) || 0 })}
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateServerOpen(false)} disabled={isCheckingRcon}>取消</Button>
                        <Button onClick={handleCreateServer} disabled={!serverForm.name.trim() || !serverForm.ip.trim() || isCheckingRcon}>
                            {isCheckingRcon ? '验证 RCON 中...' : '验证并添加'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manage Server Dialog */}
            <Dialog open={isManageServerOpen} onOpenChange={setIsManageServerOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{activeServer?.name} - 管理面板</DialogTitle>
                    </DialogHeader>

                    <div className="flex items-center gap-2 mb-4 border-b pb-2">
                        <Button variant={manageTab === 'details' ? 'default' : 'ghost'} size="sm" onClick={() => setManageTab('details')}>修改详情</Button>
                        <Button variant={manageTab === 'players' ? 'default' : 'ghost'} size="sm" onClick={() => setManageTab('players')}>玩家管理</Button>
                    </div>

                    {manageTab === 'details' && activeServer && (
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>服务器名称</Label>
                                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>IP 地址</Label>
                                    <Input value={editForm.ip} onChange={(e) => setEditForm({ ...editForm, ip: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>端口</Label>
                                    <Input type="number" value={editForm.port} onChange={(e) => setEditForm({ ...editForm, port: parseInt(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>RCON 密码</Label>
                                <Input type="password" value={editForm.rcon_password || ''} placeholder="留空则不修改现有的密码" onChange={(e) => setEditForm({ ...editForm, rcon_password: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-3 mt-4 border-t pt-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="editVerifyEn"
                                        checked={editForm.verification_enabled || false}
                                        onChange={(e) => setEditForm({ ...editForm, verification_enabled: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <Label htmlFor="editVerifyEn" className="font-medium">启用进服前验证 (Shield)</Label>
                                </div>

                                {editForm.verification_enabled && (
                                    <div className="pl-6 space-y-4 border-l-2 border-slate-200 dark:border-slate-800 ml-2 mt-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="editWhitelistOnly"
                                                checked={editForm.whitelist_only || false}
                                                onChange={(e) => setEditForm({ ...editForm, whitelist_only: e.target.checked })}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <Label htmlFor="editWhitelistOnly" className="text-sm font-medium">仅限白名单进入</Label>
                                        </div>
                                        <p className="text-xs text-slate-500 ml-6 -mt-3">开启后进服不检测Rating和Level，只有在白名单内的玩家才能进入。</p>

                                        {!editForm.whitelist_only && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label className="text-sm">最低 Rating</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        value={editForm.required_rating !== undefined ? editForm.required_rating : 3.0}
                                                        onChange={(e) => setEditForm({ ...editForm, required_rating: parseFloat(e.target.value) || 0 })}
                                                        className="w-full"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label className="text-sm">最低 Steam 等级</Label>
                                                    <Input
                                                        type="number"
                                                        value={editForm.required_level !== undefined ? editForm.required_level : 1}
                                                        onChange={(e) => setEditForm({ ...editForm, required_level: parseInt(e.target.value) || 0 })}
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button onClick={handleUpdateServer}>保存设置</Button>
                            </div>
                        </div>
                    )}

                    {manageTab === 'players' && activeServer && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border">
                                <span className="text-sm font-medium">在线玩家列表</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchPlayers(activeServer.id)}
                                    disabled={refreshCooldown > 0}
                                >
                                    <RefreshCw className={`h-3 w-3 mr-2 ${refreshCooldown > 0 ? 'animate-spin' : ''}`} />
                                    {refreshCooldown > 0 ? `冷却中 (${refreshCooldown}s)` : '刷新'}
                                </Button>
                            </div>

                            {players.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 text-sm border border-dashed rounded-lg">
                                    暂无玩家或获取玩家列表失败
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                                            <tr>
                                                <th className="px-4 py-2">Name</th>
                                                <th className="px-4 py-2">SteamID</th>
                                                <th className="px-4 py-2">Time</th>
                                                <th className="px-4 py-2">Ping</th>
                                                <th className="px-4 py-2 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {players.map(p => (
                                                <tr key={p.userid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <td className="px-4 py-2 font-medium">{p.name || 'Unknown'}</td>
                                                    <td className="px-4 py-2 font-mono text-xs">{p.steam_id}</td>
                                                    <td className="px-4 py-2 text-xs">{p.time}</td>
                                                    <td className="px-4 py-2 text-xs">{p.ping}</td>
                                                    <td className="px-4 py-2 text-right flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" className="h-7 px-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30" onClick={() => setKickPlayerUserid(p.userid)}>
                                                            <LogOut className="h-3 w-3 mr-1" /> Kick
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => setBanPlayerUserid(p.userid)}>
                                                            <ShieldBan className="h-3 w-3 mr-1" /> Ban
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Group Alert Dialog */}
            <AlertDialog open={deleteGroupId !== null} onOpenChange={(open) => !open && setDeleteGroupId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确定要删除该分组吗？</AlertDialogTitle>
                        <AlertDialogDescription>
                            删除分组前，请确保组下的所有服务器均已被删除或者转移，否则可能导致异常。此操作不可逆。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteGroupId(null)}>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={submitDeleteGroup} className="bg-red-600 hover:bg-red-700 text-white">确定删除</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Server Alert Dialog */}
            <AlertDialog open={deleteServerId !== null} onOpenChange={(open) => !open && setDeleteServerId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确定要移除此服务器吗？</AlertDialogTitle>
                        <AlertDialogDescription>
                            将从管理面板中移除对该服务器的状态监控和操作权限。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteServerId(null)}>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={submitDeleteServer} className="bg-red-600 hover:bg-red-700 text-white">确定移除</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Kick Player Alert Dialog */}
            <AlertDialog open={kickPlayerUserid !== null} onOpenChange={(open) => !open && setKickPlayerUserid(null)}>
                <AlertDialogContent className="z-[60]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>确定断开此玩家的连接？</AlertDialogTitle>
                        <AlertDialogDescription>
                            该玩家将会被强制踢出当前的对局。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setKickPlayerUserid(null)}>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={submitKickPlayer} className="bg-orange-600 hover:bg-orange-700 text-white">确定踢出</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Ban Player Dialog */}
            <Dialog open={banPlayerUserid !== null} onOpenChange={(open) => !open && setBanPlayerUserid(null)}>
                <DialogContent className="sm:max-w-[425px] z-[60]">
                    <DialogHeader>
                        <DialogTitle>封禁玩家</DialogTitle>
                        <DialogDescription>
                            输入想封禁该玩家此时长 (单位: 分钟)。输入 0 即代表永久封禁。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">时长 (分钟)</Label>
                            <Input
                                type="number"
                                value={banDuration}
                                onChange={(e) => setBanDuration(parseInt(e.target.value) || 0)}
                                className="col-span-3"
                                placeholder="0 for permanent"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBanPlayerUserid(null)}>取消</Button>
                        <Button onClick={submitBanPlayer} className="bg-red-600 hover:bg-red-700 text-white">确定封禁</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
