#!/usr/bin/env node
import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, ans => res(ans.trim())));

(async () => {
  console.log("\n=== Assistant d'installation Headshot IA ===\n");
  console.log("Si tu ne sais pas, appuie sur Entrée: je mettrai une valeur TEST/DEMO facile à changer plus tard.\n");

  const PUBLIC_BASE_URL = await ask("URL publique de votre app (ex: https://votre-app.onrender.com) [dev: http://localhost:3000]: ") || "http://localhost:3000";
  const DEMO_MODE = await ask("Mode DEMO sans clés ? (oui/non) [oui]: ") || "oui";

  console.log("\n-- Stripe (tu peux laisser vide pour le mode test plus tard) --");
  const STRIPE_SECRET_KEY = await ask("Stripe secret key (sk_test_...): ");
  const STRIPE_PRICE_TRY = await ask("Stripe price ID (Pack Essai) (price_...): ");
  const STRIPE_PRICE_PRO = await ask("Stripe price ID (Pack Pro) (price_...): ");
  const STRIPE_PRICE_SUB = await ask("Stripe price ID (Abonnement) (price_...): ");

  console.log("\n-- Replicate (clé API) --");
  const REPLICATE_API_TOKEN = await ask("Replicate API token (r8_...): ");
  const REPLICATE_MODEL = await ask("Replicate model [fofr/instant-id-portrait]: ") || "fofr/instant-id-portrait";

  console.log("\n-- Cloudflare R2 / S3 --");
  const S3_ENDPOINT = await ask("R2 endpoint (https://<accountid>.r2.cloudflarestorage.com): ");
  const S3_REGION = "auto";
  const S3_BUCKET = await ask("Bucket name [headshot-uploads]: ") || "headshot-uploads";
  const AWS_ACCESS_KEY_ID = await ask("R2 Access Key ID: ");
  const AWS_SECRET_ACCESS_KEY = await ask("R2 Secret Access Key: ");
  const S3_PUBLIC_BASE = await ask("URL publique (pub-...r2.dev ou CDN/worker) : ");
  const S3_PREFIX = "uploads/";

  console.log("\n-- Email (Mailtrap en dev) --");
  const SMTP_HOST = await ask("SMTP host [sandbox.smtp.mailtrap.io]: ") || "sandbox.smtp.mailtrap.io";
  const SMTP_PORT = await ask("SMTP port [2525]: ") || "2525";
  const SMTP_USER = await ask("SMTP user: ");
  const SMTP_PASS = await ask("SMTP pass: ");
  const SMTP_FROM = await ask("Expéditeur [Headshot IA <no-reply@headshot.app>]: ") || "Headshot IA <no-reply@headshot.app>";

  const JWT_SECRET = (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).repeat(2);

  const env = `# Généré par scripts/setup.mjs
PUBLIC_BASE_URL=${PUBLIC_BASE_URL}
DEMO_MODE=${/^(oui|o|yes|y)$/i.test(DEMO_MODE) ? "true" : "false"}
JWT_SECRET=${JWT_SECRET}

# Stripe
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_PRICE_TRY=${STRIPE_PRICE_TRY}
STRIPE_PRICE_PRO=${STRIPE_PRICE_PRO}
STRIPE_PRICE_SUB=${STRIPE_PRICE_SUB}

# Replicate
REPLICATE_API_TOKEN=${REPLICATE_API_TOKEN}
REPLICATE_MODEL=${REPLICATE_MODEL}

# R2 / S3
S3_ENDPOINT=${S3_ENDPOINT}
S3_REGION=${S3_REGION}
S3_BUCKET=${S3_BUCKET}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
S3_PUBLIC_BASE=${S3_PUBLIC_BASE}
S3_PREFIX=${S3_PREFIX}

# SMTP
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
SMTP_FROM=${SMTP_FROM}
`;

  fs.writeFileSync(".env", env);
  console.log("\n✅ Fichier .env créé. Tu peux lancer :");
  console.log("   npm install && npm run db:init && npm run dev");
  console.log("\nAstuce: tu peux relancer ce setup quand tu veux pour régénérer le .env.\n");
  rl.close();
})();
