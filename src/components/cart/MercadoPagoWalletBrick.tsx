"use client";

import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

type Props = {
  disabled?: boolean;
  /** Crea preferencia y resuelve con preferenceId oficial de MP */
  createPreference: () => Promise<string>;
  onError?: (message: string) => void;
};

let mpInitialized = false;

function MercadoPagoWalletBrickInner({
  disabled,
  createPreference,
  onError,
}: Props) {
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.trim();
  const [ready, setReady] = useState(() => {
    if (!publicKey) return false;
    if (!mpInitialized) {
      initMercadoPago(publicKey, { locale: "es-MX" });
      mpInitialized = true;
    }
    return true;
  });
  const createPreferenceRef = useRef(createPreference);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    createPreferenceRef.current = createPreference;
    onErrorRef.current = onError;
  }, [createPreference, onError]);

  useEffect(() => {
    if (!publicKey || ready) return;
    if (!mpInitialized) {
      initMercadoPago(publicKey, { locale: "es-MX" });
      mpInitialized = true;
    }
    queueMicrotask(() => setReady(true));
  }, [publicKey, ready]);

  const handleSubmit = useCallback(async () => {
    try {
      return await createPreferenceRef.current();
    } catch (e) {
      const msg =
        typeof e === "string"
          ? e
          : e instanceof Error
            ? e.message
            : "No se pudo iniciar el pago con Mercado Pago.";
      onErrorRef.current?.(msg);
      return Promise.reject(msg);
    }
  }, []);

  const handleError = useCallback((error: unknown) => {
    onErrorRef.current?.(
      typeof error === "object" && error && "message" in error
        ? String((error as { message: string }).message)
        : "Error del botón de Mercado Pago.",
    );
  }, []);

  if (!publicKey) {
    return (
      <p className="rounded-sm border border-line bg-petal/40 px-3 py-2 text-sm text-ink-soft">
        Falta <code className="text-xs">NEXT_PUBLIC_MP_PUBLIC_KEY</code> en
        .env.local
      </p>
    );
  }

  if (!ready) {
    return (
      <div className="checkout-pay-loading" role="status">
        Cargando Mercado Pago…
      </div>
    );
  }

  return (
    <div
      className={`checkout-pay-slot checkout-pay-slot--mp mp-wallet-wrap relative w-full ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      {disabled ? (
        <div className="absolute inset-0 z-10" aria-hidden />
      ) : null}
      <Wallet
        locale="es-MX"
        customization={{
          theme: "default",
          valueProp: "security_safety",
          customStyle: {
            valuePropColor: "blue",
            borderRadius: "6px",
            buttonHeight: "48px",
            hideValueProp: true,
          },
        }}
        onSubmit={handleSubmit}
        onError={handleError}
      />
    </div>
  );
}

/** Solo re-render si cambia `disabled` (evita flash al tipear en el form). */
export const MercadoPagoWalletBrick = memo(
  MercadoPagoWalletBrickInner,
  (prev, next) => prev.disabled === next.disabled,
);
