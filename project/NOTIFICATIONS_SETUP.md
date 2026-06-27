# Jaithra Lab - Email Notifications Setup Guide

## Current Status
✅ Your email `pranavkothakunta@gmail.com` has been linked to the admin account
✅ Bookings are being logged to the console (server logs)
⏳ Email notifications can be enabled by adding an API key

## How Notifications Work

### Without Email Service (Current)
- When a patient books an appointment, the system logs a notification in the server console
- You can monitor the terminal where you ran `npm run dev` to see bookings in real-time
- All booking data is stored in the database

### With Email Service (Optional)
- Get real-time email notifications at pranavkothakunta@gmail.com
- Requires a free API key from Resend, SendGrid, or similar service

## Setup Email Notifications

### Option 1: Use Resend (Recommended - Free)

1. Go to https://resend.com and sign up for a free account
2. Get your API key from the dashboard
3. Create a `.env.local` file in the project folder with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

4. Restart the dev server: `npm run dev`
5. Now when a patient books, you'll get an email at pranavkothakunta@gmail.com

### Option 2: Use SendGrid

Similar to Resend - get an API key and set `SENDGRID_API_KEY` in `.env.local`

## How to Test Bookings

1. Go to http://localhost:3002/book
2. Fill in and submit a test booking
3. Check the terminal where `npm run dev` is running
4. You should see a formatted notification like:

```
╔════════════════════════════════════════════════════════════╗
║                   NEW BOOKING NOTIFICATION                 ║
╠════════════════════════════════════════════════════════════╣
║ Patient: John Doe                                           ║
║ Phone: +91 9876543210                                       ║
║ Email: pranavkothakunta@gmail.com                          ║
║ Date: 26 June 2026                                         ║
║ Type: Home Collection                                      ║
║ Patient ID: PAT-20260626-ABCD                              ║
╚════════════════════════════════════════════════════════════╝
```

## Database Notifications

All bookings are also stored in the `patients` table in Supabase. You can:
1. Log in to your Supabase dashboard
2. Navigate to the `patients` table
3. See all bookings with full details
4. Track status changes

## Troubleshooting

### "Email notification (no service configured)" in logs
- This means no API key is set
- Add RESEND_API_KEY to .env.local and restart

### Still not seeing notifications?
1. Verify Supabase connection is working
2. Check that the booking form submission succeeds (should show success message)
3. Check the admin dashboard at http://localhost:3002/admin/login
4. Contact support with the exact error message from the console

## Next Steps

- ✅ Bookings are being recorded
- ⏳ Add email service API key for email notifications
- 📊 Monitor bookings in the admin dashboard
- 📞 Respond to booking requests and update status
