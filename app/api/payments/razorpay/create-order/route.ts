import { NextResponse } from 'next/server';
import { createClient as createCookieClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';
import { rateLimit, clientKeyFrom } from '@/utils/rateLimit';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TBHxoNcpPx7OW9';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request: Request) {
  try {
    const rl = rateLimit(`razorpay-order:${clientKeyFrom(request)}`, 15, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many payment attempts. Please wait a minute and try again.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(rl.retryAfterMs / 1000).toString() } }
      );
    }

    if (!RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Payment gateway is not configured on the server (missing RAZORPAY_KEY_SECRET).' },
        { status: 500 }
      );
    }

    const cookieClient = await createCookieClient();
    const adminClient = getSupabaseAdmin();

    const { data: { user } } = await cookieClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, amount } = await request.json();
    if (!projectId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'projectId and a positive amount are required' }, { status: 400 });
    }

    // Verify the caller owns (is the architect on) this project
    const { data: project } = await adminClient
      .from('projects')
      .select('id, architect_id, project_name')
      .eq('id', projectId)
      .maybeSingle();

    if (!project || project.architect_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const amountInPaise = Math.round(Number(amount) * 100);

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64'),
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `${projectId}-${Date.now()}`,
        notes: { projectId, userId: user.id },
      }),
    });

    const order = await res.json();
    if (!res.ok) {
      console.error('[razorpay/create-order] Razorpay API error:', order);
      return NextResponse.json({ error: order?.error?.description || 'Failed to create payment order' }, { status: 502 });
    }

    return NextResponse.json({ success: true, orderId: order.id, keyId: RAZORPAY_KEY_ID, amount: amountInPaise });
  } catch (err: any) {
    console.error('[razorpay/create-order] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
