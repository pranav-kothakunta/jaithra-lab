import Link from 'next/link';
import { ArrowRight, FlaskConical, HeartPulse, Home, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_40%),linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-600/20">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">Jaithra Lab</p>
              <p className="text-xs text-slate-500">Book Blood Tests Online</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-slate-900">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {showHero && (title || description) ? (
          <section className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 p-8 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                  <Sparkles className="h-4 w-4" />
                  Trusted diagnostics, simplified
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  {title}
                </h1>
                {description ? <p className="mt-3 text-base leading-7 text-slate-600">{description}</p> : null}
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-teal-600" />
                  NABL certified reporting
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  Fast support and updates
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <div className={cn('w-full', compact ? 'mx-auto max-w-5xl' : 'mx-auto max-w-7xl')}>
          {children}
        </div>
      </main>

      <footer className="border-t border-slate-200/80 bg-white/70 px-4 py-8 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Jaithra Lab</p>
              <p className="text-sm text-slate-500">Convenient bookings, reliable care.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <Link href="/book" className="transition hover:text-slate-900">
              Book a test
            </Link>
            <Link href="/track" className="transition hover:text-slate-900">
              Track booking
            </Link>
            <Link href="/admin/login" className="transition hover:text-slate-900">
              Admin access
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
