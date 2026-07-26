/**
 * LightMap Full QA Test Script
 * Tests all API endpoints and database tables using Supabase REST API
 * Run with: node qa_test.mjs
 */

const SUPABASE_URL = 'https://gncpstvyexbkwibdqzua.supabase.co';
const ANON_KEY = 'sb_publishable_qP9NFXFbmjZi71-3JN_OzA_dnNe-ScN';
const BASE_URL = 'http://localhost:3000';

// Test credentials
const CREDENTIALS = {
  admin: { email: 'admin@gmail.com', password: 'admin123' },
  architect: { email: 'design@gmail.com', password: 'design123' },
  designer: { email: 'design123@gmail.com', password: 'design123' },
};

const results = [];
let passCount = 0;
let failCount = 0;
let warnCount = 0;

function log(status, testName, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status}] ${testName}${detail ? ': ' + detail : ''}`);
  results.push({ status, testName, detail });
  if (status === 'PASS') passCount++;
  else if (status === 'FAIL') failCount++;
  else warnCount++;
}

async function supabaseRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
}

async function supabaseAuth(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response;
}

async function appRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return response;
  } catch (err) {
    return null;
  }
}

// ============================================================
// TEST SUITE
// ============================================================

async function runTests() {
  console.log('\n====================================================');
  console.log('🧪 LightMap Full QA Test Suite');
  console.log('====================================================\n');

  // -----------------------------------------------------------
  // 1. CONNECTIVITY CHECKS
  // -----------------------------------------------------------
  console.log('\n--- SECTION 1: Connectivity ---');

  // Check app is running
  try {
    const appRes = await appRequest('/');
    if (appRes && appRes.status === 200) {
      log('PASS', 'App is running at localhost:3000', `HTTP ${appRes.status}`);
    } else {
      log('FAIL', 'App connectivity', appRes ? `HTTP ${appRes.status}` : 'No response');
    }
  } catch (e) {
    log('FAIL', 'App connectivity', e.message);
  }

  // Check login page
  try {
    const loginRes = await appRequest('/login');
    if (loginRes && loginRes.status === 200) {
      log('PASS', 'Login page loads', `HTTP ${loginRes.status}`);
    } else {
      log('FAIL', 'Login page', `HTTP ${loginRes?.status}`);
    }
  } catch (e) {
    log('FAIL', 'Login page', e.message);
  }

  // Check Supabase connectivity
  try {
    const sbRes = await supabaseRequest('profiles?select=count&limit=1');
    if (sbRes.status === 200 || sbRes.status === 206) {
      log('PASS', 'Supabase DB connectivity', `HTTP ${sbRes.status}`);
    } else {
      const text = await sbRes.text();
      log('FAIL', 'Supabase DB connectivity', `HTTP ${sbRes.status}: ${text.substring(0, 100)}`);
    }
  } catch (e) {
    log('FAIL', 'Supabase DB connectivity', e.message);
  }

  // -----------------------------------------------------------
  // 2. AUTHENTICATION TESTS
  // -----------------------------------------------------------
  console.log('\n--- SECTION 2: Authentication ---');

  let adminToken = null;
  let architectToken = null;
  let designerToken = null;
  let adminUserId = null;

  // Admin login
  try {
    const res = await supabaseAuth(CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    if (res.status === 200) {
      const data = await res.json();
      adminToken = data.access_token;
      adminUserId = data.user?.id;
      log('PASS', 'Admin login', `User ID: ${data.user?.id?.substring(0, 8)}...`);
    } else {
      const data = await res.json();
      log('FAIL', 'Admin login', data.error_description || data.msg || `HTTP ${res.status}`);
    }
  } catch (e) {
    log('FAIL', 'Admin login', e.message);
  }

  // Architect login
  try {
    const res = await supabaseAuth(CREDENTIALS.architect.email, CREDENTIALS.architect.password);
    if (res.status === 200) {
      const data = await res.json();
      architectToken = data.access_token;
      log('PASS', 'Architect login', `User ID: ${data.user?.id?.substring(0, 8)}...`);
    } else {
      const data = await res.json();
      log('FAIL', 'Architect login', data.error_description || data.msg || `HTTP ${res.status}`);
    }
  } catch (e) {
    log('FAIL', 'Architect login', e.message);
  }

  // Designer login
  try {
    const res = await supabaseAuth(CREDENTIALS.designer.email, CREDENTIALS.designer.password);
    if (res.status === 200) {
      const data = await res.json();
      designerToken = data.access_token;
      log('PASS', 'Designer login', `User ID: ${data.user?.id?.substring(0, 8)}...`);
    } else {
      const data = await res.json();
      log('FAIL', 'Designer login', data.error_description || data.msg || `HTTP ${res.status}`);
    }
  } catch (e) {
    log('FAIL', 'Designer login', e.message);
  }

  // Invalid credentials test
  try {
    const res = await supabaseAuth('fake@fake.com', 'wrongpassword');
    if (res.status !== 200) {
      log('PASS', 'Invalid credentials rejected', `HTTP ${res.status}`);
    } else {
      log('FAIL', 'Invalid credentials should be rejected but returned 200');
    }
  } catch (e) {
    log('PASS', 'Invalid credentials rejected', 'Connection error as expected');
  }

  // -----------------------------------------------------------
  // 3. DATABASE TABLE CHECKS
  // -----------------------------------------------------------
  console.log('\n--- SECTION 3: Database Tables ---');

  const tables = ['profiles', 'projects', 'payments', 'revision_requests', 'pricing_plans'];

  for (const table of tables) {
    try {
      const res = await supabaseRequest(`${table}?select=*&limit=5`, {
        headers: adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {},
      });
      if (res.status === 200) {
        const data = await res.json();
        log('PASS', `Table: ${table} exists`, `${data.length} rows returned`);
      } else {
        const text = await res.text();
        log('FAIL', `Table: ${table}`, `HTTP ${res.status}: ${text.substring(0, 80)}`);
      }
    } catch (e) {
      log('FAIL', `Table: ${table}`, e.message);
    }
  }

  // -----------------------------------------------------------
  // 4. ROLE VERIFICATION IN PROFILES TABLE
  // -----------------------------------------------------------
  console.log('\n--- SECTION 4: Role Data in Profiles Table ---');

  if (adminToken) {
    try {
      const res = await supabaseRequest('profiles?select=id,name,email,role&order=role', {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      if (res.status === 200) {
        const profiles = await res.json();
        const admins = profiles.filter(p => p.role === 'admin');
        const architects = profiles.filter(p => p.role === 'architect');
        const designers = profiles.filter(p => p.role === 'designer');

        console.log(`\n  📊 Profiles Summary:`);
        console.log(`     Admins: ${admins.length}`);
        console.log(`     Architects: ${architects.length}`);
        console.log(`     Designers: ${designers.length}`);
        console.log(`     Total: ${profiles.length}`);

        if (admins.length > 0) log('PASS', 'Admin profiles exist in DB', `Count: ${admins.length}`);
        else log('FAIL', 'No admin profiles found in DB');

        if (architects.length > 0) log('PASS', 'Architect profiles exist in DB', `Count: ${architects.length}`);
        else log('WARN', 'No architect profiles found in DB');

        if (designers.length > 0) log('PASS', 'Designer profiles exist in DB', `Count: ${designers.length}`);
        else log('WARN', 'No designer profiles found in DB');

        // Print profile details
        console.log('\n  📋 Profiles:');
        profiles.forEach(p => {
          console.log(`     [${p.role?.toUpperCase()}] ${p.name} <${p.email}>`);
        });
      } else {
        const text = await res.text();
        log('FAIL', 'Fetch profiles', `HTTP ${res.status}: ${text.substring(0, 80)}`);
      }
    } catch (e) {
      log('FAIL', 'Fetch profiles', e.message);
    }
  }

  // -----------------------------------------------------------
  // 5. PROJECTS TABLE CHECKS
  // -----------------------------------------------------------
  console.log('\n--- SECTION 5: Projects Table ---');

  if (adminToken) {
    try {
      const res = await supabaseRequest('projects?select=id,project_id_serial,project_name,client_name,status,payment_status,area_sq_ft,created_at&order=created_at.desc&limit=20', {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      if (res.status === 200) {
        const projects = await res.json();
        log('PASS', 'Projects table accessible', `${projects.length} projects found`);

        if (projects.length > 0) {
          // Check status distribution
          const statusCounts = {};
          projects.forEach(p => {
            statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
          });
          console.log('\n  📊 Project Status Distribution:');
          Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`     ${status}: ${count}`);
          });

          // Check payment_status
          const paymentCounts = {};
          projects.forEach(p => {
            paymentCounts[p.payment_status] = (paymentCounts[p.payment_status] || 0) + 1;
          });
          console.log('\n  💰 Payment Status Distribution:');
          Object.entries(paymentCounts).forEach(([status, count]) => {
            console.log(`     ${status}: ${count}`);
          });

          // List projects
          console.log('\n  📋 Recent Projects:');
          projects.slice(0, 10).forEach(p => {
            console.log(`     [${p.project_id_serial || 'N/A'}] ${p.project_name} | ${p.status} | ${p.payment_status || 'N/A'}`);
          });
        } else {
          log('WARN', 'Projects table is empty', 'No projects in database');
        }

        // Test required fields exist
        if (projects.length > 0) {
          const p = projects[0];
          const requiredFields = ['id', 'project_name', 'client_name', 'status'];
          const missingFields = requiredFields.filter(f => p[f] === undefined);
          if (missingFields.length === 0) {
            log('PASS', 'Projects have required fields', `project_name, client_name, status all present`);
          } else {
            log('FAIL', 'Projects missing required fields', missingFields.join(', '));
          }
        }
      } else {
        const text = await res.text();
        log('FAIL', 'Projects table', `HTTP ${res.status}: ${text.substring(0, 80)}`);
      }
    } catch (e) {
      log('FAIL', 'Projects table', e.message);
    }
  }

  // -----------------------------------------------------------
  // 6. PAYMENTS TABLE CHECKS
  // -----------------------------------------------------------
  console.log('\n--- SECTION 6: Payments Table ---');

  if (adminToken) {
    try {
      const res = await supabaseRequest('payments?select=id,project_id,amount,status,invoice_number,created_at&order=created_at.desc&limit=20', {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      if (res.status === 200) {
        const payments = await res.json();
        log('PASS', 'Payments table accessible', `${payments.length} payments found`);

        if (payments.length > 0) {
          const totalRevenue = payments
            .filter(p => p.status === 'completed' || p.status === 'paid')
            .reduce((sum, p) => sum + Number(p.amount || 0), 0);
          console.log(`\n  💰 Total Revenue (completed/paid): ₹${totalRevenue.toLocaleString('en-IN')}`);

          const statusCounts = {};
          payments.forEach(p => {
            statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
          });
          console.log('\n  📊 Payment Status Distribution:');
          Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`     ${status}: ${count}`);
          });

          console.log('\n  📋 Recent Payments:');
          payments.slice(0, 5).forEach(p => {
            console.log(`     Invoice: ${p.invoice_number || 'N/A'} | ₹${Number(p.amount || 0).toLocaleString('en-IN')} | ${p.status}`);
          });
        } else {
          log('WARN', 'Payments table is empty');
        }
      } else {
        const text = await res.text();
        log('FAIL', 'Payments table', `HTTP ${res.status}: ${text.substring(0, 80)}`);
      }
    } catch (e) {
      log('FAIL', 'Payments table', e.message);
    }
  }

  // -----------------------------------------------------------
  // 7. REVISION REQUESTS TABLE CHECKS
  // -----------------------------------------------------------
  console.log('\n--- SECTION 7: Revision Requests Table ---');

  if (adminToken) {
    try {
      const res = await supabaseRequest('revision_requests?select=id,status,description,project_id,created_at&order=created_at.desc&limit=20', {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      if (res.status === 200) {
        const revisions = await res.json();
        log('PASS', 'Revision requests table accessible', `${revisions.length} revisions found`);

        if (revisions.length > 0) {
          const statusCounts = {};
          revisions.forEach(r => {
            statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
          });
          console.log('\n  📊 Revision Status Distribution:');
          Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`     ${status}: ${count}`);
          });
        } else {
          log('WARN', 'Revision requests table is empty');
        }
      } else {
        const text = await res.text();
        log('FAIL', 'Revision requests table', `HTTP ${res.status}: ${text.substring(0, 80)}`);
      }
    } catch (e) {
      log('FAIL', 'Revision requests table', e.message);
    }
  }

  // -----------------------------------------------------------
  // 8. PRICING PLANS TABLE CHECKS
  // -----------------------------------------------------------
  console.log('\n--- SECTION 8: Pricing Plans Table ---');

  if (adminToken) {
    try {
      const res = await supabaseRequest('pricing_plans?select=*&order=created_at.desc', {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      if (res.status === 200) {
        const plans = await res.json();
        log('PASS', 'Pricing plans table accessible', `${plans.length} plans found`);

        if (plans.length > 0) {
          console.log('\n  📋 Pricing Plans:');
          plans.forEach(p => {
            console.log(`     ${p.name} | ₹${p.base_price_per_sq_ft || p.price_per_sqft || 'N/A'}/sqft | ${p.is_active ? 'Active' : 'Inactive'}`);
          });
        } else {
          log('WARN', 'No pricing plans found - architect cannot create projects without pricing');
        }
      } else {
        const text = await res.text();
        log('FAIL', 'Pricing plans table', `HTTP ${res.status}: ${text.substring(0, 80)}`);
      }
    } catch (e) {
      log('FAIL', 'Pricing plans table', e.message);
    }
  }

  // -----------------------------------------------------------
  // 9. APP API ROUTE CHECKS (Unauthenticated - should return 401)
  // -----------------------------------------------------------
  console.log('\n--- SECTION 9: API Route Security (No Auth) ---');

  const protectedRoutes = [
    '/api/admin/dashboard',
    '/api/admin/users',
    '/api/projects',
    '/api/payments',
    '/api/revisions',
  ];

  for (const route of protectedRoutes) {
    try {
      const res = await appRequest(route);
      if (res) {
        if (res.status === 401 || res.status === 403) {
          log('PASS', `Route ${route} requires auth`, `HTTP ${res.status}`);
        } else if (res.status === 200) {
          log('WARN', `Route ${route} returns 200 without auth`, 'May be using anon key with RLS');
        } else {
          log('WARN', `Route ${route}`, `HTTP ${res.status} (unexpected)`);
        }
      } else {
        log('FAIL', `Route ${route}`, 'No response / fetch failed');
      }
    } catch (e) {
      log('FAIL', `Route ${route}`, e.message);
    }
  }

  // -----------------------------------------------------------
  // 10. APP PAGE ROUTE CHECKS
  // -----------------------------------------------------------
  console.log('\n--- SECTION 10: App Page Routes ---');

  const appPages = [
    { path: '/', expectedStatus: 200, name: 'Landing page' },
    { path: '/login', expectedStatus: 200, name: 'Login page' },
    { path: '/admin/dashboard', expectedStatus: [200, 302, 307], name: 'Admin dashboard (redirect if not logged in)' },
    { path: '/architect/dashboard', expectedStatus: [200, 302, 307], name: 'Architect dashboard' },
    { path: '/designer/dashboard', expectedStatus: [200, 302, 307], name: 'Designer dashboard' },
  ];

  for (const page of appPages) {
    try {
      const res = await appRequest(page.path, { redirect: 'manual' });
      if (res) {
        const expectedList = Array.isArray(page.expectedStatus) ? page.expectedStatus : [page.expectedStatus];
        if (expectedList.includes(res.status)) {
          log('PASS', page.name, `HTTP ${res.status}`);
        } else {
          log('WARN', page.name, `HTTP ${res.status} (expected ${expectedList.join(' or ')})`);
        }
      } else {
        log('FAIL', page.name, 'No response');
      }
    } catch (e) {
      log('FAIL', page.name, e.message);
    }
  }

  // -----------------------------------------------------------
  // 11. DATA INTEGRITY CHECKS
  // -----------------------------------------------------------
  console.log('\n--- SECTION 11: Data Integrity Checks ---');

  if (adminToken) {
    // Check projects have required relational fields
    try {
      const res = await supabaseRequest('projects?select=id,project_name,client_name,status,area_sq_ft,architect_id,assigned_designer_id&limit=10', {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      if (res.status === 200) {
        const projects = await res.json();

        // Check for projects with null architect_id
        const noArchitect = projects.filter(p => !p.architect_id);
        if (noArchitect.length > 0) {
          log('WARN', 'Projects without architect_id', `${noArchitect.length} projects have no architect`);
        } else if (projects.length > 0) {
          log('PASS', 'All projects have architect_id assigned');
        }

        // Check projects with In Design status have a designer
        const inDesign = projects.filter(p => p.status === 'In Design');
        const inDesignNoDesigner = inDesign.filter(p => !p.assigned_designer_id);
        if (inDesignNoDesigner.length > 0) {
          log('WARN', '"In Design" projects without designer', `${inDesignNoDesigner.length} projects have no assigned designer`);
          inDesignNoDesigner.forEach(p => {
            console.log(`     ⚠️ Project: ${p.project_name} (${p.status})`);
          });
        } else if (inDesign.length > 0) {
          log('PASS', 'All "In Design" projects have designer assigned');
        }

        // Check for zero/null area
        const noArea = projects.filter(p => !p.area_sq_ft || p.area_sq_ft === 0);
        if (noArea.length > 0) {
          log('WARN', 'Projects with zero/null area', `${noArea.length} projects`);
        } else if (projects.length > 0) {
          log('PASS', 'All projects have area_sq_ft set');
        }
      }
    } catch (e) {
      log('FAIL', 'Data integrity check', e.message);
    }

    // Check payments reference valid project IDs
    try {
      const payRes = await supabaseRequest('payments?select=id,project_id,amount,status&limit=10', {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      if (payRes.status === 200) {
        const payments = await payRes.json();

        const nullProject = payments.filter(p => !p.project_id);
        if (nullProject.length > 0) {
          log('WARN', 'Payments without project_id', `${nullProject.length} orphaned payments`);
        } else if (payments.length > 0) {
          log('PASS', 'All payments have project_id');
        }

        const nullAmount = payments.filter(p => !p.amount || p.amount === 0);
        if (nullAmount.length > 0) {
          log('WARN', 'Payments with zero/null amount', `${nullAmount.length} payments`);
        } else if (payments.length > 0) {
          log('PASS', 'All payments have non-zero amounts');
        }
      }
    } catch (e) {
      log('FAIL', 'Payment integrity check', e.message);
    }
  }

  // -----------------------------------------------------------
  // 12. ENV CONFIG CHECK
  // -----------------------------------------------------------
  console.log('\n--- SECTION 12: Configuration Notes ---');

  const envNote = `SUPABASE_SERVICE_ROLE_KEY is set to the same value as NEXT_PUBLIC_SUPABASE_ANON_KEY (publishable key). ` +
    `This means admin operations (createUser, deleteUser) will fail with service_role restrictions. ` +
    `The app has fallback to auth.signUp which should work for creating users.`;

  log('WARN', 'Service Role Key Configuration', envNote);

  // -----------------------------------------------------------
  // FINAL REPORT
  // -----------------------------------------------------------
  console.log('\n====================================================');
  console.log('📊 FINAL TEST REPORT');
  console.log('====================================================');
  console.log(`✅ PASS: ${passCount}`);
  console.log(`❌ FAIL: ${failCount}`);
  console.log(`⚠️ WARN: ${warnCount}`);
  console.log(`📝 Total: ${results.length}`);
  console.log('\n--- FAILURES ---');
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`  ❌ ${r.testName}: ${r.detail}`);
  });
  console.log('\n--- WARNINGS ---');
  results.filter(r => r.status === 'WARN').forEach(r => {
    console.log(`  ⚠️ ${r.testName}: ${r.detail}`);
  });
  console.log('\n====================================================\n');
}

runTests().catch(console.error);
