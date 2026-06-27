import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  const url = new URL(req.url);
  const prefix = "/functions/v1/admin-api";
  let path = url.pathname;
  if (path.startsWith(prefix)) {
    path = path.slice(prefix.length);
  } else if (path.startsWith("/admin-api")) {
    path = path.slice("/admin-api".length);
  }
  path = path.replace(/^\/+/, "");
  const parts = path.split("/");
  const action = parts[0] || "";
  const sub = parts[1] || "";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // ── LOGIN ──
    if (action === "login" && req.method === "POST") {
      const { email } = await req.json();
      if (!email) return json({ error: "Email required" }, 400);
      const { data: user, error } = await supabase
        .from("users")
        .select("id, email, name, role, password_hash")
        .eq("email", email)
        .single();
      if (error || !user) return json({ error: "User not found" }, 401);
      return json(user);
    }

    // ── UPGRADE PASSWORD ──
    if (action === "upgrade-password" && req.method === "PATCH") {
      const { id, password_hash } = await req.json();
      if (!id || !password_hash) return json({ error: "ID and password_hash required" }, 400);
      const { error } = await supabase.from("users").update({ password_hash, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    // ── SETUP ADMIN EMAIL ──
    if (action === "setup-admin-email" && req.method === "POST") {
      const { email } = await req.json();
      if (!email) return json({ error: "Email required" }, 400);
      
      // Get or create admin user
      const { data: existingAdmin } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();

      if (existingAdmin) {
        // Update existing admin email
        const { error } = await supabase
          .from("users")
          .update({ email, updated_at: new Date().toISOString() })
          .eq("id", existingAdmin.id);
        
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true, message: "Admin email updated", admin_id: existingAdmin.id });
      } else {
        // Create new admin user
        const { data: newAdmin, error } = await supabase
          .from("users")
          .insert({
            email,
            name: "Admin",
            role: "admin",
            password_hash: "$2a$10$placeholder", // Placeholder, should be updated via proper admin setup
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) return json({ error: error.message }, 500);
        return json({ ok: true, message: "Admin user created", admin_id: newAdmin.id });
      }
    }

    // ── STATS ──
    if (action === "stats") {
      const today = new Date().toISOString().split("T")[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

      const [patientsToday, activePatients, pendingReports, reportsSent, monthlyRev, yearlyRev, homePending, newRequests, paymentsMonth] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("booking_date", today),
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("report_status", "not_uploaded").eq("status", "active"),
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("report_status", "uploaded").eq("status", "active"),
        supabase.from("patients").select("total_amount").gte("created_at", monthStart).eq("status", "active"),
        supabase.from("patients").select("total_amount").gte("created_at", yearStart).eq("status", "active"),
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("collection_type", "home_collection").in("test_status", ["booked", "collection_pending"]),
        supabase.from("appointment_requests").select("id", { count: "exact", head: true }).eq("status", "new_request"),
        supabase.from("payments").select("amount").gte("created_at", monthStart),
      ]);

      const sum = (res: any) => res.data?.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0) || 0;
      const sumPayments = (res: any) => res.data?.reduce((s: number, r: any) => s + Number(r.amount || 0), 0) || 0;

      // Outstanding amount
      const { data: outstanding } = await supabase.from("patients").select("remaining_amount").eq("status", "active").gt("remaining_amount", 0);
      const totalOutstanding = outstanding?.reduce((s, r) => s + Number(r.remaining_amount || 0), 0) || 0;

      return json({
        todays_patients: patientsToday.count || 0,
        active_patients: activePatients.count || 0,
        pending_reports: pendingReports.count || 0,
        reports_sent: reportsSent.count || 0,
        monthly_revenue: sum(monthlyRev),
        yearly_revenue: sum(yearlyRev),
        home_collections_pending: homePending.count || 0,
        new_appointment_requests: newRequests.count || 0,
        monthly_collected: sumPayments(paymentsMonth),
        total_outstanding: totalOutstanding,
      });
    }

    // ── APPOINTMENTS ──
    if (action === "appointments" && req.method === "GET") {
      const status = url.searchParams.get("status");
      let q = supabase.from("appointment_requests").select("*").order("created_at", { ascending: false });
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }

    if (action === "appointments" && req.method === "PATCH") {
      const { id, status, notes } = await req.json();
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (status) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
      const { data, error } = await supabase.from("appointment_requests").update(updates).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }

    // ── PATIENTS ──
    if (action === "patients" && req.method === "GET") {
      const search = url.searchParams.get("search");
      const status = url.searchParams.get("status");
      let q = supabase.from("patients").select("*, patient_tests(*)").order("created_at", { ascending: false });
      if (status) q = q.eq("status", status);
      if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%,patient_id.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }

    if (action === "patients" && req.method === "POST") {
      const body = await req.json();
      const { name, phone, age, gender, address, location, booking_date, collection_type, total_amount, tests } = body;
      if (!name || !phone) return json({ error: "Name and phone required" }, 400);

      const now = new Date();
      const pid = `PAT-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
      const amount = Number(total_amount || 0);

      const { data: patient, error } = await supabase.from("patients").insert({
        patient_id: pid, name, phone,
        age: age || null, gender: gender || null,
        address: address || null, location: location || null,
        booking_date: booking_date || now.toISOString().split("T")[0],
        collection_type: collection_type || "home_collection",
        total_amount: amount, amount_paid: 0, remaining_amount: amount,
        payment_status: "unpaid", test_status: "booked",
        report_status: "not_uploaded", whatsapp_status: "pending",
        status: "active",
      }).select().single();

      if (error) return json({ error: error.message }, 500);

      if (tests && Array.isArray(tests) && tests.length > 0) {
        const pts = tests.map((t: any) => ({
          patient_id: patient.id, test_id: t.test_id || null,
          test_name: t.test_name, price: Number(t.price || 0),
        }));
        await supabase.from("patient_tests").insert(pts);
      }

      // Also create an appointment request for admin to review
      const { error: aptError } = await supabase.from("appointment_requests").insert({
        name, phone, address: address || null, location: location || null,
        collection_type: collection_type || "home_collection",
        preferred_date: booking_date || new Date().toISOString().split("T")[0],
        requested_tests: tests?.map((t: any) => t.test_name).join(", ") || null,
        status: "new_request",
        notes: `Auto-converted from booking. Patient ID: ${pid}`,
      });

      if (aptError) {
        console.error("Appointment request insert failed", aptError);
      }

      const { error: notificationError } = await supabase.from("notifications").insert({
        type: "new_patient", title: "New Patient Registered",
        message: `${name} (${pid}) booked for ${collection_type || "home_collection"}`,
        reference_id: patient.id,
        is_read: false,
      });

      if (notificationError) {
        console.error("Notification insert failed", notificationError);
      }

      // Send email notification to admin
      try {
        const { data: adminUser } = await supabase
          .from("users")
          .select("email, name")
          .eq("role", "admin")
          .limit(1)
          .single();

        if (adminUser?.email) {
          const appointmentDate = booking_date ? new Date(booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'To be confirmed';
          const collectionLabel = collection_type === 'home_collection' ? 'Home Collection' : 'Lab Visit';
          
          // Log notification for admin (appears in Supabase logs)
          console.log(`
╔════════════════════════════════════════════════════════════╗
║                   NEW BOOKING NOTIFICATION                 ║
╠════════════════════════════════════════════════════════════╣
║ Patient: ${name.padEnd(43)}║
║ Phone: +91 ${phone.padEnd(47)}║
║ Email: ${adminUser.email.padEnd(47)}║
║ Date: ${appointmentDate.padEnd(48)}║
║ Type: ${collectionLabel.padEnd(48)}║
║ Patient ID: ${pid.padEnd(43)}║
╠════════════════════════════════════════════════════════════╣
║ Address: ${(address || 'Not provided').substring(0, 50).padEnd(48)}║
╚════════════════════════════════════════════════════════════╝
          `);

           else {
            console.log(`ℹ Email service not configured. Set RESEND_API_KEY to enable email notifications.`);
          }
        }
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
      }

      return json(patient);
    }

    if (action === "patients" && req.method === "PATCH") {
      const { id, ...updates } = await req.json();
      if (!id) return json({ error: "ID required" }, 400);
      updates.updated_at = new Date().toISOString();

      if (updates.total_amount !== undefined || updates.amount_paid !== undefined) {
        const { data: current } = await supabase.from("patients").select("total_amount, amount_paid").eq("id", id).single();
        if (current) {
          const total = Number(updates.total_amount ?? current.total_amount);
          const paid = Number(updates.amount_paid ?? current.amount_paid);
          updates.remaining_amount = total - paid;
          updates.payment_status = paid >= total ? "paid" : paid > 0 ? "partial" : "unpaid";
        }
      }

      const { data, error } = await supabase.from("patients").update(updates).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }

    // ── TESTS ──
    if (action === "tests" && req.method === "GET") {
      const activeOnly = url.searchParams.get("active") === "true";
      let q = supabase.from("tests").select("*").order("category");
      if (activeOnly) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }

    if (action === "tests" && req.method === "POST") {
      const body = await req.json();
      if (!body.name || body.price === undefined) return json({ error: "Name and price required" }, 400);
      const { data, error } = await supabase.from("tests").insert({
        name: body.name, description: body.description || null,
        price: Number(body.price),
        preparation_instructions: body.preparation_instructions || null,
        report_delivery_time: body.report_delivery_time || null,
        category: body.category || null,
        is_active: body.is_active !== false,
      }).select().single();
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }

    if (action === "tests" && req.method === "PATCH") {
      const { id, ...updates } = await req.json();
      if (!id) return json({ error: "ID required" }, 400);
      updates.updated_at = new Date().toISOString();
      if (updates.price !== undefined) updates.price = Number(updates.price);
      const { data, error } = await supabase.from("tests").update(updates).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }

    // ── PAYMENTS ──
    if (action === "payments" && req.method === "GET") {
      const patientId = url.searchParams.get("patient_id");
      let q = supabase.from("payments").select("*, patients(name, patient_id, phone)").order("created_at", { ascending: false });
      if (patientId) q = q.eq("patient_id", patientId);
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }

    if (action === "payments" && req.method === "POST") {
      const { patient_id, amount, payment_method, notes, received_by } = await req.json();
      if (!patient_id || !amount) return json({ error: "Patient ID and amount required" }, 400);

      const { data: payment, error } = await supabase.from("payments").insert({
        patient_id, amount: Number(amount),
        payment_method: payment_method || "cash",
        notes: notes || null, received_by: received_by || null,
      }).select().single();

      if (error) return json({ error: error.message }, 500);

      const { data: patient } = await supabase.from("patients").select("amount_paid, total_amount").eq("id", patient_id).single();
      if (patient) {
        const newPaid = Number(patient.amount_paid) + Number(amount);
        const total = Number(patient.total_amount);
        await supabase.from("patients").update({
          amount_paid: newPaid, remaining_amount: total - newPaid,
          payment_status: newPaid >= total ? "paid" : newPaid > 0 ? "partial" : "unpaid",
          updated_at: new Date().toISOString(),
        }).eq("id", patient_id);
      }

      return json(payment);
    }

    // ── REPORTS ──
    if (action === "reports") {
      // List reports for a patient
      if (req.method === "GET" && sub !== "upload-url" && sub !== "download-url") {
        const patientId = url.searchParams.get("patient_id");
        let q = supabase.from("reports").select("*").order("created_at", { ascending: false });
        if (patientId) q = q.eq("patient_id", patientId);
        const { data, error } = await q;
        if (error) return json({ error: error.message }, 500);
        return json(data);
      }

      // Generate signed upload URL
      if (sub === "upload-url" && req.method === "POST") {
        const { patient_id, file_name } = await req.json();
        if (!patient_id || !file_name) return json({ error: "patient_id and file_name required" }, 400);
        const ext = file_name.split(".").pop() || "pdf";
        const storagePath = `${patient_id}/${Date.now()}.${ext}`;
        const { data, error } = await supabase.storage.from("reports").createSignedUploadUrl(storagePath);
        if (error) return json({ error: error.message }, 500);
        return json({ signed_url: data.signedUrl, path: storagePath, token: data.token });
      }

      // Generate signed download URL
      if (sub === "download-url" && req.method === "GET") {
        const reportId = url.searchParams.get("report_id");
        if (!reportId) return json({ error: "report_id required" }, 400);
        const { data: report } = await supabase.from("reports").select("file_url").eq("id", reportId).single();
        if (!report) return json({ error: "Report not found" }, 404);
        // file_url contains the storage path
        const { data, error } = await supabase.storage.from("reports").createSignedUrl(report.file_url, 3600);
        if (error) return json({ error: error.message }, 500);
        return json({ url: data.signedUrl });
      }

      // Record a report after successful upload
      if (req.method === "POST") {
        const { patient_id, file_name, file_url, file_size } = await req.json();
        if (!patient_id || !file_name || !file_url) return json({ error: "patient_id, file_name, file_url required" }, 400);

        // Delete existing report for this patient if any
        const { data: existing } = await supabase.from("reports").select("id, file_url").eq("patient_id", patient_id);
        if (existing && existing.length > 0) {
          const paths = existing.map((r: any) => r.file_url).filter(Boolean);
          if (paths.length > 0) await supabase.storage.from("reports").remove(paths);
          await supabase.from("reports").delete().eq("patient_id", patient_id);
        }

        const { data: report, error } = await supabase.from("reports").insert({
          patient_id, file_name, file_url, file_size: file_size || null,
        }).select().single();

        if (error) return json({ error: error.message }, 500);

        // Update patient report_status
        await supabase.from("patients").update({
          report_status: "uploaded", updated_at: new Date().toISOString(),
        }).eq("id", patient_id);

        return json(report);
      }

      // Delete a report
      if (req.method === "DELETE") {
        const reportId = url.searchParams.get("id");
        if (!reportId) return json({ error: "id required" }, 400);
        const { data: report } = await supabase.from("reports").select("patient_id, file_url").eq("id", reportId).single();
        if (report?.file_url) {
          await supabase.storage.from("reports").remove([report.file_url]);
        }
        await supabase.from("reports").delete().eq("id", reportId);
        // Check if patient has other reports
        if (report?.patient_id) {
          const { data: remaining } = await supabase.from("reports").select("id").eq("patient_id", report.patient_id);
          if (!remaining || remaining.length === 0) {
            await supabase.from("patients").update({ report_status: "not_uploaded", updated_at: new Date().toISOString() }).eq("id", report.patient_id);
          }
        }
        return json({ ok: true });
      }
    }

    // ── PATIENT REPORT DOWNLOAD (public, by phone or patient_id) ──
    if (action === "patient-report" && req.method === "GET") {
      const identifier = url.searchParams.get("identifier");
      if (!identifier) return json({ error: "identifier required" }, 400);

      // Look up patient
      const { data: patient } = await supabase
        .from("patients")
        .select("id, name, report_status")
        .or(`phone.eq.${identifier},patient_id.eq.${identifier}`)
        .eq("report_status", "uploaded")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!patient) return json({ error: "No report found" }, 404);

      // Get latest report
      const { data: report } = await supabase
        .from("reports")
        .select("id, file_name, file_url, created_at")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!report) return json({ error: "No report file found" }, 404);

      // Generate signed download URL (valid 1 hour)
      const { data: signed, error } = await supabase.storage.from("reports").createSignedUrl(report.file_url, 3600);
      if (error) return json({ error: error.message }, 500);

      return json({ url: signed.signedUrl, file_name: report.file_name, patient_name: patient.name });
    }

    // ── PATIENT PAYMENTS (public, by phone or patient_id) ──
    if (action === "patient-payments" && req.method === "GET") {
      const identifier = url.searchParams.get("identifier");
      if (!identifier) return json({ error: "identifier required" }, 400);

      // Look up patient with payment details
      const { data: patient } = await supabase
        .from("patients")
        .select("id, patient_id, name, phone, total_amount, amount_paid, remaining_amount, payment_status")
        .or(`phone.eq.${identifier},patient_id.eq.${identifier}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!patient) return json({ error: "No patient found" }, 404);

      // Get all payments for this patient
      const { data: payments, error } = await supabase
        .from("payments")
        .select("id, amount, payment_method, payment_date, notes, created_at")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });

      if (error) return json({ error: error.message }, 500);

      return json({
        patient: {
          patient_id: patient.patient_id,
          name: patient.name,
          phone: patient.phone,
          total_amount: patient.total_amount,
          amount_paid: patient.amount_paid,
          remaining_amount: patient.remaining_amount,
          payment_status: patient.payment_status,
        },
        payments: payments || [],
      });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error("Admin API error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
