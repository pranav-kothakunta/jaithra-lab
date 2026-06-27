'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Search,
  Clock,
  FileText,
  CreditCard,
  Download,
  Phone,
  ArrowLeft,
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
      const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .or(`phone.eq.${cleaned},patient_id.eq.${cleaned}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (patient) {
        setResult({ type: 'patient', data: patient });
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
    new_request: 'bg-blue-100 text-blue-700 border-blue-200',
    confirmed: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    converted: 'bg-teal-100 text-teal-700 border-teal-200',
    booked: 'bg-slate-100 text-slate-700 border-slate-200',
    collection_pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    sample_collected: 'bg-blue-100 text-blue-700 border-blue-200',
    testing: 'bg-orange-100 text-orange-700 border-orange-200',
    report_ready: 'bg-green-100 text-green-700 border-green-200',
    completed: 'bg-teal-100 text-teal-700 border-teal-200',
  };

  return (
    <PublicLayout title="Track your booking" description="Check your appointment status, payments, and report availability in one place." compact showHero>
      <main className="mx-auto max-w-2xl relative z-10">
        {/* Search Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300">
          <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-8 py-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 bg-white/20 rounded-[20px] flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-extrabold text-2xl tracking-tight">Track Booking</h1>
                <p className="text-blue-50 font-medium mt-1">Enter your details to see real-time status</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">Phone Number or Patient ID</Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="e.g. 9876543210 or PAT-..."
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(''); setResult(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 h-14 rounded-2xl border-2 border-white bg-white/50 px-5 text-lg shadow-sm backdrop-blur-md focus:border-blue-500 focus:bg-white focus:ring-0 transition-all"
                  autoFocus
                />
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !identifier.trim()}
                  className="h-14 bg-slate-900 text-white px-8 rounded-2xl font-bold shadow-lg shadow-slate-900/20 transition-all hover:scale-105 hover:bg-slate-800"
                >
                  {isLoading ? 'Searching...' : 'Track Now'}
                </Button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50/80 backdrop-blur-md border border-red-200/50 text-red-700 text-sm font-medium p-4 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2">{error}</div>
            )}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            {/* Header with patient/appointment info */}
            <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-500 rounded-[20px] shadow-lg shadow-blue-500/30 flex items-center justify-center text-white text-2xl font-black">
                    {result.data.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-2xl">{result.data.name}</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      {result.type === 'patient' && result.data.patient_id ? result.data.patient_id : `+91 ${result.data.phone}`}
                    </p>
                  </div>
                </div>
                <div className={`inline-flex items-center justify-center px-4 py-2 rounded-full border-2 text-sm font-bold shadow-sm ${statusColor[result.data.status || result.data.test_status] || 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {statusLabel[result.data.status || result.data.test_status] || result.data.status || result.data.test_status}
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {result.type === 'patient' && (
                  <>
                    <div className="bg-white/60 rounded-2xl p-4 border border-white/80 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Collection</p>
                      <p className="text-base font-bold text-slate-800">{result.data.collection_type === 'home_collection' ? 'Home Collection' : 'Lab Visit'}</p>
                    </div>
                    <div className="bg-white/60 rounded-2xl p-4 border border-white/80 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Date</p>
                      <p className="text-base font-bold text-slate-800">{new Date(result.data.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="bg-white/60 rounded-2xl p-4 border border-white/80 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Report</p>
                      <p className={`text-base font-bold ${result.data.report_status === 'uploaded' ? 'text-green-600' : 'text-slate-500'}`}>
                        {result.data.report_status === 'uploaded' ? 'Available' : 'Pending'}
                      </p>
                    </div>
                  </>
                )}
                {result.type === 'appointment' && (
                  <>
                    <div className="bg-white/60 rounded-2xl p-4 border border-white/80 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Collection</p>
                      <p className="text-base font-bold text-slate-800">{result.data.collection_type === 'home_collection' ? 'Home Collection' : 'Lab Visit'}</p>
                    </div>
                    {result.data.preferred_date && (
                      <div className="bg-white/60 rounded-2xl p-4 border border-white/80 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Requested Date</p>
                        <p className="text-base font-bold text-slate-800">{new Date(result.data.preferred_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Payment Details (only for patients) */}
            {result.type === 'patient' && (
              <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-slate-100 rounded-xl">
                    <CreditCard className="w-5 h-5 text-slate-600" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-xl">Payment Details</h3>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-white">
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Total Amount</span>
                    <span className="font-black text-slate-900 text-lg">{formatCurrency(result.data.total_amount || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-2xl border border-green-100/50">
                    <span className="text-sm font-bold uppercase tracking-wider text-green-600">Amount Paid</span>
                    <span className="font-black text-green-700 text-lg">{formatCurrency(result.data.amount_paid || 0)}</span>
                  </div>
                  {result.data.remaining_amount > 0 && (
                    <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100/50">
                      <span className="text-sm font-bold uppercase tracking-wider text-red-600">Balance Due</span>
                      <span className="font-black text-red-700 text-lg">{formatCurrency(result.data.remaining_amount)}</span>
                    </div>
                  )}
                </div>

                {payments.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Payment History</p>
                    <div className="space-y-3">
                      {payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between bg-white/60 border border-white/80 rounded-2xl p-4 shadow-sm">
                          <div>
                            <p className="font-bold text-slate-800 text-sm capitalize">{payment.payment_method}</p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">{new Date(payment.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                          <span className="font-black text-green-600">{formatCurrency(payment.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Report Actions */}
            {result.type === 'patient' && result.data.report_status === 'uploaded' && (
              <Button
                onClick={handleDownloadReport}
                className="w-full h-16 rounded-[24px] bg-gradient-to-r from-green-500 to-teal-500 text-white font-extrabold text-lg shadow-lg shadow-teal-500/30 transition-all hover:scale-[1.02] hover:shadow-xl gap-3"
              >
                <Download className="w-6 h-6" />
                Download Secure Report
              </Button>
            )}

            {result.type === 'patient' && result.data.report_status !== 'uploaded' && (
              <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-8 flex items-start gap-5">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-800 text-lg mb-1">Report Generation in Progress</p>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">Your report is being processed. It will be available here securely once ready.</p>
                </div>
              </div>
            )}

            {/* Contact Section */}
            <div className="bg-gradient-to-br from-blue-600 to-teal-500 rounded-[2.5rem] p-8 text-center shadow-lg shadow-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
              <div className="relative z-10">
                <h3 className="text-white font-extrabold text-2xl mb-2">Need Assistance?</h3>
                <p className="text-blue-50 font-medium text-sm mb-6">Contact our support team for immediate help</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href={`tel:+${process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || '917661820085'}`} className="flex-1">
                    <Button className="w-full h-14 bg-white text-blue-600 hover:bg-slate-50 font-bold gap-2 rounded-2xl shadow-sm">
                      <Phone className="w-5 h-5" /> Call Us Now
                    </Button>
                  </a>
                  <a href={`https://wa.me/${process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || '917661820085'}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full h-14 bg-transparent border-2 border-white/40 text-white hover:bg-white/10 font-bold gap-2 rounded-2xl">
                      <MessageCircle className="w-5 h-5" /> WhatsApp Us
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 text-center relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Link>
        </div>
      </main>
    </PublicLayout>
  );
}
