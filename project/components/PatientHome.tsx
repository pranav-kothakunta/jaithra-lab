import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { ArrowRight, CheckCircle2, Clock, Home, ShieldCheck, Smartphone } from 'lucide-react';

const features = [
  {
    title: 'Free Home Collection',
    description: 'Book lab tests from home and our technician will collect your sample at your doorstep.',
    icon: Home,
  },
  {
    title: 'NABL Certified',
    description: 'Trusted lab testing with certified reports and reliable quality standards.',
    icon: ShieldCheck,
  },
  {
    title: '24-Hour Reports',
    description: 'Receive your verified reports quickly on WhatsApp without waiting in line.',
    icon: Clock,
  },
  {
    title: 'No Registration Needed',
    description: 'Book your tests instantly with just your mobile number and patient ID.',
    icon: Smartphone,
  },
];

const testTypes = [
  {
    title: 'Routine Blood Tests',
    description: 'CBC, ESR, blood group, and other common pathology tests for everyday health screening.',
  },
  {
    title: 'Diabetes & Heart Screening',
    description: 'HbA1c, fasting sugar, lipid profile, and other cardiac risk assessments.',
  },
  {
    title: 'Hormone & Fertility Tests',
    description: 'Thyroid, vitamin panels, fertility hormones, and reproductive health investigations.',
  },
  {
    title: 'Wellness Packages',
    description: 'Preventive health packages for full-body checkups and regular follow-up monitoring.',
  },
];

export default function PatientHome() {
  return (
    <PublicLayout
      title="Book lab tests online in minutes"
      description="Schedule home collection, track your appointment, and receive clear updates from Jaithra Lab in one place."
      showHero
    >
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <section className="space-y-8 rounded-[2rem] border border-slate-200/80 bg-white/80 p-8 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.32)] backdrop-blur">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-2 text-sm font-semibold text-teal-800">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />
            Free home collection • Fast WhatsApp reports • NABL certified
          </div>

          <div className="space-y-5">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Clean booking experience, trusted care, and fast reports.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Jaithra Lab brings pathology services to your doorstep with a simple booking flow, transparent updates, and dependable reporting.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/book"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Book Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/track"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Track Booking
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Admin Login
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-8 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Why choose Jaithra Lab</p>
            <h3 className="text-2xl font-semibold text-slate-900">Simple, safe, and speedy lab testing.</h3>
            <p className="text-slate-600">
              We make lab appointments easy for every family, whether you need a quick home collection or a visit to the lab.
            </p>
          </div>

          <div className="mt-8 grid gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-blue-600 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">{feature.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-[2rem] border border-slate-200/80 bg-white/80 p-8 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.18)] backdrop-blur">
        <div className="space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Tests we offer</p>
          <h3 className="text-3xl font-semibold text-slate-900 sm:text-4xl">A wide range of lab tests to support your care.</h3>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-600">
            From routine pathology to wellness screenings, our lab services are designed to make testing simple and accessible.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {testTypes.map((testType) => (
            <div key={testType.title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900">{testType.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">{testType.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">How it works</p>
          <h3 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Three easy steps to get tested.</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600 text-white">
              <Home className="h-6 w-6" />
            </div>
            <h4 className="text-xl font-semibold text-slate-900">Book Online</h4>
            <p className="mt-3 text-sm leading-6 text-slate-600">Provide your details and choose home collection for a convenient appointment.</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-teal-600 text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-xl font-semibold text-slate-900">Collection at Home</h4>
            <p className="mt-3 text-sm leading-6 text-slate-600">A trained technician comes to your home with proper safety and hygiene.</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 text-white">
              <Clock className="h-6 w-6" />
            </div>
            <h4 className="text-xl font-semibold text-slate-900">Reports in 24H</h4>
            <p className="mt-3 text-sm leading-6 text-slate-600">Get your verified report quickly on WhatsApp so you can move ahead without delay.</p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
