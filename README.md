# MeterProof

Fight estimated municipal bills with evidence. Log timestamped meter photos, calculate the overcharge in Rands, and generate a formal dispute pack. Built for City of Johannesburg, eThekwini, City of Tshwane and City of Cape Town.

MeterProof provides administrative templates and billing calculations, not legal advice.

## Run it on localhost (no accounts needed)

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Open http://localhost:3000.

With the Supabase keys left empty the app runs in **local mode**: there is no login, and meters, readings, photos and disputes are stored in your browser (localStorage and IndexedDB). Every screen works. The data lives in that one browser and disappears if you clear site data.

`NEXT_PUBLIC_DEMO_MODE=true` (the default in `.env.example`) makes the R79 and R39 buttons succeed immediately, so you can test the whole paid flow without PayFast.

### Try the full flow

1. **Meters** (`/dashboard`): add a meter, then **Log reading** with a photo.
2. **Check bill** (`/dashboard/check-bill`): enter the statement date and billed readings.
3. **Dispute pack** (`/dashboard/dispute-pack`): fill in the account holder, unlock, download the PDF.
4. **Tracker** (`/dashboard/tracker`): start Account Shield, log the reference number. A submission date more than 21 business days ago shows the escalation email.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Tariff maths and PayFast signature checks (`lib/billing.test.ts`) |

## Updating tariffs (every 1 July)

All rates live in `lib/tariffs.ts`; the maths is in `lib/billing.ts`. Each table records its source and a `verified` flag. Tables marked `verified: false` came from secondary sources or are incomplete, and the app labels their results "indicative". All 2026/27 tables are verified against the municipality's own documents (reviewed 17 November 2026):

| Municipality | Electricity | Water |
| --- | --- | --- |
| Johannesburg | City Power schedule in the March 2026 Council item, plus the 6c/kWh network surcharge above 500 kWh | Approved water tariff schedule |
| eThekwini | Final tariff tables, p. 227 (Scale 3 and 4) | Final tariff tables, p. 268 (full pressure, property above R350 000) |
| Tshwane | City's 2026/27 tariff notice (VAT basis not stated; treated as excluding VAT) | Same notice, normal rates. Level 2 restriction rates from 16 Nov 2026 are higher, so results are a minimum |
| Cape Town | Budget Annexure 4 | City's approved-tariffs notice, Level Water Wise |

Only per-unit charges are modelled. Fixed monthly charges do not change with the meter reading, so they do not affect an overcharge.

## Going live, step 1: Supabase (free tier)

1. Create a project at https://supabase.com.
2. **SQL Editor**: paste all of `supabase/schema.sql` and run it. It creates the tables (`profiles`, `meters`, `readings`, `disputes`, `payments`), Row Level Security policies, and the private `meter-photos` storage bucket.
3. **Project Settings > API**: copy the values into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only; never commit it)
4. **Authentication > URL Configuration**: set Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to Redirect URLs. Add your production URLs later.
5. **Authentication > Emails > Templates**: in both the "Magic Link" and "Confirm signup" templates, add a line showing the one-time code, for example `Your sign-in code: {{ .Token }}`. The login page accepts that code, which is what lets someone sign in on their laptop after reading the email on their phone.
6. Restart `npm run dev`. If you ran an earlier version of `schema.sql`, run the current file again: it is safe to re-run and adds the photo delete rule. The app now asks for an email and sends a magic link, and data is stored in Supabase.

Local-mode data is not migrated: it stays in the browser.

In Supabase mode a reading's timestamp is set by the database clock and readings cannot be edited or deleted, which is what makes them usable as evidence.

## Going live, step 2: PayFast

1. Create a sandbox account at https://sandbox.payfast.co.za and set a passphrase under Settings.
2. Add to `.env.local`: `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, and keep `PAYFAST_SANDBOX=true`.
3. Set `NEXT_PUBLIC_DEMO_MODE=false`.
4. PayFast must reach `/api/payfast/notify` from the internet. On localhost, run a tunnel (for example `ngrok http 3000`) and set `NEXT_PUBLIC_SITE_URL` to the tunnel's https address.
5. Pay with the sandbox buyer account. The ITN route verifies the signature, the sender, the amount and PayFast's own confirmation before unlocking the pack or extending Account Shield.

For live payments use your live merchant details and set `PAYFAST_SANDBOX=false`.

## How it is put together

- `app/page.tsx`: landing page and Quick Bill Check.
- `app/dashboard/*`: meters and evidence timeline, bill check, dispute pack, tracker.
- `app/api/dispute-pack`: checks the payment and builds the PDF on the server. `app/api/account`: deletes the account.
- `app/api/payfast/*`: `checkout` (signed form fields), `notify` (ITN webhook), `demo-unlock` (demo mode only).
- `lib/store/*`: one `Store` interface with two implementations, `local.ts` (browser) and `supabase.ts`. `index.ts` picks one from the environment.
- `lib/letters.ts`, `lib/pdf.ts`: dispute letter text and the jsPDF document.
- `app/tokens.css`, `app/base.css`, `app/globals.css`: design tokens and component styles.

## Before launch

- **Legal pages:** fill in the operator name and contact email in `lib/legal.ts`. `/privacy` and `/terms` are drafts; have them reviewed.
- **Sign-in emails:** Supabase's built-in sender allows only a few emails an hour. Connect your own SMTP provider under Authentication > Emails.
- **Tariffs:** re-check every table on 1 July (see above).
- **Reminders:** the tracker shows a reading schedule, but nothing is emailed or sent by SMS yet.

## Deploying to Vercel

Import the GitHub repository in Vercel and add every variable from `.env.example` under Project Settings > Environment Variables. Set `NEXT_PUBLIC_SITE_URL` to the production address, add `https://your-domain/auth/callback` to Supabase's Redirect URLs, and set `NEXT_PUBLIC_DEMO_MODE=false`.

## Known limits

- With Supabase configured, the PDF is built on the server after the payment is checked. In local mode it is built in the browser, where there is no real paywall.
- Readings cannot be edited or deleted on their own, because they are evidence. Deleting a meter or the account removes them.
- The 21 business day count skips weekends but not public holidays.
- The folder is inside OneDrive. `node_modules` and `.next` are large and change often; exclude them from sync or move the project if OneDrive struggles.
