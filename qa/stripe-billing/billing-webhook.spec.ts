import { createHmac } from 'node:crypto';
import { test, expect, type APIRequestContext } from '@playwright/test';

const BASE = (process.env.E2E_API_BASE_URL ?? '').replace(/\/$/, '');
const TOKEN = process.env.E2E_ACCESS_TOKEN ?? '';
const USER_ID = process.env.E2E_USER_ID ?? '';
const WHSEC = process.env.STRIPE_WEBHOOK_SECRET ?? '';

test.beforeAll(() => {
  const missing = Object.entries({
    E2E_API_BASE_URL: BASE,
    E2E_ACCESS_TOKEN: TOKEN,
    E2E_USER_ID: USER_ID,
    STRIPE_WEBHOOK_SECRET: WHSEC,
  })
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    throw new Error(`Missing in .env.e2e: ${missing.join(', ')} (see env.e2e.example)`);
  }
  if (!WHSEC.startsWith('whsec_')) {
    throw new Error('STRIPE_WEBHOOK_SECRET must be a whsec_... signing secret');
  }
});

// Only supabase_user_id is set; `customer` is omitted on purpose so the handler
// never overwrites the test user's real stripe_customer_id with a fake one.
function signedEvent(type: string, object: Record<string, unknown>) {
  const payload = JSON.stringify({
    id: `evt_qa_${Date.now()}`,
    object: 'event',
    type,
    data: { object },
  });
  const ts = Math.floor(Date.now() / 1000);
  const v1 = createHmac('sha256', WHSEC).update(`${ts}.${payload}`).digest('hex');
  return { payload, header: `t=${ts},v1=${v1}` };
}

async function postWebhook(request: APIRequestContext, payload: string, header: string) {
  return request.post(`${BASE}/billing/webhook`, {
    data: payload,
    headers: { 'content-type': 'application/json', 'stripe-signature': header },
  });
}

async function entitlements(request: APIRequestContext) {
  const res = await request.get(`${BASE}/billing/entitlements`, {
    headers: { authorization: `Bearer ${TOKEN}` },
  });
  expect(res.status()).toBe(200);
  return res.json();
}

async function downgrade(request: APIRequestContext) {
  const { payload, header } = signedEvent('customer.subscription.deleted', {
    id: 'sub_qa',
    object: 'subscription',
    status: 'canceled',
    metadata: { supabase_user_id: USER_ID },
  });
  return postWebhook(request, payload, header);
}

test.describe.configure({ mode: 'serial' });

test.describe('Stripe webhook -> /billing/entitlements', () => {
  test.afterAll(async ({ playwright }) => {
    const request = await playwright.request.newContext();
    await downgrade(request);
    await request.dispose();
  });

  test('precondition: test account is authenticated and on free plan', async ({ request }) => {
    const ent = await entitlements(request);
    expect(ent.authenticated, 'token rejected — refresh E2E_ACCESS_TOKEN').toBe(true);
    expect(ent.plan, 'run on a free test account; Part B leaves it on pro').toBe('free');
  });

  test('bad signature is rejected with 400', async ({ request }) => {
    const { payload } = signedEvent('checkout.session.completed', { id: 'cs_qa', object: 'checkout.session' });
    const res = await postWebhook(request, payload, `t=${Math.floor(Date.now() / 1000)},v1=${'0'.repeat(64)}`);
    expect(res.status()).toBe(400);
  });

  test('checkout.session.completed -> 200 and plan becomes pro', async ({ request }) => {
    const { payload, header } = signedEvent('checkout.session.completed', {
      id: 'cs_test_qa',
      object: 'checkout.session',
      metadata: { supabase_user_id: USER_ID },
    });
    const res = await postWebhook(request, payload, header);
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ received: true, type: 'checkout.session.completed' });

    await expect
      .poll(async () => (await entitlements(request)).plan, { timeout: 10_000 })
      .toBe('pro');
    expect((await entitlements(request)).plan_label).toBe('Pro');
  });

  test('customer.subscription.deleted -> 200 and plan returns to free', async ({ request }) => {
    const res = await downgrade(request);
    expect(res.status()).toBe(200);
    await expect
      .poll(async () => (await entitlements(request)).plan, { timeout: 10_000 })
      .toBe('free');
  });
});
