export const SECURITY = {
  NONCE_BYTES: 32,
  NONCE_HEADER: 'x-csp-nonce',
  TRUSTED_IP_HEADER: 'x-vercel-forwarded-for',
  LOCAL_SOURCE: 'local',
  PERMISSIONS_POLICY: 'camera=(), microphone=(), geolocation=()',
  ADVISORY_REVIEW_DAYS: 14,
  ADVISORY_REASON_MIN: 30,
} as const;
