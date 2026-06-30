import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { appointmentId } = await req.json();
    if (!appointmentId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const supabase = createSupabaseAdmin();

    // 1. Fetch appointment details and test catalog
    const [
      { data: apt, error: fetchErr },
      { data: allTests }
    ] = await Promise.all([
      supabase.from('appointment_requests').select('*').eq('id', appointmentId).single(),
      supabase.from('tests').select('*')
    ]);

    if (fetchErr || !apt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (apt.status === 'converted') {
      return NextResponse.json({ error: 'Appointment is already converted' }, { status: 400 });
    }

    // 2. Map requested tests and calculate total
    let totalAmount = 0;
    const testsArray: any[] = [];
    
    if (apt.requested_tests) {
      const testNames = apt.requested_tests.split(',').map((t: string) => t.trim()).filter(Boolean);
      for (const name of testNames) {
        const catalogTest = allTests?.find((t: any) => t.name.toLowerCase() === name.toLowerCase());
        const price = catalogTest ? Number(catalogTest.price || 0) : 0;
        totalAmount += price;
        testsArray.push({ test_name: name, price });
      }
    }

    // 3. Generate Patient ID
    const now = new Date();
    const pid = `PAT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 4. Insert Patient
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
        total_amount: totalAmount,
        amount_paid: 0,
        remaining_amount: totalAmount,
        payment_status: 'unpaid',
        test_status: 'booked',
        report_status: 'not_uploaded',
        whatsapp_status: 'pending',
        status: 'active',
      })
      .select()
      .single();

    if (patientErr || !patient) throw patientErr;

    // 5. Insert Tests
    if (testsArray.length > 0) {
      const dbTestsArray = testsArray.map(t => ({
        patient_id: patient.id,
        test_name: t.test_name,
        price: t.price,
      }));
      await supabase.from('patient_tests').insert(dbTestsArray);
    }

    // 6. Update Appointment Status
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
