'use client';

import Link from 'next/link';
import { FlaskConical, HeartPulse, Phone, ShieldCheck, Sparkles, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/book', label: 'Book' },
  { href: '/track', label: 'Track' },
  { href: '/admin/login', label: 'Admin' },
];

type PublicLayoutProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
  compact?: boolean;
  showHero?: boolean;
};

export default function PublicLayout({
  children,
  title,
  description,
  compact = false,
  showHero = false,
}: PublicLayoutProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#fafcff] text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-teal-400/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-400/5 blur-[120px]" />
      </div>

      <header
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-out',
          scrolled
            ? 'bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.03)]'
            : 'bg-transparent py-2'
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[18px] bg-white shadow-lg shadow-blue-500/10 transition-transform duration-500 group-hover:scale-105">
              <img src="/logo.jpg" alt="Jaithra Lab Logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-slate-900">Jaithra Lab</p>
              <p className="text-xs font-medium text-slate-500">Premium Diagnostics</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-semibold text-slate-600 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-4 py-2 transition-colors hover:text-blue-600 before:absolute before:inset-0 before:rounded-full before:bg-blue-50 before:opacity-0 before:transition-opacity hover:before:opacity-100"
              >
                <span className="relative z-10">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 pt-32 pb-16 sm:px-6 lg:px-8">
        {showHero && (title || description) ? (
          <section className="mb-12 overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/40 p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:bg-white/50">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/50 bg-blue-50/50 px-4 py-1.5 text-sm font-bold text-blue-700 backdrop-blur-md shadow-sm">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Next-Gen Diagnostics
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.1]">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-5 text-lg leading-relaxed text-slate-600 font-medium">
                    {description}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-3">
                <div className="group flex items-center gap-3 rounded-2xl border border-white/60 bg-white/60 p-4 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-600 transition-transform group-hover:scale-110">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  NABL Certified Quality
                </div>
                <div className="group flex items-center gap-3 rounded-2xl border border-white/60 bg-white/60 p-4 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-transform group-hover:scale-110">
                    <Phone className="h-5 w-5" />
                  </div>
                  Instant Updates
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <div className={cn('w-full relative z-10', compact ? 'mx-auto max-w-5xl' : 'mx-auto max-w-7xl')}>
          {children}
        </div>
      </main>

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || '918008807506'}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 group flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_rgba(37,211,102,0.4)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(37,211,102,0.5)] hover:scale-105"
        aria-label="Contact on WhatsApp"
      >
        <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <MessageCircle className="h-8 w-8 relative z-10 drop-shadow-sm" fill="currentColor" />
        {/* Tooltip */}
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 scale-0 whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white opacity-0 shadow-xl transition-all duration-300 origin-right group-hover:scale-100 group-hover:opacity-100">
          Chat with us
          <div className="absolute right-[-4px] top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-slate-900" />
        </span>
      </a>

      <footer className="relative z-10 border-t border-slate-200/50 bg-white/50 backdrop-blur-xl px-4 py-12 sm:px-6 lg:px-8 mt-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-blue-600 to-teal-400 text-white shadow-lg shadow-blue-500/20">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">Jaithra Lab</p>
              <p className="text-sm font-medium text-slate-500">Premium care, delivered.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-600">
            <Link href="/book" className="transition hover:text-blue-600 hover:-translate-y-0.5 inline-block">
              Book a Test
            </Link>
            <Link href="/track" className="transition hover:text-blue-600 hover:-translate-y-0.5 inline-block">
              Track Booking
            </Link>
            <a href="tel:+918008807506" className="transition hover:text-blue-600 hover:-translate-y-0.5 inline-flex items-center gap-1">
              <Phone className="w-4 h-4" /> +91 80088 07506
            </a>
            <a href="https://wa.me/918008807506" target="_blank" rel="noopener noreferrer" className="transition text-green-600 hover:text-green-700 hover:-translate-y-0.5 inline-block">
              WhatsApp Support
            </a>
            <a href="mailto:rameshgujjari81@gmail.com" className="transition hover:text-blue-600 hover:-translate-y-0.5 inline-block">
              rameshgujjari81@gmail.com
            </a>
            <Link href="/admin/login" className="transition hover:text-blue-600 hover:-translate-y-0.5 inline-block">
              Admin Access
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
