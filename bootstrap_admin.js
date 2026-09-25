import { createClient } from '@supabase/supabase-js';
process.loadEnvFile('.env');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const bootstrapSecret = 'StartX-Admin-Bootstrap-2026'; // from backend/.env

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function bootstrapAdmin() {
  const email = 'admin@act.edu';
  const password = 'AdminPassword123!';
  
  console.log(`1. Signing up/logging in ${email}...`);
  let { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: 'College Administrator' }
    }
  });

  if (error && error.message.includes('already registered')) {
    console.log('User already exists. Logging in...');
    const loginRes = await supabase.auth.signInWithPassword({ email, password });
    data = loginRes.data;
    error = loginRes.error;
  }

  if (error) {
    console.error('Supabase auth failed:', error.message);
    return;
  }

  const token = data.session?.access_token;
  if (!token) {
    console.error('No access token received.');
    return;
  }

  console.log(`2. Calling backend bootstrap API...`);
  try {
    const res = await fetch('http://localhost:8080/api/v1/admin/bootstrap', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Bootstrap-Secret': bootstrapSecret,
        'Content-Type': 'application/json'
      }
    });

    const body = await res.json();
    console.log(`Backend response [${res.status}]:`, body);
  } catch (err) {
    console.error('Backend request failed:', err);
  }
}

bootstrapAdmin();
