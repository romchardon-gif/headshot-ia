## Déploiement 1‑clic (Render Blueprint)

1. Poussez ce dossier dans **votre repo Git** (GitHub/ GitLab) :
```bash
git init
git add .
git commit -m "Headshot IA starter"
git branch -M main
git remote add origin <URL_DE_VOTRE_REPO>
git push -u origin main
```

2. Sur **Render.com** → *New + Blueprint* → pointez vers votre repo (branche `main`).  
3. Render lit `.render.yaml` et prépare le service web automatiquement.  
4. Renseignez les variables d’environnement manquantes (flags `sync:false`).  
5. Déployez. Testez `https://<votre-app>.onrender.com/api/health`.

> Vérifiez les envs avec : `npm run env:check` en local (copiez vos valeurs dans `.env` avant).


# Headshot IA — Starter (Webapp)

Stack minimal pour lancer vite un **générateur de photos de profil pro** :
- Frontend **statique** (HTML/CSS/JS) au design punchy
- Backend **Node + Express**
- **Stripe Checkout** pour la monétisation
- **Replicate** pour la génération d'images (modèle ID-preserving)

## 1) Setup

```bash
git clone <ce zip décompressé>
cd ai-profile-generator-starter
cp .env.example .env
# Édite .env et renseigne les clés
npm install
npm run dev
# Ouvre http://localhost:3000
```

