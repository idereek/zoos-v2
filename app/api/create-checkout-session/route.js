export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const PRICE_MAP = {
  basic: {
    monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY,
    annual: process.env.STRIPE_PRICE_BASIC_ANNUAL,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL,
  },
};

const TRIAL_DAYS = {
  basic: 3,
  pro: 2,
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { plan, period, userId, email } = body;

    if (!plan || !period || !userId) {
      return Response.json({ error: "plan, period, userId шаардлагатай" }, { status: 400 });
    }

    const priceId = PRICE_MAP[plan]?.[period];
    if (!priceId) {
      return Response.json({ error: "Тохирох Price ID олдсонгvй" }, { status: 400 });
    }

    const origin = request.headers.get("origin") || "https://stocktuslah.com";

    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("line_items[0][price]", priceId);
    params.append("line_items[0][quantity]", "1");
    params.append("success_url", `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${origin}/pricing`);
    params.append("client_reference_id", userId);
    params.append("subscription_data[trial_period_days]", String(TRIAL_DAYS[plan] || 0));
    params.append("subscription_data[metadata][user_id]", userId);
    params.append("subscription_data[metadata][plan]", plan);
    if (email) params.append("customer_email", email);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      return Response.json({ error: data.error?.message || "Stripe алдаа" }, { status: 500 });
    }

    return Response.json({ url: data.url });
  } catch (err) {
    return Response.json({ error: String(err.message || err) }, { status: 500 });
  }
}
