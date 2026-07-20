export const dynamic = "force-dynamic";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_EMAIL_TO = process.env.CONTACT_EMAIL_TO;

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return Response.json(
        { error: "Нэр, имэйл, зурвас бvгд шаардлагатай" },
        { status: 400 }
      );
    }

    if (!RESEND_API_KEY || !CONTACT_EMAIL_TO) {
      return Response.json(
        { error: "Сервер тохиргоо дутуу байна" },
        { status: 500 }
      );
    }

    const emailBody = {
      from: "Zoos Contact Form <onboarding@resend.dev>",
      to: [CONTACT_EMAIL_TO],
      reply_to: email,
      subject: `Шинэ зурвас — ${name}`,
      text: `Нэр: ${name}\nИмэйл: ${email}\n\nЗурвас:\n${message}`,
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailBody),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: data.message || "Имэйл илгээхэд алдаа гарлаа" },
        { status: 500 }
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: String(err.message || err) }, { status: 500 });
  }
}
