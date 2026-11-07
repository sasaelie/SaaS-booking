import Stripe from 'stripe';
import { S3Client } from '@aws-sdk/client-s3';
import { Resend } from 'resend';
import type { Environment } from '../config/env';
import { StripePaymentAdapter } from '../adapters/payments/stripe-payment.adapter';
import { S3ProofStorageAdapter } from '../adapters/storage/s3-proof.adapter';
import { unavailablePayment, unavailableStorage } from './unavailable';
export function providers(env: Environment) {
  const gateway =
    env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET
      ? new StripePaymentAdapter(new Stripe(env.STRIPE_SECRET_KEY), env.STRIPE_WEBHOOK_SECRET)
      : unavailablePayment;
  const storage =
    env.STORAGE_BUCKET &&
    env.STORAGE_ACCESS_KEY_ID &&
    env.STORAGE_SECRET_ACCESS_KEY &&
    env.STORAGE_REGION
      ? new S3ProofStorageAdapter(
          new S3Client({
            endpoint: env.STORAGE_ENDPOINT,
            region: env.STORAGE_REGION,
            credentials: {
              accessKeyId: env.STORAGE_ACCESS_KEY_ID,
              secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
            },
          }),
          env.STORAGE_BUCKET,
        )
      : unavailableStorage;
  const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
  return { gateway, storage, resend };
}
