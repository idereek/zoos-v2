import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PRICE_TO_TIER = {
  [process.env.STRIPE_PRICE_BASIC_MONTHLY]: "basic",
  [process.env.STRIPE_PRICE_BASIC_ANNUAL]: "basic",
  [process.env.STRIPE_PRICE_PRO_MONTHLY]: "pro",
  [process.env.STRIPE_PRICE_PRO_ANNUAL]: "pro",
};

async function verifyStripeSignature(payload, sigHeader, secret) {
  if (!sigHeader) return false;
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k, v];
    })
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expectedSig === signature;
}

async function getSubscriptionFromStripe(subscriptionId) {
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) throw new Error("Stripe subscription fetch алдаа");
  return res.json();
}

function toIsoOrNull(unixSeconds) {
  if (!unixSeconds) return null;
  const d = new Date(unixSeconds * 1000);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function POST(request) {
  const payload = await request.text();
  const sigHeader = request.headers.get("stripe-signature");

  const isValid = await verifyStripeSignature(payload, sigHeader, STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(payload);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const subscriptionId = session.subscription;
      const customerId = session.customer;

      if (userId && subscriptionId) {
        const sub = await getSubscriptionFromStripe(subscriptionId);
        const firstItem = sub.items.data[0];
        const priceId = firstItem?.price?.id;
        const tier = PRICE_TO_TIER[priceId] || "free";
        const periodEndUnix = sub.current_period_end || firstItem?.current_period_end || null;

        await supabaseAdmin.from("subscriptions").upsert(
          {
            user_id: userId,
            tier,
            status: sub.status,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            current_period_end: toIsoOrNull(periodEndUnix),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object;
      const userId = sub.metadata?.user_id;

      if (userId) {
        const firstItem = sub.items.data[0];
        const priceId = firstItem?.price?.id;
        const tier =
          event.type === "customer.subscription.deleted" ? "free" : PRICE_TO_TIER[priceId] || "free";
        const periodEndUnix = sub.current_period_end || firstItem?.current_period_end || null;

        await supabaseAdmin.from("subscriptions").upsert(
          {
            user_id: userId,
            tier,
            status: event.type === "customer.subscription.deleted" ? "canceled" : sub.status,
            stripe_customer_id: sub.customer,
            stripe_subscription_id: sub.id,
            current_period_end: toIsoOrNull(periodEndUnix),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      }
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return Response.json({ error: String(err.message || err) }, { status: 500 });
  }
}
