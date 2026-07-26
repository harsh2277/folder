import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient as createCookieClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// projectPaymentKind identifies which server-side state transition to apply once
// the Razorpay signature has been verified:
// 'full'       — single full-amount payment, marks project payment_status='paid'
// 'milestone1' — 50% upfront deposit, marks project payment_status='partial'
// 'milestone2' — 50% final release payment, marks project payment_status='paid'
type PaymentKind = 'full' | 'milestone1' | 'milestone2';

export async function POST(request: Request) {
  try {
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

    const {
      projectId,
      paymentId,
      kind,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }: {
      projectId: string;
      paymentId?: string;
      kind: PaymentKind;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    } = await request.json();

    if (!projectId || !kind || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required verification fields' }, { status: 400 });
    }

    // Verify caller owns this project
    const { data: project } = await adminClient
      .from('projects')
      .select('id, architect_id')
      .eq('id', projectId)
      .maybeSingle();

    if (!project || project.architect_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify Razorpay HMAC signature: expected = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('[razorpay/verify] Signature mismatch for project', projectId);
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    // Signature is valid — apply the state transition server-side
    const projectUpdate: Record<string, any> =
      kind === 'milestone1'
        ? { payment_status: 'partial', status: 'Under Review' }
        : { payment_status: 'paid', status: 'Under Review' };

    await adminClient.from('projects').update(projectUpdate).eq('id', projectId);

    if (paymentId) {
      await adminClient
        .from('payments')
        .update({ status: 'completed', transaction_id: razorpay_payment_id })
        .eq('id', paymentId);
    } else {
      // Fall back to the earliest pending payment row for this project
      const { data: pays } = await adminClient
        .from('payments')
        .select('id')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      if (pays && pays.length > 0) {
        await adminClient
          .from('payments')
          .update({ status: 'completed', transaction_id: razorpay_payment_id })
          .eq('id', pays[0].id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[razorpay/verify] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
