'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  FlaskConical,
  LogOut,
  Users,
  Calendar,
  TestTube,
  CreditCard,
  Bell,
  Search,
  Plus,
  Phone,
  Home,
  Clock,
  DollarSign,
  FileText,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowRight,
  Edit,
  Upload,
  Download,
  Trash2,
  FileCheck,
  AlertCircle,
  IndianRupee,
  UserPlus,
  Activity,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { DashboardStats, AppointmentRequest, Patient, Test, Payment, Report } from '@/lib/types';

const API = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-api`;
const API_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
};

async function apiFetch(url: string, opts?: RequestInit) {
  return fetch(url, { ...opts, headers: { ...API_HEADERS, ...(opts?.headers || {}) } });
}

type Tab = 'dashboard' | 'appointments' | 'patients' | 'add_patient' | 'tests' | 'add_test' | 'payments' | 'record_payment' | 'reports';

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'add_patient', label: 'Add Patient', icon: UserPlus },
  { id: 'tests', label: 'Tests', icon: TestTube },
  { id: 'add_test', label: 'Add Test', icon: Plus },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'record_payment', label: 'Record Payment', icon: IndianRupee },
  { id: 'reports', label: 'Reports', icon: FileText },
];

interface ExtendedStats extends DashboardStats {
  monthly_collected?: number;
  total_outstanding?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<ExtendedStats | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [isRefreshingAppointments, setIsRefreshingAppointments] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [appointmentsDebug, setAppointmentsDebug] = useState<string>('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialogs
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [editTest, setEditTest] = useState<Test | null>(null);
  const [paymentPatientId, setPaymentPatientId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientFormError, setPatientFormError] = useState('');

  // Report upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPatientId, setUploadingPatientId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, 'uploading' | 'done' | 'error'>>({});

  // Patient form
  const [pForm, setPForm] = useState({
    name: '', phone: '', age: '', gender: '', address: '',
    collection_type: 'home_collection', booking_date: '',
    total_amount: '', amount_paid: '', tests_text: '',
  });

  // Test form
  const [tForm, setTForm] = useState({
    name: '', description: '', price: '', category: '',
    report_delivery_time: '', preparation_instructions: '', is_active: true,
  });

  // Payment form
  const [payForm, setPayForm] = useState({ amount: '', payment_method: 'cash', notes: '' });

  // Helper: calculate total amount from test names by looking up prices in tests catalog
  const calcTotalFromTests = (testsText: string): string => {
    if (!testsText.trim()) return '0';
    const testNames = testsText.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    let total = 0;
    for (const name of testNames) {
      const catalogTest = tests.find(t => t.name.toLowerCase() === name);
      if (catalogTest) total += Number(catalogTest.price || 0);
    }
    return total.toString();
  };

  // Search
  const [patientSearch, setPatientSearch] = useState('');

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth/me');
      if (!res.ok) { router.push('/admin/login'); return; }
      const data = await res.json();
      setUser(data.user);
    } catch {
      router.push('/admin/login');
    }
  }, [router]);

  const loadStats = useCallback(async () => {
    const res = await apiFetch(`${API}/stats`);
    if (res.ok) setStats(await res.json());
  }, []);

  const loadAppointments = useCallback(async () => {
    setIsRefreshingAppointments(true);
    try {
      setAppointmentsError('');
      setAppointmentsDebug('');
      const res = await apiFetch(`${API}/appointments`);
      const text = await res.text();
      if (!res.ok) {
        const message = `Failed to load appointments: ${res.status} ${res.statusText}`;
        console.error(message, text);
        setAppointmentsError(message);
        setAppointmentsDebug(text);
        setAppointments([]);
        return;
      }
      try {
        const data = JSON.parse(text);
        setAppointments(data);
        setAppointmentsDebug(JSON.stringify(data.slice(0, 5), null, 2));
      } catch (err) {
        console.error('Invalid appointments JSON', err, text);
        setAppointmentsError('Unable to parse appointments response');
        setAppointmentsDebug(text);
        setAppointments([]);
      }
    } finally {
      setIsRefreshingAppointments(false);
    }
  }, []);

  const loadPatients = useCallback(async () => {
    const params = patientSearch ? `?search=${encodeURIComponent(patientSearch)}` : '';
    const res = await apiFetch(`${API}/patients${params}`);
    if (res.ok) setPatients(await res.json());
  }, [patientSearch]);

  const loadTests = useCallback(async () => {
    const res = await apiFetch(`${API}/tests`);
    if (res.ok) setTests(await res.json());
  }, []);

  const loadPayments = useCallback(async () => {
    const res = await apiFetch(`${API}/payments`);
    if (res.ok) setPayments(await res.json());
  }, []);

  const loadReports = useCallback(async () => {
    const res = await apiFetch(`${API}/reports`);
    if (res.ok) setReports(await res.json());
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    Promise.all([loadStats(), loadAppointments(), loadPatients(), loadTests(), loadPayments(), loadReports()])
      .finally(() => setIsLoading(false));
  }, [user, loadStats, loadAppointments, loadPatients, loadTests, loadPayments, loadReports]);

  // Auto-refresh appointments every 10 seconds when viewing that tab
  useEffect(() => {
    if (activeTab !== 'appointments') return;
    const interval = setInterval(() => {
      loadAppointments();
      loadPatients();
      loadStats();
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab, loadAppointments, loadPatients, loadStats]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const updateAppointment = async (id: string, status: string) => {
    await apiFetch(`${API}/appointments`, { method: 'PATCH', body: JSON.stringify({ id, status }) });
    loadAppointments();
    loadStats();
  };

  const convertAppointment = async (apt: AppointmentRequest) => {
    try {
      const res = await fetch('/api/admin/convert-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: apt.id }),
      });
      if (res.ok) {
        loadAppointments();
        loadPatients();
        loadStats();
      } else {
        console.error('Failed to convert appointment');
      }
    } catch (err) {
      console.error('Convert Error:', err);
    }
  };

  const openNewPatient = () => {
    setEditPatient(null);
    setPatientFormError('');
    setPForm({ name: '', phone: '', age: '', gender: '', address: '', collection_type: 'home_collection', booking_date: new Date().toISOString().split('T')[0], total_amount: '', amount_paid: '', tests_text: '' });
    setActiveTab('add_patient');
  };

  const openEditPatient = (p: Patient) => {
    setEditPatient(p);
    setPatientFormError('');
    const testsText = p.tests?.map(t => t.test_name).join(', ') || '';
    // Auto-calculate total from patient_tests prices, fallback to catalog lookup
    const testsTotal = p.tests && p.tests.length > 0
      ? p.tests.reduce((sum, t) => sum + Number(t.price || 0), 0)
      : 0;
    const finalTotal = testsTotal > 0 ? testsTotal.toString() : calcTotalFromTests(testsText);
    setPForm({
      name: p.name,
      phone: p.phone,
      age: p.age?.toString() || '',
      gender: p.gender || '',
      address: p.address || '',
      collection_type: p.collection_type,
      booking_date: p.booking_date,
      total_amount: finalTotal,
      amount_paid: p.amount_paid?.toString() || '0',
      tests_text: testsText,
    });
    setActiveTab('add_patient');
  };

  const savePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setPatientFormError('');
    if (!pForm.name.trim() || !pForm.phone.trim()) {
      setPatientFormError('Name and phone are required');
      return;
    }
    setIsSubmitting(true);
    try {
      const body: any = {
        name: pForm.name,
        phone: pForm.phone,
        age: pForm.age ? Number(pForm.age) : null,
        gender: pForm.gender || null,
        address: pForm.address || null,
        collection_type: pForm.collection_type,
        booking_date: pForm.booking_date || new Date().toISOString().split('T')[0],
        total_amount: Number(pForm.total_amount || 0),
        amount_paid: Number(pForm.amount_paid || 0),
        tests: pForm.tests_text ? pForm.tests_text.split(',').map(t => {
          const name = t.trim();
          const catalogTest = tests.find(ct => ct.name.toLowerCase() === name.toLowerCase());
          return { test_name: name, price: catalogTest ? Number(catalogTest.price || 0) : 0 };
        }) : [],
      };
      let res;
      if (editPatient) {
        res = await apiFetch(`${API}/patients`, { method: 'PATCH', body: JSON.stringify({ id: editPatient.id, ...body, tests: undefined }) });
      } else {
        res = await apiFetch(`${API}/patients`, { method: 'POST', body: JSON.stringify(body) });
      }
      
      if (!res.ok) {
        const errorData = await res.json();
        setPatientFormError(errorData.error || 'Failed to save patient');
        return;
      }

      setActiveTab('patients');
      loadPatients();
      loadStats();
    } catch (err) {
      setPatientFormError('Network error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePatientStatus = async (id: string, field: string, value: string) => {
    await apiFetch(`${API}/patients`, { method: 'PATCH', body: JSON.stringify({ id, [field]: value }) });
    loadPatients();
    loadStats();
  };

  const openNewTest = () => {
    setEditTest(null);
    setTForm({ name: '', description: '', price: '', category: '', report_delivery_time: '', preparation_instructions: '', is_active: true });
    setActiveTab('add_test');
  };

  const openEditTest = (t: Test) => {
    setEditTest(t);
    setTForm({
      name: t.name,
      description: t.description || '',
      price: t.price?.toString() || '',
      category: t.category || '',
      report_delivery_time: t.report_delivery_time || '',
      preparation_instructions: t.preparation_instructions || '',
      is_active: t.is_active,
    });
    setActiveTab('add_test');
  };

  const saveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editTest) {
        await apiFetch(`${API}/tests`, { method: 'PATCH', body: JSON.stringify({ id: editTest.id, ...tForm, price: Number(tForm.price) }) });
      } else {
        await apiFetch(`${API}/tests`, { method: 'POST', body: JSON.stringify({ ...tForm, price: Number(tForm.price) }) });
      }
      setActiveTab('tests');
      loadTests();
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPaymentDialog = (patientId: string) => {
    setPaymentPatientId(patientId);
    setPayForm({ amount: '', payment_method: 'cash', notes: '' });
    setActiveTab('record_payment');
  };

  const savePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch(`${API}/payments`, {
        method: 'POST',
        body: JSON.stringify({ patient_id: paymentPatientId, ...payForm, amount: Number(payForm.amount) }),
      });
      setPayForm({ amount: '', payment_method: 'cash', notes: '' });
      setPaymentPatientId('');
      setActiveTab('payments');
      loadPayments();
      loadPatients();
      loadStats();
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerReportUpload = (patientId: string) => {
    setUploadingPatientId(patientId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingPatientId) return;
    e.target.value = '';

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are allowed for report upload.');
      setUploadingPatientId(null);
      return;
    }

    const patientId = uploadingPatientId;
    setUploadingPatientId(null);
    setUploadProgress(p => ({ ...p, [patientId]: 'uploading' }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient_id', patientId);

      const res = await fetch('/api/admin/upload-report', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }

      setUploadProgress(p => ({ ...p, [patientId]: 'done' }));
      loadPatients();
      loadReports();
      loadStats();
      setTimeout(() => setUploadProgress(p => { const n = { ...p }; delete n[patientId]; return n; }), 4000);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadProgress(p => ({ ...p, [patientId]: 'error' }));
      setTimeout(() => setUploadProgress(p => { const n = { ...p }; delete n[patientId]; return n; }), 4000);
    }
  };

  const downloadReport = async (reportId: string, fileName: string) => {
    const res = await apiFetch(`${API}/reports/download-url?report_id=${reportId}`);
    if (!res.ok) return;
    const { url } = await res.json();
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank';
    a.click();
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm('Delete this report?')) return;
    await apiFetch(`${API}/reports?id=${reportId}`, { method: 'DELETE' });
    loadReports();
    loadPatients();
    loadStats();
  };

  const statusColor: Record<string, string> = {
    new_request: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-900',
    converted: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900',
    rejected: 'bg-red-100 text-red-700',
    booked: 'bg-gray-100 dark:bg-slate-800/50 text-gray-700 dark:text-gray-200',
    collection_pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-900',
    sample_collected: 'bg-blue-100 text-blue-700',
    testing: 'bg-orange-100 text-orange-700',
    report_ready: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900',
    completed: 'bg-teal-100 text-teal-700',
  };

  const paymentStatusColor: Record<string, string> = {
    paid: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900',
    partial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-900',
    unpaid: 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900',
  };

  // Payment reconciliation helpers
  const totalCollected = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const methodBreakdown = payments.reduce((acc: Record<string, number>, p) => {
    acc[p.payment_method] = (acc[p.payment_method] || 0) + Number(p.amount || 0);
    return acc;
  }, {});

  if (!user) return null;

  const displayName = user?.email
    ? user.email.split('@')[0].split(/[\.\-_]/).map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
    : user?.name || 'Admin';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-cyan-50/50 dark:from-indigo-950/20 dark:via-slate-950 dark:to-cyan-950/20 font-sans">
      {/* Hidden file input for report upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Top Bar with Integrated Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/60 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3 w-auto lg:w-1/4">
            <img src="/logo.jpg" alt="Jaithra Lab Logo" className="w-10 h-10 object-contain rounded-lg shadow-md" />
            <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight hidden sm:block">Jaithra Lab</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/50">
            {tabs.filter(t => !['add_patient', 'add_test', 'record_payment'].includes(t.id)).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'text-indigo-700 bg-white dark:bg-slate-900 shadow-sm border border-indigo-100/50 ring-1 ring-indigo-50'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-200/50'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
                {tab.id === 'appointments' && stats && stats.new_appointment_requests > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm border-2 border-white">
                    {stats.new_appointment_requests}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Profile / Alerts Section */}
          <div className="flex items-center gap-3 w-auto lg:w-1/4 justify-end">
            {stats && stats.new_appointment_requests > 0 && (
              <Badge className="bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 shadow-sm px-3 py-1 lg:hidden">
                <Bell className="w-3.5 h-3.5 mr-1.5" />
                {stats.new_appointment_requests}
              </Badge>
            )}
            <ThemeToggle />
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 pl-3 pr-1 py-1 rounded-full border border-slate-100 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 hidden sm:block">{displayName}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 w-8 rounded-full p-0 text-slate-400 hover:text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation (Scrollable) */}
        <div className="lg:hidden flex overflow-x-auto px-4 py-3 gap-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pb-3">
          {tabs.filter(t => !['add_patient', 'add_test', 'record_payment'].includes(t.id)).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 border-transparent'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'appointments' && stats && stats.new_appointment_requests > 0 && (
                <span className="w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold ml-1">
                  {stats.new_appointment_requests}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8">

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 sm:p-10 text-white shadow-2xl shadow-indigo-900/20 border border-white/10">
              <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-500/40 via-fuchsia-500/30 to-teal-400/20 blur-3xl" />
              <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-gradient-to-tr from-cyan-500/30 to-blue-500/20 blur-3xl" />
              <div className="relative z-10 max-w-2xl">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
                  Welcome back, {displayName.split(' ')[0]}! 👋
                </h1>
                <p className="text-slate-300 text-lg font-medium leading-relaxed">
                  Here is your lab's performance at a glance. You have <strong className="text-white">{stats.new_appointment_requests}</strong> new requests and <strong className="text-white">{stats.pending_reports}</strong> reports pending upload.
                </p>
                <div className="mt-8 flex gap-4 flex-wrap">
                  <button onClick={openNewPatient} className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-indigo-900 shadow-lg shadow-white/20 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-cyan-500 hover:text-white hover:border-transparent hover:shadow-md hover:scale-105 transition-all duration-300">
                    <UserPlus className="mr-2 h-4 w-4" />
                    New Patient
                  </button>
                  <button onClick={() => setActiveTab('appointments')} className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-white/20 hover:scale-105">
                    <Calendar className="mr-2 h-4 w-4 text-cyan-300" />
                    View Appointments
                  </button>
                </div>
              </div>
            </div>

            {/* Overview Stats */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 px-1">Overview</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { label: "Today's Patients", value: stats.todays_patients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                  { label: 'Active Patients', value: stats.active_patients, icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
                  { label: 'Pending Reports', value: stats.pending_reports, icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
                  { label: 'Reports Sent', value: stats.reports_sent, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
                  { label: 'Monthly Revenue', value: formatCurrency(stats.monthly_revenue), icon: IndianRupee, color: 'text-white', bg: 'bg-indigo-50', border: 'border-indigo-100' },
                  { label: 'Collected This Month', value: formatCurrency(stats.monthly_collected || 0), icon: TrendingUp, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
                  { label: 'Home Pending', value: stats.home_collections_pending, icon: Home, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                  { label: 'Outstanding', value: formatCurrency(stats.total_outstanding || 0), icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
                ].map(({ label, value, icon: Icon, color, bg, border }) => (
                  <div key={label} className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 ${bg} ${border} border rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                        <Icon className={`w-6 h-6 ${color}`} />
                      </div>
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</h3>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 px-1">Quick Actions</h2>
              <div className="grid sm:grid-cols-3 gap-5">
                <button onClick={openNewPatient} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg hover:border-blue-200 transition-all text-left group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-1">Add Patient</h4>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Register a new patient visit</p>
                </button>
                <button onClick={() => setActiveTab('appointments')} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg hover:border-teal-200 transition-all text-left group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-1">View Appointments</h4>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stats.new_appointment_requests} new requests pending</p>
                </button>
                <button onClick={() => setActiveTab('reports')} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg hover:border-orange-200 transition-all text-left group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-1">Manage Reports</h4>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stats.pending_reports} pending upload</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Appointment Requests</h2>
                <Badge variant="secondary">{appointments.filter(a => a.status === 'new_request').length} new</Badge>
              </div>
              <button 
                onClick={loadAppointments} 
                disabled={isRefreshingAppointments}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-gradient-to-r hover:from-indigo-500 hover:to-cyan-500 hover:text-white hover:border-transparent hover:shadow-md transition-all duration-300 dark:bg-slate-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshingAppointments ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
                {isRefreshingAppointments ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            {appointmentsError ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                <p className="font-semibold">Unable to load appointment requests</p>
                <p className="mt-2">{appointmentsError}</p>
                <button onClick={loadAppointments} className="mt-4 inline-flex items-center rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-all duration-300">
                  Retry
                </button>
                {appointmentsDebug && (
                  <pre className="mt-4 overflow-x-auto rounded-xl bg-white dark:bg-slate-900 p-3 text-left text-xs text-slate-700 dark:text-slate-200 border border-red-100">{appointmentsDebug}</pre>
                )}
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No appointment requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map(apt => (
                  <div key={apt.id} className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-900 dark:text-white">{apt.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[apt.status] || 'bg-gray-100 dark:bg-slate-800/50 text-gray-600 dark:text-gray-300'}`}>
                            {apt.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{apt.phone}</span>
                          {apt.address && <span className="flex items-center gap-1"><Home className="w-3 h-3" />{apt.address}</span>}
                          {apt.location && apt.collection_type !== 'lab_visit' && (
                            <a href={`https://maps.google.com/?q=${apt.location}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                              <MapPin className="w-3 h-3" /> View on Map
                            </a>
                          )}
                          {apt.collection_type === 'lab_visit' && (
                            <a href="https://maps.app.goo.gl/XQNAahxHV4H5as7z5" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline">
                              <MapPin className="w-3 h-3" /> Lab Location
                            </a>
                          )}
                          {apt.preferred_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(apt.preferred_date)}</span>}
                          {apt.requested_tests && <span className="flex items-center gap-1"><TestTube className="w-3 h-3" />{apt.requested_tests}</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(apt.created_at)}</p>
                      </div>
                      {apt.status === 'new_request' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" onClick={() => convertAppointment(apt)} className="bg-gradient-to-r from-blue-600 to-teal-500 text-white">
                            <CheckCircle2 className="w-3 h-3 mr-1" />Confirm
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateAppointment(apt.id, 'rejected')} className="text-red-600 border-red-200 hover:bg-red-50">
                            <XCircle className="w-3 h-3 mr-1" />Reject
                          </Button>
                        </div>
                      )}
                      {apt.status === 'confirmed' && (
                        <Button size="sm" onClick={() => convertAppointment(apt)} className="bg-gradient-to-r from-blue-600 to-teal-500 text-white">
                          <ArrowRight className="w-3 h-3 mr-1" />Convert to Patient
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PATIENTS TAB */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Patients</h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search name, phone, ID..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="pl-9 h-9 w-full sm:w-64"
                  />
                </div>
                <Button size="sm" onClick={openNewPatient} className="bg-gradient-to-r from-blue-600 to-teal-500 text-white">
                  <Plus className="w-4 h-4 mr-1" />Add
                </Button>
              </div>
            </div>
            {patients.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No patients found</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Patient</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Collection</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Payment</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Test Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Report</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map(p => (
                        <tr key={p.id} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-900/50 dark:bg-slate-900/50">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-gray-900 dark:text-white">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.patient_id} | {p.phone}</p>
                            {p.age && <p className="text-xs text-gray-400">{p.age}y {p.gender || ''}</p>}
                            {p.location && (
                              <a href={`https://maps.google.com/?q=${p.location}`} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 mt-1 text-blue-600 dark:text-blue-400 hover:underline w-max">
                                <MapPin className="w-3 h-3" /> View Map
                              </a>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs capitalize text-gray-600 dark:text-gray-300">{p.collection_type?.replace('_', ' ')}</span>
                            <p className="text-xs text-gray-400">{formatDate(p.booking_date)}</p>
                            {p.collection_type === 'lab_visit' && (
                              <a href="https://maps.app.goo.gl/XQNAahxHV4H5as7z5" target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 mt-1 text-teal-600 dark:text-teal-400 hover:underline w-max">
                                <MapPin className="w-3 h-3" /> Lab Location
                              </a>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {(() => {
                              const testsTotal = p.tests && p.tests.length > 0 ? p.tests.reduce((s, t) => s + Number(t.price || 0), 0) : 0;
                              const displayTotal = testsTotal > 0 ? testsTotal : p.total_amount;
                              return (
                                <>
                                  <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(displayTotal)}</p>
                                  <p className="text-xs text-gray-400">Paid: {formatCurrency(p.amount_paid)}</p>
                                  {p.remaining_amount > 0 && (
                                    <p className="text-xs text-red-500 font-medium">Due: {formatCurrency(p.remaining_amount)}</p>
                                  )}
                                </>
                              );
                            })()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${paymentStatusColor[p.payment_status] || ''}`}>
                              {p.payment_status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Select value={p.test_status} onValueChange={(v) => updatePatientStatus(p.id, 'test_status', v)}>
                              <SelectTrigger className="h-7 text-xs w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {['booked', 'collection_pending', 'sample_collected', 'testing', 'report_ready', 'completed'].map(s => (
                                  <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-4">
                            {uploadProgress[p.id] === 'uploading' ? (
                              <span className="text-xs text-blue-600 flex items-center gap-1">
                                <Clock className="w-3 h-3 animate-spin" />Uploading...
                              </span>
                            ) : uploadProgress[p.id] === 'done' ? (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />Uploaded!
                              </span>
                            ) : uploadProgress[p.id] === 'error' ? (
                              <span className="text-xs text-red-600 flex items-center gap-1">
                                <XCircle className="w-3 h-3" />Failed
                              </span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.report_status === 'uploaded' ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900' : 'bg-gray-100 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400'}`}>
                                  {p.report_status === 'uploaded' ? 'Uploaded' : 'Pending'}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => triggerReportUpload(p.id)}
                                title="Upload Report"
                                className="text-blue-600 hover:bg-blue-50"
                              >
                                <Upload className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openPaymentDialog(p.id)} title="Record Payment" className="text-teal-600 hover:bg-teal-50">
                                <CreditCard className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openEditPatient(p)} title="Edit">
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADD PATIENT TAB */}
        {activeTab === 'add_patient' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{editPatient ? 'Edit Patient Details' : 'Register New Patient'}</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{editPatient ? 'Update information and current status.' : 'Fill in the details to record a new patient visit.'}</p>
              </div>
              <Button variant="outline" onClick={() => setActiveTab('patients')}>Cancel</Button>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
              <form onSubmit={savePatient} className="space-y-8">
                {patientFormError && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {patientFormError}
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Full Name *</Label>
                      <Input value={pForm.name} onChange={e => setPForm(f => ({ ...f, name: e.target.value }))} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500" placeholder="e.g. John Doe" required />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Phone Number *</Label>
                      <Input value={pForm.phone} onChange={e => setPForm(f => ({ ...f, phone: e.target.value }))} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500" placeholder="10-digit number" required />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Age</Label>
                        <Input type="number" value={pForm.age} onChange={e => setPForm(f => ({ ...f, age: e.target.value }))} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500" placeholder="Years" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Gender</Label>
                        <Select value={pForm.gender || '_none'} onValueChange={v => setPForm(f => ({ ...f, gender: v === '_none' ? '' : v }))}>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-blue-500"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">Not specified</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Address</Label>
                      <Textarea value={pForm.address} onChange={e => setPForm(f => ({ ...f, address: e.target.value }))} className="resize-none h-32 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500" placeholder="Full residential address" />
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Collection Type</Label>
                        <Select value={pForm.collection_type} onValueChange={v => setPForm(f => ({ ...f, collection_type: v }))}>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-blue-500"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="home_collection">Home Collection</SelectItem>
                            <SelectItem value="lab_visit">Lab Visit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Booking Date</Label>
                        <Input type="date" value={pForm.booking_date} onChange={e => setPForm(f => ({ ...f, booking_date: e.target.value }))} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total Amount <span className="text-xs font-normal text-slate-400">(auto-calculated)</span></Label>
                        <Input type="number" value={pForm.total_amount} readOnly className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 cursor-not-allowed font-semibold text-lg" placeholder="₹0" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Amount Paid</Label>
                        <Input type="number" value={pForm.amount_paid} onChange={e => setPForm(f => ({ ...f, amount_paid: e.target.value }))} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 font-semibold text-lg text-blue-600" placeholder="₹0" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Requested Tests</Label>
                      <Textarea value={pForm.tests_text} onChange={e => { const val = e.target.value; setPForm(f => ({ ...f, tests_text: val, total_amount: calcTotalFromTests(val) })); }} placeholder="e.g. CBC, Lipid Profile, Thyroid" className="resize-none h-32 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500" />
                    </div>
                    
                    {editPatient && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Test Status</Label>
                          <Select
                            value={editPatient.test_status}
                            onValueChange={v => { updatePatientStatus(editPatient.id, 'test_status', v); setEditPatient({ ...editPatient, test_status: v as any }); }}
                          >
                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['booked', 'collection_pending', 'sample_collected', 'testing', 'report_ready', 'completed'].map(s => (
                                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Report Status</Label>
                          <Select
                            value={editPatient.report_status}
                            onValueChange={v => { updatePatientStatus(editPatient.id, 'report_status', v); setEditPatient({ ...editPatient, report_status: v as any }); }}
                          >
                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_uploaded">Not Uploaded</SelectItem>
                              <SelectItem value="uploaded">Uploaded</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setActiveTab('patients')} className="h-14 px-8 text-base font-semibold">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="h-14 px-10 text-base font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-full shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">
                    {isSubmitting ? 'Saving...' : editPatient ? 'Update Patient' : 'Save Patient'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TESTS TAB */}
        {activeTab === 'tests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Test Catalogue</h2>
              <Button size="sm" onClick={openNewTest} className="bg-gradient-to-r from-blue-600 to-teal-500 text-white">
                <Plus className="w-4 h-4 mr-1" />Add Test
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests.map(t => (
                <div key={t.id} className={`bg-white dark:bg-slate-900 rounded-xl p-5 border shadow-sm transition-all ${t.is_active ? 'border-gray-100 dark:border-slate-800' : 'border-gray-200 dark:border-slate-800 opacity-60'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t.name}</h3>
                    {t.is_active ? (
                      <Badge className="bg-green-50 text-green-700 text-[10px]">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                    )}
                  </div>
                  {t.category && <p className="text-xs text-gray-400 mb-2">{t.category}</p>}
                  {t.description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{t.description}</p>}
                  <div className="flex items-end justify-between">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(t.price)}</p>
                    {t.report_delivery_time && <p className="text-xs text-teal-600 font-medium">{t.report_delivery_time}</p>}
                  </div>
                  <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => openEditTest(t)}>Edit</Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => {
                      apiFetch(`${API}/tests`, { method: 'PATCH', body: JSON.stringify({ id: t.id, is_active: !t.is_active }) }).then(loadTests);
                    }}>
                      {t.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="space-y-5">
            {/* Reconciliation Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Collected</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalCollected)}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Outstanding</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(stats?.total_outstanding || 0)}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">By Method</p>
                <div className="space-y-1">
                  {Object.entries(methodBreakdown).map(([method, amt]) => (
                    <div key={method} className="flex justify-between text-xs">
                      <span className="capitalize text-gray-600 dark:text-gray-300">{method}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(amt)}</span>
                    </div>
                  ))}
                  {Object.keys(methodBreakdown).length === 0 && <p className="text-xs text-gray-400">No payments</p>}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Transactions</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{payments.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">all time</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Payment Transactions</h2>
              <Button size="sm" onClick={() => openPaymentDialog('')} className="bg-gradient-to-r from-blue-600 to-teal-500 text-white">
                <Plus className="w-4 h-4 mr-1" />Record Payment
              </Button>
            </div>
            {payments.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No payments recorded</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Patient</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Method</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-900/50 dark:bg-slate-900/50">
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{formatDate(p.payment_date || p.created_at)}</td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900 dark:text-white">{p.patients?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-400">{p.patients?.patient_id}</p>
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">{formatCurrency(p.amount)}</td>
                          <td className="py-3 px-4">
                            <span className="capitalize text-gray-600 dark:text-gray-300 text-xs font-medium bg-gray-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-full">{p.payment_method}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-400 text-xs">{p.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-5">
            {/* All patients report status */}
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Patient Reports
                <span className="text-xs font-normal text-gray-400">({patients.filter(p => p.status === 'active').length} active patients)</span>
              </h3>
              {patients.filter(p => p.status === 'active').length === 0 ? (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-3 text-gray-500">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">No active patients found.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-slate-800 bg-blue-50/50">
                          <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Patient</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Booking Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Test Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Report Status</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patients.filter(p => p.status === 'active').map(p => (
                          <tr key={p.id} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-900/50 dark:bg-slate-900/50">
                            <td className="py-3 px-4">
                              <p className="font-semibold text-gray-900 dark:text-white">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.patient_id} | {p.phone}</p>
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{formatDate(p.booking_date)}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[p.test_status] || 'bg-gray-100 dark:bg-slate-800/50 text-gray-600 dark:text-gray-300'}`}>
                                {p.test_status?.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {p.report_status === 'uploaded' ? (
                                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400">
                                  <CheckCircle2 className="w-3 h-3" />Uploaded
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400">
                                  <AlertCircle className="w-3 h-3" />Pending
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {uploadProgress[p.id] === 'uploading' ? (
                                <span className="text-xs text-blue-600 flex items-center gap-1 justify-end">
                                  <Clock className="w-3 h-3 animate-spin" />Uploading...
                                </span>
                              ) : uploadProgress[p.id] === 'done' ? (
                                <span className="text-xs text-green-600 flex items-center gap-1 justify-end font-semibold">
                                  <CheckCircle2 className="w-3 h-3" />Done!
                                </span>
                              ) : uploadProgress[p.id] === 'error' ? (
                                <span className="text-xs text-red-600 flex items-center gap-1 justify-end">
                                  <XCircle className="w-3 h-3" />Failed — try again
                                </span>
                              ) : (
                                <Button size="sm" onClick={() => triggerReportUpload(p.id)} className={`h-8 ${p.report_status === 'uploaded' ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'bg-gradient-to-r from-blue-600 to-teal-500 text-white'}`}>
                                  <Upload className="w-3 h-3 mr-1" />{p.report_status === 'uploaded' ? 'Re-upload' : 'Upload PDF'}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Uploaded reports */}
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-green-500" />
                Uploaded Reports
                <span className="text-xs font-normal text-gray-400">({reports.length} reports)</span>
              </h3>
              {reports.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No reports uploaded yet</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                          <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">File Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Patient</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Uploaded</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Size</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map(r => {
                          const patient = patients.find(p => p.id === r.patient_id);
                          return (
                            <tr key={r.id} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-900/50 dark:bg-slate-900/50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                  <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">{r.file_name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-medium text-gray-900 dark:text-white">{patient?.name || 'Unknown'}</p>
                                <p className="text-xs text-gray-400">{patient?.patient_id || r.patient_id?.slice(0, 8)}</p>
                              </td>
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{formatDate(r.created_at)}</td>
                              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs">
                                {r.file_size ? `${(r.file_size / 1024).toFixed(0)} KB` : '-'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button size="sm" variant="ghost" onClick={() => downloadReport(r.id, r.file_name)} className="text-blue-600 hover:bg-blue-50">
                                    <Download className="w-3 h-3 mr-1" />Download
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => { if (patient) triggerReportUpload(patient.id); }} className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-slate-800/50" title="Re-upload">
                                    <Upload className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => deleteReport(r.id)} className="text-red-500 hover:bg-red-50">
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADD TEST TAB */}
        {activeTab === 'add_test' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{editTest ? 'Edit Test' : 'Add New Test'}</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{editTest ? 'Update test details in the catalogue.' : 'Add a new test to the catalogue.'}</p>
              </div>
              <Button variant="outline" onClick={() => setActiveTab('tests')}>Cancel</Button>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
              <form onSubmit={saveTest} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Test Name *</Label>
                  <Input value={tForm.name} onChange={e => setTForm(f => ({ ...f, name: e.target.value }))} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800" required />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Price *</Label>
                    <Input type="number" value={tForm.price} onChange={e => setTForm(f => ({ ...f, price: e.target.value }))} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Category</Label>
                    <Input value={tForm.category} onChange={e => setTForm(f => ({ ...f, category: e.target.value }))} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800" placeholder="e.g. Blood, Urine" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Report Delivery Time</Label>
                  <Input value={tForm.report_delivery_time} onChange={e => setTForm(f => ({ ...f, report_delivery_time: e.target.value }))} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800" placeholder="e.g. 24 hours" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Description</Label>
                  <Textarea value={tForm.description} onChange={e => setTForm(f => ({ ...f, description: e.target.value }))} className="resize-none h-24 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Preparation Instructions</Label>
                  <Textarea value={tForm.preparation_instructions} onChange={e => setTForm(f => ({ ...f, preparation_instructions: e.target.value }))} className="resize-none h-24 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800" placeholder="e.g. Fasting 10-12 hrs required" />
                </div>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <input type="checkbox" id="is_active" checked={tForm.is_active} onChange={e => setTForm(f => ({ ...f, is_active: e.target.checked }))} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <Label htmlFor="is_active" className="text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">Test is Active</Label>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setActiveTab('tests')} className="h-14 px-8 text-base font-semibold">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="h-14 px-10 text-base font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-full shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">
                    {isSubmitting ? 'Saving...' : editTest ? 'Update Test' : 'Add Test'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RECORD PAYMENT TAB */}
        {activeTab === 'record_payment' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Record Payment</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Add a payment record for a patient</p>
              </div>
              <Button variant="outline" onClick={() => setActiveTab('payments')}>Cancel</Button>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
              <form onSubmit={savePayment} className="space-y-6">
                {!paymentPatientId && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Select Patient *</Label>
                    <Select value={paymentPatientId || ''} onValueChange={v => setPaymentPatientId(v)}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"><SelectValue placeholder="Choose a patient" /></SelectTrigger>
                      <SelectContent>
                        {patients.filter(p => p.status === 'active').map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.patient_id}) — {formatCurrency(p.remaining_amount)} due
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {paymentPatientId && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm">
                    {(() => {
                      const p = patients.find(pt => pt.id === paymentPatientId);
                      return p ? (
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-bold text-blue-900 text-base">{p.name}</p>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setPaymentPatientId('')} className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-100">Change</Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-blue-100 text-xs">
                            {(() => {
                              const testsTotal = p.tests && p.tests.length > 0 ? p.tests.reduce((s, t) => s + Number(t.price || 0), 0) : 0;
                              const displayTotal = testsTotal > 0 ? testsTotal : p.total_amount;
                              return (
                                <div>
                                  <p className="text-blue-600/70 mb-0.5">Total</p>
                                  <p className="font-semibold text-blue-900">{formatCurrency(displayTotal)}</p>
                                </div>
                              );
                            })()}
                            <div>
                              <p className="text-blue-600/70 mb-0.5">Paid</p>
                              <p className="font-semibold text-blue-900">{formatCurrency(p.amount_paid)}</p>
                            </div>
                            <div>
                              <p className="text-blue-600/70 mb-0.5">Due</p>
                              <p className="font-semibold text-red-600">{formatCurrency(p.remaining_amount)}</p>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Amount *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={payForm.amount}
                    onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="Enter amount"
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-lg font-semibold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Payment Method</Label>
                  <Select value={payForm.payment_method} onValueChange={v => setPayForm(f => ({ ...f, payment_method: v }))}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notes</Label>
                  <Input value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800" placeholder="Optional notes" />
                </div>
                
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setActiveTab('payments')} className="h-14 px-8 text-base font-semibold">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !paymentPatientId || !payForm.amount}
                    className="h-14 px-10 text-base font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-full shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
                  >
                    {isSubmitting ? 'Recording...' : 'Record Payment'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
