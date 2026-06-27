import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

// ── POST /api/booking ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      age,
      gender,
      address,
      location,
      booking_date,
      collection_type,
      tests = [],
      total_amount = 0,
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    // Generate unique patient ID
    const now = new Date();
    const pid = `PAT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const amount = Number(total_amount || 0);

    // 1. Insert patient record
    const { data: patient, error: patientErr } = await supabase
      .from('patients')
      .insert({
        patient_id: pid,
        name,
        phone,
        age: age ? Number(age) : null,
        gender: gender || null,
        address: address || null,
        location: location || null,
        booking_date: booking_date || now.toISOString().split('T')[0],
        collection_type: collection_type || 'home_collection',
        total_amount: amount,
        amount_paid: 0,
        remaining_amount: amount,
        payment_status: 'unpaid',
        test_status: 'booked',
        report_status: 'not_uploaded',
        whatsapp_status: 'pending',
        status: 'active',
      })
      .select()
      .single();

    if (patientErr || !patient) {
      console.error('[Booking] Patient insert error:', patientErr);
      return NextResponse.json({ error: patientErr?.message || 'Booking failed' }, { status: 500 });
    }

    // 2. Insert patient tests
    if (Array.isArray(tests) && tests.length > 0) {
      const pts = tests.map((t: { test_name: string; test_id?: string; price?: number }) => ({
        patient_id: patient.id,
        test_id: t.test_id || null,
        test_name: t.test_name,
        price: Number(t.price || 0),
      }));
      const { error: testsErr } = await supabase.from('patient_tests').insert(pts);
      if (testsErr) {
        console.error('[Booking] Tests insert error:', testsErr);
      }
    }

    // 3. Create appointment request for admin review
    const testNames = tests.map((t: { test_name: string }) => t.test_name).join(', ');
    const { error: apptErr } = await supabase.from('appointment_requests').insert({
      name,
      phone,
      address: address || null,
      location: location || null,
      collection_type: collection_type || 'home_collection',
      preferred_date: booking_date || now.toISOString().split('T')[0],
      requested_tests: testNames || null,
      status: 'new_request',
      notes: `Auto-created from booking portal. Patient ID: ${pid}`,
    });
    if (apptErr) console.error('[Booking] Appointment request error:', apptErr);

    // 4. Create in-app notification for admin
    const { error: notifErr } = await supabase.from('notifications').insert({
      type: 'new_patient',
      title: 'New Appointment Booked',
      message: `${name} (${pid}) booked a ${collection_type === 'home_collection' ? 'home collection' : 'lab visit'} for ${booking_date || 'today'}`,
      reference_id: patient.id,
      is_read: false,
    });
    if (notifErr) console.error('[Booking] Notification insert error:', notifErr);

    

    const appointmentDate = booking_date
      ? new Date(booking_date + 'T00:00:00').toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'To be confirmed';

    // Console log for monitoring
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                   NEW BOOKING NOTIFICATION                 ║
╠════════════════════════════════════════════════════════════╣
║ Patient: ${name.substring(0, 48).padEnd(48)}║
║ Phone:   +91 ${phone.substring(0, 47).padEnd(47)}║
║ ID:      ${pid.padEnd(50)}║
║ Date:    ${appointmentDate.substring(0, 50).padEnd(50)}║
║ Type:    ${(collection_type === 'home_collection' ? 'Home Collection' : 'Lab Visit').padEnd(50)}║
╚════════════════════════════════════════════════════════════╝`);

    return NextResponse.json({ success: true, patient_id: pid, id: patient.id }, { status: 201 });
  } catch (err) {
    console.error('[Booking] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
