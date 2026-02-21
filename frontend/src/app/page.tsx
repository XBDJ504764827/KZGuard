'use client';

import React, { useState } from 'react';
import { ShieldAlert, Fingerprint, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.text();
        setErrorMsg(errData || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        router.push('/admin/community');
      } else {
        setErrorMsg('Authentication successful but no token received.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('Failed to connect to the server.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-30 dark:opacity-20 flex justify-center">
        <div className="absolute -top-40 w-[600px] h-[600px] bg-blue-400 dark:bg-blue-600 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-lighten opacity-40"></div>
        <div className="absolute top-20 left-20 w-[400px] h-[400px] bg-purple-400 dark:bg-purple-600 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-lighten opacity-30"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
          <ShieldAlert className="w-10 h-10 text-blue-600 dark:text-blue-500" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
          KZGuard
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Enterprise-grade community security and administration platform
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="border-0 shadow-2xl shadow-blue-900/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-200 dark:ring-slate-800">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-bold text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">Authenticate to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 font-medium">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700 dark:text-slate-300">Username</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Fingerprint className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="username"
                    type="text"
                    required
                    className="pl-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-11"
                    placeholder="admin"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Password</Label>
                  <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">Forgot password?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="pl-10 pr-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-11 focus:ring-blue-500 font-mono tracking-widest text-lg"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-500 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all group mt-6"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Authenticating...
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2 font-semibold">
                    Sign in to Dashboard <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col pb-8">
            <div className="mt-6 relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/80 dark:bg-slate-900/80 text-slate-500">Public Services</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 w-full">
              <Button variant="outline" className="h-10 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800" onClick={() => router.push('/bans')}>
                View Ban List
              </Button>
              <Button variant="outline" className="h-10 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800" onClick={() => router.push('/apply')}>
                Apply Whitelist
              </Button>
            </div>
          </CardFooter>
        </Card>

        <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
          &copy; 2026 KZGuard Security. Internal system.
        </p>
      </div>
    </div>
  );
}
