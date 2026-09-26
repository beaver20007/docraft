# QA: Stripe billing (test mode)

Two parts. Claude never enters card numbers, passwords or tokens, and never touches CAPTCHA.

## Part A — automated (webhook -> entitlements)

Sends a locally signed `checkout.session.completed` (with `metadata.supabase_user_id`) to
`/billing/webhook`, asserts HTTP 200, then asserts `GET /billing/entitlements` returns
`plan: "pro"` (`plan_label: "Pro"`). Then sends `customer.subscription.deleted` and asserts
`plan: "free"`. Also asserts a bad signature gives 400.

Why not `stripe trigger`: its fixture creates an unrelated customer with no `supabase_user_id`;
the handler (`stripe_service.py:_on_checkout_completed`) then finds no user, does nothing, and
still returns 200 — it cannot prove the entitlement change.

Setup (once):

```powershell
cd qa\stripe-billing
npm install
Copy-Item env.e2e.example .env.e2e   # then fill it in yourself; the file is git-ignored
```

`.env.e2e` values: `E2E_ACCESS_TOKEN` (test account session token, ~1h lifetime),
`E2E_USER_ID` (uuid of that same account), `STRIPE_WEBHOOK_SECRET` (`whsec_...` of the
test-mode endpoint from Stripe Dashboard -> Developers -> Webhooks).

Run:

```powershell
npx playwright test
```

Use a **free test account only**: the run writes `plan=pro`, then restores `free`
(also on failure, via `afterAll`). The precondition test fails if the account is already `pro`.

## Part B — manual, once (real Checkout with a test card)

1. Make sure the test account is on `free` (Part A leaves it there).
2. Open the app (`https://ai-playbook-generator.vercel.app/`), sign in as the test account.
3. Click **Перейти на Pro** (shown when plan=free and billing is enforced).
4. On the Stripe Checkout page (must say TEST MODE / sandbox): card `4242 4242 4242 4242`,
   any future expiry, any CVC, any name/postal code. Click **Subscribe**.
5. You should be redirected to the `STRIPE_SUCCESS_URL` (`...?upgraded=1`).
6. Stripe Dashboard -> Developers -> Webhooks -> your endpoint -> recent events: the
   `checkout.session.completed` and `customer.subscription.created` deliveries must show **200**.
7. Check the result (either):
   - run `curl -H "Authorization: Bearer <token>" <api>/billing/entitlements` — expect `"plan":"pro"`;
   - or rerun nothing: just report the `plan` value you see.
8. Clean up: Stripe Dashboard (test mode) -> Customers -> the test customer -> cancel the
   subscription, so the account returns to `free`.

If Checkout shows a CAPTCHA, solve it yourself.
