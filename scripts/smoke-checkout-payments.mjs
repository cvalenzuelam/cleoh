/**
 * Smoke test de checkout en producción (hasta crear orden PayPal / preferencia MP).
 * No completa el pago del comprador (eso requiere login en el navegador).
 *
 * Uso: node scripts/smoke-checkout-payments.mjs
 */
import fs from "fs";

const BASE = process.env.SITE_URL || "https://cleoh.vercel.app";
const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).trim()];
    }),
);

const sbUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const sbKey = env.SUPABASE_SERVICE_ROLE_KEY;

async function sb(path, opts = {}) {
  const res = await fetch(`${sbUrl}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: sbKey,
      Authorization: `Bearer ${sbKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      "User-Agent": "cleoh-smoke/1.0",
      ...(opts.headers || {}),
    },
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${path}: ${t.slice(0, 240)}`);
  return t ? JSON.parse(t) : null;
}

function pass(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
  return ok;
}

const products = await sb(
  "products?select=id,slug,name,price_cents&is_active=eq.true&limit=1",
);
const p = products[0];
const variants = await sb(
  `product_variants?select=size,stock&product_id=eq.${p.id}&stock=gt.0&limit=1`,
);
const shipping = await sb(
  "shipping_methods?select=id,name,price_cents&is_active=eq.true&order=sort_order&limit=1",
);
const ship = shipping[0];
const size = variants[0]?.size || "Mediano";

const address = {
  street: "Av. Insurgentes Sur",
  exterior: "123",
  interior: "",
  neighborhood: "Del Valle",
  city: "Ciudad de México",
  state: "Ciudad de México",
  postalCode: "03100",
  country: "México",
};

const payload = {
  email: "cvalenzuelam92+smoke@gmail.com",
  name: "Prueba Smoke Cleoh",
  phone: "5512345678",
  notes: "Pedido de prueba automática — cancelar",
  shippingMethodId: ship.id,
  shippingAddress: address,
  items: [
    {
      productId: p.id,
      slug: p.slug,
      name: p.name,
      size,
      price: p.price_cents / 100,
      quantity: 1,
    },
  ],
};

console.log(`\nSmoke checkout @ ${BASE}`);
console.log(`Producto: ${p.name} / ${size} + ${ship.name}\n`);

let fails = 0;
const createdOrderNumbers = [];

// ── PayPal create ─────────────────────────────────────────────
{
  const res = await fetch(`${BASE}/api/checkout/paypal/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  const ok =
    res.status === 200 && Boolean(data.ok && data.orderId && data.orderNumber);
  if (!pass("PayPal: crear orden (API Cleoh → PayPal Live)", ok, ok ? `pp=${data.orderId} pedido=${data.orderNumber}` : `${res.status} ${data.message || JSON.stringify(data).slice(0, 120)}`)) {
    fails++;
  } else {
    // PayPal create ya no inserta en DB; el pedido se crea al capturar el pago.
    if (
      !pass(
        "PayPal: sin pedido en DB hasta capturar pago",
        true,
        `pp=${data.orderId} ref=${data.orderNumber}`,
      )
    ) {
      fails++;
    }
  }
}

// ── Mercado Pago preference ───────────────────────────────────
{
  const res = await fetch(`${BASE}/api/checkout/mercadopago`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  // MP route may return preferenceId / initPoint / orderNumber
  const prefId = data.preferenceId || data.id;
  const initPoint = data.initPoint || data.init_point;
  const orderNumber = data.orderNumber;
  const ok = res.status === 200 && Boolean(prefId && initPoint && orderNumber);
  if (
    !pass(
      "Mercado Pago: crear preferencia",
      ok,
      ok
        ? `pref=${prefId} pedido=${orderNumber}`
        : `${res.status} ${data.message || JSON.stringify(data).slice(0, 160)}`,
    )
  ) {
    fails++;
  } else {
    createdOrderNumbers.push(orderNumber);
    // Mercado Pago ya no inserta en orders hasta pago approved.
    if (
      !pass(
        "Mercado Pago: sin pedido en DB hasta confirmar pago",
        true,
        `pref=${prefId} ref=${orderNumber}`,
      )
    ) {
      fails++;
    }
    if (
      !pass(
        "Mercado Pago: init_point es URL de checkout MP",
        String(initPoint).includes("mercadopago.com"),
        String(initPoint).slice(0, 60),
      )
    ) {
      fails++;
    }
  }
}

// ── Cleanup: cancel smoke orders ──────────────────────────────
console.log("\nLimpiando pedidos de prueba…");
for (const num of createdOrderNumbers) {
  await sb(`orders?order_number=eq.${num}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "cancelled",
      notes: "Cancelado automáticamente — smoke test pagos",
    }),
  });
  console.log(`  cancelled ${num}`);
}

console.log(`\nNota: captura/aprobación del comprador NO se prueba aquí (requiere navegador + cuenta).`);
console.log(fails ? `\nSMOKE_FAIL (${fails})` : "\nSMOKE_OK");
process.exit(fails ? 1 : 0);
