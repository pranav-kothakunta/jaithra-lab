import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { ArrowRight, CheckCircle2, Clock, Home, ShieldCheck, Smartphone, Beaker, FileHeart, Stethoscope, Activity, MapPin } from 'lucide-react';

const features = [
  {
    title: 'Free Home Collection',
    description: 'Book lab tests from home and our technician will collect your sample at your doorstep.',
    icon: Home,
    color: 'from-blue-500 to-cyan-400',
  },
  {
    title: 'NABL Certified',
    description: 'Trusted lab testing with certified reports and reliable quality standards.',
    icon: ShieldCheck,
    color: 'from-teal-500 to-emerald-400',
  },
  {
    title: '24-Hour Reports',
    description: 'Receive your verified reports quickly on WhatsApp without waiting in line.',
    icon: Clock,
    color: 'from-violet-500 to-purple-400',
  },
  {
    title: 'No Registration Needed',
    description: 'Book your tests instantly with just your mobile number and patient ID.',
    icon: Smartphone,
    color: 'from-amber-500 to-orange-400',
  },
];

const testTypes = [
  {
    title: 'Routine Blood Tests',
    description: 'CBC, ESR, blood group, and other common pathology tests.',
    icon: Beaker,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    title: 'Diabetes & Heart',
    description: 'HbA1c, fasting sugar, lipid profile, and cardiac risks.',
    icon: Activity,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  {
    title: 'Hormone & Fertility',
    description: 'Thyroid, vitamin panels, fertility hormones.',
    icon: FileHeart,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    title: 'Wellness Packages',
    description: 'Preventive health packages for full-body checkups.',
    icon: Stethoscope,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
];

export default function PatientHome() {
  return (
    <PublicLayout
      title="Book lab tests online in minutes"
      description="Schedule home collection, track your appointment, and receive clear updates from Jaithra Lab in one place."
      showHero
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <section className="group relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/60 p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:bg-white/80">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-blue-400/20 to-teal-400/20 blur-3xl transition-opacity duration-500 group-hover:opacity-100 opacity-50" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/50 bg-teal-50/50 px-4 py-1.5 text-sm font-bold text-teal-700 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
              Free home collection • Fast WhatsApp reports
            </div>

            <div className="mt-8 space-y-6">
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-[1.15]">
                Clean booking experience,<br/> trusted care, fast reports.
              </h2>
              <p className="max-w-2xl text-lg leading-relaxed text-slate-600 font-medium">
                Jaithra Lab brings pathology services to your doorstep with a simple booking flow, transparent updates, and dependable reporting.
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/book"
                className="group/btn relative overflow-hidden inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-slate-900/20 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-slate-900/30"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-teal-500 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
                <span className="relative z-10 flex items-center">
                  Book Now
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                </span>
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center justify-center rounded-full border-2 border-slate-200/50 bg-white/50 backdrop-blur-md px-8 py-4 text-base font-semibold text-slate-700 transition-all hover:bg-white hover:border-slate-300 hover:shadow-lg hover:-translate-y-1"
              >
                Track Booking
              </Link>
              <a
                href="https://maps.app.goo.gl/XQNAahxHV4H5as7z5"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border-2 border-slate-200/50 bg-white/50 backdrop-blur-md px-8 py-4 text-base font-semibold text-teal-700 transition-all hover:bg-white hover:border-teal-300 hover:shadow-lg hover:-translate-y-1"
              >
                <MapPin className="mr-2 h-5 w-5" />
                Lab Location
              </a>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/60 p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:bg-white/80">
          <div className="space-y-3">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Why Jaithra Lab</p>
            <h3 className="text-2xl font-extrabold text-slate-900 leading-tight">Simple, safe, and speedy lab testing.</h3>
          </div>

          <div className="mt-8 grid gap-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="group flex items-start gap-5 rounded-[1.5rem] border border-white/60 bg-white/40 p-5 backdrop-blur-md transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 cursor-default">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className="h-6 w-6 drop-shadow-md" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{feature.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 font-medium">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="mt-12 relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/60 p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:bg-white/80">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Tests we offer</p>
          <h3 className="text-3xl font-extrabold text-slate-900 sm:text-4xl leading-tight">A wide range of lab tests to support your care.</h3>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {testTypes.map((testType) => {
            const Icon = testType.icon;
            return (
              <div key={testType.title} className="group relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/40 p-8 backdrop-blur-md transition-all duration-300 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2">
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-[18px] ${testType.bg} ${testType.color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h4 className="text-xl font-bold text-slate-900">{testType.title}</h4>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 font-medium">{testType.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-12 space-y-10">
        <div className="space-y-4 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-600">How it works</p>
          <h3 className="text-3xl font-extrabold text-slate-900 sm:text-4xl leading-tight">Three easy steps to get tested.</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/60 p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Home className="h-10 w-10 drop-shadow-md" />
            </div>
            <h4 className="text-2xl font-bold text-slate-900">Book Online</h4>
            <p className="mt-4 text-base leading-relaxed text-slate-600 font-medium">Provide your details and choose home collection for a convenient appointment.</p>
          </div>
          <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/60 p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-teal-500 to-emerald-400 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
              <CheckCircle2 className="h-10 w-10 drop-shadow-md" />
            </div>
            <h4 className="text-2xl font-bold text-slate-900">Collection at Home</h4>
            <p className="mt-4 text-base leading-relaxed text-slate-600 font-medium">A trained technician comes to your home with proper safety and hygiene.</p>
          </div>
          <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/60 p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-violet-500 to-purple-400 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Clock className="h-10 w-10 drop-shadow-md" />
            </div>
            <h4 className="text-2xl font-bold text-slate-900">Reports in 24H</h4>
            <p className="mt-4 text-base leading-relaxed text-slate-600 font-medium">Get your verified report quickly on WhatsApp so you can move ahead without delay.</p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
