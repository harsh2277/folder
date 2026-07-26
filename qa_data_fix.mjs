/**
 * Fix Data Integrity Issues:
 * 1. Find project with no architect_id and fix it
 * 2. Verify fixes applied
 */

const SUPABASE_URL = 'https://gncpstvyexbkwibdqzua.supabase.co';
const ANON_KEY = 'sb_publishable_qP9NFXFbmjZi71-3JN_OzA_dnNe-ScN';

async function dbQ(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return res;
}

async function auth(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) {
    const data = await res.json();
    return { token: data.access_token, userId: data.user?.id };
  }
  return null;
}

async function run() {
  console.log('\n=== Data Integrity Fix Script ===\n');

  const adminAuth = await auth('admin@gmail.com', 'admin123');
  if (!adminAuth) {
    console.log('❌ Failed to authenticate as admin');
    return;
  }

  const headers = { 'Authorization': `Bearer ${adminAuth.token}` };

  // Find architect user
  const archRes = await dbQ('profiles?select=id,name,email&eq.role=architect', { headers });
  const architects = await archRes.json();
  console.log('Architects:', JSON.stringify(architects));

  // Actually use the correct PostgREST syntax
  const archRes2 = await dbQ('profiles?role=eq.architect&select=id,name,email', { headers });
  const architects2 = await archRes2.json();
  console.log('Architects2:', JSON.stringify(architects2));

  // Find projects with no architect_id
  const projRes = await dbQ('projects?architect_id=is.null&select=id,project_name,status,created_at', { headers });
  const nullArchProjects = await projRes.json();
  console.log('\nProjects with no architect_id:', JSON.stringify(nullArchProjects, null, 2));

  if (nullArchProjects.length > 0 && architects2.length > 0) {
    const architectId = architects2[0].id;
    console.log(`\nWill assign architect ${architects2[0].name} (${architectId}) to ${nullArchProjects.length} projects...`);

    for (const proj of nullArchProjects) {
      const updateRes = await dbQ(`projects?id=eq.${proj.id}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ architect_id: architectId }),
      });
      
      if (updateRes.status === 200 || updateRes.status === 204) {
        console.log(`  ✅ Fixed: ${proj.project_name}`);
      } else {
        const text = await updateRes.text();
        console.log(`  ❌ Failed to fix ${proj.project_name}: HTTP ${updateRes.status} - ${text.substring(0, 100)}`);
      }
    }
  } else {
    console.log('No projects to fix or no architects found.');
  }

  // Verify final state
  console.log('\n=== Verification ===');
  const allProjRes = await dbQ('projects?select=id,project_name,status,architect_id,assigned_designer_id', { headers });
  const allProjects = await allProjRes.json();
  console.log(`Total projects: ${allProjects.length}`);
  const noArch = allProjects.filter(p => !p.architect_id);
  const noDesignerInDesign = allProjects.filter(p => p.status === 'In Design' && !p.assigned_designer_id);
  console.log(`Projects without architect_id: ${noArch.length} ${noArch.length === 0 ? '✅' : '❌'}`);
  console.log(`In Design without designer: ${noDesignerInDesign.length} ${noDesignerInDesign.length === 0 ? '✅' : '⚠️'}`);
}

run().catch(console.error);
