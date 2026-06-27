// Database Types
export interface User {
  id: string;
  email: string;
  password_hash?: string;
  name: string;
  role: 'admin' | 'staff';
  created_at: string;
  updated_at: string;
}

export interface Test {
  id: string;
  name: string;
  description: string | null;
  price: number;
  preparation_instructions: string | null;
  report_delivery_time: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  patient_id: string;
  name: string;
  phone: string;
  age: number | null;
  gender: string | null;
  address: string | null;
  location: string | null;
  booking_date: string;
  collection_type: 'home_collection' | 'lab_visit';
  total_amount: number;
  amount_paid: number;
  remaining_amount: number;
  payment_status: 'paid' | 'partial' | 'unpaid';
  test_status: 'booked' | 'collection_pending' | 'sample_collected' | 'testing' | 'report_ready' | 'completed';
  report_status: 'not_uploaded' | 'uploaded';
  whatsapp_status: 'pending' | 'sent' | 'delivered' | 'read';
  status: 'active' | 'old';
  completion_date: string | null;
  created_at: string;
  updated_at: string;
  tests?: PatientTest[];
  report?: Report;
}

export interface PatientTest {
  id: string;
  patient_id: string;
  test_id: string | null;
  test_name: string;
  price: number;
  created_at: string;
}

export interface AppointmentRequest {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  location: string | null;
  requested_tests: string | null;
  preferred_date: string | null;
  collection_type: string | null;
  status: 'new_request' | 'confirmed' | 'rejected' | 'converted';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  patient_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  patient_id: string | null;
  amount: number;
  payment_method: 'cash' | 'upi' | 'card' | 'bank_transfer';
  payment_date: string;
  notes: string | null;
  received_by: string | null;
  created_at: string;
  patient?: Patient;
}

export interface WhatsAppLog {
  id: string;
  patient_id: string;
  phone: string | null;
  message: string | null;
  status: 'pending' | 'sent' | 'failed';
  sent_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string | null;
  message: string | null;
  is_read: boolean;
  reference_id: string | null;
  created_at: string;
}

// Stats Types
export interface DashboardStats {
  todays_patients: number;
  active_patients: number;
  pending_reports: number;
  reports_sent: number;
  monthly_revenue: number;
  yearly_revenue: number;
  home_collections_pending: number;
  new_appointment_requests: number;
  monthly_collected?: number;
  total_outstanding?: number;
}
