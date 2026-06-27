import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

async function sendAdminEmail(booking: any) {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!adminEmail || !resendApiKey) return;

  const html = `
    <h2>New Appointment Request</h2>
    <p><strong>Patient Name:</strong> ${booking.name}</p>
    <p><strong>Phone:</strong> ${booking.phone}</p>
    <p><strong>Age:</strong> ${booking.age || 'N/A'}</p>
    <p><strong>Gender:</strong> ${booking.gender || 'N/A'}</p>
    <p><strong>Collection Type:</strong> ${booking.collection_type}</p>
    <p><strong>Date:</strong> ${booking.booking_date}</p>
    <p><strong>Tests:</strong> ${booking.tests.length ? booking.tests.map((t:any) => t.test_name).join(', ') : 'None specified'}</p>
    <br>
    <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.replace('.supabase.co', '') : 'https://jaithra-lab.vercel.app'}/admin/dashboard">View in Dashboard</a>
  `;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Jaithra Diagnostics <onboarding@resend.dev>',
        to: adminEmail,
        subject: `New Booking: ${booking.name}`,
        html: html
      })
    });
  } catch (err) {
    console.error('Email send failed:', err);
  }
}

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

    // 1. Strict Validation
    if (!name?.trim() || !phone?.trim() || !booking_date || !collection_type) {
      return NextResponse.json({ error: 'Name, phone, date, and collection type are required' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const testNames = Array.isArray(tests) ? tests.map((t: { test_name: string }) => t.test_name).filter(Boolean).join(', ') : '';

    // 2. Create appointment request for admin review
    const { data: request, error: apptErr } = await supabase.from('appointment_requests').insert({
      name,
      phone,
      address: address || null,
      location: location || null,
      collection_type: collection_type,
      preferred_date: booking_date,
      requested_tests: testNames || null,
      status: 'new_request',
      notes: `Auto-created from booking portal. Age: ${age || 'N/A'}, Gender: ${gender || 'N/A'}`,
    }).select().single();

    if (apptErr || !request) {
      console.error('[Booking] Appointment request error:', apptErr);
      return NextResponse.json({ error: 'Failed to create appointment request' }, { status: 500 });
    }

    // 3. Create in-app notification for admin
    const { error: notifErr } = await supabase.from('notifications').insert({
      type: 'new_patient',
      title: 'New Appointment Booked',
      message: `${name} requested a ${collection_type === 'home_collection' ? 'home collection' : 'lab visit'} for ${booking_date}`,
      reference_id: request.id,
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
║ ID:      ${request.id.padEnd(50)}║
║ Date:    ${appointmentDate.substring(0, 50).padEnd(50)}║
║ Type:    ${(collection_type === 'home_collection' ? 'Home Collection' : 'Lab Visit').padEnd(50)}║
╚════════════════════════════════════════════════════════════╝`);

    // 4. Send email notification to Admin
    await sendAdminEmail(body);

    return NextResponse.json({ success: true, patient_id: request.id, id: request.id }, { status: 201 });
  } catch (err) {
    console.error('[Booking] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
