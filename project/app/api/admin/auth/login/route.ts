import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createToken, hashPassword } from '@/lib/auth';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Use edge function to look up user (bypasses RLS via service role)
    const userRes = await fetch(`${SUPABASE_URL}/functions/v1/admin-api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
      body: JSON.stringify({ email: email.toLowerCase().trim() }),
    });

    if (!userRes.ok) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = await userRes.json();

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Auto-upgrade plaintext passwords to bcrypt
    if (!user.password_hash.startsWith('$2')) {
      const hashed = await hashPassword(password);
      await fetch(`${SUPABASE_URL}/functions/v1/admin-api/upgrade-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
        body: JSON.stringify({ id: user.id, password_hash: hashed }),
      });
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });

    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
