import "server-only";

import { Resend } from "resend";
import { sizeDisplayName } from "@/lib/admin/products";
import {
  body,
  display,
  emailButton,
  emailDivider,
  emailFirstName,
  emailGhostLink,
  emailLayout,
  emailOrderNumberBlock,
  emailSectionLabel,
  escapeHtml,
  getEmailSiteUrl,
  ink,
  inkSoft,
  mist,
  rose,
  blush,
  petal,
} from "@/lib/email/brand";
import { getEmailConfig, getOrderNotifyEmail } from "@/lib/email/config";
import { formatOrderMoney } from "@/lib/orders/format";
import { BANK_TRANSFER } from "@/lib/orders/bank-transfer";
import {
  PAYMENT_METHODS,
  paymentMethodLabel,
} from "@/lib/orders/payment-method";
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

function buildAddressBlock(address: Address) {
  const streetLine = [
    address.street?.trim(),
    address.exterior?.trim()
      ? `No. ${address.exterior.trim()}`
      : "",
    address.interior?.trim()
      ? `Int. ${address.interior.trim()}`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (!address.street) {
    return `<p style="margin:0;font-family:${body};font-size:14px;color:${inkSoft};">Sin dirección registrada.</p>`;
  }

  return `
    <p style="margin:0 0 4px;font-family:${body};font-size:14px;font-weight:400;line-height:1.65;color:${inkSoft};">
      ${escapeHtml(streetLine)}
    </p>
    <p style="margin:0 0 4px;font-family:${body};font-size:14px;font-weight:400;line-height:1.65;color:${inkSoft};">
      ${escapeHtml(address.neighborhood ?? "")}
    </p>
    <p style="margin:0 0 4px;font-family:${body};font-size:14px;font-weight:400;line-height:1.65;color:${inkSoft};">
      ${escapeHtml(address.city ?? "")}, ${escapeHtml(address.state ?? "")} ${escapeHtml(address.postalCode ?? "")}
    </p>
    <p style="margin:0;font-family:${body};font-size:14px;font-weight:400;line-height:1.65;color:${inkSoft};">
      ${escapeHtml(address.country || "México")}
    </p>
    ${
      address.methodName
        ? `<p style="margin:16px 0 0;font-family:${body};font-size:11px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:${rose};">
            ${escapeHtml(address.methodName)}
          </p>`
        : ""
    }`;
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
  homeUrl: string;
}) {
  const firstName = emailFirstName(input.customerName);
  const orderNumber = escapeHtml(input.orderNumber);

  const rows = input.items
    .map(
      (item) => `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid ${mist};vertical-align:top;">
          <p style="margin:0;font-family:${display};font-size:21px;font-weight:500;letter-spacing:0.02em;line-height:1.25;color:${ink};">
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
        <td style="padding:16px 0;border-bottom:1px solid ${mist};vertical-align:top;text-align:right;white-space:nowrap;">
          <p style="margin:0;font-family:${body};font-size:14px;font-weight:500;color:${ink};">
            ${formatOrderMoney(item.line_total_cents)}
          </p>
        </td>
      </tr>`,
    )
    .join("");

  const bodyContent = `
    ${emailOrderNumberBlock(orderNumber)}
    ${emailDivider()}
    <tr>
      <td style="padding:0 32px 8px;">
        ${emailSectionLabel("Tu pedido")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${rows}
        </table>
      </td>
    </tr>
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
    ${emailDivider()}
    <tr>
      <td style="padding:0 32px 8px;">
        ${emailSectionLabel("Envío")}
        ${buildAddressBlock(input.address)}
      </td>
    </tr>
    ${
      input.notes
        ? `<tr>
      <td style="padding:24px 32px 0;">
        ${emailSectionLabel("Nota")}
        <p style="margin:0;font-family:${body};font-size:14px;font-weight:300;line-height:1.7;color:${inkSoft};white-space:pre-wrap;">
          ${escapeHtml(input.notes)}
        </p>
      </td>
    </tr>`
        : ""
    }
    <tr>
      <td style="padding:40px 32px 32px;text-align:center;">
        ${emailButton(input.shopUrl, "Seguir comprando")}
      </td>
    </tr>`;

  return emailLayout({
    title: `Pedido confirmado · Cleoh`,
    preheader: `Tu pedido ${input.orderNumber} en Cleoh está confirmado.`,
    homeUrl: input.homeUrl,
    heroHeadline: `¡Gracias, ${firstName}!`,
    heroSubcopy:
      "Recibimos tu pago. Estamos preparando tu pedido con el mismo cuidado con el que elegiste cada pieza.",
    body: bodyContent,
  });
}

