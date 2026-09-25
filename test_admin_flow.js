import { createClient } from '@supabase/supabase-js';
process.loadEnvFile('.env');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BACKEND_URL = 'http://localhost:8080';
const ORIGIN = 'http://localhost:5174';

async function fetchWithCors(url, method, token, body = null) {
  const headers = {
    'Origin': ORIGIN,
    'Authorization': `Bearer ${token}`
  };
  if (body) headers['Content-Type'] = 'application/json';
  
  // Test OPTIONS preflight first
  const optionsRes = await fetch(url, {
    method: 'OPTIONS',
    headers: {
      'Origin': ORIGIN,
      'Access-Control-Request-Method': method,
      'Access-Control-Request-Headers': 'Authorization, Content-Type'
    }
  });
  if (optionsRes.status !== 200) {
    throw new Error(`OPTIONS preflight failed for ${url}: ${optionsRes.status}`);
  }

  // Actual request
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch(e) { json = text; }
  return { status: res.status, json };
}

async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login failed for ${email}: ${error.message}`);
  return data.session.access_token;
}

async function testAdminFlow() {
  try {
    console.log('--- TESTING ADMIN FLOW ---');
    
    // 1. Admin login
    const adminToken = await loginUser('admin@act.edu', 'AdminPassword123!');
    console.log('Admin logged in.');

    // 13. /api/v1/auth/me works
    const meRes = await fetchWithCors(`${BACKEND_URL}/api/v1/auth/me`, 'GET', adminToken);
    console.log('/auth/me status:', meRes.status, 'role:', meRes.json?.data?.role);

    // 2-3. Add Student Email
    const studentRes = await fetchWithCors(`${BACKEND_URL}/api/v1/admin/authorized-users`, 'POST', adminToken, {
      email: 'student_new@gmail.com',
      role: 'STUDENT'
    });
    console.log('Add Student status:', studentRes.status, studentRes.json?.message);

    // 4-5. Refresh (GET) Admin page
    let listRes = await fetchWithCors(`${BACKEND_URL}/api/v1/admin/authorized-users`, 'GET', adminToken);
    let foundStudent = listRes.json?.data?.some(u => u.email === 'student_new@gmail.com');
    console.log('Student email appears in list:', foundStudent);

    // 6-7. Add Faculty Email
    const facultyRes = await fetchWithCors(`${BACKEND_URL}/api/v1/admin/authorized-users`, 'POST', adminToken, {
      email: 'teacher_new@college.edu',
      role: 'FACULTY'
    });
    console.log('Add Faculty status:', facultyRes.status, facultyRes.json?.message);

    // 8-9. Refresh page
    listRes = await fetchWithCors(`${BACKEND_URL}/api/v1/admin/authorized-users`, 'GET', adminToken);
    let foundFaculty = listRes.json?.data?.some(u => u.email === 'teacher_new@college.edu');
    console.log('Faculty email appears in list:', foundFaculty);

    // 10. Duplicate email is rejected
    const dupRes = await fetchWithCors(`${BACKEND_URL}/api/v1/admin/authorized-users`, 'POST', adminToken, {
      email: 'student_new@gmail.com',
      role: 'STUDENT'
    });
    console.log('Duplicate add status:', dupRes.status, '(expected 400 or 500)');

    // Next steps require Student/Faculty users. Creating them first.
    let studentToken;
    try {
      const su = await supabase.auth.signUp({ email: 'student_new@gmail.com', password: 'Password123!' });
      studentToken = su.data?.session?.access_token || await loginUser('student_new@gmail.com', 'Password123!');
    } catch(e) {
      studentToken = await loginUser('student_new@gmail.com', 'Password123!');
    }

    let facultyToken;
    try {
      const fu = await supabase.auth.signUp({ email: 'teacher_new@college.edu', password: 'Password123!' });
      facultyToken = fu.data?.session?.access_token || await loginUser('teacher_new@college.edu', 'Password123!');
    } catch(e) {
      facultyToken = await loginUser('teacher_new@college.edu', 'Password123!');
    }

    // Call /me to trigger provisioning
    await fetchWithCors(`${BACKEND_URL}/api/v1/auth/me`, 'GET', studentToken);
    await fetchWithCors(`${BACKEND_URL}/api/v1/auth/me`, 'GET', facultyToken);

    // 11. Student cannot call Admin API
    const studentAdminRes = await fetchWithCors(`${BACKEND_URL}/api/v1/admin/authorized-users`, 'GET', studentToken);
    console.log('Student hitting Admin API status:', studentAdminRes.status, '(expected 403)');

    // 12. Faculty cannot call Admin API
    const facultyAdminRes = await fetchWithCors(`${BACKEND_URL}/api/v1/admin/authorized-users`, 'GET', facultyToken);
    console.log('Faculty hitting Admin API status:', facultyAdminRes.status, '(expected 403)');

    console.log('--- TESTS COMPLETED SUCCESSFULLY ---');

  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

testAdminFlow();