### Variables d'environnement
- `REPLICATE_API_TOKEN` : token API Replicate
- `REPLICATE_MODEL` : e.g. `fofr/instant-id-portrait` (ou un autre modèle qui préserve l'identité)
- `STRIPE_SECRET_KEY` : clé secrète Stripe
- `STRIPE_PRICE_TRY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_SUB` : IDs de Price créés dans Stripe
- `PUBLIC_BASE_URL` : URL publique (ex: `http://localhost:3000`)

## 2) Déploiement rapide
- **Vercel / Render / Railway** : ajoutez les variables d'environnement, déployez.
- **Domaine** : achetez un .com court et mappez-le au déploiement.
- **Stockage images (prod)** : remplacez l'envoi base64 par un upload vers S3/Cloudflare R2 et passez les URLs au modèle Replicate.

## 3) Améliorations suggérées (prochaines étapes)
- Auth simple (email magique) pour l'historique des rendus
- File d'attente / webhooks pour synchroniser l'état de génération
- Plus de **styles** (corporate, créatif, influenceur, IG, OnlyFans, etc.)
- Filigrane sur versions gratuites, **HD** réservé au payant
- Export en paquets (.zip) + partages sociaux en 1 clic

## 4) Importants
- Les modèles Replicate ont chacun des **paramètres**/noms d'inputs différents. Adaptez `server.js` selon le modèle choisi (ex: `input_image`, `reference_image`, `image`...). Testez dans la console Replicate puis collez l'input qui marche.
- Pour Stripe, créez 3 **Prices** et copiez leurs IDs dans `.env`.
- Ce starter est volontairement **minimal** pour expédier vite. Durcissez la sécurité, ajoutez la persistance (DB) et la mise à l'échelle pour la prod.

Bonne vente ! 🚀


## 5) Mode DEMO (sans clés)
- Mettez `DEMO_MODE=true` dans `.env` → l'app fonctionne sans Stripe ni Replicate.
- Le paiement redirige directement en succès et la génération renvoie 4 images de démonstration.

## 6) Test Stripe
- Utilisez la **clé secrète de test** et n'importe quel Price de test.
- Carte test : `4242 4242 4242 4242` — date future, CVC au choix.


## 7) Modèles conseillés (Replicate)
- **fofr/instant-id-portrait** — headshots propres, préservation d'identité.
- **tencentarc/instantid** (ou forks équivalents) — nécessite souvent `input_image`.
- **stable-diffusion ID adapters** (IP-Adapter / FaceID) — selon disponibilité.

Si le modèle ne réagit pas, changez la clé d'input dans `buildModelInput()` (ex. `image` → `input_image`).

## 8) Styles prêts
Envoyez `style=corporate|influencer|dating|artistic` au backend. Les prompts/negative prompts sont définis dans `STYLE_PRESETS`.


## 9) Filigrane & Export ZIP
- Par défaut (non payé), les images renvoyées sont **filigranées** côté serveur avec Jimp.
- Si l'URL contient `?success=1` (retour Stripe), la génération est traitée **sans filigrane**.
- Endpoint `/api/zip` : POST JSON `{ images: [urls|dataURLs] }` → renvoie un fichier `headshots.zip`.


## 10) Stockage Cloudflare R2 / AWS S3
**Pourquoi ?** URLs publiques légères pour Replicate + téléchargement rapide pour l’utilisateur.

### Configuration (R2 recommandé)
1. Créez un bucket R2 dans Cloudflare → notez **endpoint** (ex: `https://<accountid>.r2.cloudflarestorage.com`) et **bucket name`**.
2. Générez une **Access Key ID** et **Secret Access Key** pour R2.
3. (Optionnel) Activez un **domaine public** ou la fonctionnalité **Public Bucket** → obtenez une URL type `https://pub-...r2.dev`.
4. Renseignez `.env` :
```
S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=<nom-du-bucket>
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
S3_PUBLIC_BASE=https://pub-xxxxxx.r2.dev   # ou votre CDN perso
S3_PREFIX=uploads/
```

### Fonctionnement
- Les **photos uploadées** par l’utilisateur sont envoyées dans le bucket → on obtient des **URLs publiques**.
- Ces URLs sont passées au modèle Replicate.
- Les **résultats générés** sont à leur tour **persistés** dans le bucket et renvoyés au front.
- Le filigrane (non payé) s’applique toujours mais à partir des fichiers stockés.

### Nettoyage
- Ajoutez une tâche CRON séparée pour supprimer les objets plus vieux que X jours si nécessaire.


## 11) Purge automatique (nettoyage des anciens fichiers)
**Script :** `purge-old.js`
- Supprime les objets plus vieux que `PURGE_MAX_AGE_DAYS` (par défaut 14 jours).
- **Dry-run** par défaut si `PURGE_DRY_RUN=true`.

**Exemples :**
```bash
PURGE_MAX_AGE_DAYS=14 PURGE_DRY_RUN=true npm run purge  # simulateur
PURGE_MAX_AGE_DAYS=30 npm run purge                      # suppression réelle
```
Planifiez ce script en CRON (Render/Railway scheduler ou GitHub Actions). 

## 12) Accélération via Cloudflare Workers (CDN sur R2)
Fichiers inclus :
- `worker.js` — Worker qui sert R2 avec cache agressif.
- `wrangler.sample.toml` — modèle de config.

**Étapes :**
1. Installez Wrangler : `npm i -g wrangler`
2. Copiez `wrangler.sample.toml` → `wrangler.toml` et renseignez `account_id` et `bucket_name`.
3. Connectez votre bucket R2 à la binding `BUCKET`.
4. Déployez : `wrangler deploy`
5. (Optionnel) Ajoutez une **route** (`routes = ["cdn.votredomaine.com/i/*"]`), puis dans l’app utilisez des URLs au format `/i/<key>` pour profiter du CDN.

> Avec ça, vous servez vos images depuis R2 **sous CDN** avec des headers `Cache-Control` adéquats et un cache edge 1 an.


## 13) Auth par lien magique + Historique
- **/api/auth/request** : POST `{ email }` → envoie un lien de connexion par email (Mailtrap conseillé en dev).
- **/api/auth/verify** : GET avec `token` → place un cookie de session.
- **/api/me** : renvoie l'email courant si connecté.
- **/api/history** : liste les rendus de l'utilisateur (100 derniers).

DB: SQLite (`data.sqlite`) avec tables `users` et `generations`.
Initialiser:
```bash
npm run db:init
```
SMTP de dev: utilisez Mailtrap.io, renseignez `SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM`.
