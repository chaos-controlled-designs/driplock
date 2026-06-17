// @ts-nocheck — Deno runtime; TypeScript doesn't have Deno typings without the extension
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno&no-check';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  httpClient: Stripe.createFetchHttpClient(),
});

// Service role client — bypasses RLS, only used server-side
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// CORS headers — required for browser → Edge Function calls
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PLANS: Record<string, { label: string; cents: number }> = {
  single: { label: 'VIP Lock — One Event',   cents: 699  },
  season: { label: 'VIP Lock — Full Season', cents: 1199 },
};

// ── Helper ────────────────────────────────────────────────────────
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function computeExpiry(plan: string, eventDate?: string | null): string {
  if (plan === 'season') {
    // Covers full school year — Prom + Homecoming
    return `${new Date().getFullYear()}-12-31T23:59:59+00:00`;
  }
  if (eventDate) {
    // Single event: 3-day grace period after the event date
    const d = new Date(`${eventDate}T23:59:59`);
    d.setDate(d.getDate() + 3);
    return d.toISOString();
  }
  // No event date set — default 6 months
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d.toISOString();
}

// ── Main handler ─────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  // Read raw body once — needed for webhook signature verification
  const rawBody = await req.text();
  const stripeSignature = req.headers.get('stripe-signature');

  if (stripeSignature) {
    return handleWebhook(rawBody, stripeSignature);
  }

  return handleCreateSession(req, rawBody);
});

// ── PATH A: Stripe webhook (checkout.session.completed) ──────────
async function handleWebhook(rawBody: string, signature: string): Promise<Response> {
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set');
    return json({ error: 'Server misconfiguration' }, 500);
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Webhook signature verification failed:', msg);
    return json({ error: `Invalid signature: ${msg}` }, 400);
  }

  if (event.type !== 'checkout.session.completed') {
    console.log('Ignored event type:', event.type);
    return json({ ignored: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.client_reference_id;
  const plan   = session.metadata?.plan;

  console.log('Webhook received — userId:', userId, '| plan:', plan);

  if (!userId || !plan || !PLANS[plan]) {
    console.error('Missing or invalid fields — userId:', userId, '| plan:', plan);
    return json({ error: 'Missing client_reference_id or plan metadata' }, 400);
  }

  // Fetch event_date for accurate single-event expiry
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('event_date')
    .eq('id', userId)
    .single();

  if (profileErr) {
    // Non-fatal — will fall back to 6-month expiry
    console.warn('Could not fetch profile event_date:', profileErr.message);
  }

  const vipExpiry = computeExpiry(plan, profile?.event_date);

  const { error: updateErr } = await supabaseAdmin
    .from('profiles')
    .update({ vip_status: plan, vip_expiry: vipExpiry })
    .eq('id', userId);

  if (updateErr) {
    console.error('Failed to activate VIP:', updateErr.message);
    return json({ error: 'Database update failed' }, 500);
  }

  console.log(`VIP activated — user: ${userId} | plan: ${plan} | expires: ${vipExpiry}`);
  return json({ ok: true });
}

// ── PATH B: Create Stripe Checkout Session ───────────────────────
async function handleCreateSession(req: Request, rawBody: string): Promise<Response> {
  // Verify the caller's JWT so we know the real user ID
  const authHeader = req.headers.get('Authorization') ?? '';
  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authErr } = await anonClient.auth.getUser();
  if (authErr || !user) {
    console.error('Unauthorized request:', authErr?.message);
    return json({ error: 'Unauthorized — please sign in' }, 401);
  }

  // Parse request body
  let body: { plan?: string; successUrl?: string };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const plan = body.plan ?? '';
  const successUrl = body.successUrl ?? `${req.headers.get('origin') ?? ''}/vip`;

  if (!PLANS[plan]) {
    return json({ error: `Unknown plan "${plan}". Must be "single" or "season".` }, 400);
  }

  const { label, cents } = PLANS[plan];

  // Create the Checkout Session — all critical fields set in code (not in Stripe dashboard)
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: user.id,   // Identifies the user in the webhook
      metadata: { plan },              // Identifies the plan in the webhook
      success_url: `${successUrl}?activated=1`,
      cancel_url:  successUrl,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: cents,
          product_data: {
            name: label,
            description:
              plan === 'season'
                ? 'VIP access for Prom + Homecoming — active all year'
                : 'VIP access for one event — Prom or Homecoming',
          },
        },
      }],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Stripe session creation failed:', msg);
    return json({ error: `Stripe error: ${msg}` }, 500);
  }

  console.log(`Checkout session created — user: ${user.id} | plan: ${plan} | url: ${session.url}`);
  return json({ url: session.url });
}
