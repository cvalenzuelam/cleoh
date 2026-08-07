import "server-only";

import { Resend } from "resend";
import type { CartItem } from "@/lib/cart/types";
import { formatCartMoney } from "@/lib/cart/types";
import {
  body,
  emailButton,
  emailLayout,
  emailSectionLabel,
  escapeHtml,
  getEmailSiteUrl,
  ink,
  inkSoft,
  mist,
} from "@/lib/email/brand";
import { getEmailConfig } from "@/lib/email/config";

type AbandonedCartItem = Pick<
  CartItem,
  "name" | "size" | "quantity" | "price"
>;

function buildItemsHtml(items: AbandonedCartItem[]) {
  const rows = items
    .slice(0, 6)
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${mist};font-family:${body};font-size:14px;color:${ink};">
        ${escapeHtml(item.name)}
        <span style="color:${inkSoft};"> · Talla ${escapeHtml(item.size)}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid ${mist};font-family:${body};font-size:13px;color:${inkSoft};text-align:center;width:48px;">
        ×${item.quantity}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid ${mist};font-family:${body};font-size:13px;color:${ink};text-align:right;width:96px;">
        ${escapeHtml(formatCartMoney(item.price * item.quantity))}
      </td>
    </tr>`,
    )
    .join("");

  const extra =
    items.length > 6
      ? `<p style="margin:12px 0 0;font-family:${body};font-size:12px;color:${inkSoft};">+ ${items.length - 6} artículo(s) más</p>`
      : "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      ${rows}
    </table>${extra}`;
}

export async function sendAbandonedCartEmail(input: {
  email: string;
  items: AbandonedCartItem[];
  subtotalCents: number;
  recoveryToken: string;
}) {
  const { apiKey, from, configured } = getEmailConfig();
  if (!configured) {
    console.warn(
      "[email] Falta RESEND_API_KEY o EMAIL_FROM — se omite carrito abandonado.",
    );
    return { sent: false as const, reason: "missing_config" as const };
  }

  if (!input.items.length) {
    return { sent: false as const, reason: "empty_cart" as const };
  }

  const siteUrl = getEmailSiteUrl();
  const recoverUrl = `${siteUrl}/carrito?recover=${input.recoveryToken}`;
  const subtotal = formatCartMoney(input.subtotalCents / 100);

  const bodyContent = `
    <tr>
      <td style="padding:8px 32px 0;">
        ${emailSectionLabel("Tu carrito")}
        ${buildItemsHtml(input.items)}
        <p style="margin:16px 0 0;font-family:${body};font-size:14px;font-weight:500;color:${ink};text-align:right;">
          Subtotal · ${escapeHtml(subtotal)}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 32px 8px;text-align:center;">
        ${emailButton(recoverUrl, "Volver a mi carrito")}
      </td>
    </tr>
    <tr>
      <td style="padding:8px 32px 32px;text-align:center;">
        <p style="margin:0;font-family:${body};font-size:12px;font-weight:300;line-height:1.6;color:${ink};opacity:0.7;">
          Las piezas pueden agotarse. Completa tu compra cuando quieras.
        </p>
      </td>
    </tr>`;

  const html = emailLayout({
    title: "Tu carrito te espera · Cleoh",
    preheader: "Dejaste piezas en tu carrito — retómalo cuando quieras.",
    homeUrl: siteUrl,
    heroHeadline: "¿Olvidaste algo?",
    heroSubcopy:
      "Guardamos tu carrito. Un clic y sigues donde lo dejaste.",
    body: bodyContent,
  });

  const resend = new Resend(apiKey);

  try {
    const { error: sendError } = await resend.emails.send({
      from,
      to: [input.email],
      subject: "Tu carrito te espera · Cleoh",
      html,
    });

    if (sendError) {
      console.error("[email] Abandoned cart:", sendError.message);
      return { sent: false as const, reason: "send_failed" as const };
    }

    return { sent: true as const };
  } catch (error) {
    console.error("[email] Abandoned cart:", error);
    return { sent: false as const, reason: "send_failed" as const };
  }
}
