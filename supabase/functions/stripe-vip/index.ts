import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno&no-check';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  // @ts-ignore — Deno-compatible fetch client
  httpClient: Stripe.createFetchHttpClient(),
});

// Service role key bypasses RLS — safe here because this runs server-side only
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('No Stripe signature', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', msg);
    return new Response(`Signature invalid: ${msg}`, { status: 400 });
  }

  // Only handle successful checkouts
  if (event.type !== 'checkout.session.completed') {
    return new Response('Event type ignored', { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // client_reference_id carries the Supabase user ID (set in the Stripe URL)
  const userId = session.client_reference_id;

  // plan metadata is set on the Payment Link itself in the Stripe dashboard
  const plan = session.metadata?.plan as 'single' | 'season' | undefined;

  if (!userId || !plan) {
    console.error('Missing client_reference_id or plan metadata. userId:', userId, 'plan:', plan);
    return new Response('Missing required data', { status: 400 });
  }

  // Fetch the user's event_date so single-event VIP expires correctly
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('event_date, event_type')
    .eq('id', userId)
    .single();

  if (profileErr) {
    console.error('Failed to fetch profile:', profileErr.message);
  }

  let vipExpiry: string;

  if (plan === 'season') {
    // Full season covers both prom + homecoming for the whole school year.
    // Expires December 31 of the current calendar year.
    const year = new Date().getFullYear();
    vipExpiry = `${year}-12-31T23:59:59+00:00`;
  } else {
    // Single event — expires 3 days after their event date.
    // The 3-day grace period lets them keep using the school feed for final arrangements.
    if (profile?.event_date) {
      const d = new Date(`${profile.event_date}T23:59:59`);
      d.setDate(d.getDate() + 3);
      vipExpiry = d.toISOString();
    } else {
      // No event date set yet — default to 6 months from payment
      const d = new Date();
      d.setMonth(d.getMonth() + 6);
      vipExpiry = d.toISOString();
    }
  }

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ vip_status: plan, vip_expiry: vipExpiry })
    .eq('id', userId);

  if (updateErr) {
    console.error('Failed to update VIP status:', updateErr.message);
    return new Response('Database update failed', { status: 500 });
  }

  console.log(`VIP activated — user: ${userId} | plan: ${plan} | expires: ${vipExpiry}`);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
