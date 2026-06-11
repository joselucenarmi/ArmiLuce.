import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import Stripe from 'npm:stripe@12.18.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return new Response('Webhook Error', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan || 'pro';

        if (userId) {
          // Update subscription in database
          await supabase
            .from('subscriptions')
            .update({
              plan: plan as 'pro' | 'professional',
              status: 'active',
              stripe_subscription_id: session.subscription as string,
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('user_id', userId);

          // Update profile plan
          await supabase
            .from('profiles')
            .update({ subscription_plan: plan })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (subData?.user_id) {
          const plan = subscription.metadata?.plan || 'pro';
          const status = subscription.status === 'active' ? 'active' :
                         subscription.status === 'canceled' ? 'canceled' :
                         subscription.status;

          await supabase
            .from('subscriptions')
            .update({
              status: status as 'active' | 'canceled' | 'past_due',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('user_id', subData.user_id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (subData?.user_id) {
          await supabase
            .from('subscriptions')
            .update({
              plan: 'basic',
              status: 'canceled',
            })
            .eq('user_id', subData.user_id);

          await supabase
            .from('profiles')
            .update({ subscription_plan: 'basic' })
            .eq('id', subData.user_id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: subData } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (subData?.user_id) {
          await supabase
            .from('subscriptions')
            .update({ status: 'active' })
            .eq('user_id', subData.user_id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: subData } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (subData?.user_id) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('user_id', subData.user_id);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response('Webhook handler error', { status: 500 });
  }
});