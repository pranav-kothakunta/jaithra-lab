'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FlaskConical, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
        return;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_email', data.user?.email || email);
        localStorage.setItem('admin_name', data.user?.name || 'Admin');
      }
      router.push('/admin/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#fafcff] text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-400/20 blur-[120px]" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="text-center mb-8">
          <div className="relative inline-flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] bg-white shadow-xl shadow-blue-500/10 mb-6">
            <img src="/logo.jpg" alt="Jaithra Lab Logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Admin Portal</h1>
          <p className="text-sm font-medium text-slate-500 mt-2">Sign in to manage your lab operations</p>
        </div>

        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/60 p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50/80 backdrop-blur-md border border-red-200/50 text-red-700 text-sm font-medium p-4 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 text-center">
                {error}
              </div>
            )}
            
            <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-4 flex items-start gap-3 backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-blue-900">Secure Access</p>
                <p className="text-xs font-medium text-blue-700/80 mt-0.5">This area is restricted to authorized lab personnel only.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-slate-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@jaithra-lab.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 rounded-2xl border-2 border-white bg-white/50 px-5 text-base shadow-sm backdrop-blur-md focus:border-blue-500 focus:bg-white focus:ring-0 transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold text-slate-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 rounded-2xl border-2 border-white bg-white/50 pl-5 pr-12 text-base shadow-sm backdrop-blur-md focus:border-blue-500 focus:bg-white focus:ring-0 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white font-extrabold text-base shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 mt-2"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
