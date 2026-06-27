import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { appointmentId } = await req.json();
    if (!appointmentId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const supabase = createSupabaseAdmin();

    // 1. Fetch appointment details
    const { data: apt, error: fetchErr } = await supabase
      .from('appointment_requests')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (fetchErr || !apt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // 2. Generate Patient ID
    const now = new Date();
    const pid = `PAT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 3. Insert Patient
    const { data: patient, error: patientErr } = await supabase
      .from('patients')
      .insert({
        patient_id: pid,
        name: apt.name,
        phone: apt.phone,
        address: apt.address || null,
        location: apt.location || null,
        booking_date: apt.preferred_date || now.toISOString().split('T')[0],
        collection_type: apt.collection_type || 'home_collection',
        total_amount: 0,
        amount_paid: 0,
        remaining_amount: 0,
        payment_status: 'unpaid',
        test_status: 'booked',
        report_status: 'not_uploaded',
        whatsapp_status: 'pending',
        status: 'active',
      })
      .select()
      .single();

    if (patientErr || !patient) throw patientErr;

    // 4. Insert Tests
    if (apt.requested_tests) {
      const testsArray = apt.requested_tests.split(',').map((t: string) => ({
        patient_id: patient.id,
        test_name: t.trim(),
        price: 0,
      }));
      await supabase.from('patient_tests').insert(testsArray);
    }

    // 5. Update Appointment Status
    await supabase.from('appointment_requests').update({ status: 'converted', updated_at: now.toISOString() }).eq('id', apt.id);

    // 6. Notification
    await supabase.from('notifications').insert({
      type: 'new_patient',
      title: 'Appointment Converted to Patient',
      message: `${apt.name} (${pid}) is now an active patient.`,
      reference_id: patient.id,
      is_read: false,
    });

    return NextResponse.json({ success: true, patient_id: pid });
  } catch (err: any) {
    console.error('Convert Error:', err);
    return NextResponse.json({ error: err.message || 'Server Error' }, { status: 500 });
  }
}
