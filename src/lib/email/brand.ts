import "server-only";

import { site } from "@/data/site";

/** Cleoh email tokens — aligned with globals.css / design-system.mdc */
export const emailColors = {
  ink: "#1a1416",
  inkSoft: "#3d3236",
  rose: "#8f5a66",
  blush: "#c9a8ad",
  petal: "#f3eaeb",
  porcelain: "#faf7f6",
  mist: "#ebe2e3",
} as const;

export const emailFonts = {
  display: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
  body: "'Outfit', Helvetica, Arial, sans-serif",
} as const;

const { ink, inkSoft, rose, blush, petal, porcelain, mist } = emailColors;
const { display, body } = emailFonts;

export function getEmailSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || site.url
  );
}

export function emailLogoUrl() {
  return `${getEmailSiteUrl()}/email/cleoh-logo.svg`;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function emailFirstName(customerName: string) {
  return escapeHtml(
    (customerName || "hola").trim().split(/\s+/)[0] || "hola",
  );
}

function emailHead(title: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Outfit:wght@300;400;500&display=swap" rel="stylesheet" />
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Georgia, 'Times New Roman', serif !important; }
  </style>
  <![endif]-->
</head>`;
}

/** Logo image + wordmark fallback for clients that block images */
export function emailLogoBlock(homeUrl: string) {
  const logoUrl = escapeHtml(emailLogoUrl());
  const safeHome = escapeHtml(homeUrl);

  return `
    <a href="${safeHome}" style="text-decoration:none;display:inline-block;">
      <img
        src="${logoUrl}"
        width="140"
        height="32"
        alt="Cleoh"
        style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;max-width:140px;height:auto;"
      />
    </a>
    <!--[if mso]>
    <p style="margin:0;font-family:${display};font-size:28px;font-weight:400;letter-spacing:0.16em;text-transform:uppercase;color:${ink};text-align:center;">
      CLEOH
    </p>
    <![endif]-->`;
}

export function emailTagline() {
  return `<p style="margin:12px 0 0;font-family:${body};font-size:10px;font-weight:400;letter-spacing:0.22em;text-transform:uppercase;color:${rose};">
    ${escapeHtml(site.tagline)}
  </p>`;
}

export function emailHeroBand(input: {
  homeUrl: string;
  headline: string;
  subcopy: string;
}) {
  return `
    <tr>
      <td style="padding:40px 32px 36px;text-align:center;background-color:${petal};background-image:linear-gradient(168deg,${petal} 0%,${porcelain} 78%);border-bottom:1px solid ${mist};">
        ${emailLogoBlock(input.homeUrl)}
        ${emailTagline()}
        <h1 style="margin:28px 0 0;font-family:${display};font-size:40px;font-weight:500;letter-spacing:0.01em;line-height:1.12;color:${ink};">
          ${input.headline}
        </h1>
        <p style="margin:16px auto 0;max-width:400px;font-family:${body};font-size:15px;font-weight:300;line-height:1.75;color:${inkSoft};">
          ${input.subcopy}
        </p>
      </td>
    </tr>`;
}

export function emailSectionLabel(text: string) {
  return `<p style="margin:0 0 12px;font-family:${body};font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:${blush};">
    ${text}
  </p>`;
}

export function emailDivider() {
  return `<tr>
    <td style="padding:8px 40px 24px;">
      <div style="height:1px;background:${mist};line-height:1px;font-size:1px;">&nbsp;</div>
    </td>
  </tr>`;
}

export function emailOrderNumberBlock(orderNumber: string, extra?: string) {
  return `
    <tr>
      <td style="padding:32px 32px 8px;text-align:center;">
        ${emailSectionLabel("Pedido")}
        <p style="margin:0;font-family:${display};font-size:26px;font-weight:500;letter-spacing:0.06em;color:${ink};">
          ${orderNumber}
        </p>
        ${extra ?? ""}
      </td>
    </tr>`;
}

export function emailButton(href: string, label: string) {
  const safeHref = escapeHtml(href);
  return `<a href="${safeHref}" style="display:inline-block;padding:16px 36px;background:${ink};color:${porcelain};font-family:${body};font-size:11px;font-weight:500;letter-spacing:0.2em;text-decoration:none;text-transform:uppercase;border-radius:2px;">
    ${escapeHtml(label)}
  </a>`;
}

export function emailGhostLink(href: string, label: string) {
  const safeHref = escapeHtml(href);
  return `<a href="${safeHref}" style="font-family:${body};font-size:12px;font-weight:400;letter-spacing:0.12em;text-transform:uppercase;color:${inkSoft};text-decoration:none;">
    ${escapeHtml(label)}
  </a>`;
}

export function emailFooter(homeUrl: string) {
  const safeHome = escapeHtml(homeUrl);
  const instagram = escapeHtml(site.social.instagram);

  return `
    <tr>
      <td style="padding:32px 32px 40px;text-align:center;border-top:1px solid ${mist};background:${porcelain};">
        <a href="${safeHome}" style="text-decoration:none;display:inline-block;">
          <img
            src="${escapeHtml(emailLogoUrl())}"
            width="96"
            height="22"
            alt="Cleoh"
            style="display:block;margin:0 auto;border:0;outline:none;opacity:0.85;"
          />
        </a>
        <p style="margin:16px 0 0;font-family:${body};font-size:12px;font-weight:300;line-height:1.7;color:${inkSoft};">
          Con cariño,<br />el equipo Cleoh
        </p>
        <p style="margin:16px 0 0;font-family:${body};font-size:11px;font-weight:400;letter-spacing:0.08em;">
          <a href="${instagram}" style="color:${rose};text-decoration:none;">@cleoh.mex</a>
        </p>
      </td>
    </tr>`;
}

export function emailLayout(input: {
  title: string;
  preheader: string;
  homeUrl: string;
  heroHeadline: string;
  heroSubcopy: string;
  body: string;
}) {
  const preheader = escapeHtml(input.preheader);

  return `${emailHead(input.title)}
<body style="margin:0;padding:0;background:${porcelain};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
    ${preheader}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${porcelain};">
    <tr>
      <td align="center" style="padding:24px 16px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:${porcelain};border:1px solid ${mist};">
          ${emailHeroBand({
            homeUrl: input.homeUrl,
            headline: input.heroHeadline,
            subcopy: input.heroSubcopy,
          })}
          ${input.body}
          ${emailFooter(input.homeUrl)}
        </table>
        <p style="margin:20px 0 0;font-family:${body};font-size:11px;font-weight:300;color:${blush};text-align:center;">
          Cleoh · Lencería romántica · México
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export { ink, inkSoft, rose, blush, petal, porcelain, mist, display, body };