function buildOrderShippedHtml(input: {
  customerName: string;
  orderNumber: string;
  trackingCode: string;
  trackingUrl: string;
  methodName?: string;
  shopUrl: string;
  homeUrl: string;
}) {
  const firstName = emailFirstName(input.customerName);
  const orderNumber = escapeHtml(input.orderNumber);
  const trackingCode = escapeHtml(input.trackingCode);
  const trackingUrl = escapeHtml(input.trackingUrl);
  const methodExtra = input.methodName
    ? `<p style="margin:12px 0 0;font-family:${body};font-size:12px;font-weight:400;letter-spacing:0.08em;color:${rose};">
        ${escapeHtml(input.methodName)}
      </p>`
    : "";

  const bodyContent = `
    ${emailOrderNumberBlock(orderNumber, methodExtra)}
    ${emailDivider()}
    <tr>
      <td style="padding:0 32px 8px;text-align:center;">
        ${emailSectionLabel("Código de rastreo")}
        <p style="margin:0;font-family:${body};font-size:22px;font-weight:500;letter-spacing:0.08em;color:${ink};">
          ${trackingCode}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 32px 16px;text-align:center;">
        ${emailButton(input.trackingUrl, "Rastrear envío")}
        <p style="margin:20px 0 0;font-family:${body};font-size:12px;font-weight:300;line-height:1.7;color:${inkSoft};word-break:break-all;">
          O copia este enlace:<br />
          <a href="${trackingUrl}" style="color:${rose};text-decoration:underline;">${trackingUrl}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 32px 32px;text-align:center;">
        ${emailGhostLink(input.shopUrl, "Visitar la tienda")}
      </td>
    </tr>`;

  return emailLayout({
    title: `Tu pedido va en camino · Cleoh`,
    preheader: `Tu pedido ${input.orderNumber} ya salió. Código: ${input.trackingCode}.`,
    homeUrl: input.homeUrl,
    heroHeadline: `¡Va en camino, ${firstName}!`,
    heroSubcopy:
      "Tu pedido ya salió de nuestro almacén. Aquí tienes los datos para seguirlo paso a paso.",
    body: bodyContent,
  });
}

