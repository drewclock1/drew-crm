# Drew CRM — Insurance Sales & Recruiting

A full-stack CRM built for high-volume insurance sales and recruiting. Two separate pipelines, live Kanban boards, commission calculator, goal meters, Google Sheets sync, and SMS bot integration.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) |
| Database | Supabase (Postgres + Auth + Realtime) |
| Styling | Tailwind CSS |
| Hosting | Hetzner VPS via Coolify |
| CI/CD | GitHub → Coolify auto-deploy on push to main |
| Sheets Sync | Google Sheets API v4 (Service Account) |
| SMS Bot | n8n webhook integration |

---

## Pipelines

**Insurance:** new_lead → contacted → quote_sent → follow_up → closed_won → closed_lost

**Recruiting:** prospect → reached_out → interview → offer_sent → onboarded → lost

Both pipelines have separate Kanban boards, stage logic, triggers, and reporting. They share the contacts table.

---

## Setup

### 1. Hetzner + Coolify

1. SSH into your Hetzner server
2. Install Coolify if not already installed:
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```
3. Open Coolify at `http://<your-ip>:8000`
4. Go to **Projects → New Project → Add Resource → Public Repository**

### 2. Connect GitHub Repo in Coolify

1. In Coolify, create a new Application
2. Set Source: **GitHub** → repo `drewclock1/drew-crm`
3. Branch: `main`
4. Build command: `npm run build`
5. Start command: `npm start`
6. Port: `3000`
7. Enable **Auto-deploy on push** so every push to main redeploys automatically

### 3. Set Environment Variables in Coolify

In your Coolify application → **Environment Variables**, add all of these:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
GOOGLE_SHEETS_ID=your_google_sheet_id_here
SMS_BOT_URL=https://your-n8n-instance.com
BOT_API_KEY=your_secret_bot_key
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
CRON_SECRET=generate_with_openssl_rand_base64_32
```

> **NEXTAUTH_SECRET & CRON_SECRET:** Run `openssl rand -base64 32` on your server to generate each one.

---

## Supabase Setup

### Run the Initial Migration

1. Open your Supabase project → **SQL Editor**
2. Open the file: `supabase/migrations/001_initial_schema.sql`
3. Paste the entire contents into the SQL editor
4. Click **Run**

This creates all tables, indexes, RLS policies, triggers, and enables Realtime on the right tables.

### Get Your Supabase Keys

In Supabase → **Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon/public key
- `SUPABASE_SERVICE_KEY` → service_role key (keep this secret — server-side only)

---

## Google Sheets Integration

### Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable the **Google Sheets API**
4. Go to **IAM & Admin → Service Accounts → Create Service Account**
5. Download the JSON key file
6. Copy the entire JSON content as the `GOOGLE_SERVICE_ACCOUNT_JSON` env var

### Share the Sheet

1. Open your Google Sheet
2. Click **Share**
3. Add the service account email (found in the JSON key as `client_email`) with **Viewer** access
4. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/**SHEET_ID_HERE**/edit`

### Sheet Column Format

Your Sheet must have these columns in this order (Row 1 = headers, Row 2+ = data):

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| row_id | first_name | last_name | phone | email | state | policy_type | premium | source | temp |

The sync engine writes back `stage` (col K) and `commission` (col L) automatically.

### Trigger Sync Manually

Hit this URL in a browser or via cron:
```
GET https://your-domain.com/api/cron/sheets-sync?secret=YOUR_CRON_SECRET
```

For Coolify cron, add a scheduled job or use an external cron service like [cron-job.org](https://cron-job.org) pointed at the above URL every 15 minutes.

---

## SMS Bot Integration

### Point the SMS Bot at the CRM

When a lead's stage changes, the CRM fires a POST to:
```
POST {SMS_BOT_URL}/api/trigger
Headers: x-api-key: {BOT_API_KEY}
Body: { "to": "+1XXXXXXXXXX", "triggerContext": "..." }
```

### Configure Your n8n Bot

In your n8n webhook node, listen for POST requests on `/api/trigger` and use the `triggerContext` field to instruct the AI what message to send.

### Bot Handoff to Human

When the SMS bot wants to hand off to a human, it POSTs to:
```
POST https://your-domain.com/api/webhooks/bot-handoff
Headers: x-api-key: {BOT_API_KEY}
Body: { "phone": "+1XXXXXXXXXX", "lead_id": "uuid", "lead_type": "insurance|recruiting", "reason": "..." }
```

This updates the contact mode to `human` and logs a handoff activity in the CRM.

---

## Environment Variable Reference

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (safe for browser) |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-side only, never expose) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full JSON of your Google Service Account key |
| `GOOGLE_SHEETS_ID` | The ID from your Google Sheet URL |
| `SMS_BOT_URL` | Base URL of your n8n instance (e.g. https://n8n.yourdomain.com) |
| `BOT_API_KEY` | Shared secret between CRM and SMS bot |
| `NEXTAUTH_SECRET` | Random secret for session signing |
| `CRON_SECRET` | Secret to protect the /api/cron/sheets-sync endpoint |

---

## User Roles

| Role | Access |
|------|--------|
| `agent` | Own leads only, can move stages, log activities, use calculator |
| `manager` | All agents, can set goals, view reports, export data |
| `admin` | Full access including user management and settings |

The first user who signs up can be promoted to admin by running this SQL in Supabase:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Local Development

```bash
git clone https://github.com/drewclock1/drew-crm
cd drew-crm
npm install
cp .env.example .env.local
# Fill in .env.local with your values
npm run dev
```

Open http://localhost:3000

---

## Deployment

Push to main → Coolify auto-deploys. That's it.

```bash
git add .
git commit -m "your changes"
git push origin main
```

Monitor the build in Coolify → your application → **Deployments**.
