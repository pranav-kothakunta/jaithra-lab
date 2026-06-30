import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

// POST: Upload report (receives file as FormData)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const patientId = formData.get('patient_id') as string | null;

    if (!file || !patientId) {
      return NextResponse.json({ error: 'file and patient_id are required' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    // 1. Ensure storage bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const reportsBucket = buckets?.find((b: any) => b.name === 'reports');
    if (!reportsBucket) {
      const { error: bucketErr } = await supabase.storage.createBucket('reports', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf'],
      });
      if (bucketErr && !bucketErr.message.includes('already exists')) {
        console.error('Bucket creation error:', bucketErr);
        return NextResponse.json({ error: 'Failed to create storage bucket' }, { status: 500 });
      }
    }

    // 2. Upload file to Supabase Storage
    const ext = file.name.split('.').pop() || 'pdf';
    const storagePath = `${patientId}/${Date.now()}.${ext}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadErr } = await supabase.storage
      .from('reports')
      .upload(storagePath, fileBuffer, {
        contentType: file.type || 'application/pdf',
        upsert: true,
      });

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr);
      return NextResponse.json({ error: 'File upload failed: ' + uploadErr.message }, { status: 500 });
    }

    // 3. Delete any existing report records for this patient
    const { data: existing } = await supabase
      .from('reports')
      .select('id, file_url')
      .eq('patient_id', patientId);

    if (existing && existing.length > 0) {
      const oldPaths = existing.map((r: any) => r.file_url).filter(Boolean);
      if (oldPaths.length > 0) {
        await supabase.storage.from('reports').remove(oldPaths);
      }
      await supabase.from('reports').delete().eq('patient_id', patientId);
    }

    // 4. Insert new report record
    const { data: report, error: dbErr } = await supabase
      .from('reports')
      .insert({
        patient_id: patientId,
        file_name: file.name,
        file_url: storagePath,
        file_size: file.size || null,
      })
      .select()
      .single();

    if (dbErr) {
      console.error('Report DB insert error:', dbErr);
      return NextResponse.json({ error: 'Failed to save report record' }, { status: 500 });
    }

    // 5. Update patient report_status
    await supabase
      .from('patients')
      .update({
        report_status: 'uploaded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', patientId);

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    console.error('Report upload error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
