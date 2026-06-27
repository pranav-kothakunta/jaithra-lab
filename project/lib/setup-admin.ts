import { supabase } from '@/lib/supabase/client';

const ADMIN_EMAIL = 'pranavkothakunta@gmail.com';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function setupAdminEmail() {
  try {
    // Call the edge function to setup/update admin email
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-api/setup-admin-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
      }),
    });

    const data = await response.json();
    console.log('Admin email setup result:', data);
    return response.ok;
  } catch (error) {
    console.error('Error setting up admin email:', error);
    return false;
  }
}
