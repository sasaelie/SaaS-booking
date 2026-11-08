export const PRIVATE_FILES = {
  BACKEND: 'postgres',
  KEY_MAX: 512,
  MAX_TOTAL_BYTES: 50 * 1024 * 1024,
  QUOTA_LOCK: 'staging-private-files-quota',
  AUDIENCE: 'booking-private-file',
  PATH: '/api/private-file',
  MIME_TYPE: 'image/png',
} as const;
