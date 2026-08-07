import "server-only";

import { Resend } from "resend";
import { site } from "@/data/site";
import {
  emailButton,
  emailLayout,
  emailSectionLabel,
  escapeHtml,
  getEmailSiteUrl,
  ink,
  body,
} from "@/lib/email/brand";
import { getEmailConfig } from "@/lib/email/config";

export async function sendNewsletterWelcomeEmail(email: string) {
  const { apiKey, from, configured } = getEmailConfig();

  if (!configured) {
    console.warn(
      "[email] Falta RESEND_API_KEY o EMAIL_FROM — se omite correo de newsletter.",
    );
    return { sent: false as const, reason: "missing_config" as const };
  }

  const siteUrl = getEmailSiteUrl();
  const shopUrl = `${siteUrl}/tienda`;
  const code = site.coupon.code;

  const bodyContent = `
    <tr>
      <td style="padding:8px 32px 0;text-align:center;">
        ${emailSectionLabel("Tu código")}
        <p style="margin:0;font-family:${body};font-size:28px;font-weight:500;letter-spacing:0.18em;color:${ink};">
          ${escapeHtml(code)}
        </p>
        <p style="margin:12px 0 0;font-family:${body};font-size:14px;font-weight:300;line-height:1.7;color:${ink};opacity:0.85;">
          ${escapeHtml(site.coupon.label)} en tu primera compra. Escríbelo al pagar en checkout.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 32px 8px;text-align:center;">
        ${emailButton(shopUrl, "Ver la tienda")}
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 32px;text-align:center;">
        <p style="margin:0;font-family:${body};font-size:12px;font-weight:300;line-height:1.6;color:${ink};opacity:0.7;">
          Envío a todo México · Pago seguro con Mercado Pago o PayPal
        </p>
      </td>
    </tr>`;

  const html = emailLayout({
    title: `${code} · Cleoh`,
    preheader: `Tu código ${code} — ${site.coupon.label}`,
    homeUrl: siteUrl,
    heroHeadline: "Tu regalo de bienvenida",
    heroSubcopy: "Gracias por unirte. Aquí tienes tu descuento para la primera compra.",
    body: bodyContent,
  });

  const resend = new Resend(apiKey);

  try {
    const { error: sendError } = await resend.emails.send({
      from,
      to: [email],
      subject: `Tu ${code} — ${site.coupon.label} · Cleoh`,
      html,
    });

    if (sendError) {
      console.error("[email] Newsletter welcome:", sendError.message);
      return { sent: false as const, reason: "send_failed" as const };
    }

    return { sent: true as const };
  } catch (error) {
    console.error("[email] Newsletter welcome:", error);
    return { sent: false as const, reason: "send_failed" as const };
  }
}
