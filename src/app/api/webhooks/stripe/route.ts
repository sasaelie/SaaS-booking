// src/app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { StripePaymentAdapter } from '../../../../adapters/payments/stripe-payment.adapter';
import { HandlePaymentWebhookUseCase } from '../../../../core/use-cases/handle-stripe-webhook.use-case';
import Stripe from 'stripe';
const stripeSecretKey = process.env['STRIPE_SECRET_KEY'] ?? '';
const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'] ?? '';
const stripeClient = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
});
const paymentGateway = new StripePaymentAdapter(stripeClient, webhookSecret);
export async function POST(request: Request): Promise<NextResponse> {
  const bodyText = await request.text();
  const signatureHeader = headers().get('stripe-signature') ?? '';
  const useCase = new HandlePaymentWebhookUseCase({
    paymentGateway,
    paymentRepo: {} as any, // Injection du repository Drizzle de production
    notificationPort: {} as any, // Injection du port de notification e-mail
  });
  const result = await useCase.execute(bodyText, signatureHeader);
  if (!result.ok)
    return NextResponse.json(
      { error: result.error.cause, code: result.error.code },
      { status: 400 },
    );
  return NextResponse.json({ received: true, data: result.value });
}
