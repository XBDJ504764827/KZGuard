'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, ShieldPlus, ShieldCheck, Loader2, Search, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

type Admin = {
    id: number;
    username: string;
    role: string;
    steam_id: string | null;
    created_at: string | null;
    remark: string | null;
};

export default function AdminsPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [currentUser, setCurrentUser] = useState<{ username: string, role: string } | null>(null);

    // Dialog states
    const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
    const [newAdminUser, setNewAdminUser] = useState('');
    const [newAdminPass, setNewAdminPass] = useState('');
    const [newAdminSteamId, setNewAdminSteamId] = useState('');
    const [newAdminRemark, setNewAdminRemark] = useState('');

    const [editAdminId, setEditAdminId] = useState<number | null>(null);
    const [editAdminForm, setEditAdminForm] = useState<Partial<Admin> & { password?: string }>({});

    const [deactivateAdminId, setDeactivateAdminId] = useState<number | null>(null);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/api/admins');
            if (res.ok) {
                const data = await res.json();
                setAdmins(data);
            } else {
                console.error('Failed to fetch admins');
            }
        } catch (error) {
            console.error('Error fetching admins:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUser({ username: payload.sub, role: payload.role });
            } catch {
                console.error("Failed to parse user info from token.");
            }
        }
    }, []);

    const submitAddAdmin = async () => {
        if (!newAdminUser || !newAdminPass) {
            toast.error('用户名和密码不能为空');
            return;
        }

        try {
            const payload = {
                username: newAdminUser,
                password: newAdminPass,
                role: 'admin',
                steam_id: newAdminSteamId.trim() || undefined,
                remark: newAdminRemark.trim() || undefined
            };
            const res = await apiFetch('/api/admins', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                fetchAdmins();
                toast.success('管理员添加成功');
                setIsAddAdminOpen(false);
                setNewAdminUser('');
                setNewAdminPass('');
                setNewAdminSteamId('');
                setNewAdminRemark('');
            } else {
                toast.error('添加管理员失败');
            }
        } catch (error) {
            console.error('Error adding admin:', error);
            toast.error('发生网络错误');
        }
    };

    const openEditAdmin = (admin: Admin) => {
        setEditAdminId(admin.id);
        setEditAdminForm({
            username: admin.username,
            role: admin.role,
            steam_id: admin.steam_id || '',
            remark: admin.remark || '',
            password: '',
        });
    };

    const submitEditAdmin = async () => {
        if (!editAdminId) return;

        const payload: Partial<Admin> & { password?: string } = {};
        if (editAdminForm.username) payload.username = editAdminForm.username;
        if (editAdminForm.role) payload.role = editAdminForm.role;
        if (editAdminForm.steam_id !== undefined) payload.steam_id = editAdminForm.steam_id?.trim() || undefined;
        if (editAdminForm.remark !== undefined) payload.remark = editAdminForm.remark?.trim() || undefined;
        if (editAdminForm.password) payload.password = editAdminForm.password;

        try {
            const res = await apiFetch(`/api/admins/${editAdminId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                toast.success('信息更新成功');
                setEditAdminId(null);
                fetchAdmins();
            } else {
                toast.error('更新失败或权限不足');
            }
        } catch (error) {
            console.error('Error updating admin:', error);
            toast.error('发生网络错误');
        }
    };

    const submitDeactivate = async () => {
        if (!deactivateAdminId) return;
        try {
            const res = await apiFetch(`/api/admins/${deactivateAdminId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchAdmins();
                toast.success('账号已停用');
            } else {
                toast.error('停用账号失败');
            }
        } catch (error) {
            console.error('Error deleting admin:', error);
            toast.error('发生网络错误');
        } finally {
            setDeactivateAdminId(null);
        }
    };

    const filteredAdmins = admins.filter(admin =>
        admin.username.toLowerCase().includes(search.toLowerCase()) ||
        (admin.steam_id && admin.steam_id.toLowerCase().includes(search.toLowerCase())) ||
        (admin.remark && admin.remark.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">管理员管理</h2>
                    <p className="text-slate-500 dark:text-slate-400">管理系统管理员及权限分配，维护社区安全基线。</p>
                </div>
                <Button onClick={() => setIsAddAdminOpen(true)} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
                    <UserPlus className="mr-2 h-4 w-4" />
                    添加管理员
                </Button>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-80">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search admins..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center flex-col items-center py-12 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
                    <p>Loading administrators...</p>
                </div>
            ) : filteredAdmins.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    No administrators found.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAdmins.map(admin => (
                        <Card key={admin.id} className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group bg-white dark:bg-slate-950">
                            <div className={`absolute top-0 left-0 w-full h-1 ${admin.role === 'super_admin' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${admin.role === 'super_admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                                            {admin.username.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base text-slate-900 dark:text-white">{admin.username}</CardTitle>
                                            {admin.steam_id && (
                                                <CardDescription className="flex items-center gap-1 mt-0.5 font-mono text-xs">
                                                    {admin.steam_id}
                                                </CardDescription>
                                            )}
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                                        Active
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
                                        <span className="text-slate-500 dark:text-slate-400">Created At</span>
                                        <span className="font-mono text-slate-600 dark:text-slate-400 text-xs">
                                            {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    {admin.remark && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500 dark:text-slate-400">Remark</span>
                                            <span className="text-slate-600 dark:text-slate-400 text-xs truncate max-w-[150px]" title={admin.remark}>
                                                {admin.remark}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                                    {(currentUser?.role === 'super_admin' || currentUser?.username === admin.username) && (
                                        <Button onClick={() => openEditAdmin(admin)} variant="outline" size="sm" className="flex-1 h-8 px-2 text-xs bg-white dark:bg-slate-900 whitespace-nowrap">
                                            <Edit className="mr-1 h-3.5 w-3.5 text-slate-400 shrink-0" /> 修改信息
                                        </Button>
                                    )}
                                    {currentUser?.role === 'super_admin' && (
                                        <Button onClick={() => setDeactivateAdminId(admin.id)} variant="outline" size="sm" className="flex-1 h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 bg-white dark:bg-slate-900 whitespace-nowrap">
                                            停用账号
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Admin Dialog */}
            <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>添加管理员</DialogTitle>
                        <DialogDescription>
                            创建一个新的管理员账号，默认分配基础 Admin 权限。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="username" className="text-right">
                                用户名
                            </Label>
                            <Input
                                id="username"
                                value={newAdminUser}
                                onChange={(e) => setNewAdminUser(e.target.value)}
                                className="col-span-3"
                                placeholder="输入用户名"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">
                                初始密码
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={newAdminPass}
                                onChange={(e) => setNewAdminPass(e.target.value)}
                                className="col-span-3"
                                placeholder="输入初始密码"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="steamid" className="text-right">
                                SteamID
                            </Label>
                            <Input
                                id="steamid"
                                value={newAdminSteamId}
                                onChange={(e) => setNewAdminSteamId(e.target.value)}
                                className="col-span-3"
                                placeholder="选填 (例如 STEAM_0:1:12345)"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="remark" className="text-right">
                                备注
                            </Label>
                            <Input
                                id="remark"
                                value={newAdminRemark}
                                onChange={(e) => setNewAdminRemark(e.target.value)}
                                className="col-span-3"
                                placeholder="选填"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddAdminOpen(false)}>取消</Button>
                        <Button type="submit" onClick={submitAddAdmin}>确定保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Admin Dialog */}
            <Dialog open={editAdminId !== null} onOpenChange={(open) => !open && setEditAdminId(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>修改信息</DialogTitle>
                        <DialogDescription>
                            编辑账号信息。若无需修改密码，请留空。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-username" className="text-right">
                                用户名
                            </Label>
                            <Input
                                id="edit-username"
                                value={editAdminForm.username || ''}
                                onChange={(e) => setEditAdminForm({ ...editAdminForm, username: e.target.value })}
                                className="col-span-3"
                                disabled={currentUser?.role !== 'super_admin'}
                            />
                        </div>
                        {currentUser?.role === 'super_admin' && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-role" className="text-right">
                                    角色
                                </Label>
                                <select
                                    id="edit-role"
                                    value={editAdminForm.role || 'admin'}
                                    onChange={(e) => setEditAdminForm({ ...editAdminForm, role: e.target.value })}
                                    className="col-span-3 flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-password" className="text-right">
                                新密码
                            </Label>
                            <Input
                                id="edit-password"
                                type="password"
                                value={editAdminForm.password || ''}
                                onChange={(e) => setEditAdminForm({ ...editAdminForm, password: e.target.value })}
                                className="col-span-3"
                                placeholder="留空以保持不变"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-steamid" className="text-right">
                                SteamID
                            </Label>
                            <Input
                                id="edit-steamid"
                                value={editAdminForm.steam_id || ''}
                                onChange={(e) => setEditAdminForm({ ...editAdminForm, steam_id: e.target.value })}
                                className="col-span-3"
                                placeholder="选填"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-remark" className="text-right">
                                备注
                            </Label>
                            <Input
                                id="edit-remark"
                                value={editAdminForm.remark || ''}
                                onChange={(e) => setEditAdminForm({ ...editAdminForm, remark: e.target.value })}
                                className="col-span-3"
                                placeholder="选填"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditAdminId(null)}>取消</Button>
                        <Button type="button" onClick={submitEditAdmin}>保存修改</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Deactivate Admin Alert Dialog */}
            <AlertDialog open={deactivateAdminId !== null} onOpenChange={(open) => !open && setDeactivateAdminId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确定要停用此账号吗？</AlertDialogTitle>
                        <AlertDialogDescription>
                            停用或删除后，该管理员将无法再登录控制面板并执行任何系统操作。此步骤不可撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeactivateAdminId(null)}>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={submitDeactivate} className="bg-red-600 hover:bg-red-700 text-white">确定停用</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
