#!/usr/bin/env node
// Print required envs and which ones are missing
const required = [
  'PUBLIC_BASE_URL','JWT_SECRET',
  'STRIPE_SECRET_KEY','STRIPE_PRICE_TRY','STRIPE_PRICE_PRO','STRIPE_PRICE_SUB',
  'REPLICATE_API_TOKEN','REPLICATE_MODEL',
  'S3_ENDPOINT','S3_BUCKET','AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','S3_PUBLIC_BASE',
  'SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','SMTP_FROM'
];
const missing = required.filter(k => !process.env[k] || String(process.env[k]).trim()==='');
if (missing.length) {
  console.log('Missing env vars:\n- ' + missing.join('\n- '));
  process.exit(1);
} else {
  console.log('All required env vars look set ✓');
}
