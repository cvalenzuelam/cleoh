"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useCart } from "@/components/cart/CartProvider";
import { EmptyCartState } from "@/components/cart/EmptyCartState";
import { FreeShippingProgress } from "@/components/cart/FreeShippingProgress";
import { MercadoPagoWalletBrick } from "@/components/cart/MercadoPagoWalletBrick";
import { BankTransferCheckout } from "@/components/cart/BankTransferCheckout";
import { PayPalCheckoutButtons } from "@/components/cart/PayPalCheckoutButtons";
import { InstagramLink } from "@/components/store/InstagramLink";
import { MX_STATES } from "@/data/mexico";
import { savePurchaseSnapshot, trackMetaCommerceEvent } from "@/lib/analytics/metaPixel";
import { createMetaEventId } from "@/lib/analytics/metaEventId";
import { sizeLabel } from "@/lib/admin/products";
import { productImage } from "@/lib/catalog/types";
import {
  saveCheckoutEmail,
  scheduleAbandonedCartSync,
} from "@/lib/cart/abandon-client";
import { formatCartMoney } from "@/lib/cart/types";
import {
  qualifiesForFreeShipping,
  resolveShippingCents,
} from "@/lib/shipping/free-shipping";
import { BANK_TRANSFER } from "@/lib/orders/bank-transfer";
import type { ShippingMethodPublic } from "@/lib/shipping/types";

type Props = {
  shippingMethods: ShippingMethodPublic[];
};

const labelClass =
  "text-[0.65rem] uppercase tracking-[0.18em] text-ink";

function FieldLabel({
  children,
  required,
  optional,
  abbrTitle,
  htmlFor,
}: {
  children: ReactNode;
  required?: boolean;
  /** Marca abreviada: opc. */
  optional?: boolean;
  /** Si el texto del label es abreviatura (ej. Ext. → Exterior) */
  abbrTitle?: string;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={labelClass}>
      {abbrTitle ? (
        <abbr
          title={abbrTitle}
          className="cursor-help border-b border-dotted border-ink/35 no-underline"
        >
          {children}
        </abbr>
      ) : (
        children
      )}
      {required ? (
        <span className="ml-0.5 text-rose" aria-hidden>
          *
        </span>
      ) : null}
      {optional && !required ? (
        <span
          className="ml-1.5 font-normal normal-case tracking-normal text-ink-soft/80"
          title="Campo opcional"
        >
          opc.
        </span>
      ) : null}
    </label>
  );
}

function FieldWrap({
  tipId,
  tip,
  children,
  className = "",
}: {
  tipId: string;
  tip: { fieldId: string; message: string } | null;
  children: ReactNode;
  className?: string;
}) {
  const show = tip?.fieldId === tipId;
  return (
    <div className={`checkout-field-wrap ${className}`.trim()}>
      {children}
      {show ? (
        <div className="checkout-field-tip" role="tooltip">
          {tip.message}
        </div>
      ) : null}
    </div>
  );
}

type CheckoutFormSnapshot = {
  email: string;
  name: string;
  phone: string;
  coupon: string;
  notes: string;
  street: string;
  exterior: string;
  interior: string;
  neighborhood: string;
  city: string;
  stateMx: string;
  postalCode: string;
  shippingMethodId: string;
  shippingMethods: ShippingMethodPublic[];
  items: {
    productId: string;
    slug: string;
    name: string;
    size: string;
    price: number;
    quantity: number;
  }[];
};

function getCheckoutIssue(f: CheckoutFormSnapshot) {
  if (!f.name.trim()) {
    return { message: "El nombre es obligatorio.", fieldId: "checkout-name" };
  }
  if (!f.email.trim()) {
    return { message: "El email es obligatorio.", fieldId: "checkout-email" };
  }
  if (!f.phone.trim()) {
    return {
      message: "El teléfono es obligatorio (lo pide la paquetería).",
      fieldId: "checkout-phone",
    };
  }
  if (!f.street.trim()) {
    return { message: "La calle es obligatoria.", fieldId: "checkout-street" };
  }
  if (!f.exterior.trim()) {
    return {
      message: "El número exterior es obligatorio.",
      fieldId: "checkout-exterior",
    };
  }
  if (!f.postalCode.trim()) {
    return {
      message: "El código postal es obligatorio.",
      fieldId: "checkout-postal",
    };
  }
  if (!f.neighborhood.trim()) {
    return {
      message: "La colonia es obligatoria.",
      fieldId: "checkout-neighborhood",
    };
  }
  if (!f.city.trim()) {
    return { message: "La ciudad es obligatoria.", fieldId: "checkout-city" };
  }
  if (!f.stateMx.trim()) {
    return { message: "El estado es obligatorio.", fieldId: "checkout-state" };
  }
  if (!f.shippingMethodId) {
    return {
      message: "Elige un método de envío.",
      fieldId: "checkout-shipping",
    };
  }
  return null;
}

