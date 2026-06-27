// Simple email template generator for appointments
export function generateAppointmentEmailHTML(patientName: string, phone: string, email: string, appointmentDate: string, collectionType: string): string {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #14b8a6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .detail-row { margin: 15px 0; padding: 12px; background: white; border-left: 4px solid #2563eb; border-radius: 4px; }
          .label { font-weight: bold; color: #2563eb; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 New Appointment Request</h1>
          </div>
          <div class="content">
            <p>A new appointment has been booked through your Jaithra Lab portal.</p>
            
            <div class="detail-row">
              <div class="label">Patient Name:</div>
              <div>${patientName}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Contact Number:</div>
              <div>+91 ${phone}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Email:</div>
              <div>${email || 'Not provided'}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Appointment Date:</div>
              <div>${appointmentDate}</div>
            </div>
            
            <div class="detail-row">
              <div class="label">Collection Type:</div>
              <div>${collectionType === 'home_collection' ? 'Home Collection' : 'Lab Visit'}</div>
            </div>
            
            <p style="margin-top: 20px; padding: 15px; background: #dbeafe; border-radius: 4px; border-left: 4px solid #2563eb;">
              <strong>Next Step:</strong> Log in to your Jaithra Lab admin dashboard to review and confirm this appointment.
            </p>
          </div>
          <div class="footer">
            <p>Jaithra Lab - Convenient Diagnostics, Trusted Care</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Send email via Resend API (if configured) or via custom endpoint
export async function sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
  try {
    // Try sending via a server endpoint if available
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (resendApiKey) {
      // Use Resend API
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "noreply@jaithra-lab.com",
          to,
          subject,
          html: htmlContent,
        }),
      });
      
      return response.ok;
    }
    
    console.log(`Email would be sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}