function buildOrderRefundHtml(input: {
  customerName: string;
  orderNumber: string;
  amountCents: number;
  fullyRefunded: boolean;
  lines: {
    product_name: string;
    variant_label: string | null;
    quantity: number;
  }[];
  shopUrl: string;
  homeUrl: string;
}) {
  const firstName = emailFirstName(input.customerName);
  const orderNumber = escapeHtml(input.orderNumber);

  const rows = input.lines
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${mist};font-family:${body};font-size:14px;color:${inkSoft};">
          ${escapeHtml(item.product_name)}
          ${
            item.variant_label
              ? `<span style="color:${rose};"> · Talla ${escapeHtml(sizeDisplayName(item.variant_label))}</span>`
              : ""
          }
          × ${item.quantity}
        </td>
      </tr>`,
    )
    .join("");

  const bodyContent = `
    ${emailOrderNumberBlock(orderNumber)}
    ${emailDivider()}
    <tr>
      <td style="padding:0 32px;">
        ${emailSectionLabel("Artículos reembolsados")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${rows}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 8px;text-align:center;">
        <p style="margin:0;font-family:${body};font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:${blush};">
          Monto reembolsado
        </p>
        <p style="margin:10px 0 0;font-family:${display};font-size:28px;font-weight:500;color:${ink};">
          ${formatOrderMoney(input.amountCents)}
        </p>
        <p style="margin:16px 0 0;font-family:${body};font-size:14px;font-weight:300;line-height:1.7;color:${inkSoft};">
          El reembolso se procesará al mismo método de pago. Si no lo ves en unos días, revisa con tu banco o PayPal.
        </p>
      </td>
    </tr>
    ${emailDivider()}
    <tr>
      <td style="padding:8px 32px 32px;text-align:center;">
        ${emailButton(input.shopUrl, "Visitar la tienda")}
      </td>
    </tr>`;

  return emailLayout({
    title: input.fullyRefunded
      ? `Pedido reembolsado · Cleoh`
      : `Reembolso parcial · Cleoh`,
    preheader: input.fullyRefunded
      ? `Tu pedido ${input.orderNumber} fue reembolsado por completo.`
      : `Recibiste un reembolso de ${formatOrderMoney(input.amountCents)} en tu pedido ${input.orderNumber}.`,
    homeUrl: input.homeUrl,
    heroHeadline: input.fullyRefunded
      ? "Pedido reembolsado"
      : `Reembolso procesado, ${firstName}`,
    heroSubcopy: input.fullyRefunded
      ? `Hola ${firstName}, reembolsamos tu pedido ${input.orderNumber} por completo.`
      : `Hola ${firstName}, procesamos un reembolso parcial en tu pedido ${input.orderNumber}.`,
    body: bodyContent,
  });
}

function buildOrderCancelledHtml(input: {
  customerName: string;
  orderNumber: string;
  totalCents: number;
  refunded: boolean;
  shopUrl: string;
  homeUrl: string;
}) {
  const firstName = emailFirstName(input.customerName);
  const orderNumber = escapeHtml(input.orderNumber);
  const refundNote = input.refunded
    ? `<p style="margin:16px 0 0;font-family:${body};font-size:14px;font-weight:300;line-height:1.7;color:${inkSoft};">
        El reembolso de ${formatOrderMoney(input.totalCents)} se procesará al mismo método de pago. Si no lo ves en unos días, revisa con tu banco o PayPal.
      </p>`
    : "";

  const bodyContent = `
    ${emailOrderNumberBlock(orderNumber, refundNote)}
    ${emailDivider()}
    <tr>
      <td style="padding:8px 32px 32px;text-align:center;">
        ${emailButton(input.shopUrl, "Visitar la tienda")}
      </td>
    </tr>`;

  return emailLayout({
    title: `Pedido cancelado · Cleoh`,
    preheader: `Tu pedido ${input.orderNumber} fue cancelado${input.refunded ? " y reembolsado" : ""}.`,
    homeUrl: input.homeUrl,
    heroHeadline: "Pedido cancelado",
    heroSubcopy: input.refunded
      ? `Hola ${firstName}, cancelamos tu pedido ${input.orderNumber} y ya iniciamos el reembolso.`
      : `Hola ${firstName}, tu pedido ${input.orderNumber} fue cancelado.`,
    body: bodyContent,
  });
}

function buildOrderPendingPaymentHtml(input: {
  customerName: string;
  orderNumber: string;
  totalCents: number;
  items: {
    product_name: string;
    variant_label: string | null;
    quantity: number;
    line_total_cents: number;
  }[];
  shopUrl: string;
  homeUrl: string;
}) {
  const firstName = emailFirstName(input.customerName);
  const orderNumber = escapeHtml(input.orderNumber);

  const rows = input.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${mist};font-family:${body};font-size:14px;color:${inkSoft};">
          ${escapeHtml(item.product_name)}
          ${
            item.variant_label
              ? ` · Talla ${escapeHtml(sizeDisplayName(item.variant_label))}`
              : ""
          }
          × ${item.quantity}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${mist};text-align:right;font-family:${body};font-size:14px;color:${ink};">
          ${formatOrderMoney(item.line_total_cents)}
        </td>
      </tr>`,
    )
    .join("");

  const bodyContent = `
    ${emailOrderNumberBlock(orderNumber)}
    ${emailDivider()}
    <tr>
      <td style="padding:0 32px 8px;">
        ${emailSectionLabel("Resumen")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${rows}
        </table>
        <p style="margin:16px 0 0;font-family:${display};font-size:22px;font-weight:500;text-align:right;color:${ink};">
          Total: ${formatOrderMoney(input.totalCents)}
        </p>
      </td>
    </tr>
    ${emailDivider()}
    <tr>
      <td style="padding:0 32px 8px;">
        ${emailSectionLabel("Datos para transferir")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:${body};font-size:14px;color:${inkSoft};">
          <tr>
            <td style="padding:4px 0;text-transform:uppercase;font-size:10px;letter-spacing:0.16em;color:${rose};">Banco</td>
            <td style="padding:4px 0;text-align:right;font-weight:500;color:${ink};">${escapeHtml(BANK_TRANSFER.bank)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;text-transform:uppercase;font-size:10px;letter-spacing:0.16em;color:${rose};">Cuenta</td>
            <td style="padding:4px 0;text-align:right;font-family:monospace;color:${ink};">${escapeHtml(BANK_TRANSFER.accountNumber)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;text-transform:uppercase;font-size:10px;letter-spacing:0.16em;color:${rose};">Titular</td>
            <td style="padding:4px 0;text-align:right;color:${ink};">${escapeHtml(BANK_TRANSFER.holder)}</td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-family:${body};font-size:14px;font-weight:300;line-height:1.7;color:${inkSoft};">
          Transfiere el <strong>total exacto</strong> de tu pedido y envía tu comprobante por Instagram
          (<a href="${escapeHtml(BANK_TRANSFER.instagramUrl)}" style="color:${rose};">${escapeHtml(BANK_TRANSFER.instagram)}</a>)
          indicando el número <strong>${orderNumber}</strong>.
          Validamos el pago manualmente y te avisamos por correo cuando quede confirmado.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 32px;text-align:center;">
        ${emailButton(input.shopUrl, "Seguir comprando")}
      </td>
    </tr>`;

  return emailLayout({
    title: `Pedido registrado · Cleoh`,
    preheader: `Tu pedido ${input.orderNumber} quedó registrado. Aquí están los datos para transferir.`,
    homeUrl: input.homeUrl,
    heroHeadline: `Pedido registrado, ${firstName}`,
    heroSubcopy:
      "Recibimos tu pedido. Realiza la transferencia y envía tu comprobante para que podamos validarlo.",
    body: bodyContent,
  });
}

