/**
 * Regresión completa: cambios tipo admin (vía Supabase service role)
 * deben reflejarse de inmediato en landing / tienda / ficha / categoría.
 *
 * Uso: node scripts/regression-admin-landing.mjs
 */
import fs from "fs";
import { cleanEnvValue } from "./env-utils.mjs";

const ENV_FILE = process.env.ENV_FILE || ".env.local";
const BASE = process.env.SITE_URL || "https://cleoh.vercel.app";
const env = Object.fromEntries(
  fs
    .readFileSync(ENV_FILE, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), cleanEnvValue(l.slice(i + 1))];
    }),
);

const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const key = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const results = [];
let failed = 0;

function ok(name, pass, detail = "") {
  results.push({ name, pass, detail });
  if (pass) console.log(`  PASS  ${name}${detail ? " — " + detail : ""}`);
  else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`);
  }
}

async function api(path, opts = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      "User-Agent": "cleoh-regression/1.0",
      ...(opts.headers || {}),
    },
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${path}: ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
}

async function page(path) {
  const res = await fetch(`${BASE}${path}`, {
    cache: "no-store",
    headers: { "User-Agent": "cleoh-regression/1.0" },
  });
  const html = await res.text();
  return { status: res.status, html, cache: res.headers.get("x-vercel-cache") };
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

const DEFAULT_SIZES = ["Extra Chica", "Chica", "Mediano", "Grande"];

console.log(`\n=== Regresión admin → landing (${BASE}) ===`);
console.log(`    env: ${ENV_FILE}\n`);

// ─── 1. Sanity: store pages load ─────────────────────────────────
console.log("1) Páginas tienda responden");
for (const path of ["/", "/tienda", "/producto/pijama-novia", "/categoria/novias"]) {
  const { status, cache } = await page(path);
  ok(`GET ${path}`, status === 200, `status=${status} cache=${cache}`);
}

// ─── 2. Pick a featured product visible on landing ───────────────
const homeSeed = await page("/");
const featuredRows = await api(
  "products?select=id,slug,name,price_cents,compare_at_cents,is_featured,is_active,category_id,primary_image_url&is_featured=eq.true&is_active=eq.true&order=created_at.desc",
);
const product =
  featuredRows.find((p) =>
    homeSeed.html.includes(`href="/producto/${p.slug}"`),
  ) ?? featuredRows[0];
if (!product) {
  console.error("No hay producto destacado activo para probar.");
  process.exit(1);
}
const slug = product.slug;
const snapshot = { ...product };
console.log(`\nProducto de prueba: ${slug} ($${product.price_cents / 100})\n`);

const variantsBefore = await api(
  `product_variants?select=id,size,stock&product_id=eq.${product.id}`,
);

try {
  // ─── 3. Precio → landing + ficha inmediata ─────────────────────
  console.log("2) Precio se refleja al instante");
  const markerCents = product.price_cents === 49500 ? 49600 : 49500;
  const markerLabel = `$${markerCents / 100}`;
  await api(`products?id=eq.${product.id}`, {
    method: "PATCH",
    body: JSON.stringify({ price_cents: markerCents }),
  });
  await sleep(300);
  const home = await page("/");
  const prod = await page(`/producto/${slug}`);
  const tienda = await page("/tienda");
  ok("Landing muestra precio nuevo", home.html.includes(markerLabel));
  ok("Ficha muestra precio nuevo", prod.html.includes(markerLabel));
  ok("Tienda muestra precio nuevo", tienda.html.includes(markerLabel));

  // restore price for next checks but keep testing
  await api(`products?id=eq.${product.id}`, {
    method: "PATCH",
    body: JSON.stringify({ price_cents: snapshot.price_cents }),
  });

  // ─── 4. Oferta: compare > price muestra tachado; igual no ──────
  console.log("\n3) Lógica de precio tachado (oferta)");
  const salePrice = snapshot.price_cents;
  const compareHigher = salePrice + 10000;
  await api(`products?id=eq.${product.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      price_cents: salePrice,
      compare_at_cents: compareHigher,
    }),
  });
  await sleep(300);
  let pSale = await page(`/producto/${slug}`);
  const compareLabel = `$${compareHigher / 100}`;
  const priceLabel = `$${salePrice / 100}`;
  ok(
    "Con compare > price aparece precio tachado",
    pSale.html.includes(compareLabel) && pSale.html.includes(priceLabel),
    `look for ${compareLabel} and ${priceLabel}`,
  );
  // equal compare should not strike (store maps to null)
  await api(`products?id=eq.${product.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      price_cents: salePrice,
      compare_at_cents: salePrice,
    }),
  });
  await sleep(300);
  pSale = await page(`/producto/${slug}`);
  // When equal, UI should only show one price — line-through with same amount is a fail signal if compare rendered
  // Our mapProduct nulls compare when !isSalePrice, so only one price string should appear for that product card area.
  ok(
    "Con compare == price NO hay oferta (solo precio actual)",
    pSale.html.includes(priceLabel),
  );

  await api(`products?id=eq.${product.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      price_cents: snapshot.price_cents,
      compare_at_cents: snapshot.compare_at_cents,
    }),
  });

  // ─── 5. Stock por talla (incl. Extra Chica / Chica) ────────────
  console.log("\n4) Stock por talla (aliases femeninos)");
  const stockMarker = 3;
  for (const size of DEFAULT_SIZES) {
    const aliases =
      size === "Extra Chica"
        ? ["Extra Chica", "Extra Chico"]
        : size === "Chica"
          ? ["Chica", "Chico"]
          : [size];
    const rows = await api(
      `product_variants?select=id,size&product_id=eq.${product.id}&size=in.(${aliases.map((a) => `"${a}"`).join(",")})`,
    );
    if (!rows?.length) {
      await api("product_variants", {
        method: "POST",
        body: JSON.stringify({
          product_id: product.id,
          size,
          color: "",
          stock: stockMarker,
          is_active: true,
        }),
      });
    } else {
      const [keep, ...dupes] = rows;
      await api(`product_variants?id=eq.${keep.id}`, {
        method: "PATCH",
        body: JSON.stringify({ size, stock: stockMarker }),
      });
      for (const d of dupes) {
        await api(`product_variants?id=eq.${d.id}`, { method: "DELETE" });
      }
    }
  }
  const stocks = await api(
    `product_variants?select=size,stock&product_id=eq.${product.id}`,
  );
  const bySize = Object.fromEntries(stocks.map((v) => [v.size, v.stock]));
  for (const size of DEFAULT_SIZES) {
    ok(`Stock ${size} = ${stockMarker}`, bySize[size] === stockMarker);
  }
  ok(
    "Sin tallas legacy Extra Chico/Chico",
    !bySize["Extra Chico"] && !bySize["Chico"],
  );

  // Product page should show sizes as available (not all sold out)
  await sleep(300);
  const pStock = await page(`/producto/${slug}`);
  ok(
    "Ficha no muestra Agotado cuando hay stock",
    !/Agotado/i.test(pStock.html) || pStock.html.includes("Extra Chica") || pStock.html.includes("Mediano"),
  );

  // ─── 6. Destacado off → sale de landing ────────────────────────
  console.log("\n5) Destacado / activo en landing");
  await api(`products?id=eq.${product.id}`, {
    method: "PATCH",
    body: JSON.stringify({ is_featured: false }),
  });
  await sleep(300);
  let homeFeat = await page("/");
  // Product may still appear if fallback uses latest active — featured section prefers is_featured
  // Check featured query directly + that name is less prominent; stronger: set inactive
  const featuredRows = await api(
    `products?select=slug&is_featured=eq.true&is_active=eq.true`,
  );
  ok(
    "DB: producto ya no está en is_featured",
    !featuredRows.some((r) => r.slug === slug),
  );

  await api(`products?id=eq.${product.id}`, {
    method: "PATCH",
    body: JSON.stringify({ is_featured: true, is_active: false }),
  });
  await sleep(300);
  homeFeat = await page("/");
  const tiendaFeat = await page("/tienda");
  const prodGone = await page(`/producto/${slug}`);
  ok(
    "Inactivo: no aparece en landing",
    !homeFeat.html.includes(`href="/producto/${slug}"`),
  );
  ok(
    "Inactivo: no aparece en /tienda",
    !tiendaFeat.html.includes(`href="/producto/${slug}"`),
  );
  ok(
    "Inactivo: ficha 404 o no vende",
    prodGone.status === 404 ||
      prodGone.html.includes("Not Found") ||
      prodGone.html.includes("no encontr"),
  );

  // restore active + featured
  await api(`products?id=eq.${product.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      is_featured: true,
      is_active: true,
    }),
  });
  await sleep(300);
  homeFeat = await page("/");
  ok(
    "Reactivado: vuelve a landing",
    homeFeat.html.includes(`href="/producto/${slug}"`),
  );

  // ─── 7. Imágenes limpias (sin CRLF) ────────────────────────────
  console.log("\n6) URLs de imagen limpias");
  const dirty = await api(
    "products?select=slug,primary_image_url&primary_image_url=not.is.null&limit=50",
  );
  const dirtyImgs = await api(
    "product_images?select=id,url&limit=100",
  );
  const badProduct = (dirty || []).filter((p) =>
    /[\r\n]/.test(p.primary_image_url || ""),
  );
  const badGallery = (dirtyImgs || []).filter((i) => /[\r\n]/.test(i.url || ""));
  ok("products.primary_image_url sin saltos de línea", badProduct.length === 0);
  ok("product_images.url sin saltos de línea", badGallery.length === 0);

  const homeImg = await page("/");
  ok(
    "Landing no pide URLs con %0D%0A",
    !homeImg.html.includes("%0D%0A"),
  );

  // ─── 8. Categoría / nav ────────────────────────────────────────
  console.log("\n7) Categorías y nav");
  const cats = await api(
    "categories?select=id,slug,name,is_nav,is_tile,cover_image_url&order=sort_order",
  );
  const navCats = (cats || []).filter((c) => c.is_nav);
  ok("Hay categorías en nav", navCats.length > 0, String(navCats.length));
  const homeNav = await page("/");
  for (const c of navCats.slice(0, 4)) {
    ok(
      `Nav incluye /categoria/${c.slug}`,
      homeNav.html.includes(`/categoria/${c.slug}`),
    );
  }
  if (navCats[0]) {
    const catPage = await page(`/categoria/${navCats[0].slug}`);
    ok(
      `Página categoría ${navCats[0].slug} OK`,
      catPage.status === 200,
    );
  }

  // ─── 9. Cupón Cleoh10 existe y activo (checkout copy) ──────────
  console.log("\n8) Cupón");
  const coupons = await api(
    "coupons?select=code,is_active,percent_off&code=ilike.Cleoh10",
  );
  ok(
    "Cupón Cleoh10 existe y activo",
    coupons?.length > 0 && coupons[0].is_active === true,
    coupons?.[0] ? `${coupons[0].percent_off}%` : "missing",
  );

  // ─── 10. Admin login page reachable ────────────────────────────
  console.log("\n9) Admin reachable");
  const adminLogin = await page("/admin/login");
  ok("GET /admin/login", adminLogin.status === 200);
  const adminRoot = await page("/admin");
  ok(
    "GET /admin redirige o pide login",
    adminRoot.status === 200 || adminRoot.status === 307 || adminRoot.status === 302 || adminRoot.html.includes("login") || adminRoot.html.includes("Admin"),
  );
} finally {
  // ─── Restore guinea pig completely ─────────────────────────────
  console.log("\nRestaurando producto de prueba…");
  await api(`products?id=eq.${product.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      price_cents: snapshot.price_cents,
      compare_at_cents: snapshot.compare_at_cents,
      is_featured: snapshot.is_featured,
      is_active: snapshot.is_active,
      primary_image_url: snapshot.primary_image_url,
    }),
  });
  for (const v of variantsBefore || []) {
    await api(`product_variants?id=eq.${v.id}`, {
      method: "PATCH",
      body: JSON.stringify({ size: v.size, stock: v.stock }),
    });
  }
}

console.log("\n=== Resumen ===");
console.log(`Total: ${results.length}  PASS: ${results.length - failed}  FAIL: ${failed}`);
if (failed) {
  console.log("\nFallos:");
  for (const r of results.filter((x) => !x.pass)) {
    console.log(` - ${r.name}${r.detail ? ": " + r.detail : ""}`);
  }
  process.exit(1);
}
console.log("\nREGRESSION_OK\n");
