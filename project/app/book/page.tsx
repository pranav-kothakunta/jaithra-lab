'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { ArrowRight, CheckCircle2, MapPin, Phone, ShieldCheck } from 'lucide-react';

type BookingForm = {
  name: string;
  phone: string;
  age: string;
  gender: string;
  address: string;
  location: string;
  collection_type: 'home_collection' | 'lab_visit';
  booking_date: string;
  tests_text: string;
};

const initialForm: BookingForm = {
  name: '',
  phone: '',
  age: '',
  gender: 'male',
  address: '',
  location: '',
  collection_type: 'home_collection',
  booking_date: new Date().toISOString().split('T')[0],
  tests_text: '',
};

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [form, setForm] = useState<BookingForm>(initialForm);
  const [locationMessage, setLocationMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patientId, setPatientId] = useState('');
  const [availableTests, setAvailableTests] = useState<string[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  const formattedPhone = phone.replace(/\D/g, '');

  const handlePhoneSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = formattedPhone;
    if (cleaned.length !== 10) {
      setPhoneError('Enter a valid 10-digit mobile number');
      return;
    }
    setPhoneError('');
    setForm((current) => ({ ...current, phone: cleaned }));
    setStep(2);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Geolocation is not supported by your browser.');
      return;
    }
    setLocationMessage('Getting your location…');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setForm((current) => ({ ...current, location: `${lat},${lng}` }));
        setLocationMessage(`Location captured: ${lat}, ${lng}`);
      },
      () => {
        setLocationMessage('Unable to get your location. Please enter address manually.');
      },
      { timeout: 15000 },
    );
  };

  const handleToggleTest = (testName: string) => {
    setSelectedTests((current) =>
      current.includes(testName)
        ? current.filter((name) => name !== testName)
        : [...current, testName],
    );
  };

  useEffect(() => {
    const loadTests = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data, error } = await sb
          .from('tests')
          .select('name')
          .eq('is_active', true)
          .order('category');
        if (error || !data) { setAvailableTests([]); return; }
        setAvailableTests(data.map((t: { name: string }) => t.name).filter(Boolean));
      } catch {
        setAvailableTests([]);
      }
    };

    loadTests();
  }, []);

  const createBooking = async () => {
    setError('');
    setIsLoading(true);

    const customTests = form.tests_text
      ? form.tests_text.split(',').map((test) => ({ test_name: test.trim(), price: 0 }))
      : [];

    const tests = [
      ...selectedTests.map((test_name) => ({ test_name, price: 0 })),
      ...customTests,
    ];

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          age: form.age,
          gender: form.gender,
          address: form.address,
          location: form.location,
          booking_date: form.booking_date,
          collection_type: form.collection_type,
          tests: tests.length ? tests : undefined,
          total_amount: 0,
        }),
      });

      if (!res.ok) {
        let data: any = {};
        try {
          data = await res.json();
        } catch {
          data = {};
        }
        setError(data.error || 'Booking failed. Please try again.');
        return;
      }

      const data = await res.json();
      setPatientId(data.patient_id || data.id || '');
      setSuccess('Your appointment request has been submitted successfully.');
      setStep(4);
    } catch (err) {
      setError('Unable to submit booking. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitDetails = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!form.address.trim() && !form.location.trim()) {
      setError('Provide an address or allow location access.');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(form.booking_date);
    if (selectedDate < today) {
      setError('Please choose today or a future date.');
      return;
    }
    if (!selectedTests.length && !form.tests_text.trim()) {
      setError('Select at least one test or enter a custom test.');
      return;
    }
    setError('');
    setStep(3);
  };

  return (
    <PublicLayout
      title="Book your test instantly"
      description="Enter your mobile number to continue, then confirm your booking details and location."
      compact
      showHero
    >
      {success && step === 4 ? (
          <div className="rounded-[2.5rem] border border-white/60 bg-white/60 p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
            <div className="flex items-center gap-4 rounded-3xl bg-teal-500/10 p-5 text-teal-800 border border-teal-200/50 backdrop-blur-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-500/30">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xl font-bold">Booking request submitted</p>
                <p className="text-sm font-medium text-teal-700/80 mt-1">Your appointment has been received and will be confirmed shortly.</p>
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-md">
                <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Mobile</p>
                <p className="mt-2 text-xl font-bold text-slate-900">{form.phone}</p>
              </div>
              <div className="rounded-3xl border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-md">
                <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Reference ID</p>
                <p className="mt-2 text-xl font-bold text-blue-600">{patientId || 'Pending'}</p>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/track" className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30">
                Track Appointment
              </Link>
              <Link href="/" className="inline-flex items-center justify-center rounded-full border-2 border-slate-200/50 bg-white/50 px-8 py-4 text-base font-semibold text-slate-700 backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white hover:shadow-lg">
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/60 p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
              <div className="flex items-center gap-5 text-slate-900">
                <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-600/20">
                  {step === 3 ? <ShieldCheck className="h-8 w-8" /> : <Phone className="h-8 w-8" />}
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-600">Step {step} of 3</p>
                  <h2 className="mt-1 text-3xl font-extrabold leading-tight">
                    {step === 1 ? 'Verify phone number' : step === 2 ? 'Appointment details' : 'Review & confirm'}
                  </h2>
                </div>
              </div>

              {error && <div className="mt-8 rounded-2xl border border-red-200/50 bg-red-50/80 backdrop-blur-md p-4 text-sm font-medium text-red-700 shadow-sm">{error}</div>}

              {step === 1 && (
                <form onSubmit={handlePhoneSubmit} className="mt-10 space-y-6 max-w-md">
                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-base font-semibold text-slate-700">Mobile number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full h-14 rounded-2xl border-2 border-white bg-white/50 px-5 text-lg shadow-sm backdrop-blur-md focus:border-blue-500 focus:bg-white focus:ring-0 transition-all"
                    />
                    {phoneError && <p className="text-sm font-medium text-red-600">{phoneError}</p>}
                  </div>
                  <Button type="submit" className="h-14 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-105 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30">
                    Continue
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleSubmitDetails} className="mt-10 grid gap-8 md:grid-cols-2">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Full name</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        placeholder="Enter full name"
                        className="h-12 rounded-2xl border-2 border-white bg-white/50 px-4 shadow-sm backdrop-blur-md focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone-confirm" className="text-sm font-semibold text-slate-700">Mobile number</Label>
                      <Input
                        id="phone-confirm"
                        value={form.phone}
                        disabled
                        className="h-12 rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-4 text-slate-500 shadow-sm backdrop-blur-md cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-sm font-semibold text-slate-700">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={form.age}
                        onChange={(event) => setForm({ ...form, age: event.target.value })}
                        placeholder="e.g. 30"
                        className="h-12 rounded-2xl border-2 border-white bg-white/50 px-4 shadow-sm backdrop-blur-md focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Gender</Label>
                      <div className="flex gap-2">
                        {['male', 'female', 'other'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setForm({ ...form, gender: g as BookingForm['gender'] })}
                            className={`flex-1 h-12 rounded-2xl border-2 px-3 text-sm font-bold capitalize transition-all hover:scale-105 ${
                              form.gender === g
                                ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm'
                                : 'border-white bg-white/50 text-slate-600 hover:border-blue-300'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-semibold text-slate-700">Address</Label>
                      <Input
                        id="address"
                        value={form.address}
                        onChange={(event) => setForm({ ...form, address: event.target.value })}
                        placeholder="Street, locality, city"
                        className="h-12 rounded-2xl border-2 border-white bg-white/50 px-4 shadow-sm backdrop-blur-md focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="location" className="text-sm font-semibold text-slate-700">Location coordinates</Label>
                        <button type="button" onClick={handleUseLocation} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                          <MapPin className="h-3.5 w-3.5" /> Auto-detect
                        </button>
                      </div>
                      <Input
                        id="location"
                        value={form.location}
                        onChange={(event) => setForm({ ...form, location: event.target.value })}
                        placeholder="Latitude, longitude"
                        className="h-12 rounded-2xl border-2 border-white bg-white/50 px-4 shadow-sm backdrop-blur-md focus:border-blue-500 focus:bg-white transition-all"
                      />
                      {locationMessage && <p className="text-xs font-medium text-slate-500">{locationMessage}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Collection type</Label>
                      <div className="flex gap-2">
                        {[
                          { id: 'home_collection', label: 'Home Collection' },
                          { id: 'lab_visit', label: 'Lab Visit' }
                        ].map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setForm({ ...form, collection_type: type.id as BookingForm['collection_type'] })}
                            className={`flex-1 h-12 rounded-2xl border-2 px-3 text-sm font-bold transition-all hover:scale-105 ${
                              form.collection_type === type.id
                                ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm'
                                : 'border-white bg-white/50 text-slate-600 hover:border-blue-300'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="booking_date" className="text-sm font-semibold text-slate-700">Preferred date</Label>
                      <Input
                        id="booking_date"
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={form.booking_date}
                        onChange={(event) => setForm({ ...form, booking_date: event.target.value })}
                        className="h-12 rounded-2xl border-2 border-white bg-white/50 px-4 shadow-sm backdrop-blur-md focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-6 pt-4 border-t border-slate-200/50">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-slate-700">Choose Tests</Label>
                      <div className="rounded-3xl border border-white/60 bg-white/40 p-5 shadow-inner backdrop-blur-md">
                        {availableTests.length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {availableTests.map((test) => (
                              <button
                                type="button"
                                key={test}
                                onClick={() => handleToggleTest(test)}
                                className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all hover:scale-105 ${selectedTests.includes(test) ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm' : 'border-white bg-white/50 text-slate-700 hover:border-blue-300'}`}
                              >
                                {test}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-slate-500">Loading available tests…</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tests_text" className="text-sm font-semibold text-slate-700">Custom Tests</Label>
                      <Input
                        id="tests_text"
                        value={form.tests_text}
                        onChange={(event) => setForm({ ...form, tests_text: event.target.value })}
                        placeholder="e.g. Vitamin D, B12 (comma separated)"
                        className="h-12 rounded-2xl border-2 border-white bg-white/50 px-4 shadow-sm backdrop-blur-md focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-4 pt-6 sm:flex-row">
                    <Button type="submit" className="h-14 inline-flex items-center justify-center rounded-full bg-blue-600 px-8 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30">
                      Review details
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-14 inline-flex items-center justify-center rounded-full border-2 border-slate-200/50 bg-white/50 px-8 text-base font-semibold text-slate-700 backdrop-blur-md transition-all hover:bg-white hover:shadow-md">
                      Back
                    </Button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <div className="mt-10 space-y-8">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="rounded-3xl border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Patient Name</p>
                      <p className="text-lg font-bold text-slate-900">{form.name}</p>
                      <p className="text-sm font-medium text-slate-500 mt-1">{form.age} Yrs • {form.gender}</p>
                    </div>
                    <div className="rounded-3xl border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Contact</p>
                      <p className="text-lg font-bold text-slate-900">+91 {form.phone}</p>
                    </div>
                    <div className="sm:col-span-2 rounded-3xl border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Address & Location</p>
                      <p className="text-base font-medium text-slate-900 leading-relaxed">{form.address || 'No address provided'}</p>
                      {form.location && <p className="text-sm font-medium text-blue-600 mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {form.location}</p>}
                    </div>
                    <div className="rounded-3xl border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Appointment Info</p>
                      <p className="text-lg font-bold text-slate-900 capitalize">{form.collection_type.replace('_', ' ')}</p>
                      <p className="text-sm font-medium text-slate-500 mt-1">Date: {new Date(form.booking_date).toLocaleDateString('en-IN', { dateStyle: 'medium'})}</p>
                    </div>
                    <div className="rounded-3xl border border-white/60 bg-white/50 p-6 shadow-sm backdrop-blur-md transition-all hover:bg-white">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Tests Requested</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedTests.map(t => <span key={t} className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">{t}</span>)}
                        {form.tests_text && form.tests_text.split(',').map(t => t.trim()).filter(Boolean).map(t => <span key={t} className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">{t}</span>)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row pt-4">
                    <Button onClick={createBooking} disabled={isLoading} className="h-14 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-teal-500 px-8 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-600/40">
                      {isLoading ? 'Submitting request...' : 'Confirm & Book'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-14 inline-flex items-center justify-center rounded-full border-2 border-slate-200/50 bg-white/50 px-8 text-base font-semibold text-slate-700 backdrop-blur-md transition-all hover:bg-white hover:shadow-md">
                      Make Changes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </PublicLayout>
  );
}