function getStep1Issue(f: Pick<CheckoutFormSnapshot, "name" | "email" | "phone">) {
  if (!f.name.trim()) {
    return { message: "El nombre es obligatorio.", fieldId: "checkout-name" };
  }
  if (!f.email.trim()) {
    return { message: "El email es obligatorio.", fieldId: "checkout-email" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
    return { message: "Escribe un email válido.", fieldId: "checkout-email" };
  }
  if (!f.phone.trim()) {
    return {
      message: "El teléfono es obligatorio (lo pide la paquetería).",
      fieldId: "checkout-phone",
    };
  }
  return null;
}

function getStep2Issue(f: CheckoutFormSnapshot) {
  if (!f.street.trim()) {
    return { message: "La calle es obligatoria.", fieldId: "checkout-street" };
  }
  if (!f.exterior.trim()) {
    return {
      message: "El número exterior es obligatorio.",
      fieldId: "checkout-exterior",
    };
  }
  if (!f.postalCode.trim()) {
    return {
      message: "El código postal es obligatorio.",
      fieldId: "checkout-postal",
    };
  }
  if (!f.neighborhood.trim()) {
    return {
      message: "La colonia es obligatoria.",
      fieldId: "checkout-neighborhood",
    };
  }
  if (!f.city.trim()) {
    return { message: "La ciudad es obligatoria.", fieldId: "checkout-city" };
  }
  if (!f.stateMx.trim()) {
    return { message: "El estado es obligatorio.", fieldId: "checkout-state" };
  }
  if (!f.shippingMethodId) {
    return {
      message: "Elige un método de envío.",
      fieldId: "checkout-shipping",
    };
  }
  return null;
}

type CheckoutStepNum = 1 | 2 | 3;

function CheckoutStepBadge({
  step,
  active,
  done,
}: {
  step: CheckoutStepNum;
  active: boolean;
  done: boolean;
}) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors duration-300 ${
        active
          ? "bg-rose text-white"
          : done
            ? "bg-rose/15 text-rose"
            : "bg-mist text-ink-soft"
      }`}
      aria-hidden
    >
      {done && !active ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M5 12l5 5L19 7" />
        </svg>
      ) : (
        step
      )}
    </span>
  );
}

function focusField(fieldId: string) {
  requestAnimationFrame(() => {
    const el = document.getElementById(fieldId);
    if (!(el instanceof HTMLElement)) return;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

export function CheckoutView({ shippingMethods }: Props) {
  const { items, subtotal, ready, clear, count, syncStock } = useCart();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);
  const [fieldTip, setFieldTip] = useState<{
    fieldId: string;
    message: string;
  } | null>(null);
  const [currentStep, setCurrentStep] = useState<CheckoutStepNum>(1);
  const tipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [street, setStreet] = useState("");
  const [exterior, setExterior] = useState("");
  const [interior, setInterior] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateMx, setStateMx] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [shippingMethodId, setShippingMethodId] = useState(
    shippingMethods[0]?.id ?? "",
  );

  const [postalStatus, setPostalStatus] = useState<
    "idle" | "loading" | "found" | "not-found"
  >("idle");
  const [postalColonias, setPostalColonias] = useState<string[]>([]);
  const [customNeighborhood, setCustomNeighborhood] = useState(false);
  // CP para el que el usuario eligió explícitamente "mi colonia no aparece".
  // Si luego escribe un CP distinto, se vuelve a mostrar la lista: el modo
  // manual no debe quedar pegado para siempre.
  const customNeighborhoodCpRef = useRef<string | null>(null);
  const lastAutoFillRef = useRef<{
    cp: string;
    city: string;
    state: string;
  } | null>(null);

  // Autocompleta colonia/ciudad/estado a partir del código postal usando el
  // catálogo SEPOMEX local (sin depender de APIs externas). No bloquea el
  // pago si falla o no encuentra el CP: el cliente siempre puede seguir
  // llenando los campos a mano.
  useEffect(() => {
    const cp = postalCode.trim();
    if (!/^\d{5}$/.test(cp)) {
      setPostalStatus("idle");
      setPostalColonias([]);
      return;
    }

    // Si el modo manual se activó para OTRO código postal, se resetea: este
    // CP nuevo merece su propia oportunidad de mostrar la lista.
    if (
      customNeighborhoodCpRef.current !== null &&
      customNeighborhoodCpRef.current !== cp
    ) {
      customNeighborhoodCpRef.current = null;
      setCustomNeighborhood(false);
    }

    let cancelled = false;
    setPostalStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/checkout/postal-code?cp=${encodeURIComponent(cp)}`,
        );
        if (cancelled) return;

        if (!res.ok) {
          setPostalStatus("not-found");
          setPostalColonias([]);
          return;
        }

        const data = (await res.json()) as {
          estado?: string;
          municipio?: string;
          ciudad?: string;
          colonias?: string[];
        };

        setPostalStatus("found");
        const colonias = data.colonias ?? [];
        setPostalColonias(colonias);

        const prevAuto = lastAutoFillRef.current;
        const cityIsAuto = !city.trim() || (!!prevAuto && city === prevAuto.city);
        const stateIsAuto =
          !stateMx.trim() || (!!prevAuto && stateMx === prevAuto.state);

        const nextCity = data.ciudad ?? "";
        const nextState = data.estado ?? "";
        if (cityIsAuto && nextCity) setCity(nextCity);
        if (
          stateIsAuto &&
          nextState &&
          (MX_STATES as readonly string[]).includes(nextState)
        ) {
          setStateMx(nextState);
        }
        lastAutoFillRef.current = { cp, city: nextCity, state: nextState };

        // Se lee el ref (siempre al día) en vez del estado `customNeighborhood`:
        // el estado puede quedar "stale" dentro de este closure si se acaba
        // de resetear en esta misma ejecución del efecto (ver arriba).
        if (customNeighborhoodCpRef.current === null) {
          if (colonias.length === 1) {
            setNeighborhood(colonias[0]);
          } else if (colonias.length > 1 && !colonias.includes(neighborhood)) {
            setNeighborhood("");
          }
        }
      } catch {
        if (!cancelled) {
          setPostalStatus("not-found");
          setPostalColonias([]);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo re-consulta cuando cambia el CP
  }, [postalCode]);

  const selectedShipping = useMemo(
    () => shippingMethods.find((m) => m.id === shippingMethodId) ?? null,
    [shippingMethods, shippingMethodId],
  );

  const freeShipping = qualifiesForFreeShipping(subtotal);
  const shippingCost = selectedShipping
    ? resolveShippingCents(subtotal, selectedShipping.priceCents) / 100
    : 0;
  const discountAmount = appliedCoupon?.discount ?? 0;
  const estimatedTotal = Math.max(0, subtotal - discountAmount + shippingCost);

  // Con envío gratis no pedimos paquetería: fijamos el primer método activo
  // (sigue yendo en el pedido). Si baja del umbral, vuelven las opciones.
  useEffect(() => {
    if (!freeShipping) return;
    const fallback = shippingMethods[0]?.id;
    if (fallback && shippingMethodId !== fallback) {
      setShippingMethodId(fallback);
    }
  }, [freeShipping, shippingMethods, shippingMethodId]);

  // Recorta cantidades si el stock bajó desde que se llenó el carrito.
  useEffect(() => {
    if (!ready || !items.length) return;
    void syncStock();
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps -- al entrar a checkout

  // Un solo InitiateCheckout por visita a /checkout, no por cada re-render.
  const initiateCheckoutFiredRef = useRef(false);
  const initiateCheckoutEventIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || items.length === 0 || initiateCheckoutFiredRef.current) {
      return;
    }
    initiateCheckoutFiredRef.current = true;
    const eventId =
      initiateCheckoutEventIdRef.current ??
      createMetaEventId("initiatecheckout");
    initiateCheckoutEventIdRef.current = eventId;

    trackMetaCommerceEvent(
      "InitiateCheckout",
      {
        content_ids: items.map((i) => i.productId),
        contents: items.map((i) => ({ id: i.productId, quantity: i.quantity })),
        num_items: count,
        value: subtotal,
        currency: "MXN",
      },
      { eventId, email: email.trim() || undefined },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe evaluarse al montar con carrito listo
  }, [ready, items.length]);

  // Una vez por método: el usuario puede volver y probar otro, pero repetir
  // el mismo evento no agrega señal.
  const paymentInfoTrackedRef = useRef<Set<string>>(new Set());
  const trackAddPaymentInfo = useCallback(
    (method: string) => {
      if (paymentInfoTrackedRef.current.has(method)) return;
      paymentInfoTrackedRef.current.add(method);

      trackMetaCommerceEvent(
        "AddPaymentInfo",
        {
          content_ids: items.map((i) => i.productId),
          contents: items.map((i) => ({
            id: i.productId,
            quantity: i.quantity,
          })),
          num_items: count,
          value: estimatedTotal,
          currency: "MXN",
          payment_method: method,
        },
        { email: email.trim() || undefined },
      );
    },
    [items, count, estimatedTotal, email],
  );

  useEffect(() => {
    if (!ready || !items.length) return;
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return;
    saveCheckoutEmail(normalized);
    scheduleAbandonedCartSync(normalized, items);
  }, [ready, email, items]);

  // Si cambia el carrito, revalida el cupón aplicado
  useEffect(() => {
    if (!appliedCoupon) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/checkout/coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: appliedCoupon.code,
            subtotal,
            email: email.trim() || undefined,
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          code?: string;
          discount?: number;
        };
        if (cancelled) return;
        if (!res.ok || data.error || data.discount == null || !data.code) {
          setAppliedCoupon(null);
          setCouponMessage(data.error ?? "El cupón ya no aplica a este pedido.");
          return;
        }
        setAppliedCoupon({ code: data.code, discount: data.discount });
      } catch {
        if (!cancelled) {
          setAppliedCoupon(null);
          setCouponMessage("No se pudo validar el cupón.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subtotal, appliedCoupon?.code, email]); // eslint-disable-line react-hooks/exhaustive-deps -- revalidar al cambiar subtotal, código o email

  const formSnapshot = useMemo<CheckoutFormSnapshot>(
    () => ({
      email,
      name,
      phone,
      coupon: appliedCoupon?.code ?? "",
      notes,
      street,
      exterior,
      interior,
      neighborhood,
      city,
      stateMx,
      postalCode,
      shippingMethodId,
      shippingMethods,
      items: items.map((i) => ({
        productId: i.productId,
        slug: i.slug,
        name: i.name,
        size: i.size,
        price: i.price,
        quantity: i.quantity,
      })),
    }),
    [
      email,
      name,
      phone,
      appliedCoupon?.code,
      notes,
      street,
      exterior,
      interior,
      neighborhood,
      city,
      stateMx,
      postalCode,
      shippingMethodId,
      shippingMethods,
      items,
    ],
  );

  const formRef = useRef(formSnapshot);
  useEffect(() => {
    formRef.current = formSnapshot;
  }, [formSnapshot]);

  const blockPay = getCheckoutIssue(formSnapshot) !== null;

  const onPayError = useCallback((message: string) => {
    // Ignora mensajes de validación (van en tooltip)
    if (
      message.includes("obligatorio") ||
      message.includes("obligatoria") ||
      message.includes("método de envío")
    ) {
      return;
    }
    setStatus(message);
  }, []);

  const showFieldIssue = useCallback(
    (issue: { fieldId: string; message: string }) => {
      if (tipTimerRef.current) clearTimeout(tipTimerRef.current);
      setFieldTip(issue);
      focusField(issue.fieldId);
      tipTimerRef.current = setTimeout(() => setFieldTip(null), 3600);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (tipTimerRef.current) clearTimeout(tipTimerRef.current);
    };
  }, []);

  const clearFieldTip = useCallback((fieldId: string) => {
    setFieldTip((current) =>
      current?.fieldId === fieldId ? null : current,
    );
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponMessage(null);
  }, []);

  const applyCoupon = useCallback(async () => {
    const code = coupon.trim();
    if (!code) {
      setCouponMessage("Escribe un código de cupón.");
      return;
    }
    setCouponBusy(true);
    setCouponMessage(null);
    try {
      const res = await fetch("/api/checkout/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          subtotal,
          email: email.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        code?: string;
        discount?: number;
      };
      if (!res.ok || data.error || data.discount == null || !data.code) {
        setAppliedCoupon(null);
        setCouponMessage(data.error ?? "Cupón no válido.");
        return;
      }
      setAppliedCoupon({ code: data.code, discount: data.discount });
      setCoupon(data.code);
      setCouponMessage(
        data.discount > 0
          ? `Cupón ${data.code} aplicado.`
          : `Cupón ${data.code} aplicado (sin descuento en este pedido).`,
      );
    } catch {
      setAppliedCoupon(null);
      setCouponMessage("No se pudo validar el cupón. Intenta de nuevo.");
    } finally {
      setCouponBusy(false);
    }
  }, [coupon, subtotal, email]);

  const scrollToStep = useCallback((step: CheckoutStepNum) => {
    requestAnimationFrame(() => {
      document
        .getElementById(`checkout-step-${step}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const goToStep = useCallback(
    (step: CheckoutStepNum) => {
      setCurrentStep(step);
      scrollToStep(step);
    },
    [scrollToStep],
  );

  const validateBeforePay = useCallback(() => {
    const f = formRef.current;
    const step1Issue = getStep1Issue(f);
    if (step1Issue) {
      showFieldIssue(step1Issue);
      goToStep(1);
      return false;
    }
    const step2Issue = getStep2Issue(f);
    if (step2Issue) {
      showFieldIssue(step2Issue);
      goToStep(2);
      return false;
    }
    return true;
  }, [goToStep, showFieldIssue]);

  const proceedToStep2 = useCallback(() => {
    const issue = getStep1Issue(formRef.current);
    if (issue) {
      showFieldIssue(issue);
      return;
    }
    goToStep(2);
  }, [goToStep, showFieldIssue]);

  const proceedToStep3 = useCallback(() => {
    const issue = getStep2Issue(formRef.current);
    if (issue) {
      showFieldIssue(issue);
      return;
    }
    goToStep(3);
  }, [goToStep, showFieldIssue]);

  const buildPayload = useCallback((f: CheckoutFormSnapshot) => {
    const method = f.shippingMethods.find((m) => m.id === f.shippingMethodId);
    return {
      email: f.email,
      name: f.name,
      phone: f.phone,
      coupon: f.coupon.trim() || undefined,
      notes: f.notes.trim() || undefined,
      shippingMethodId: f.shippingMethodId,
      shippingAddress: {
        street: f.street,
        exterior: f.exterior,
        interior: f.interior,
        neighborhood: f.neighborhood,
        city: f.city,
        state: f.stateMx,
        postalCode: f.postalCode,
        country: "México",
        methodId: f.shippingMethodId,
        methodName: method?.name ?? "",
      },
      items: f.items,
    };
  }, []);

  const createPreference = useCallback(async () => {
    setStatus(null);
    const f = formRef.current;
    const issue = getCheckoutIssue(f);
    if (issue) {
      showFieldIssue(issue);
      return Promise.reject(issue.message);
    }

    trackAddPaymentInfo("mercadopago");

    const res = await fetch("/api/checkout/mercadopago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(f)),
    });

    const data = (await res.json()) as {
      message?: string;
      preferenceId?: string;
    };

    if (!res.ok || !data.preferenceId) {
      const msg = data.message ?? "No se pudo crear la preferencia de pago.";
      setStatus(msg);
      return Promise.reject(msg);
    }

    savePurchaseSnapshot({
      value: estimatedTotal,
      currency: "MXN",
      contentIds: f.items.map((i) => i.productId),
      contents: f.items.map((i) => ({ id: i.productId, quantity: i.quantity })),
      numItems: count,
    });

    return data.preferenceId;
  }, [buildPayload, showFieldIssue, estimatedTotal, count, trackAddPaymentInfo]);

  const createPayPalOrder = useCallback(async () => {
    setStatus(null);
    const f = formRef.current;
    const issue = getCheckoutIssue(f);
    if (issue) {
      showFieldIssue(issue);
      return Promise.reject(issue.message);
    }

    trackAddPaymentInfo("paypal");

    const res = await fetch("/api/checkout/paypal/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(f)),
    });

    const data = (await res.json()) as {
      message?: string;
      orderId?: string;
    };

    if (!res.ok || !data.orderId) {
      const msg = data.message ?? "No se pudo crear la orden PayPal.";
      setStatus(msg);
      return Promise.reject(msg);
    }

    savePurchaseSnapshot({
      value: estimatedTotal,
      currency: "MXN",
      contentIds: f.items.map((i) => i.productId),
      contents: f.items.map((i) => ({ id: i.productId, quantity: i.quantity })),
      numItems: count,
    });

    return data.orderId;
  }, [buildPayload, showFieldIssue, estimatedTotal, count, trackAddPaymentInfo]);

  const onPayPalApprove = useCallback(
    async (orderID: string) => {
      setStatus("Confirmando pago PayPal…");
      const res = await fetch("/api/checkout/paypal/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderID }),
      });
      const data = (await res.json()) as {
        message?: string;
        orderNumber?: string;
      };

      if (!res.ok) {
        setStatus(data.message ?? "No se pudo confirmar el pago PayPal.");
        return;
      }

      clear();
      const q = data.orderNumber
        ? `?external_reference=${encodeURIComponent(data.orderNumber)}`
        : "";
      router.push(`/checkout/exito${q}`);
    },
    [clear, router],
  );

  const createBankTransferOrder = useCallback(async () => {
    setStatus(null);
    const f = formRef.current;
    const issue = getCheckoutIssue(f);
    if (issue) {
      showFieldIssue(issue);
      throw new Error(issue.message);
    }

    trackAddPaymentInfo("spei");

    const res = await fetch("/api/checkout/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(f)),
    });

    const data = (await res.json()) as {
      message?: string;
      orderNumber?: string;
    };

    if (!res.ok || !data.orderNumber) {
      const msg = data.message ?? "No se pudo crear el pedido.";
      setStatus(msg);
      throw new Error(msg);
    }

    clear();
    const q = new URLSearchParams({
      external_reference: data.orderNumber,
      method: "spei",
    });
    router.push(`/checkout/pendiente?${q.toString()}`);
  }, [buildPayload, clear, router, showFieldIssue, trackAddPaymentInfo]);

  if (exiting) {
    return null;
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-ink-soft">
        Cargando…
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyCartState variant="page" pageTitle="Checkout" />;
  }

  const step1Done = getStep1Issue(formSnapshot) === null;
  const step2Done = getStep2Issue(formSnapshot) === null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <h1 className="font-display text-4xl tracking-wide text-ink">
          Checkout
        </h1>
        <Link
          href="/carrito"
          className="link-anim text-[0.65rem] uppercase tracking-[0.18em] text-ink-soft"
        >
          Volver al carrito
        </Link>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="stagger-list space-y-4">
          {/* Paso 1 — Tus datos */}
          <section
            id="checkout-step-1"
            className={`checkout-step scroll-mt-24 border bg-white/40 transition-shadow duration-300 ${
              currentStep === 1
                ? "border-ink/20 shadow-[0_8px_32px_rgba(26,20,22,0.06)]"
                : "border-line"
            }`}
          >
            <div className="flex items-start gap-4 px-5 py-5 sm:px-6">
              <CheckoutStepBadge
                step={1}
                active={currentStep === 1}
                done={step1Done && currentStep > 1}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl tracking-wide text-ink sm:text-2xl">
                      Tus datos
                    </h2>
                    {currentStep === 1 ? (
                      <p className="mt-1 text-xs text-ink-soft">
                        Solo pedimos lo esencial para completar tu compra.
                      </p>
                    ) : step1Done ? (
                      <p className="mt-1 text-sm text-ink-soft">
                        {name} · {email}
                        {phone ? ` · ${phone}` : ""}
                      </p>
                    ) : null}
                  </div>
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="link-anim shrink-0 text-[0.65rem] uppercase tracking-[0.14em] text-ink-soft"
                    >
                      Editar
                    </button>
                  ) : null}
                </div>

                {currentStep === 1 ? (
                  <div className="mt-6 space-y-5 animate-fade-up">
                    <FieldWrap
                      tipId="checkout-name"
                      tip={fieldTip}
                    >
                      <FieldLabel required htmlFor="checkout-name">
                        Nombre
                      </FieldLabel>
                      <input
                        id="checkout-name"
                        required
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          clearFieldTip("checkout-name");
                        }}
                        className="input-soft mt-1.5"
                        autoComplete="name"
                      />
                    </FieldWrap>
                    <FieldWrap tipId="checkout-email" tip={fieldTip}>
                      <FieldLabel required htmlFor="checkout-email">
                        Email
                      </FieldLabel>
                      <input
                        id="checkout-email"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          clearFieldTip("checkout-email");
                        }}
                        className="input-soft mt-1.5"
                        autoComplete="email"
                      />
                    </FieldWrap>
                    <FieldWrap tipId="checkout-phone" tip={fieldTip}>
                      <FieldLabel required htmlFor="checkout-phone">
                        Teléfono celular
                      </FieldLabel>
                      <input
                        id="checkout-phone"
                        required
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          clearFieldTip("checkout-phone");
                        }}
                        className="input-soft mt-1.5"
                        autoComplete="tel"
                        inputMode="tel"
                      />
                      <p className="mt-1.5 text-xs text-ink-soft">
                        La paquetería lo pide para coordinar la entrega.
                      </p>
                    </FieldWrap>
                    <button
                      type="button"
                      onClick={proceedToStep2}
                      className="btn btn-primary mt-2 w-full sm:w-auto sm:min-w-[16rem]"
                    >
                      Proceder a la entrega
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {/* Paso 2 — Envío */}
          <section
            id="checkout-step-2"
            className={`checkout-step scroll-mt-24 border bg-white/40 transition-shadow duration-300 ${
              currentStep === 2
                ? "border-ink/20 shadow-[0_8px_32px_rgba(26,20,22,0.06)]"
                : currentStep < 2
                  ? "border-line opacity-60"
                  : "border-line"
            }`}
          >
            <div className="flex items-start gap-4 px-5 py-5 sm:px-6">
              <CheckoutStepBadge
                step={2}
                active={currentStep === 2}
                done={step2Done && currentStep > 2}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl tracking-wide text-ink sm:text-2xl">
                      Envío
                    </h2>
                    {currentStep === 2 ? (
                      <p className="mt-1 text-xs text-ink-soft">
                        Escribe tu código postal primero para autocompletar
                        colonia, ciudad y estado.
                      </p>
                    ) : currentStep > 2 && step2Done ? (
                      <p className="mt-1 text-sm text-ink-soft">
                        {street} {exterior}
                        {interior ? ` Int. ${interior}` : ""}, {neighborhood},{" "}
                        {city}, {stateMx} · CP {postalCode}
                      </p>
                    ) : null}
                  </div>
                  {currentStep > 2 ? (
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      className="link-anim shrink-0 text-[0.65rem] uppercase tracking-[0.14em] text-ink-soft"
                    >
                      Editar
                    </button>
                  ) : null}
                </div>

                {currentStep === 2 ? (
                  <div className="mt-6 space-y-8 animate-fade-up">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FieldWrap
                        tipId="checkout-street"
                        tip={fieldTip}
                        className="sm:col-span-2"
                      >
                        <FieldLabel required htmlFor="checkout-street">
                          Calle
                        </FieldLabel>
                        <input
                          id="checkout-street"
                          required
                          value={street}
                          onChange={(e) => {
                            setStreet(e.target.value);
                            clearFieldTip("checkout-street");
                          }}
                          className="input-soft mt-1.5"
                          autoComplete="address-line1"
                        />
                      </FieldWrap>
                      <FieldWrap tipId="checkout-exterior" tip={fieldTip}>
                        <FieldLabel
                          required
                          abbrTitle="Número exterior"
                          htmlFor="checkout-exterior"
                        >
                          Ext.
                        </FieldLabel>
                        <input
                          id="checkout-exterior"
                          required
                          value={exterior}
                          onChange={(e) => {
                            setExterior(e.target.value);
                            clearFieldTip("checkout-exterior");
                          }}
                          className="input-soft mt-1.5"
                        />
                      </FieldWrap>
                      <div>
                        <FieldLabel
                          optional
                          abbrTitle="Número interior"
                          htmlFor="checkout-interior"
                        >
                          Int.
                        </FieldLabel>
                        <input
                          id="checkout-interior"
                          value={interior}
                          onChange={(e) => setInterior(e.target.value)}
                          className="input-soft mt-1.5"
                          autoComplete="address-line2"
                        />
                      </div>
                      <FieldWrap
                        tipId="checkout-postal"
                        tip={fieldTip}
                        className="sm:col-span-2"
                      >
                        <FieldLabel required htmlFor="checkout-postal">
                          Código postal
                        </FieldLabel>
                        <input
                          id="checkout-postal"
                          required
                          value={postalCode}
                          onChange={(e) => {
                            setPostalCode(
                              e.target.value.replace(/\D/g, "").slice(0, 5),
                            );
                            clearFieldTip("checkout-postal");
                          }}
                          className="input-soft mt-1.5 max-w-[10rem]"
                          autoComplete="postal-code"
                          inputMode="numeric"
                          maxLength={5}
                        />
                        {postalStatus === "loading" ? (
                          <p className="mt-1.5 text-xs text-ink-soft">
                            Buscando…
                          </p>
                        ) : postalStatus === "found" ? (
                          <p className="mt-1.5 animate-fade-up text-xs text-ink-soft">
                            {postalColonias.length > 1
                              ? `${postalColonias.length} colonias encontradas · ${city}, ${stateMx}`
                              : `Detectado: ${city}, ${stateMx}`}
                          </p>
                        ) : postalStatus === "not-found" ? (
                          <p className="mt-1.5 text-xs text-ink-soft">
                            No encontramos ese código postal, completa los datos
                            manualmente.
                          </p>
                        ) : (
                          <p className="mt-1.5 text-xs text-ink-soft">
                            Escríbelo primero: así completamos colonia, ciudad y
                            estado por ti.
                          </p>
                        )}
                      </FieldWrap>
                      <FieldWrap
                        tipId="checkout-neighborhood"
                        tip={fieldTip}
                        className="sm:col-span-2"
                      >
                        <FieldLabel required htmlFor="checkout-neighborhood">
                          Colonia
                        </FieldLabel>
                        {postalColonias.length > 1 && !customNeighborhood ? (
                          <>
                            <select
                              id="checkout-neighborhood"
                              required
                              value={neighborhood}
                              onChange={(e) => {
                                setNeighborhood(e.target.value);
                                clearFieldTip("checkout-neighborhood");
                              }}
                              className="input-soft mt-1.5"
                            >
                              <option value="">Selecciona tu colonia</option>
                              {postalColonias.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                customNeighborhoodCpRef.current =
                                  postalCode.trim();
                                setCustomNeighborhood(true);
                                setNeighborhood("");
                              }}
                              className="link-anim mt-1.5 text-[0.65rem] uppercase tracking-[0.14em] text-ink-soft"
                            >
                              Mi colonia no aparece en la lista
                            </button>
                          </>
                        ) : (
                          <>
                            <input
                              id="checkout-neighborhood"
                              required
                              value={neighborhood}
                              onChange={(e) => {
                                setNeighborhood(e.target.value);
                                clearFieldTip("checkout-neighborhood");
                              }}
                              className="input-soft mt-1.5"
                            />
                            {postalColonias.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  customNeighborhoodCpRef.current = null;
                                  setCustomNeighborhood(false);
                                }}
                                className="link-anim mt-1.5 text-[0.65rem] uppercase tracking-[0.14em] text-ink-soft"
                              >
                                Elegir de la lista
                              </button>
                            ) : null}
                          </>
                        )}
                      </FieldWrap>
                      <FieldWrap tipId="checkout-city" tip={fieldTip}>
                        <FieldLabel required htmlFor="checkout-city">
                          Ciudad
                        </FieldLabel>
                        <input
                          id="checkout-city"
                          required
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            clearFieldTip("checkout-city");
                          }}
                          className="input-soft mt-1.5"
                          autoComplete="address-level2"
                        />
                      </FieldWrap>
                      <FieldWrap tipId="checkout-state" tip={fieldTip}>
                        <FieldLabel required htmlFor="checkout-state">
                          Estado
                        </FieldLabel>
                        <select
                          id="checkout-state"
                          required
                          value={stateMx}
                          onChange={(e) => {
                            setStateMx(e.target.value);
                            clearFieldTip("checkout-state");
                          }}
                          className="input-soft mt-1.5"
                        >
                          <option value="">Selecciona</option>
                          {MX_STATES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </FieldWrap>
                      <div>
                        <FieldLabel>País</FieldLabel>
                        <input
                          value="México"
                          readOnly
                          className="input-soft mt-1.5 bg-mist/40 text-ink-soft"
                        />
                      </div>
                    </div>

                    {!freeShipping ? (
                      <div className="space-y-4">
                        <h3 className="font-display text-lg tracking-wide text-ink">
                          Método de envío
                          <span className="ml-1 text-rose" aria-hidden>
                            *
                          </span>
                        </h3>
                        {!shippingMethods.length ? (
                          <p className="text-sm text-ink-soft">
                            No hay métodos de envío activos. Configúralos en el
                            admin.
                          </p>
                        ) : (
                          <FieldWrap tipId="checkout-shipping" tip={fieldTip}>
                            <div
                              id="checkout-shipping"
                              className="stagger-list space-y-3"
                              tabIndex={-1}
                            >
                              {shippingMethods.map((m) => {
                                const active = m.id === shippingMethodId;
                                return (
                                  <label
                                    key={m.id}
                                    className={`flex cursor-pointer items-start justify-between gap-4 border px-4 py-3 transition-all duration-300 ${
                                      active
                                        ? "select-option-active border-ink bg-white shadow-[0_8px_24px_rgba(26,20,22,0.06)]"
                                        : "border-line bg-transparent hover:-translate-y-0.5 hover:border-ink/40 hover:bg-petal/40 hover:shadow-[0_8px_20px_rgba(26,20,22,0.04)]"
                                    }`}
                                  >
                                    <span className="flex items-start gap-3">
                                      <input
                                        type="radio"
                                        name="shipping"
                                        className="mt-1"
                                        checked={active}
                                        onChange={() => {
                                          setShippingMethodId(m.id);
                                          clearFieldTip("checkout-shipping");
                                        }}
                                      />
                                      <span>
                                        <span className="block text-sm text-ink">
                                          {m.name}
                                        </span>
                                        {m.etaLabel ? (
                                          <span className="mt-0.5 block text-xs text-ink-soft">
                                            {m.etaLabel}
                                          </span>
                                        ) : null}
                                        {m.description ? (
                                          <span className="mt-0.5 block text-xs text-ink-soft">
                                            {m.description}
                                          </span>
                                        ) : null}
                                      </span>
                                    </span>
                                    <span className="shrink-0 text-sm tabular-nums text-ink">
                                      {formatCartMoney(m.priceCents / 100)}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </FieldWrap>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-rose">
                        Tu pedido califica para envío gratis.
                      </p>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="text-ink-soft"
                          aria-hidden
                        >
                          <path d="M8 4h9a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2z" />
                          <path d="M10 9h6M10 13h4" />
                        </svg>
                        <FieldLabel optional htmlFor="order-notes">
                          Agregar una nota
                        </FieldLabel>
                      </div>
                      <textarea
                        id="order-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="P. ej., Dejar el pedido en la puerta"
                        className="input-soft resize-y"
                      />
                    </div>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={() => goToStep(1)}
                        className="btn btn-secondary sm:min-w-[10rem]"
                      >
                        Regresar
                      </button>
                      <button
                        type="button"
                        onClick={proceedToStep3}
                        className="btn btn-primary sm:min-w-[16rem]"
                      >
                        Proceder al pago
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {/* Paso 3 — Pago */}
          <section
            id="checkout-step-3"
            className={`checkout-step scroll-mt-24 border bg-white/40 transition-shadow duration-300 ${
              currentStep === 3
                ? "border-ink/20 shadow-[0_8px_32px_rgba(26,20,22,0.06)]"
                : currentStep < 3
                  ? "border-line opacity-60"
                  : "border-line"
            }`}
          >
            <div className="flex items-start gap-4 px-5 py-5 sm:px-6">
              <CheckoutStepBadge
                step={3}
                active={currentStep === 3}
                done={false}
              />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl tracking-wide text-ink sm:text-2xl">
                  Pago
                </h2>
                {currentStep === 3 ? (
                  <div className="mt-6 animate-fade-up">
                    <div className="space-y-4 border border-line/70 bg-petal/25 px-4 py-4 sm:px-5 sm:py-5">
                      <div>
                        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-ink-soft">
                          Método de pago
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-ink">
                          Elige entre{" "}
                          <span className="font-medium">PayPal</span>,{" "}
                          <span className="font-medium">Mercado Pago</span> o{" "}
                          <span className="font-medium">
                            transferencia bancaria
                          </span>
                          .
                        </p>
                      </div>
                      <div className="flex items-start gap-3 border-t border-line/50 pt-4">
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="mt-0.5 shrink-0 text-rose"
                          aria-hidden
                        >
                          <rect x="4" y="10" width="16" height="10" rx="1.5" />
                          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                        </svg>
                        <div className="space-y-1 text-xs leading-relaxed text-ink-soft">
                          <p className="font-medium text-ink">
                            Pago seguro y sin guardar datos
                          </p>
                          <p>
                            PayPal y Mercado Pago procesan tu pago de forma
                            cifrada.
                          </p>
                          <p>
                            La transferencia se valida manualmente al recibir tu
                            comprobante por{" "}
                            <InstagramLink className="text-rose underline-offset-2 hover:underline" />{" "}
                            ({BANK_TRANSFER.instagram}).
                          </p>
                        </div>
                      </div>
                    </div>

                    {status ? (
                      <p
                        className="mt-4 animate-fade-up text-center text-xs text-ink-soft"
                        role="status"
                      >
                        {status}
                      </p>
                    ) : null}

                    <div className="checkout-pay-stack mt-6 space-y-4">
                      <PayPalCheckoutButtons
                        blockPay={blockPay}
                        onBlockedPay={() => {
                          validateBeforePay();
                        }}
                        createOrder={createPayPalOrder}
                        onApprove={onPayPalApprove}
                        onError={onPayError}
                      />

                      <MercadoPagoWalletBrick
                        createPreference={createPreference}
                        onError={onPayError}
                      />

                      <div className="checkout-pay-or" aria-hidden>
                        <span>o</span>
                      </div>

                      <BankTransferCheckout
                        blockPay={blockPay}
                        onBlockedPay={validateBeforePay}
                        total={estimatedTotal}
                        onSubmit={createBankTransferOrder}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      className="btn btn-secondary mt-6"
                    >
                      Regresar
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-ink-soft">
                    Completa tus datos y dirección para continuar.
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="border-t border-line/70 pt-6">
            <button
              type="button"
              onClick={() => {
                setExiting(true);
                router.replace("/tienda");
                window.setTimeout(() => clear(), 0);
              }}
              className="group inline-flex items-baseline gap-2.5 text-ink-soft transition-colors duration-300 hover:text-rose"
            >
              <span
                className="font-display text-2xl leading-none transition-transform duration-300 group-hover:rotate-90"
                aria-hidden
              >
                ×
              </span>
              <span className="text-[0.7rem] uppercase tracking-[0.2em]">
                Vaciar carrito y salir
              </span>
            </button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-8 space-y-4">
          <FreeShippingProgress subtotal={subtotal} variant="checkout" />
          <div className="animate-fade-up-delay border border-line bg-white/40 p-6 backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(26,20,22,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <p className="font-display text-xl tracking-wide text-ink">
                Resumen de la compra
              </p>
              <Link
                href="/carrito"
                className="link-anim shrink-0 text-[0.65rem] uppercase tracking-[0.14em] text-rose"
              >
                Editar
              </Link>
            </div>

            <ul className="stagger-list mt-5 space-y-4">
              {items.map((i) => (
                <li key={i.key} className="flex gap-3">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-mist">
                    <Image
                      src={productImage(i.image)}
                      alt={i.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug text-ink">{i.name}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      Talla {sizeLabel(i.size)} × {i.quantity}
                    </p>
                    <p className="mt-1 text-sm tabular-nums text-ink">
                      {formatCartMoney(i.price * i.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t border-line pt-5">
              <FieldLabel optional htmlFor="checkout-coupon">
                ¿Tienes un código de descuento?
              </FieldLabel>
              {appliedCoupon ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-3 border border-line bg-petal/50 px-3 py-2.5 animate-fade-up">
                  <span className="text-sm text-ink">
                    <span className="font-medium tracking-wide">
                      {appliedCoupon.code}
                    </span>
                    <span className="ml-2 text-ink-soft">
                      −{formatCartMoney(appliedCoupon.discount)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="link-anim ml-auto text-[0.65rem] uppercase tracking-[0.14em] text-ink-soft"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <div className="mt-1.5 flex gap-2">
                  <input
                    id="checkout-coupon"
                    value={coupon}
                    onChange={(e) => {
                      setCoupon(e.target.value);
                      setCouponMessage(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void applyCoupon();
                      }
                    }}
                    className="input-soft min-w-0 flex-1"
                    autoComplete="off"
                    disabled={couponBusy}
                    placeholder="Código"
                  />
                  <button
                    type="button"
                    onClick={() => void applyCoupon()}
                    disabled={couponBusy || !coupon.trim()}
                    className="btn btn-secondary shrink-0 px-4"
                  >
                    {couponBusy ? "…" : "Aplicar"}
                  </button>
                </div>
              )}
              {couponMessage ? (
                <p
                  className={`mt-1.5 animate-fade-up text-xs ${
                    appliedCoupon ? "text-rose" : "text-ink-soft"
                  }`}
                  role="status"
                >
                  {couponMessage}
                </p>
              ) : null}
            </div>

            <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-soft">Subtotal</span>
                <span className="tabular-nums transition-opacity duration-300">
                  {formatCartMoney(subtotal)}
                </span>
              </div>
              {appliedCoupon && discountAmount > 0 ? (
                <div className="flex justify-between animate-fade-up text-rose">
                  <span>Descuento ({appliedCoupon.code})</span>
                  <span className="tabular-nums">
                    −{formatCartMoney(discountAmount)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-ink-soft">Envío</span>
                <span
                  key={
                    selectedShipping
                      ? `${selectedShipping.id}-${shippingCost}`
                      : "none"
                  }
                  className={`tabular-nums animate-fade-up${
                    freeShipping && selectedShipping ? " text-rose" : ""
                  }`}
                >
                  {!selectedShipping
                    ? "—"
                    : freeShipping
                      ? "Gratis"
                      : formatCartMoney(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
                <span>Total</span>
                <span
                  key={estimatedTotal}
                  className="tabular-nums animate-fade-up"
                >
                  {formatCartMoney(estimatedTotal)}
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs text-ink-soft">
              {count} {count === 1 ? "pieza" : "piezas"}
              {appliedCoupon
                ? " · El descuento se confirma al pagar."
                : " · Puedes aplicar un cupón antes de pagar."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
