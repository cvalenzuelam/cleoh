import { NextResponse } from "next/server";
import { subscribeNewsletter } from "@/lib/newsletter/subscribe";

type Body = {
  email?: string;
  source?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.email?.trim()) {
    return NextResponse.json(
      { error: "El correo es obligatorio." },
      { status: 400 },
    );
  }

  const result = await subscribeNewsletter({
    email: body.email,
    source: body.source,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    code: result.code,
    duplicate: result.duplicate,
    emailSent: result.emailSent,
  });
}
