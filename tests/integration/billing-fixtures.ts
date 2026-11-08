import Stripe from 'stripe';
export function billingStripe() {
  const state = createState();
  const transport: typeof fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const data = reply(
      state,
      url.pathname,
      init?.method ?? 'GET',
      new URLSearchParams(String(init?.body ?? '')),
    );
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  const stripe = new Stripe('sk_test_local_only', {
    httpClient: Stripe.createFetchHttpClient(transport),
    maxNetworkRetries: 0,
  });
  return {
    state,
    stripe,
    subscription: () => subscription(state),
    settings: { stripe, priceId: price.id, appUrl: 'http://localhost:3002' },
  };
}

function createState() {
  return {
    unitAmount: 1999,
    customerCount: 0,
    checkoutCount: 0,
    open: false,
    organizationId: '',
    subscriptionId: 'sub_current',
    subscriptionStatus: 'active',
    cancel: false,
    hasSubscription: false,
    period: Math.floor(Date.now() / 1000) + 2592000,
  };
}
type BillingState = ReturnType<typeof createState>;
const price = {
  id: 'price_monthly',
  unit_amount: 1999,
  currency: 'eur',
  recurring: { interval: 'month', interval_count: 1 },
};
function subscription(state: BillingState) {
  return {
    id: state.subscriptionId,
    customer: 'cus_local',
    status: state.subscriptionStatus,
    cancel_at_period_end: state.cancel,
    metadata: { organization_id: state.organizationId },
    items: { data: [{ id: 'si_local', current_period_end: state.period, price }] },
  };
}
function reply(state: BillingState, path: string, method: string, body: URLSearchParams): unknown {
  if (path === '/v1/prices/price_monthly') return { ...price, unit_amount: state.unitAmount };
  if (path === '/v1/customers') {
    state.customerCount++;
    return { id: 'cus_local' };
  }
  if (path === '/v1/checkout/sessions' && method === 'GET')
    return {
      data: state.open
        ? [
            {
              id: 'cs_local',
              mode: 'subscription',
              url: 'https://checkout.stripe.com/local',
              metadata: { organization_id: state.organizationId },
            },
          ]
        : [],
    };
  if (path === '/v1/checkout/sessions') {
    state.checkoutCount++;
    state.open = true;
    return { id: 'cs_local', url: 'https://checkout.stripe.com/local' };
  }
  if (path === '/v1/subscriptions')
    return { data: state.hasSubscription ? [subscription(state)] : [] };
  if (path.startsWith('/v1/subscriptions/')) {
    if (method === 'POST') state.cancel = body.get('cancel_at_period_end') === 'true';
    return subscription(state);
  }
  if (path === '/v1/billing_portal/sessions') return { url: 'https://billing.stripe.com/local' };
  throw Error(`Unexpected test Stripe endpoint ${method} ${path}`);
}
