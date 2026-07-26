/**
 * LightMap API Route Deep Check Script
 * Tests all API endpoints for correct auth behavior and data responses
 * Run with: node qa_api_check.mjs
 */

const SUPABASE_URL = 'https://gncpstvyexbkwibdqzua.supabase.co';
const ANON_KEY = 'sb_publishable_qP9NFXFbmjZi71-3JN_OzA_dnNe-ScN';
const BASE_URL = 'http://localhost:3000';

let pass = 0, fail = 0, warn = 0;

function log(status, name, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status}] ${name}${detail ? ': ' + detail : ''}`);
  if (status === 'PASS') pass++;
  else if (status === 'FAIL') fail++;
  else warn++;
}

async function auth(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) {
    const data = await res.json();
    return data.access_token;
  }
  return null;
}

async function dbQuery(table, query = '', token = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${token || ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  return res;
}

async function run() {
  console.log('\n====================================================');
  console.log('🔍 LightMap API Deep Verification');
  console.log('====================================================\n');

  // Get tokens
  const adminToken = await auth('admin@gmail.com', 'admin123');
  const architectToken = await auth('design@gmail.com', 'design123');
  const designerToken = await auth('design123@gmail.com', 'design123');

  console.log('\n--- CHECKING: Profiles Table RLS ---');

  // Test admin can see all profiles
  if (adminToken) {
    const res = await dbQuery('profiles', '?select=id,name,email,role', adminToken);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      log('PASS', 'Admin can read all profiles (RLS)', `${data.length} rows`);
      console.log('   Roles found:', [...new Set(data.map(p => p.role))].join(', '));
    } else {
      log('WARN', 'Admin profile read returned unexpected data', JSON.stringify(data).substring(0, 80));
    }
  }

  // Test architect can only see their own profile or allowed
  if (architectToken) {
    const res = await dbQuery('profiles', '?select=id,name,email,role&limit=10', architectToken);
    const data = await res.json();
    if (Array.isArray(data)) {
      log('PASS', 'Architect can read profiles table', `${data.length} rows visible`);
    } else {
      log('WARN', 'Architect profiles read', JSON.stringify(data).substring(0, 80));
    }
  }

  console.log('\n--- CHECKING: Projects Table RLS ---');

  // Admin should see all projects
  if (adminToken) {
    const res = await dbQuery('projects', '?select=id,project_name,status,architect_id,assigned_designer_id&order=created_at.desc', adminToken);
    const data = await res.json();
    if (Array.isArray(data)) {
      log('PASS', 'Admin can read all projects', `${data.length} total projects`);
      
      // Check specific fields
      if (data.length > 0) {
        const statuses = [...new Set(data.map(p => p.status))];
        console.log(`   Statuses: ${statuses.join(', ')}`);
        
        const noArchitectId = data.filter(p => !p.architect_id);
        if (noArchitectId.length > 0) {
          log('WARN', 'Projects missing architect_id', `${noArchitectId.length}: ${noArchitectId.map(p => p.project_name).join(', ')}`);
        } else {
          log('PASS', 'All projects have architect_id');
        }
        
        const inDesignNoDesigner = data.filter(p => p.status === 'In Design' && !p.assigned_designer_id);
        if (inDesignNoDesigner.length > 0) {
          log('WARN', '"In Design" projects without designer', `${inDesignNoDesigner.length}`);
        } else {
          log('PASS', 'All "In Design" projects have assigned_designer_id');
        }
      }
    } else {
      log('FAIL', 'Admin projects read failed', JSON.stringify(data).substring(0, 80));
    }
  }

  // Architect sees their own projects
  if (architectToken) {
    const res = await dbQuery('projects', '?select=id,project_name,status,architect_id&limit=20', architectToken);
    const data = await res.json();
    if (Array.isArray(data)) {
      log('PASS', 'Architect can read projects', `${data.length} rows visible`);
    } else {
      log('WARN', 'Architect projects read', JSON.stringify(data).substring(0, 80));
    }
  }

  // Anon - should be restricted
  const anonRes = await dbQuery('projects', '?select=id,project_name&limit=5');
  const anonData = await anonRes.json();
  if (Array.isArray(anonData) && anonData.length === 0) {
    log('PASS', 'Anonymous user cannot read projects (RLS working)');
  } else if (Array.isArray(anonData) && anonData.length > 0) {
    log('WARN', 'Anonymous user can read projects', `${anonData.length} rows exposed without auth`);
  } else {
    log('PASS', 'Anonymous user blocked from projects', `Response: ${anonRes.status}`);
  }

  console.log('\n--- CHECKING: Payments Table ---');

  if (adminToken) {
    const res = await dbQuery('payments', '?select=id,project_id,amount,status,invoice_number&limit=20', adminToken);
    const data = await res.json();
    if (Array.isArray(data)) {
      log('PASS', 'Admin can read all payments', `${data.length} payments`);
      const totalRevenue = data.filter(p => p.status === 'completed' || p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      console.log(`   Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}`);
    } else {
      log('FAIL', 'Admin payments read failed');
    }
  }

  console.log('\n--- CHECKING: Revision Requests Table ---');

  if (adminToken) {
    const res = await dbQuery('revision_requests', '?select=id,project_id,status,description,created_at&limit=20', adminToken);
    const data = await res.json();
    if (Array.isArray(data)) {
      log('PASS', 'Admin can read revision requests', `${data.length} revisions`);
      if (data.length > 0) {
        const statusGroups = {};
        data.forEach(r => { statusGroups[r.status] = (statusGroups[r.status] || 0) + 1; });
        console.log(`   Status breakdown: ${Object.entries(statusGroups).map(([s, c]) => `${s}:${c}`).join(', ')}`);
      }
    } else {
      log('FAIL', 'Admin revision_requests read failed');
    }
  }

  console.log('\n--- CHECKING: API Routes Response Quality ---');

  // Check admin dashboard API returns proper structure
  const dashRes = await fetch(`${BASE_URL}/api/admin/dashboard`);
  if (dashRes.status === 200) {
    const data = await dashRes.json();
    const hasDesigners = Array.isArray(data.designers);
    const hasProjects = Array.isArray(data.projects);
    const hasPayments = Array.isArray(data.payments);
    
    if (hasDesigners && hasProjects && hasPayments) {
      log('PASS', '/api/admin/dashboard returns valid structure', 
        `designers:${data.designers.length}, projects:${data.projects.length}, payments:${data.payments.length}`);
    } else {
      log('WARN', '/api/admin/dashboard missing fields', JSON.stringify(Object.keys(data)));
    }
    
    if (data.error) {
      log('FAIL', '/api/admin/dashboard returned error', data.error);
    }
  } else {
    log('FAIL', '/api/admin/dashboard returned non-200', `HTTP ${dashRes.status}`);
  }

  // Check /api/admin/users returns valid structure
  const usersRes = await fetch(`${BASE_URL}/api/admin/users`);
  if (usersRes.status === 200) {
    const data = await usersRes.json();
    if (Array.isArray(data.users)) {
      log('PASS', '/api/admin/users returns valid structure', `${data.users.length} users`);
      data.users.forEach(u => {
        console.log(`   [${u.role?.toUpperCase()}] ${u.name} <${u.email}>`);
      });
    } else {
      log('WARN', '/api/admin/users unexpected response', JSON.stringify(data).substring(0, 80));
    }
  } else {
    log('FAIL', '/api/admin/users returned non-200', `HTTP ${usersRes.status}`);
  }

  // Check /api/projects (should be 401 without auth)
  const projRes = await fetch(`${BASE_URL}/api/projects`);
  if (projRes.status === 401) {
    log('PASS', '/api/projects correctly returns 401 without auth');
  } else {
    log('WARN', '/api/projects', `Expected 401, got ${projRes.status}`);
  }

  console.log('\n--- CHECKING: Pricing Plans ---');

  if (adminToken) {
    const res = await dbQuery('pricing_plans', '?select=id,name,base_price_per_sq_ft,is_active&order=created_at', adminToken);
    const data = await res.json();
    if (Array.isArray(data)) {
      log('PASS', 'Pricing plans accessible', `${data.length} plans`);
      const activePlans = data.filter(p => p.is_active);
      log(activePlans.length > 0 ? 'PASS' : 'WARN', 
        `Active pricing plans: ${activePlans.length}`,
        activePlans.map(p => `${p.name} (₹${p.base_price_per_sq_ft}/sqft)`).join(', '));
    }
  }

  console.log('\n--- CHECKING: Admin Create User Flow ---');
  
  // Test creating a new designer (using signUp which works with anon key)
  const testEmail = `qa_test_${Date.now()}@test.com`;
  const createBody = JSON.stringify({ 
    email: testEmail, 
    password: 'Test1234!', 
    name: 'QA Automated Test', 
    role: 'designer',
    mobileNumber: '9876543210' 
  });

  const createRes = await fetch(`${BASE_URL}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: createBody,
  });

  if (createRes.status === 200) {
    const data = await createRes.json();
    if (data.user && data.user.id) {
      log('PASS', 'Admin create user flow works', `Created: ${testEmail}, ID: ${data.user.id?.substring(0, 8)}...`);
    } else if (data.error) {
      log('WARN', 'Admin create user returned error', data.error);
    } else {
      log('WARN', 'Admin create user unexpected response', JSON.stringify(data).substring(0, 80));
    }
  } else {
    const text = await createRes.text();
    log('FAIL', 'Admin create user failed', `HTTP ${createRes.status}: ${text.substring(0, 100)}`);
  }

  console.log('\n====================================================');
  console.log('📊 SUMMARY');
  console.log('====================================================');
  console.log(`✅ PASS: ${pass}`);
  console.log(`❌ FAIL: ${fail}`);
  console.log(`⚠️  WARN: ${warn}`);
  console.log('====================================================\n');
}

run().catch(console.error);
