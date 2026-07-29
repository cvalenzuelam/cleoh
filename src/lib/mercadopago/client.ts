import "server-only";

const MP_API = "https://api.mercadopago.com";

function accessToken() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("Falta MP_ACCESS_TOKEN en .env.local");
  return token;
}

export function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export type PreferenceItem = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
};

export async function createCheckoutPreference(input: {
  orderId: string;
  orderNumber: string;
  items: PreferenceItem[];
  payer: { name: string; email: string; phone?: string };
}) {
  const base = siteUrl();
  const isLocal =
    base.includes("localhost") || base.includes("127.0.0.1");

  // En local MP no acepta auto_return (exige back_urls públicas válidas).
  const body: Record<string, unknown> = {
    items: input.items.map((i) => ({
      id: i.id,
      title: i.title,
      quantity: i.quantity,
      unit_price: Number(i.unit_price.toFixed(2)),
      currency_id: i.currency_id ?? "MXN",
    })),
    payer: {
      name: input.payer.name,
      email: input.payer.email,
      ...(input.payer.phone
        ? { phone: { number: input.payer.phone.replace(/\D/g, "") } }
        : {}),
    },
    external_reference: input.orderNumber,
    metadata: {
      order_id: input.orderId,
      order_number: input.orderNumber,
    },
    back_urls: {
      success: `${base}/checkout/exito`,
      failure: `${base}/checkout/fallo`,
      pending: `${base}/checkout/pendiente`,
    },
    statement_descriptor: "CLEOH",
  };

  if (!isLocal) {
    body.auto_return = "approved";
    body.notification_url = `${base}/api/webhooks/mercadopago`;
  }

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as {
    id?: string;
    init_point?: string;
    sandbox_init_point?: string;
    message?: string;
    error?: string;
  };

  if (!res.ok || !data.id) {
    throw new Error(
      data.message || data.error || `Mercado Pago Preference error (${res.status})`,
    );
  }

  const isTest = accessToken().startsWith("TEST-");
  const initPoint =
    (isTest ? data.sandbox_init_point : data.init_point) ||
    data.init_point ||
    data.sandbox_init_point;

  if (!initPoint) {
    throw new Error("MP no devolvió init_point");
  }

  return {
    preferenceId: data.id,
    initPoint,
  };
}

export async function getMercadoPagoPayment(paymentId: string) {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
    cache: "no-store",
  });

  const data = (await res.json()) as {
    id?: number;
    status?: string;
    external_reference?: string;
    transaction_amount?: number;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message || `Payment fetch failed (${res.status})`);
  }

  return data;
}

export async function refundMercadoPagoPayment(paymentId: string) {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}/refunds`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    cache: "no-store",
  });

  const data = (await res.json()) as {
    id?: number;
    status?: string;
    message?: string;
    cause?: { description?: string }[];
  };

  if (!res.ok) {
    throw new Error(
      data.cause?.[0]?.description ||
        data.message ||
        `Mercado Pago refund falló (${res.status})`,
    );
  }

  return { refundId: data.id, status: data.status };
}
