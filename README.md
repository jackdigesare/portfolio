# Jack DiGesare — Portfolio

Personal portfolio site built with Next.js.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Contact form (Resend)

The Contact section Email control expands an in-page form that sends mail via [Resend](https://resend.com).

1. Create an API key at [resend.com/api-keys](https://resend.com/api-keys).
2. Copy `.env.example` to `.env.local` and set:

```bash
RESEND_API_KEY=re_xxxxxxxx
CONTACT_TO_EMAIL=jackdigesare@pm.me
CONTACT_FROM_EMAIL=Jack DiGesare <contact@jackdigesare.dev>
```

`CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL` are optional; they default to your ProtonMail inbox and `contact@jackdigesare.dev` on the verified Resend domain.

3. Restart `npm run dev` and send a test message from the form.

Messages are sent from your domain; the visitor’s address is set as Reply-To.

### Vercel

In the Vercel project → Settings → Environment Variables, add `RESEND_API_KEY` (and optionally `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL`) for Production (and Preview if you want to test there). Redeploy after saving.

The contact endpoint sends email, so protect `/api/contact` with a
[Vercel WAF rate-limit rule](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).
A fixed window of 5 requests per 10 minutes keyed by IP is a reasonable
starting point for this form. Keep the recipient fixed to `CONTACT_TO_EMAIL`;
never send mail to a submitted address without first verifying ownership.
