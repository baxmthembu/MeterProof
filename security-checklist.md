# Security checklist

Status of MeterProof against the checklist at
https://gist.github.com/5c01ef4447e94515a03314db1ef2403e (last reviewed 16 November 2026).

☑ done · ◐ partly done, with the gap stated · each row says where the control lives.

## Frontend Security

| | Security Measure | How MeterProof does it |
|---|---|---|
| ☑ | Use HTTPS everywhere | Vercel serves the site over HTTPS only and redirects HTTP. `Strict-Transport-Security` (2 years, subdomains, preload) is sent on every response from `next.config.ts`. Supabase and PayFast are called over HTTPS. |
| ☑ | Input validation and sanitization | React escapes everything it renders; the code has no `dangerouslySetInnerHTML`, `innerHTML` or `eval`. API routes accept only known products and well-formed IDs (`lib/api-guard.ts`). The database enforces types, allowed values and length limits whatever the browser sends (`supabase/schema.sql`, "security hardening"). A Content-Security-Policy limits scripts to this site. |
| ◐ | Don't store sensitive data in the browser | No secret key is in any browser file (checked by scanning the build output). **Gap:** the sign-in session is kept in a cookie that page scripts can read, see "Secure cookies". In local mode (no Supabase) the user's own readings are kept in their browser by design. |
| ☑ | CSRF protection | Every state-changing API route refuses requests whose `Origin` is not this site (`crossSite` in `lib/api-guard.ts`), and the session cookie is `SameSite=Lax`, so browsers do not attach it to cross-site POSTs. This replaces per-form tokens: the app has no cookie-authenticated HTML form posts. The PayFast webhook is authenticated by signature, not by cookie. |
| ☑ | Never expose API keys in frontend | The Supabase service-role key and the PayFast passphrase are read only in server routes. The only key in the browser is Supabase's publishable key, which is designed to be public and is limited by Row Level Security. PayFast's merchant ID and key appear in the checkout form by PayFast's design; the passphrase that signs it never leaves the server. |

## Backend Security

| | Security Measure | How MeterProof does it |
|---|---|---|
| ☑ | Authentication fundamentals | Supabase Auth, with one-time email codes. There are no passwords to store, hash or leak. |
| ☑ | Authorization checks | Row Level Security on every table and on photo storage: a user can read and change only their own rows. Readings cannot be edited or deleted. Payments and Account Shield can be written only by the server. Server routes re-check ownership before acting. |
| ☑ | API endpoint protection | `/api/dispute-pack`, `/api/payfast/checkout`, `/api/payfast/demo-unlock` and `/api/account` require a signed-in user. `/api/payfast/notify` requires a valid PayFast signature, a PayFast source address, a matching amount and PayFast's own confirmation. |
| ☑ | SQL injection prevention | All queries go through the Supabase client, which sends values as parameters. There is no hand-built SQL with user input anywhere in the app. |
| ☑ | Basic security headers | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`, and in production a `Content-Security-Policy`. The `X-Powered-By` header is removed. All set in `next.config.ts`. |
| ☑ | DDoS protection | The site runs on Vercel's network, which absorbs volumetric attacks before they reach the app. The database is Supabase-hosted, not exposed by the app. |

## Practical Security Habits

| | Security Measure | How MeterProof does it |
|---|---|---|
| ☑ | Keep dependencies updated | `npm audit` reports 0 vulnerabilities as of the review date. Re-run `npm audit` and `npm outdated` monthly and before each release. |
| ☑ | Proper error handling | Database and upload errors are logged to the console and replaced with a plain message for the user, so table, column and policy names are never shown. API routes return short fixed messages. Sign-in errors are mapped to two generic messages. |
| ◐ | Secure cookies | The session cookie is `Secure` on HTTPS and `SameSite=Lax` (`lib/store/supabase.ts`). **Gap: it is not `HttpOnly`.** The app talks to Supabase directly from the browser, which needs the session readable by script. Making it HttpOnly means moving all data access behind server routes. Until then, the Content-Security-Policy and the absence of third-party scripts are what limit the risk of a script stealing the session. |
| ◐ | File upload security | Only image files up to 25 MB are accepted. Every photo is re-drawn through a canvas and re-encoded as a small JPEG before upload, which drops hidden data (including location) and refuses files that are not really images. The storage bucket is private and accepts JPEG only, 5 MB at most. **Gap: no malware scanner.** Uploads are only ever served back to their owner as images. |
| ◐ | Rate limiting | Sign-in emails and code attempts are rate-limited by Supabase Auth. The four signed-in API routes are limited per address and per user through a counter in Postgres (`rate_limit_hit`). **Gaps:** the counter only works once the current `supabase/schema.sql` has been run (until then the routes allow requests and log a warning); the PayFast webhook has no counter, since it rejects unsigned requests before doing any work; limits on the Supabase data API itself are Supabase's own. |

## Settings outside the code

These cannot be set from this repository:

- **Supabase > SQL Editor:** run the current `supabase/schema.sql` (safe to re-run) to apply the length limits, the photo bucket limits and the rate-limit function.
- **Supabase > Authentication > Rate Limits:** keep the defaults or tighten them.
- **Vercel > Environment Variables:** keep `NEXT_PUBLIC_DEMO_MODE=false` in production, or anyone can unlock packs for free.
- **Vercel > Firewall:** optional extra rate-limit rules for `/api/*`.