function buildNewOrderAdminHtml(input: {
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string | null;
  totalCents: number;
  paymentMethod: string | null;
  status: string;
  adminOrderUrl: string;
  homeUrl: string;
}) {
  const orderNumber = escapeHtml(input.orderNumber);
  const method = paymentMethodLabel(input.paymentMethod);
  const isSpei = input.paymentMethod === PAYMENT_METHODS.spei;

  const speiNote = isSpei
    ? `<p style="margin:16px 0 0;padding:12px 14px;border:1px solid ${rose};background:${petal};font-family:${body};font-size:13px;line-height:1.6;color:${ink};">
        <strong>Acción requerida:</strong> revisa Instagram por el comprobante de transferencia antes de validar el pago en el admin.
      </p>`
    : "";

  const bodyContent = `
    ${emailOrderNumberBlock(orderNumber)}
    ${emailDivider()}
    <tr>
      <td style="padding:0 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:${body};font-size:14px;color:${inkSoft};">
          <tr>
            <td style="padding:6px 0;">Cliente</td>
            <td style="padding:6px 0;text-align:right;color:${ink};">${escapeHtml(input.customerName)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;">Email</td>
            <td style="padding:6px 0;text-align:right;color:${ink};">${escapeHtml(input.email)}</td>
          </tr>
          ${
            input.phone
              ? `<tr>
            <td style="padding:6px 0;">Teléfono</td>
            <td style="padding:6px 0;text-align:right;color:${ink};">${escapeHtml(input.phone)}</td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding:6px 0;">Pago</td>
            <td style="padding:6px 0;text-align:right;color:${ink};">${escapeHtml(method)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;">Total</td>
            <td style="padding:6px 0;text-align:right;font-weight:500;color:${ink};">${formatOrderMoney(input.totalCents)}</td>
          </tr>
        </table>
        ${speiNote}
      </td>
    </tr>
    <tr>
      <td style="padding:32px 32px;text-align:center;">
        ${emailButton(input.adminOrderUrl, "Ver pedido en admin")}
      </td>
    </tr>`;

  return emailLayout({
    title: `Nuevo pedido ${input.orderNumber} · Cleoh`,
    preheader: `Nuevo pedido de ${input.customerName} por ${formatOrderMoney(input.totalCents)}.`,
    homeUrl: input.homeUrl,
    heroHeadline: "Nuevo pedido",
    heroSubcopy: isSpei
      ? `Pedido ${input.orderNumber} por transferencia — pendiente de validar comprobante.`
      : `Pedido ${input.orderNumber} registrado. Estado: ${escapeHtml(input.status)}.`,
    body: bodyContent,
  });
}

export async function sendOrderPaidEmail(orderId: string) {
  const { apiKey, from, configured } = getEmailConfig();
  const notify = getOrderNotifyEmail();

  if (!configured) {
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

  const siteUrl = getEmailSiteUrl();

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
    shopUrl: `${siteUrl}/tienda`,
    homeUrl: siteUrl,
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
  const { apiKey, from, configured } = getEmailConfig();
  const notify = getOrderNotifyEmail();

  if (!configured) {
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
  const siteUrl = getEmailSiteUrl();

  const html = buildOrderShippedHtml({
    customerName: order.customer_name || "hola",
    orderNumber: order.order_number,
    trackingCode: order.tracking_code,
    trackingUrl: order.tracking_url,
    methodName: address.methodName,
    shopUrl: `${siteUrl}/tienda`,
    homeUrl: siteUrl,
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

export async function sendOrderRefundEmail(
  orderId: string,
  input: {
    amountCents: number;
    fullyRefunded: boolean;
    lines: {
      product_name: string;
      variant_label: string | null;
      quantity: number;
    }[];
  },
) {
  const { apiKey, from, configured } = getEmailConfig();
  const notify = getOrderNotifyEmail();

  if (!configured) {
    console.warn(
      "[email] Falta RESEND_API_KEY o EMAIL_FROM — se omite correo de reembolso.",
    );
    return { sent: false as const, reason: "missing_config" as const };
  }

  const supabase = createServiceClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_number, email, customer_name")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order?.email) {
    console.error("[email] Pedido no encontrado o sin email", error?.message);
    return { sent: false as const, reason: "order_missing" as const };
  }

  const siteUrl = getEmailSiteUrl();

  const html = buildOrderRefundHtml({
    customerName: order.customer_name || "hola",
    orderNumber: order.order_number,
    amountCents: input.amountCents,
    fullyRefunded: input.fullyRefunded,
    lines: input.lines,
    shopUrl: `${siteUrl}/tienda`,
    homeUrl: siteUrl,
  });

  const resend = new Resend(apiKey);
  const subject = input.fullyRefunded
    ? `Pedido reembolsado · ${order.order_number} · Cleoh`
    : `Reembolso parcial · ${order.order_number} · Cleoh`;

  try {
    const { error: sendError } = await resend.emails.send({
      from,
      to: [order.email],
      ...(notify ? { bcc: [notify] } : {}),
      subject,
      html,
    });

    if (sendError) {
      console.error("[email] Resend error (refund)", sendError);
      return { sent: false as const, reason: "resend_error" as const };
    }

    return { sent: true as const };
  } catch (e) {
    console.error("[email] refund send failed", e);
    return { sent: false as const, reason: "send_failed" as const };
  }
}

export async function sendOrderCancelledEmail(orderId: string) {
  const { apiKey, from, configured } = getEmailConfig();
  const notify = getOrderNotifyEmail();

  if (!configured) {
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

  const siteUrl = getEmailSiteUrl();

  const html = buildOrderCancelledHtml({
    customerName: order.customer_name || "hola",
    orderNumber: order.order_number,
    totalCents: order.total_cents,
    refunded: order.status === "refunded",
    shopUrl: `${siteUrl}/tienda`,
    homeUrl: siteUrl,
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

/** Correo al cliente al registrar pedido por transferencia (antes de validar pago). */
export async function sendOrderPendingPaymentEmail(orderId: string) {
  const { apiKey, from, configured } = getEmailConfig();

  if (!configured) {
    console.warn(
      "[email] Falta RESEND_API_KEY o EMAIL_FROM — se omite correo de pedido pendiente.",
    );
    return { sent: false as const, reason: "missing_config" as const };
  }

  const supabase = createServiceClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, email, customer_name, total_cents, payment_method, status",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order?.email) {
    console.error("[email] Pedido no encontrado o sin email", error?.message);
    return { sent: false as const, reason: "order_missing" as const };
  }

  if (order.payment_method !== PAYMENT_METHODS.spei) {
    return { sent: false as const, reason: "not_spei" as const };
  }

  if (order.status !== "pending") {
    return { sent: false as const, reason: "not_pending" as const };
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, variant_label, quantity, line_total_cents")
    .eq("order_id", order.id);

  const siteUrl = getEmailSiteUrl();

  const html = buildOrderPendingPaymentHtml({
    customerName: order.customer_name || "hola",
    orderNumber: order.order_number,
    totalCents: order.total_cents,
    items: items ?? [],
    shopUrl: `${siteUrl}/tienda`,
    homeUrl: siteUrl,
  });

  const resend = new Resend(apiKey);
  const subject = `Tu pedido ${order.order_number} — datos para transferir · Cleoh`;

  try {
    const { error: sendError } = await resend.emails.send({
      from,
      to: [order.email],
      subject,
      html,
    });

    if (sendError) {
      console.error("[email] Resend error (pending payment)", sendError);
      return { sent: false as const, reason: "resend_error" as const };
    }

    return { sent: true as const };
  } catch (e) {
    console.error("[email] pending payment send failed", e);
    return { sent: false as const, reason: "send_failed" as const };
  }
}

/** Aviso a la tienda cuando se crea cualquier pedido nuevo. */
export async function sendNewOrderAdminNotifyEmail(orderId: string) {
  const { apiKey, from, configured } = getEmailConfig();
  const notify = getOrderNotifyEmail();

  if (!configured) {
    console.warn(
      "[email] Falta RESEND_API_KEY o EMAIL_FROM — se omite aviso de pedido nuevo.",
    );
    return { sent: false as const, reason: "missing_config" as const };
  }

  if (!notify) {
    console.warn("[email] Sin inbox de tienda configurado — se omite aviso de pedido nuevo.");
    return { sent: false as const, reason: "missing_notify" as const };
  }

  const supabase = createServiceClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, email, customer_name, phone, total_cents, payment_method, status",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    console.error("[email] Pedido no encontrado para aviso admin", error?.message);
    return { sent: false as const, reason: "order_missing" as const };
  }

  const siteUrl = getEmailSiteUrl();

  const html = buildNewOrderAdminHtml({
    orderNumber: order.order_number,
    customerName: order.customer_name || "Cliente",
    email: order.email,
    phone: order.phone,
    totalCents: order.total_cents,
    paymentMethod: order.payment_method,
    status: order.status,
    adminOrderUrl: `${siteUrl}/admin/pedidos/${order.id}`,
    homeUrl: siteUrl,
  });

  const resend = new Resend(apiKey);
  const isSpei = order.payment_method === PAYMENT_METHODS.spei;
  const subject = isSpei
    ? `Transferencia pendiente · ${order.order_number} · Cleoh`
    : `Nuevo pedido · ${order.order_number} · Cleoh`;

  try {
    const { error: sendError } = await resend.emails.send({
      from,
      to: [notify],
      subject,
      html,
    });

    if (sendError) {
      console.error("[email] Resend error (admin notify)", sendError);
      return { sent: false as const, reason: "resend_error" as const };
    }

    return { sent: true as const };
  } catch (e) {
    console.error("[email] admin notify send failed", e);
    return { sent: false as const, reason: "send_failed" as const };
  }
}
