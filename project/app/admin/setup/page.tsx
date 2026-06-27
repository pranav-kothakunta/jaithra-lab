'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Mail } from 'lucide-react';

export default function AdminSetupPage() {
  const [email, setEmail] = useState('pranavkothakunta@gmail.com');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSetupEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/setup-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      console.log('Setup response:', data, 'Status:', res.status);

      if (!res.ok) {
        setError(data.error || 'Setup failed');
        setIsLoading(false);
        return;
      }

      // Store email in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_email', email);
        localStorage.setItem('admin_setup_complete', 'true');
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 2000);
    } catch (err: any) {
      console.error('Setup error:', err);
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <PublicLayout compact>
      <div className="mx-auto max-w-md">
        {success ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-green-900">Email Linked Successfully!</h2>
            <p className="mt-2 text-sm text-green-700">
              All appointment notifications will be sent to {email}
            </p>
            <p className="mt-4 text-sm text-green-600">Redirecting to login...</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Link Your Email</h1>
              <p className="mt-2 text-sm text-slate-600">
                Receive appointment notifications at this email address
              </p>
            </div>

            <form onSubmit={handleSetupEmail} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  required
                  className="h-11"
                />
                <p className="text-xs text-slate-500">
                  This email will receive all new appointment notifications
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {isLoading ? 'Setting up...' : 'Link Email'}
              </Button>

              <p className="text-center text-sm text-slate-600">
                Already set up?{' '}
                <Link href="/admin/login" className="font-semibold text-blue-600 hover:text-blue-700">
                  Go to admin login
                </Link>
              </p>
            </form>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
