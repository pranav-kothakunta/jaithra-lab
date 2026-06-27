'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FlaskConical,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  Download,
  Phone,
  ArrowLeft,
  Home,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

type SearchResult = {
  type: 'appointment' | 'patient';
  data: any;
  payments?: any[];
};

export default function TrackPage() {
  const [identifier, setIdentifier] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);

  const handleSearch = async () => {
    const cleaned = identifier.trim();
    if (!cleaned) return;

    setIsLoading(true);
    setError('');
    setResult(null);
    setPayments([]);

    try {
      // First check for confirmed patients
      const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .or(`phone.eq.${cleaned},patient_id.eq.${cleaned}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (patient) {
        setResult({ type: 'patient', data: patient });
        // Fetch payments
        const API = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-api`;
        const res = await fetch(`${API}/patient-payments?identifier=${encodeURIComponent(cleaned)}`, {
          headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        });
        if (res.ok) {
          const paymentData = await res.json();
          setPayments(paymentData.payments || []);
        }
        setIsLoading(false);
        return;
      }

      // If no patient found, check appointment requests
      const { data: appointment } = await supabase
        .from('appointment_requests')
        .select('*')
        .eq('phone', cleaned)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (appointment) {
        setResult({ type: 'appointment', data: appointment });
        setIsLoading(false);
        return;
      }

      setError('No record found. Please check your phone number or Patient ID and try again.');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!result || result.type !== 'patient') return;
    const patient = result.data;
    const identifier = patient.phone || patient.patient_id;

    const API = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-api`;
    const res = await fetch(`${API}/patient-report?identifier=${encodeURIComponent(identifier)}`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
    });
    if (!res.ok) {
      setError('Report not available yet.');
      return;
    }
    const { url, file_name } = await res.json();
    const a = document.createElement('a');
    a.href = url;
    a.download = file_name || 'report.pdf';
    a.target = '_blank';
    a.click();
  };

  const statusLabel: Record<string, string> = {
    new_request: 'New Request',
    confirmed: 'Confirmed',
    rejected: 'Rejected',
    converted: 'Converted to Booking',
    booked: 'Booked',
    collection_pending: 'Collection Pending',
    sample_collected: 'Sample Collected',
    testing: 'Testing in Progress',
    report_ready: 'Report Ready',
    completed: 'Completed',
  };

  const statusColor: Record<string, string> = {
    new_request: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    converted: 'bg-teal-100 text-teal-700',
    booked: 'bg-gray-100 text-gray-700',
    collection_pending: 'bg-yellow-100 text-yellow-700',
    sample_collected: 'bg-blue-100 text-blue-700',
    testing: 'bg-orange-100 text-orange-700',
    report_ready: 'bg-green-100 text-green-700',
    completed: 'bg-teal-100 text-teal-700',
  };

  const appointmentStatusDesc: Record<string, string> = {
    new_request: 'We received your request. Our team will call you within 15 minutes to confirm.',
    confirmed: 'Your booking is confirmed. We will contact you shortly.',
    rejected: 'Your request could not be processed. Please contact us.',
    converted: 'Your request has been converted to a confirmed booking.',
  };

  return (
    <PublicLayout title="Track your booking" description="Check your appointment status, payments, and report availability in one place." compact showHero>
      <main className="mx-auto max-w-xl">
        {/* Search Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-xl">Track Your Booking</h1>
                <p className="text-blue-100 text-sm">Check report status, payments & more</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Phone Number or Patient ID</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your phone number or Patient ID"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(''); setResult(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 h-11"
                  autoFocus
                />
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !identifier.trim()}
                  className="h-11 bg-gradient-to-r from-blue-600 to-teal-500 text-white px-6"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl">{error}</div>
            )}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-6 space-y-4">
            {/* Header with patient/appointment info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    {result.data.name?.[0]}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">{result.data.name}</h2>
                    {result.type === 'patient' && result.data.patient_id && (
                      <p className="text-sm text-gray-500">{result.data.patient_id}</p>
                    )}
                    {result.type === 'appointment' && (
                      <p className="text-sm text-gray-500">+91 {result.data.phone}</p>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusColor[result.data.status || result.data.test_status] || 'bg-gray-100 text-gray-600'}`}>
                  {statusLabel[result.data.status || result.data.test_status] || result.data.status || result.data.test_status}
                </span>
              </div>

              {/* Appointment Status Message */}
              {result.type === 'appointment' && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-800 mb-1">{statusLabel[result.data.status]}</p>
                      <p className="text-sm text-blue-600">{appointmentStatusDesc[result.data.status]}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {result.type === 'patient' && (
                  <>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400 mb-1">Collection</p>
                      <p className="text-sm font-semibold text-gray-700">{result.data.collection_type === 'home_collection' ? 'Home Collection' : 'Lab Visit'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400 mb-1">Booking Date</p>
                      <p className="text-sm font-semibold text-gray-700">{new Date(result.data.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400 mb-1">Report</p>
                      <p className={`text-sm font-semibold ${result.data.report_status === 'uploaded' ? 'text-green-600' : 'text-gray-500'}`}>
                        {result.data.report_status === 'uploaded' ? 'Available' : 'Pending'}
                      </p>
                    </div>
                  </>
                )}
                {result.type === 'appointment' && (
                  <>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400 mb-1">Collection</p>
                      <p className="text-sm font-semibold text-gray-700">{result.data.collection_type === 'home_collection' ? 'Home Collection' : 'Lab Visit'}</p>
                    </div>
                    {result.data.preferred_date && (
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-400 mb-1">Preferred Date</p>
                        <p className="text-sm font-semibold text-gray-700">{new Date(result.data.preferred_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400 mb-1">Requested Tests</p>
                      <p className="text-sm font-semibold text-gray-700">{result.data.requested_tests || 'To be confirmed'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Payment Details (only for patients) */}
            {result.type === 'patient' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Payment Details</h3>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Total Amount</span>
                    <span className="font-bold text-gray-900">{formatCurrency(result.data.total_amount || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-semibold text-green-600">{formatCurrency(result.data.amount_paid || 0)}</span>
                  </div>
                  {result.data.remaining_amount > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-gray-600 font-medium">Balance Due</span>
                      <span className="font-bold text-red-600">{formatCurrency(result.data.remaining_amount)}</span>
                    </div>
                  )}
                </div>

                {/* Payment History */}
                {payments.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment History</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                          <div>
                            <p className="font-medium text-gray-700 text-sm capitalize">{payment.payment_method}</p>
                            <p className="text-xs text-gray-400">{new Date(payment.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                          <span className="font-bold text-green-600">{formatCurrency(payment.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.data.payment_status === 'unpaid' && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-700">Payment pending. You can pay when our phlebotomist visits or at the lab.</p>
                  </div>
                )}
              </div>
            )}

            {/* Report Download (only for patients with uploaded report) */}
            {result.type === 'patient' && result.data.report_status === 'uploaded' && (
              <Button
                onClick={handleDownloadReport}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-teal-500 hover:opacity-90 text-white font-semibold gap-2"
              >
                <Download className="w-5 h-5" />
                Download Your Report
              </Button>
            )}

            {/* Report Pending Message */}
            {result.type === 'patient' && result.data.report_status !== 'uploaded' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Report in Progress</p>
                    <p className="text-sm text-gray-500">Your report will be available here once uploaded. You'll also receive it on WhatsApp.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Section */}
            <div className="bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl p-6 text-center">
              <MessageCircle className="w-10 h-10 text-white/80 mx-auto mb-3" />
              <h3 className="text-white font-bold text-lg mb-2">Need Help?</h3>
              <p className="text-white/80 text-sm mb-4">Contact us for any queries about your booking</p>
              <div className="flex gap-3 justify-center">
                <a href="tel:+919876543210">
                  <Button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold gap-2">
                    <Phone className="w-4 h-4" /> Call Us
                  </Button>
                </a>
                <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 font-semibold gap-2">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </main>
    </PublicLayout>
  );
}
