import "server-only";

function required(name: string) {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Falta ${name} en .env.local`);
  return v;
}

export function paypalConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() &&
      process.env.PAYPAL_CLIENT_SECRET?.trim(),
  );
}

function apiBase() {
  return (
    process.env.PAYPAL_API_BASE?.trim().replace(/\/$/, "") ||
    "https://api-m.sandbox.paypal.com"
  );
}

async function getAccessToken() {
  const clientId = required("NEXT_PUBLIC_PAYPAL_CLIENT_ID");
  const secret = required("PAYPAL_CLIENT_SECRET");
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const data = (await res.json()) as {
    access_token?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(
      data.error_description || `PayPal OAuth falló (${res.status})`,
    );
  }

  return data.access_token;
}

export async function createPayPalOrder(input: {
  orderNumber: string;
  totalCents: number;
  currency?: string;
  description: string;
}) {
  const token = await getAccessToken();
  const value = (input.totalCents / 100).toFixed(2);

  const res = await fetch(`${apiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.orderNumber,
          invoice_id: input.orderNumber,
          description: input.description.slice(0, 127),
          amount: {
            currency_code: input.currency ?? "MXN",
            value,
          },
        },
      ],
      application_context: {
        brand_name: "Cleoh",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
      },
    }),
    cache: "no-store",
  });

  const data = (await res.json()) as {
    id?: string;
    message?: string;
    details?: { description?: string }[];
  };

  if (!res.ok || !data.id) {
    throw new Error(
      data.details?.[0]?.description ||
        data.message ||
        `PayPal create order falló (${res.status})`,
    );
  }

  return { paypalOrderId: data.id };
}

export async function capturePayPalOrder(paypalOrderId: string) {
  const token = await getAccessToken();

  const res = await fetch(
    `${apiBase()}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    purchase_units?: {
      payments?: {
        captures?: { id?: string; status?: string }[];
      };
      invoice_id?: string;
      reference_id?: string;
    }[];
    message?: string;
    details?: { description?: string }[];
  };

  if (!res.ok) {
    throw new Error(
      data.details?.[0]?.description ||
        data.message ||
        `PayPal capture falló (${res.status})`,
    );
  }

  const unit = data.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  const orderNumber = unit?.invoice_id || unit?.reference_id;

  return {
    paypalOrderId: data.id ?? paypalOrderId,
    status: data.status,
    captureId: capture?.id,
    captureStatus: capture?.status,
    orderNumber,
  };
}

export async function refundPayPalCapture(
  captureId: string,
  input?: { amountCents?: number; currency?: string },
) {
  const token = await getAccessToken();

  const body =
    input?.amountCents != null
      ? {
          amount: {
            value: (input.amountCents / 100).toFixed(2),
            currency_code: input.currency ?? "MXN",
          },
        }
      : undefined;

  const res = await fetch(
    `${apiBase()}/v2/payments/captures/${captureId}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    },
  );

  const data = (await res.json()) as {
    id?: string;
    status?: string;
    message?: string;
    details?: { description?: string; issue?: string }[];
  };

  if (!res.ok) {
    throw new Error(
      data.details?.[0]?.description ||
        data.details?.[0]?.issue ||
        data.message ||
        `PayPal refund falló (${res.status})`,
    );
  }

  if (data.status !== "COMPLETED" && data.status !== "PENDING") {
    throw new Error(
      `PayPal no completó el reembolso (estado: ${data.status ?? "desconocido"})`,
    );
  }

  return { refundId: data.id, status: data.status };
}
