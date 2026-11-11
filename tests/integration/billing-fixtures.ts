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
    unitAmount: 2900,
    customerCount: 0,
    checkoutCount: 0,
    open: false,
    refunded: false,
    openInterval: 'month',
    lastCheckoutBody: '',
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
  unit_amount: 2900,
  currency: 'eur',
  recurring: { interval: 'month', interval_count: 1 },
};
function subscription(state: BillingState) {
  return {
    id: state.subscriptionId,
    customer: 'cus_local',
    status: state.subscriptionStatus,
    cancel_at_period_end: state.cancel,
    metadata: { organization_id: state.organizationId, billing_interval: state.openInterval },
    items: { data: [{ id: 'si_local', current_period_end: state.period, price }] },
  };
}
function reply(state: BillingState, path: string, method: string, body: URLSearchParams): unknown {
  const pricing = financialReply(state, path) ?? priceReply(state, path);
  if (pricing) return pricing;
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
              metadata: {
                organization_id: state.organizationId,
                billing_interval: state.openInterval,
              },
            },
          ]
        : [],
    };
  if (path === '/v1/checkout/sessions') {
    state.checkoutCount++;
    state.lastCheckoutBody = body.toString();
    state.openInterval = body.get('metadata[billing_interval]') ?? 'month';
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

function priceReply(state: BillingState, path: string) {
  if (path === '/v1/prices/price_annual')
    return {
      ...price,
      id: 'price_annual',
      unit_amount: 26000,
      recurring: { interval: 'year', interval_count: 1 },
    };
  if (path === '/v1/prices/price_monthly') return { ...price, unit_amount: state.unitAmount };
  return null;
}

function financialReply(state: BillingState, path: string) {
  if (path === '/v1/invoice_payments') return { data: [{ invoice: 'in_local' }], has_more: false };
  if (path === '/v1/invoices/in_local')
    return {
      id: 'in_local',
      customer: 'cus_local',
      currency: 'eur',
      status: 'paid',
      amount_paid: 2900,
      created: Math.floor(Date.now() / 1000),
      status_transitions: { paid_at: Math.floor(Date.now() / 1000) },
      parent: { subscription_details: { subscription: 'sub_current' } },
    };
  if (path === '/v1/refunds')
    return {
      data: state.refunded
        ? [
            {
              id: 're_subscription',
              amount: 2900,
              status: 'succeeded',
              created: Math.floor(Date.now() / 1000),
            },
          ]
        : [],
      has_more: false,
    };
  return null;
}
