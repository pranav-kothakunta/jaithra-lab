'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { ArrowRight, CheckCircle2, MapPin, Phone, ShieldCheck, Sparkles } from 'lucide-react';

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
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-api/tests?active=true`, {
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          },
        });
        if (!res.ok) {
          setAvailableTests([]);
          return;
        }
        const data: any[] = await res.json();
        setAvailableTests(data.map((test) => test.name).filter(Boolean));
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
      const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-api`;
      const res = await fetch(`${baseUrl}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
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
      title="Book a home collection appointment in minutes"
      description="Enter your mobile number to continue, then confirm your booking details and location."
      compact
      showHero
    >
      {success && step === 4 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 rounded-3xl bg-teal-500/10 p-4 text-teal-700">
              <CheckCircle2 className="h-6 w-6" />
              <div>
                <p className="text-lg font-semibold">Booking request submitted</p>
                <p className="text-sm text-slate-600">Your appointment has been received and will be confirmed shortly.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">Mobile</p>
                <p className="mt-2 text-base text-slate-900">{form.phone}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">Reference</p>
                <p className="mt-2 text-base text-slate-900">{patientId || 'Pending'}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/track" className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                Track Appointment
              </Link>
              <Link href="/" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-3 text-slate-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-600 text-white">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Step {step} of 3</p>
                  <h2 className="mt-1 text-2xl font-semibold">{step === 1 ? 'Verify your phone number' : step === 2 ? 'Enter your appointment details' : 'Review & confirm'}.</h2>
                </div>
              </div>

              {error && <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

              {step === 1 && (
                <form onSubmit={handlePhoneSubmit} className="mt-8 space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="phone">Mobile number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    />
                    {phoneError && <p className="text-sm text-red-600">{phoneError}</p>}
                  </div>
                  <Button type="submit" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleSubmitDetails} className="mt-8 grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full name</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        placeholder="Enter full name"
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone-confirm">Mobile number</Label>
                      <Input
                        id="phone-confirm"
                        value={form.phone}
                        disabled
                        className="w-full rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={form.age}
                        onChange={(event) => setForm({ ...form, age: event.target.value })}
                        placeholder="e.g. 30"
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        id="gender"
                        value={form.gender}
                        onValueChange={(value) => setForm({ ...form, gender: value as BookingForm['gender'] })}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={form.address}
                        onChange={(event) => setForm({ ...form, address: event.target.value })}
                        placeholder="Street, locality, city"
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="location">Location coordinates</Label>
                        <button type="button" onClick={handleUseLocation} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800">
                          <MapPin className="h-4 w-4" /> Use my location
                        </button>
                      </div>
                      <Input
                        id="location"
                        value={form.location}
                        onChange={(event) => setForm({ ...form, location: event.target.value })}
                        placeholder="Latitude, longitude"
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      />
                      {locationMessage && <p className="mt-2 text-sm text-slate-500">{locationMessage}</p>}
                    </div>
                    <div>
                      <Label htmlFor="collection_type">Collection type</Label>
                      <Select
                        id="collection_type"
                        value={form.collection_type}
                        onValueChange={(value) => setForm({ ...form, collection_type: value as BookingForm['collection_type'] })}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <SelectItem value="home_collection">Home collection</SelectItem>
                        <SelectItem value="lab_visit">Lab visit</SelectItem>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="booking_date">Preferred date</Label>
                      <Input
                        id="booking_date"
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={form.booking_date}
                        onChange={(event) => setForm({ ...form, booking_date: event.target.value })}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tests_text">Choose tests</Label>
                      <div className="grid gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        {availableTests.length > 0 ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {availableTests.map((test) => (
                              <button
                                type="button"
                                key={test}
                                onClick={() => handleToggleTest(test)}
                                className={`rounded-2xl border px-4 py-2 text-left text-sm transition ${selectedTests.includes(test) ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400'}`}
                              >
                                {test}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">Loading available tests…</p>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Select one or more tests from the list above.</p>
                    </div>
                    <div>
                      <Label htmlFor="tests_text">Additional custom tests</Label>
                      <Input
                        id="tests_text"
                        value={form.tests_text}
                        onChange={(event) => setForm({ ...form, tests_text: event.target.value })}
                        placeholder="Enter any custom tests separated by commas"
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      />
                      <p className="mt-2 text-xs text-slate-500">Optional — use this only if the test is not listed above.</p>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-3 pt-2">
                    <Button type="submit" className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                      Continue to confirmation
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      Back
                    </Button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <div className="mt-8 space-y-6">
                  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
                    <div className="flex items-center gap-3 text-slate-900">
                      <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-teal-500 text-white">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold">Confirm your booking details</p>
                        <p className="text-sm text-slate-600">We will send a confirmation once a technician is assigned.</p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-3xl bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Name</p>
                        <p className="mt-2 text-base text-slate-900">{form.name}</p>
                      </div>
                      <div className="rounded-3xl bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Phone</p>
                        <p className="mt-2 text-base text-slate-900">{form.phone}</p>
                      </div>
                      <div className="rounded-3xl bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Address / Location</p>
                        <p className="mt-2 text-base text-slate-900">{form.address || form.location || 'Not provided'}</p>
                      </div>
                      <div className="rounded-3xl bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Appointment</p>
                        <p className="mt-2 text-base text-slate-900 capitalize">{form.collection_type.replace('_', ' ')}</p>
                        <p className="text-sm text-slate-500">Preferred date: {form.booking_date}</p>
                      </div>
                      <div className="rounded-3xl bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Selected Tests</p>
                        <p className="mt-2 text-base text-slate-900">
                          {selectedTests.length > 0 ? selectedTests.join(', ') : 'No tests selected'}
                        </p>
                        {form.tests_text.trim() && (
                          <p className="mt-2 text-sm text-slate-500">Custom: {form.tests_text}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button onClick={createBooking} disabled={isLoading} className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                      {isLoading ? 'Submitting…' : 'Confirm Booking'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      Edit details
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
