import "server-only";

import { Resend } from "resend";
import { site } from "@/data/site";
import { sizeDisplayName } from "@/lib/admin/products";
import { formatOrderMoney } from "@/lib/orders/format";
import { createServiceClient } from "@/lib/supabase/server";

type Address = {
  street?: string;
  exterior?: string;
  interior?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  methodName?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildOrderPaidHtml(input: {
  customerName: string;
  orderNumber: string;
  items: {
    product_name: string;
    variant_label: string | null;
    quantity: number;
    line_total_cents: number;
  }[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  couponCode: string | null;
  address: Address;
  notes: string | null;
  shopUrl: string;
}) {
  // Colores Cleoh (misma paleta que la tienda)
  const ink = "#1a1416";
  const inkSoft = "#3d3236";
  const rose = "#8f5a66";
  const blush = "#c9a8ad";
  const petal = "#f3eaeb";
  const porcelain = "#faf7f6";
  const mist = "#ebe2e3";

  // Fuentes de la web: Cormorant Garamond + Outfit
  const display =
    "'Cormorant Garamond',Georgia,'Times New Roman',serif";
  const body = "'Outfit',Helvetica,Arial,sans-serif";

  const rows = input.items
    .map(
      (item) => `
      <tr>
        <td style="padding:18px 0;border-bottom:1px solid ${mist};vertical-align:top;">
          <p style="margin:0;font-family:${display};font-size:22px;font-weight:500;letter-spacing:0.02em;line-height:1.25;color:${ink};">
            ${escapeHtml(item.product_name)}
          </p>
          <p style="margin:6px 0 0;font-family:${body};font-size:12px;font-weight:400;letter-spacing:0.06em;color:${rose};">
            ${
              item.variant_label
                ? `Talla ${escapeHtml(sizeDisplayName(item.variant_label))} · `
                : ""
            }× ${item.quantity}
          </p>
        </td>
        <td style="padding:18px 0;border-bottom:1px solid ${mist};vertical-align:top;text-align:right;white-space:nowrap;">
          <p style="margin:4px 0 0;font-family:${body};font-size:14px;font-weight:500;color:${ink};">
            ${formatOrderMoney(item.line_total_cents)}
          </p>
        </td>
      </tr>`,
    )
    .join("");

  const streetLine = [
    input.address.street?.trim(),
    input.address.exterior?.trim()
      ? `No. ${input.address.exterior.trim()}`
      : "",
    input.address.interior?.trim()
      ? `Int. ${input.address.interior.trim()}`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const addressBlock = input.address.street
    ? `
      <p style="margin:0 0 4px;font-family:${body};font-size:14px;font-weight:400;line-height:1.65;color:${inkSoft};">
        ${escapeHtml(streetLine)}
      </p>
      <p style="margin:0 0 4px;font-family:${body};font-size:14px;font-weight:400;line-height:1.65;color:${inkSoft};">
        ${escapeHtml(input.address.neighborhood ?? "")}
      </p>
      <p style="margin:0 0 4px;font-family:${body};font-size:14px;font-weight:400;line-height:1.65;color:${inkSoft};">
        ${escapeHtml(input.address.city ?? "")}, ${escapeHtml(input.address.state ?? "")} ${escapeHtml(input.address.postalCode ?? "")}
      </p>
      <p style="margin:0;font-family:${body};font-size:14px;font-weight:400;line-height:1.65;color:${inkSoft};">
        ${escapeHtml(input.address.country || "México")}
      </p>
      ${
        input.address.methodName
          ? `<p style="margin:16px 0 0;font-family:${body};font-size:11px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:${rose};">
              ${escapeHtml(input.address.methodName)}
            </p>`
          : ""
      }`
    : `<p style="margin:0;font-family:${body};font-size:14px;color:${inkSoft};">Sin dirección registrada.</p>`;

  const firstName = escapeHtml(
    (input.customerName || "hola").trim().split(/\s+/)[0] || "hola",
  );
  const orderNumber = escapeHtml(input.orderNumber);
  const shopUrl = escapeHtml(input.shopUrl);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>Pedido confirmado · Cleoh</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Outfit:wght@300;400;500&display=swap" rel="stylesheet" />
  <style type="text/css">
    @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Outfit:wght@300;400;500&display=swap");
  </style>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Georgia, 'Times New Roman', serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:${porcelain};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Tu pedido ${orderNumber} en Cleoh está confirmado.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${porcelain};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:${porcelain};">

          <!-- Marca + hero (una sola composición) -->
          <tr>
            <td style="padding:48px 32px 36px;text-align:center;background-color:${petal};background-image:linear-gradient(165deg,${petal} 0%,${porcelain} 72%);">
              <p style="margin:0;font-family:${display};font-size:32px;font-weight:400;letter-spacing:0.16em;text-transform:uppercase;color:${ink};line-height:1.2;padding-left:0.16em;">
                CLEOH
              </p>
              <p style="margin:10px 0 0;font-family:${body};font-size:11px;font-weight:300;letter-spacing:0.2em;text-transform:uppercase;color:${rose};">
                ${escapeHtml(site.tagline)}
              </p>
              <h1 style="margin:28px 0 0;font-family:${display};font-size:44px;font-weight:500;letter-spacing:0.01em;line-height:1.1;color:${ink};">
                ¡Gracias, ${firstName}!
              </h1>
              <p style="margin:16px auto 0;max-width:380px;font-family:${body};font-size:15px;font-weight:300;line-height:1.75;color:${inkSoft};">
                Recibimos tu pago. Estamos preparando tu pedido con cuidado.
              </p>
            </td>
          </tr>

          <!-- Pedido -->
          <tr>
            <td style="padding:36px 32px 8px;text-align:center;">
              <p style="margin:0;font-family:${body};font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:${blush};">
                Pedido
              </p>
              <p style="margin:10px 0 0;font-family:${display};font-size:26px;font-weight:500;letter-spacing:0.06em;color:${ink};">
                ${orderNumber}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 48px 28px;">
              <div style="height:1px;background:${mist};line-height:1px;font-size:1px;">&nbsp;</div>
            </td>
          </tr>

          <!-- Piezas -->
          <tr>
            <td style="padding:0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${rows}
              </table>
            </td>
          </tr>

          <!-- Totales -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-family:${body};font-size:13px;font-weight:300;color:${inkSoft};">Subtotal</td>
                  <td style="padding:6px 0;font-family:${body};font-size:13px;font-weight:400;text-align:right;color:${ink};">${formatOrderMoney(input.subtotalCents)}</td>
                </tr>
                ${
                  input.discountCents > 0
                    ? `<tr>
                  <td style="padding:6px 0;font-family:${body};font-size:13px;font-weight:300;color:${inkSoft};">Descuento${
                    input.couponCode
                      ? ` · ${escapeHtml(input.couponCode)}`
                      : ""
                  }</td>
                  <td style="padding:6px 0;font-family:${body};font-size:13px;font-weight:400;text-align:right;color:${ink};">-${formatOrderMoney(input.discountCents)}</td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="padding:6px 0;font-family:${body};font-size:13px;font-weight:300;color:${inkSoft};">Envío</td>
                  <td style="padding:6px 0;font-family:${body};font-size:13px;font-weight:400;text-align:right;color:${ink};">${formatOrderMoney(input.shippingCents)}</td>
                </tr>
                <tr>
                  <td style="padding:18px 0 0;font-family:${display};font-size:24px;font-weight:500;color:${ink};">Total</td>
                  <td style="padding:18px 0 0;font-family:${display};font-size:24px;font-weight:500;text-align:right;color:${ink};">${formatOrderMoney(input.totalCents)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 48px;">
              <div style="height:1px;background:${mist};line-height:1px;font-size:1px;">&nbsp;</div>
            </td>
          </tr>

          <!-- Envío -->
          <tr>
            <td style="padding:0 32px 8px;">
              <p style="margin:0 0 14px;font-family:${body};font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:${blush};">
                Envío
              </p>
              ${addressBlock}
            </td>
          </tr>

          ${
            input.notes
              ? `<tr>
            <td style="padding:28px 32px 0;">
              <p style="margin:0 0 10px;font-family:${body};font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:${blush};">
                Nota
              </p>
              <p style="margin:0;font-family:${body};font-size:14px;font-weight:300;line-height:1.7;color:${inkSoft};white-space:pre-wrap;">
                ${escapeHtml(input.notes)}
              </p>
            </td>
          </tr>`
              : ""
          }

          <!-- CTA -->
          <tr>
            <td style="padding:40px 32px 48px;text-align:center;">
              <a href="${shopUrl}" style="display:inline-block;padding:15px 32px;background:${ink};color:${porcelain};font-family:${body};font-size:11px;font-weight:500;letter-spacing:0.2em;text-decoration:none;text-transform:uppercase;">
                Seguir comprando
              </a>
            </td>
          </tr>

          <!-- Footer suave -->
          <tr>
            <td style="padding:28px 32px 40px;text-align:center;border-top:1px solid ${mist};">
              <p style="margin:0;font-family:${display};font-size:18px;font-weight:400;letter-spacing:0.16em;text-transform:uppercase;color:${rose};padding-left:0.16em;">
                CLEOH
              </p>
              <p style="margin:12px 0 0;font-family:${body};font-size:12px;font-weight:300;line-height:1.7;color:${inkSoft};">
                Con cariño,<br />el equipo Cleoh
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildOrderShippedHtml(input: {
  customerName: string;
  orderNumber: string;
  trackingCode: string;
  trackingUrl: string;
  methodName?: string;
  shopUrl: string;
}) {
  const ink = "#1a1416";
  const inkSoft = "#3d3236";
  const rose = "#8f5a66";
  const blush = "#c9a8ad";
  const petal = "#f3eaeb";
  const porcelain = "#faf7f6";
  const mist = "#ebe2e3";
  const display =
    "'Cormorant Garamond',Georgia,'Times New Roman',serif";
  const body = "'Outfit',Helvetica,Arial,sans-serif";

  const firstName = escapeHtml(
    (input.customerName || "hola").trim().split(/\s+/)[0] || "hola",
  );
  const orderNumber = escapeHtml(input.orderNumber);
  const trackingCode = escapeHtml(input.trackingCode);
  const trackingUrl = escapeHtml(input.trackingUrl);
  const shopUrl = escapeHtml(input.shopUrl);
  const methodName = input.methodName
    ? escapeHtml(input.methodName)
    : null;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>Tu pedido va en camino · Cleoh</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Outfit:wght@300;400;500&display=swap" rel="stylesheet" />
  <style type="text/css">
    @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Outfit:wght@300;400;500&display=swap");
  </style>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Georgia, 'Times New Roman', serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:${porcelain};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Tu pedido ${orderNumber} ya salió. Código de rastreo: ${trackingCode}.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${porcelain};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:${porcelain};">

          <tr>
            <td style="padding:48px 32px 36px;text-align:center;background-color:${petal};background-image:linear-gradient(165deg,${petal} 0%,${porcelain} 72%);">
              <p style="margin:0;font-family:${display};font-size:32px;font-weight:400;letter-spacing:0.16em;text-transform:uppercase;color:${ink};line-height:1.2;padding-left:0.16em;">
                CLEOH
              </p>
              <p style="margin:10px 0 0;font-family:${body};font-size:11px;font-weight:300;letter-spacing:0.2em;text-transform:uppercase;color:${rose};">
                ${escapeHtml(site.tagline)}
              </p>
              <h1 style="margin:28px 0 0;font-family:${display};font-size:44px;font-weight:500;letter-spacing:0.01em;line-height:1.1;color:${ink};">
                ¡Va en camino, ${firstName}!
              </h1>
              <p style="margin:16px auto 0;max-width:380px;font-family:${body};font-size:15px;font-weight:300;line-height:1.75;color:${inkSoft};">
                Tu pedido ya salió. Aquí tienes los datos para seguirlo.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 32px 8px;text-align:center;">
              <p style="margin:0;font-family:${body};font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:${blush};">
                Pedido
              </p>
              <p style="margin:10px 0 0;font-family:${display};font-size:26px;font-weight:500;letter-spacing:0.06em;color:${ink};">
                ${orderNumber}
              </p>
              ${
                methodName
                  ? `<p style="margin:12px 0 0;font-family:${body};font-size:12px;font-weight:400;letter-spacing:0.08em;color:${rose};">
                      ${methodName}
                    </p>`
                  : ""
              }
            </td>
          </tr>

          <tr>
            <td style="padding:8px 48px 28px;">
              <div style="height:1px;background:${mist};line-height:1px;font-size:1px;">&nbsp;</div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 8px;text-align:center;">
              <p style="margin:0 0 10px;font-family:${body};font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:${blush};">
                Código de rastreo
              </p>
              <p style="margin:0;font-family:${body};font-size:22px;font-weight:500;letter-spacing:0.08em;color:${ink};">
                ${trackingCode}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 48px;text-align:center;">
              <a href="${trackingUrl}" style="display:inline-block;padding:15px 32px;background:${ink};color:${porcelain};font-family:${body};font-size:11px;font-weight:500;letter-spacing:0.2em;text-decoration:none;text-transform:uppercase;">
                Rastrear envío
              </a>
              <p style="margin:20px 0 0;font-family:${body};font-size:12px;font-weight:300;line-height:1.7;color:${inkSoft};word-break:break-all;">
                O copia este enlace:<br />
                <a href="${trackingUrl}" style="color:${rose};text-decoration:underline;">${trackingUrl}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 40px;text-align:center;">
              <a href="${shopUrl}" style="font-family:${body};font-size:12px;font-weight:400;letter-spacing:0.12em;text-transform:uppercase;color:${inkSoft};text-decoration:none;">
                Visitar la tienda
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 40px;text-align:center;border-top:1px solid ${mist};">
              <p style="margin:0;font-family:${display};font-size:18px;font-weight:400;letter-spacing:0.16em;text-transform:uppercase;color:${rose};padding-left:0.16em;">
                CLEOH
              </p>
              <p style="margin:12px 0 0;font-family:${body};font-size:12px;font-weight:300;line-height:1.7;color:${inkSoft};">
                Con cariño,<br />el equipo Cleoh
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildOrderCancelledHtml(input: {
  customerName: string;
  orderNumber: string;
  totalCents: number;
  refunded: boolean;
  shopUrl: string;
}) {
  const ink = "#1a1416";
  const inkSoft = "#3d3236";
  const rose = "#8f5a66";
  const blush = "#c9a8ad";
  const petal = "#f3eaeb";
  const porcelain = "#faf7f6";
  const mist = "#ebe2e3";
  const display =
    "'Cormorant Garamond',Georgia,'Times New Roman',serif";
  const body = "'Outfit',Helvetica,Arial,sans-serif";

  const firstName = escapeHtml(
    (input.customerName || "hola").trim().split(/\s+/)[0] || "hola",
  );
  const orderNumber = escapeHtml(input.orderNumber);
  const shopUrl = escapeHtml(input.shopUrl);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>Pedido cancelado · Cleoh</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Outfit:wght@300;400;500&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:${porcelain};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Tu pedido ${orderNumber} fue cancelado${input.refunded ? " y reembolsado" : ""}.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${porcelain};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:${porcelain};">

          <tr>
            <td style="padding:48px 32px 36px;text-align:center;background-color:${petal};background-image:linear-gradient(165deg,${petal} 0%,${porcelain} 72%);">
              <p style="margin:0;font-family:${display};font-size:32px;font-weight:400;letter-spacing:0.16em;text-transform:uppercase;color:${ink};line-height:1.2;padding-left:0.16em;">
                CLEOH
              </p>
              <p style="margin:10px 0 0;font-family:${body};font-size:11px;font-weight:300;letter-spacing:0.2em;text-transform:uppercase;color:${rose};">
                ${escapeHtml(site.tagline)}
              </p>
              <h1 style="margin:28px 0 0;font-family:${display};font-size:44px;font-weight:500;letter-spacing:0.01em;line-height:1.1;color:${ink};">
                Pedido cancelado
              </h1>
              <p style="margin:16px auto 0;max-width:380px;font-family:${body};font-size:15px;font-weight:300;line-height:1.75;color:${inkSoft};">
                Hola ${firstName}, tu pedido ${orderNumber} fue cancelado.
                ${
                  input.refunded
                    ? ` El reembolso de ${formatOrderMoney(input.totalCents)} se procesará al mismo método de pago.`
                    : ""
                }
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 48px 28px;">
              <div style="height:1px;background:${mist};line-height:1px;font-size:1px;">&nbsp;</div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 8px;text-align:center;">
              <p style="margin:0 0 10px;font-family:${body};font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:${blush};">
                Pedido
              </p>
              <p style="margin:0;font-family:${display};font-size:26px;font-weight:500;letter-spacing:0.06em;color:${ink};">
                ${orderNumber}
              </p>
              ${
                input.refunded
                  ? `<p style="margin:16px 0 0;font-family:${body};font-size:14px;font-weight:300;line-height:1.7;color:${inkSoft};">
                      Si no ves el reembolso en unos días, revisa con tu banco o PayPal.
                    </p>`
                  : ""
              }
            </td>
          </tr>

          <tr>
            <td style="padding:40px 32px 48px;text-align:center;">
              <a href="${shopUrl}" style="display:inline-block;padding:15px 32px;background:${ink};color:${porcelain};font-family:${body};font-size:11px;font-weight:500;letter-spacing:0.2em;text-decoration:none;text-transform:uppercase;">
                Visitar la tienda
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 40px;text-align:center;border-top:1px solid ${mist};">
              <p style="margin:0;font-family:${display};font-size:18px;font-weight:400;letter-spacing:0.16em;text-transform:uppercase;color:${rose};padding-left:0.16em;">
                CLEOH
              </p>
              <p style="margin:12px 0 0;font-family:${body};font-size:12px;font-weight:300;line-height:1.7;color:${inkSoft};">
                Con cariño,<br />el equipo Cleoh
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOrderPaidEmail(orderId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const notify = process.env.ORDER_NOTIFY_EMAIL?.trim();

  if (!apiKey || !from) {
    console.warn(
      "[email] Falta RESEND_API_KEY o EMAIL_FROM — se omite correo de pedido.",
    );
    return { sent: false as const, reason: "missing_config" as const };
  }

  const supabase = createServiceClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, email, customer_name, shipping_address, subtotal_cents, discount_cents, shipping_cents, total_cents, coupon_code, notes",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order?.email) {
    console.error("[email] Pedido no encontrado o sin email", error?.message);
    return { sent: false as const, reason: "order_missing" as const };
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, variant_label, quantity, line_total_cents")
    .eq("order_id", order.id);

  const shopUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || site.url;

  const html = buildOrderPaidHtml({
    customerName: order.customer_name || "hola",
    orderNumber: order.order_number,
    items: items ?? [],
    subtotalCents: order.subtotal_cents,
    discountCents: order.discount_cents,
    shippingCents: order.shipping_cents,
    totalCents: order.total_cents,
    couponCode: order.coupon_code,
    address: (order.shipping_address ?? {}) as Address,
    notes: order.notes,
    shopUrl: `${shopUrl}/tienda`,
  });

  const resend = new Resend(apiKey);
  const subject = `¡Gracias! Pedido ${order.order_number} · Cleoh`;

  try {
    const { error: sendError } = await resend.emails.send({
      from,
      to: [order.email],
      ...(notify ? { bcc: [notify] } : {}),
      subject,
      html,
    });

    if (sendError) {
      console.error("[email] Resend error", sendError);
      return { sent: false as const, reason: "resend_error" as const };
    }

    return { sent: true as const };
  } catch (e) {
    console.error("[email] send failed", e);
    return { sent: false as const, reason: "send_failed" as const };
  }
}

export async function sendOrderShippedEmail(orderId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const notify = process.env.ORDER_NOTIFY_EMAIL?.trim();

  if (!apiKey || !from) {
    console.warn(
      "[email] Falta RESEND_API_KEY o EMAIL_FROM — se omite correo de envío.",
    );
    return { sent: false as const, reason: "missing_config" as const };
  }

  const supabase = createServiceClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, email, customer_name, shipping_address, tracking_code, tracking_url",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order?.email) {
    console.error("[email] Pedido no encontrado o sin email", error?.message);
    return { sent: false as const, reason: "order_missing" as const };
  }

  if (!order.tracking_code || !order.tracking_url) {
    console.error("[email] Pedido sin datos de rastreo");
    return { sent: false as const, reason: "tracking_missing" as const };
  }

  const address = (order.shipping_address ?? {}) as Address;
  const shopUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || site.url;

  const html = buildOrderShippedHtml({
    customerName: order.customer_name || "hola",
    orderNumber: order.order_number,
    trackingCode: order.tracking_code,
    trackingUrl: order.tracking_url,
    methodName: address.methodName,
    shopUrl: `${shopUrl}/tienda`,
  });

  const resend = new Resend(apiKey);
  const subject = `Tu pedido va en camino · ${order.order_number} · Cleoh`;

  try {
    const { error: sendError } = await resend.emails.send({
      from,
      to: [order.email],
      ...(notify ? { bcc: [notify] } : {}),
      subject,
      html,
    });

    if (sendError) {
      console.error("[email] Resend error (shipped)", sendError);
      return { sent: false as const, reason: "resend_error" as const };
    }

    return { sent: true as const };
  } catch (e) {
    console.error("[email] shipped send failed", e);
    return { sent: false as const, reason: "send_failed" as const };
  }
}

export async function sendOrderCancelledEmail(orderId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const notify = process.env.ORDER_NOTIFY_EMAIL?.trim();

  if (!apiKey || !from) {
    console.warn(
      "[email] Falta RESEND_API_KEY o EMAIL_FROM — se omite correo de cancelación.",
    );
    return { sent: false as const, reason: "missing_config" as const };
  }

  const supabase = createServiceClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_number, email, customer_name, total_cents, status")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order?.email) {
    console.error("[email] Pedido no encontrado o sin email", error?.message);
    return { sent: false as const, reason: "order_missing" as const };
  }

  const shopUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || site.url;

  const html = buildOrderCancelledHtml({
    customerName: order.customer_name || "hola",
    orderNumber: order.order_number,
    totalCents: order.total_cents,
    refunded: order.status === "refunded",
    shopUrl: `${shopUrl}/tienda`,
  });

  const resend = new Resend(apiKey);
  const subject =
    order.status === "refunded"
      ? `Pedido cancelado y reembolsado · ${order.order_number} · Cleoh`
      : `Pedido cancelado · ${order.order_number} · Cleoh`;

  try {
    const { error: sendError } = await resend.emails.send({
      from,
      to: [order.email],
      ...(notify ? { bcc: [notify] } : {}),
      subject,
      html,
    });

    if (sendError) {
      console.error("[email] Resend error (cancelled)", sendError);
      return { sent: false as const, reason: "resend_error" as const };
    }

    return { sent: true as const };
  } catch (e) {
    console.error("[email] cancelled send failed", e);
    return { sent: false as const, reason: "send_failed" as const };
  }
}
