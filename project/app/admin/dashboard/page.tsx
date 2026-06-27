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
} from 'lucide-react';
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

type Tab = 'dashboard' | 'appointments' | 'patients' | 'tests' | 'payments' | 'reports';

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'tests', label: 'Tests', icon: TestTube },
  { id: 'payments', label: 'Payments', icon: CreditCard },
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
  const [appointmentsError, setAppointmentsError] = useState('');
  const [appointmentsDebug, setAppointmentsDebug] = useState<string>('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialogs
  const [patientDialog, setPatientDialog] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [testDialog, setTestDialog] = useState(false);
  const [editTest, setEditTest] = useState<Test | null>(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentPatientId, setPaymentPatientId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Report upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPatientId, setUploadingPatientId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, 'uploading' | 'done' | 'error'>>({});

  // Patient form
  const [pForm, setPForm] = useState({
    name: '', phone: '', age: '', gender: '', address: '',
    collection_type: 'home_collection', booking_date: '',
    total_amount: '', tests_text: '',
  });

  // Test form
  const [tForm, setTForm] = useState({
    name: '', description: '', price: '', category: '',
    report_delivery_time: '', preparation_instructions: '', is_active: true,
  });

  // Payment form
  const [payForm, setPayForm] = useState({ amount: '', payment_method: 'cash', notes: '' });

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
    const patientRes = await apiFetch(`${API}/patients`, {
      method: 'POST',
      body: JSON.stringify({
        name: apt.name,
        phone: apt.phone,
        address: apt.address,
        collection_type: apt.collection_type || 'home_collection',
        booking_date: apt.preferred_date || new Date().toISOString().split('T')[0],
        total_amount: 0,
        tests: apt.requested_tests ? apt.requested_tests.split(',').map((t: string) => ({ test_name: t.trim(), price: 0 })) : [],
      }),
    });
    if (patientRes.ok) {
      await updateAppointment(apt.id, 'converted');
      loadPatients();
      loadStats();
    }
  };

  const openNewPatient = () => {
    setEditPatient(null);
    setPForm({ name: '', phone: '', age: '', gender: '', address: '', collection_type: 'home_collection', booking_date: new Date().toISOString().split('T')[0], total_amount: '', tests_text: '' });
    setPatientDialog(true);
  };

  const openEditPatient = (p: Patient) => {
    setEditPatient(p);
    setPForm({
      name: p.name,
      phone: p.phone,
      age: p.age?.toString() || '',
      gender: p.gender || '',
      address: p.address || '',
      collection_type: p.collection_type,
      booking_date: p.booking_date,
      total_amount: p.total_amount?.toString() || '',
      tests_text: p.tests?.map(t => t.test_name).join(', ') || '',
    });
    setPatientDialog(true);
  };

  const savePatient = async (e: React.FormEvent) => {
    e.preventDefault();
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
        tests: pForm.tests_text ? pForm.tests_text.split(',').map(t => ({ test_name: t.trim(), price: 0 })) : [],
      };
      if (editPatient) {
        await apiFetch(`${API}/patients`, { method: 'PATCH', body: JSON.stringify({ id: editPatient.id, ...body, tests: undefined }) });
      } else {
        await apiFetch(`${API}/patients`, { method: 'POST', body: JSON.stringify(body) });
      }
      setPatientDialog(false);
      loadPatients();
      loadStats();
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
    setTestDialog(true);
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
    setTestDialog(true);
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
      setTestDialog(false);
      loadTests();
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPaymentDialog = (patientId: string) => {
    setPaymentPatientId(patientId);
    setPayForm({ amount: '', payment_method: 'cash', notes: '' });
    setPaymentDialog(true);
  };

  const savePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch(`${API}/payments`, {
        method: 'POST',
        body: JSON.stringify({ patient_id: paymentPatientId, ...payForm, amount: Number(payForm.amount) }),
      });
      setPaymentDialog(false);
      setPayForm({ amount: '', payment_method: 'cash', notes: '' });
      setPaymentPatientId('');
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
      // 1. Get signed upload URL
      const urlRes = await apiFetch(`${API}/reports/upload-url`, {
        method: 'POST',
        body: JSON.stringify({ patient_id: patientId, file_name: file.name }),
      });
      if (!urlRes.ok) throw new Error('Failed to get upload URL');
      const { signed_url, path } = await urlRes.json();

      // 2. Upload file directly to Supabase Storage
      const uploadRes = await fetch(signed_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('File upload failed');

      // 3. Record in DB
      const recordRes = await apiFetch(`${API}/reports`, {
        method: 'POST',
        body: JSON.stringify({ patient_id: patientId, file_name: file.name, file_url: path, file_size: file.size }),
      });
      if (!recordRes.ok) throw new Error('Failed to record report');

      setUploadProgress(p => ({ ...p, [patientId]: 'done' }));
      loadPatients();
      loadReports();
      loadStats();
      setTimeout(() => setUploadProgress(p => { const n = { ...p }; delete n[patientId]; return n; }), 3000);
    } catch {
      setUploadProgress(p => ({ ...p, [patientId]: 'error' }));
      setTimeout(() => setUploadProgress(p => { const n = { ...p }; delete n[patientId]; return n; }), 3000);
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
    confirmed: 'bg-yellow-100 text-yellow-700',
    converted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    booked: 'bg-gray-100 text-gray-700',
    collection_pending: 'bg-yellow-100 text-yellow-700',
    sample_collected: 'bg-blue-100 text-blue-700',
    testing: 'bg-orange-100 text-orange-700',
    report_ready: 'bg-green-100 text-green-700',
    completed: 'bg-teal-100 text-teal-700',
  };

  const paymentStatusColor: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700',
    unpaid: 'bg-red-100 text-red-600',
  };

  // Payment reconciliation helpers
  const totalCollected = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const methodBreakdown = payments.reduce((acc: Record<string, number>, p) => {
    acc[p.payment_method] = (acc[p.payment_method] || 0) + Number(p.amount || 0);
    return acc;
  }, {});

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden file input for report upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Jaithra Lab</span>
            <span className="text-xs text-gray-400 hidden sm:inline">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            {stats && stats.new_appointment_requests > 0 && (
              <Badge className="bg-red-50 text-red-600 border-red-200">
                <Bell className="w-3 h-3 mr-1" />
                {stats.new_appointment_requests} new
              </Badge>
            )}
            <span className="text-sm text-gray-600 hidden sm:block">{user.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'appointments' && stats && stats.new_appointment_requests > 0 && (
                <span className="w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {stats.new_appointment_requests}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Today's Patients", value: stats.todays_patients, icon: Users, color: 'from-blue-500 to-blue-600' },
                { label: 'Active Patients', value: stats.active_patients, icon: Users, color: 'from-teal-500 to-teal-600' },
                { label: 'Pending Reports', value: stats.pending_reports, icon: FileText, color: 'from-orange-500 to-orange-600' },
                { label: 'Reports Sent', value: stats.reports_sent, icon: CheckCircle2, color: 'from-green-500 to-green-600' },
                { label: 'Monthly Revenue', value: formatCurrency(stats.monthly_revenue), icon: IndianRupee, color: 'from-blue-600 to-indigo-600' },
                { label: 'Collected This Month', value: formatCurrency(stats.monthly_collected || 0), icon: TrendingUp, color: 'from-teal-600 to-cyan-600' },
                { label: 'Home Pending', value: stats.home_collections_pending, icon: Home, color: 'from-yellow-500 to-orange-500' },
                { label: 'Outstanding', value: formatCurrency(stats.total_outstanding || 0), icon: AlertCircle, color: 'from-red-500 to-pink-500' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="grid sm:grid-cols-3 gap-4">
              <button onClick={openNewPatient} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group">
                <div className="flex items-center justify-between mb-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                </div>
                <p className="font-bold text-gray-900 text-sm">Add Patient</p>
                <p className="text-xs text-gray-500">Register a new patient visit</p>
              </button>
              <button onClick={() => setActiveTab('appointments')} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all text-left group">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-teal-400 transition-colors" />
                </div>
                <p className="font-bold text-gray-900 text-sm">View Appointments</p>
                <p className="text-xs text-gray-500">{stats.new_appointment_requests} new requests</p>
              </button>
              <button onClick={() => setActiveTab('reports')} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all text-left group">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
                </div>
                <p className="font-bold text-gray-900 text-sm">Manage Reports</p>
                <p className="text-xs text-gray-500">{stats.pending_reports} pending upload</p>
              </button>
            </div>
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900">Appointment Requests</h2>
                <Badge variant="secondary">{appointments.filter(a => a.status === 'new_request').length} new</Badge>
              </div>
              <button onClick={loadAppointments} className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                Refresh
              </button>
            </div>
            {appointmentsError ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                <p className="font-semibold">Unable to load appointment requests</p>
                <p className="mt-2">{appointmentsError}</p>
                <button onClick={loadAppointments} className="mt-4 inline-flex items-center rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700">
                  Retry
                </button>
                {appointmentsDebug && (
                  <pre className="mt-4 overflow-x-auto rounded-xl bg-white p-3 text-left text-xs text-slate-700 border border-red-100">{appointmentsDebug}</pre>
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
                  <div key={apt.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-900">{apt.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                            {apt.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{apt.phone}</span>
                          {apt.address && <span className="flex items-center gap-1"><Home className="w-3 h-3" />{apt.address}</span>}
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
              <h2 className="text-lg font-bold text-gray-900">Patients</h2>
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
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Patient</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Collection</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Payment</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Test Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Report</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map(p => (
                        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.patient_id} | {p.phone}</p>
                            {p.age && <p className="text-xs text-gray-400">{p.age}y {p.gender || ''}</p>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs capitalize text-gray-600">{p.collection_type?.replace('_', ' ')}</span>
                            <p className="text-xs text-gray-400">{formatDate(p.booking_date)}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900">{formatCurrency(p.total_amount)}</p>
                            <p className="text-xs text-gray-400">Paid: {formatCurrency(p.amount_paid)}</p>
                            {p.remaining_amount > 0 && (
                              <p className="text-xs text-red-500 font-medium">Due: {formatCurrency(p.remaining_amount)}</p>
                            )}
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
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.report_status === 'uploaded' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
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

        {/* TESTS TAB */}
        {activeTab === 'tests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Test Catalogue</h2>
              <Button size="sm" onClick={openNewTest} className="bg-gradient-to-r from-blue-600 to-teal-500 text-white">
                <Plus className="w-4 h-4 mr-1" />Add Test
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests.map(t => (
                <div key={t.id} className={`bg-white rounded-xl p-5 border shadow-sm transition-all ${t.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-sm">{t.name}</h3>
                    {t.is_active ? (
                      <Badge className="bg-green-50 text-green-700 text-[10px]">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                    )}
                  </div>
                  {t.category && <p className="text-xs text-gray-400 mb-2">{t.category}</p>}
                  {t.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{t.description}</p>}
                  <div className="flex items-end justify-between">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(t.price)}</p>
                    {t.report_delivery_time && <p className="text-xs text-teal-600 font-medium">{t.report_delivery_time}</p>}
                  </div>
                  <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100">
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
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Total Collected</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalCollected)}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Outstanding</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(stats?.total_outstanding || 0)}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 mb-2">By Method</p>
                <div className="space-y-1">
                  {Object.entries(methodBreakdown).map(([method, amt]) => (
                    <div key={method} className="flex justify-between text-xs">
                      <span className="capitalize text-gray-600">{method}</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(amt)}</span>
                    </div>
                  ))}
                  {Object.keys(methodBreakdown).length === 0 && <p className="text-xs text-gray-400">No payments</p>}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Transactions</p>
                <p className="text-xl font-bold text-gray-900">{payments.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">all time</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Payment Transactions</h2>
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
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Patient</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Method</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-3 px-4 text-gray-600">{formatDate(p.payment_date || p.created_at)}</td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900">{p.patients?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-400">{p.patients?.patient_id}</p>
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900">{formatCurrency(p.amount)}</td>
                          <td className="py-3 px-4">
                            <span className="capitalize text-gray-600 text-xs font-medium bg-gray-100 px-2 py-0.5 rounded-full">{p.payment_method}</span>
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
            {/* Patients needing reports */}
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                Pending Report Upload
                <span className="text-xs font-normal text-gray-400">({patients.filter(p => p.report_status === 'not_uploaded' && p.status === 'active').length} patients)</span>
              </h3>
              {patients.filter(p => p.report_status === 'not_uploaded' && p.status === 'active').length === 0 ? (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3 text-green-700">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">All active patients have reports uploaded.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-orange-50/50">
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Patient</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Booking Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Test Status</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-600">Upload</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patients.filter(p => p.report_status === 'not_uploaded' && p.status === 'active').map(p => (
                          <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-3 px-4">
                              <p className="font-semibold text-gray-900">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.patient_id} | {p.phone}</p>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{formatDate(p.booking_date)}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[p.test_status] || 'bg-gray-100 text-gray-600'}`}>
                                {p.test_status?.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {uploadProgress[p.id] === 'uploading' ? (
                                <span className="text-xs text-blue-600 flex items-center gap-1 justify-end">
                                  <Clock className="w-3 h-3 animate-spin" />Uploading...
                                </span>
                              ) : uploadProgress[p.id] === 'done' ? (
                                <span className="text-xs text-green-600 flex items-center gap-1 justify-end">
                                  <CheckCircle2 className="w-3 h-3" />Done!
                                </span>
                              ) : (
                                <Button size="sm" onClick={() => triggerReportUpload(p.id)} className="bg-gradient-to-r from-blue-600 to-teal-500 text-white h-8">
                                  <Upload className="w-3 h-3 mr-1" />Upload PDF
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
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-green-500" />
                Uploaded Reports
                <span className="text-xs font-normal text-gray-400">({reports.length} reports)</span>
              </h3>
              {reports.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No reports uploaded yet</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">File Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Patient</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Uploaded</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Size</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map(r => {
                          const patient = patients.find(p => p.id === r.patient_id);
                          return (
                            <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                  <span className="text-gray-900 font-medium truncate max-w-[200px]">{r.file_name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-medium text-gray-900">{patient?.name || 'Unknown'}</p>
                                <p className="text-xs text-gray-400">{patient?.patient_id || r.patient_id?.slice(0, 8)}</p>
                              </td>
                              <td className="py-3 px-4 text-gray-600">{formatDate(r.created_at)}</td>
                              <td className="py-3 px-4 text-gray-500 text-xs">
                                {r.file_size ? `${(r.file_size / 1024).toFixed(0)} KB` : '-'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button size="sm" variant="ghost" onClick={() => downloadReport(r.id, r.file_name)} className="text-blue-600 hover:bg-blue-50">
                                    <Download className="w-3 h-3 mr-1" />Download
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => { if (patient) triggerReportUpload(patient.id); }} className="text-gray-500 hover:bg-gray-100" title="Re-upload">
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
      </div>

      {/* PATIENT DIALOG */}
      <Dialog open={patientDialog} onOpenChange={setPatientDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPatient ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
            <DialogDescription>{editPatient ? 'Update patient information' : 'Register a new patient visit'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={savePatient} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={pForm.name} onChange={e => setPForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input value={pForm.phone} onChange={e => setPForm(f => ({ ...f, phone: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Age</Label>
                <Input type="number" value={pForm.age} onChange={e => setPForm(f => ({ ...f, age: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={pForm.gender || '_none'} onValueChange={v => setPForm(f => ({ ...f, gender: v === '_none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Not specified</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Textarea value={pForm.address} onChange={e => setPForm(f => ({ ...f, address: e.target.value }))} className="resize-none h-16" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Collection Type</Label>
                <Select value={pForm.collection_type} onValueChange={v => setPForm(f => ({ ...f, collection_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home_collection">Home Collection</SelectItem>
                    <SelectItem value="lab_visit">Lab Visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Booking Date</Label>
                <Input type="date" value={pForm.booking_date} onChange={e => setPForm(f => ({ ...f, booking_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Total Amount</Label>
              <Input type="number" value={pForm.total_amount} onChange={e => setPForm(f => ({ ...f, total_amount: e.target.value }))} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Tests (comma separated)</Label>
              <Textarea value={pForm.tests_text} onChange={e => setPForm(f => ({ ...f, tests_text: e.target.value }))} placeholder="CBC, Lipid Profile, Thyroid" className="resize-none h-16" />
            </div>
            {editPatient && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Test Status</Label>
                  <Select
                    value={editPatient.test_status}
                    onValueChange={v => { updatePatientStatus(editPatient.id, 'test_status', v); setEditPatient({ ...editPatient, test_status: v as any }); }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['booked', 'collection_pending', 'sample_collected', 'testing', 'report_ready', 'completed'].map(s => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Report Status</Label>
                  <Select
                    value={editPatient.report_status}
                    onValueChange={v => { updatePatientStatus(editPatient.id, 'report_status', v); setEditPatient({ ...editPatient, report_status: v as any }); }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_uploaded">Not Uploaded</SelectItem>
                      <SelectItem value="uploaded">Uploaded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white">
              {isSubmitting ? 'Saving...' : editPatient ? 'Update Patient' : 'Add Patient'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* TEST DIALOG */}
      <Dialog open={testDialog} onOpenChange={setTestDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTest ? 'Edit Test' : 'Add New Test'}</DialogTitle>
            <DialogDescription>{editTest ? 'Update test details' : 'Add a new test to the catalogue'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveTest} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Test Name *</Label>
              <Input value={tForm.name} onChange={e => setTForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price *</Label>
                <Input type="number" value={tForm.price} onChange={e => setTForm(f => ({ ...f, price: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input value={tForm.category} onChange={e => setTForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Blood, Urine" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Report Delivery Time</Label>
              <Input value={tForm.report_delivery_time} onChange={e => setTForm(f => ({ ...f, report_delivery_time: e.target.value }))} placeholder="e.g. 24 hours" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={tForm.description} onChange={e => setTForm(f => ({ ...f, description: e.target.value }))} className="resize-none h-16" />
            </div>
            <div className="space-y-1.5">
              <Label>Preparation Instructions</Label>
              <Textarea value={tForm.preparation_instructions} onChange={e => setTForm(f => ({ ...f, preparation_instructions: e.target.value }))} placeholder="e.g. Fasting 10-12 hrs required" className="resize-none h-16" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={tForm.is_active} onChange={e => setTForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
              <Label htmlFor="is_active" className="text-sm">Active</Label>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white">
              {isSubmitting ? 'Saving...' : editTest ? 'Update Test' : 'Add Test'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* PAYMENT DIALOG */}
      <Dialog open={paymentDialog} onOpenChange={(open) => { setPaymentDialog(open); if (!open) { setPaymentPatientId(''); setPayForm({ amount: '', payment_method: 'cash', notes: '' }); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Add a payment record for a patient</DialogDescription>
          </DialogHeader>
          <form onSubmit={savePayment} className="space-y-4">
            {/* Patient selector shown when opened from Payments tab (no pre-selected patient) */}
            {!paymentPatientId && (
              <div className="space-y-1.5">
                <Label>Select Patient *</Label>
                <Select value={paymentPatientId || ''} onValueChange={v => setPaymentPatientId(v)}>
                  <SelectTrigger><SelectValue placeholder="Choose a patient" /></SelectTrigger>
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
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                {(() => {
                  const p = patients.find(pt => pt.id === paymentPatientId);
                  return p ? (
                    <div>
                      <p className="font-semibold text-blue-800">{p.name}</p>
                      <p className="text-blue-600 text-xs mt-0.5">
                        Total: {formatCurrency(p.total_amount)} | Paid: {formatCurrency(p.amount_paid)} | Due: {formatCurrency(p.remaining_amount)}
                      </p>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input
                type="number"
                min="1"
                value={payForm.amount}
                onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="Enter amount"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={payForm.payment_method} onValueChange={v => setPayForm(f => ({ ...f, payment_method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || !paymentPatientId || !payForm.amount}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
