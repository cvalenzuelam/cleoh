"use client";

import {
  PayPalButtons,
  PayPalScriptProvider,
} from "@paypal/react-paypal-js";
import { useCallback, useEffect, useRef } from "react";

type Props = {
  /** true = formulario incompleto: se ve el botón oficial, pero no abre popup */
  blockPay?: boolean;
  onBlockedPay?: () => void;
  createOrder: () => Promise<string>;
  onApprove: (orderID: string) => Promise<void>;
  onError?: (message: string) => void;
};

export function PayPalCheckoutButtons({
  blockPay = false,
  onBlockedPay,
  createOrder,
  onApprove,
  onError,
}: Props) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim();
  const createOrderRef = useRef(createOrder);
  const onApproveRef = useRef(onApprove);
  const onErrorRef = useRef(onError);
  const blockPayRef = useRef(blockPay);

  useEffect(() => {
    createOrderRef.current = createOrder;
    onApproveRef.current = onApprove;
    onErrorRef.current = onError;
    blockPayRef.current = blockPay;
  }, [createOrder, onApprove, onError, blockPay]);

  const handleCreateOrder = useCallback(async () => {
    if (blockPayRef.current) {
      onBlockedPay?.();
      return Promise.reject("validation");
    }
    try {
      return await createOrderRef.current();
    } catch (err) {
      const msg =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : "Error con PayPal. Intenta de nuevo.";
      if (
        msg !== "validation" &&
        !msg.includes("obligatorio") &&
        !msg.includes("obligatoria") &&
        !msg.includes("método de envío")
      ) {
        onErrorRef.current?.(msg);
      }
      return Promise.reject(msg);
    }
  }, [onBlockedPay]);

  const handleApprove = useCallback(async (data: { orderID: string }) => {
    try {
      await onApproveRef.current(data.orderID);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "No se pudo confirmar el pago PayPal.";
      onErrorRef.current?.(msg);
    }
  }, []);

  if (!clientId) {
    return (
      <p className="text-sm text-ink-soft">
        Falta <code className="text-xs">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code>
      </p>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: "MXN",
        intent: "capture",
        locale: "es_MX",
        disableFunding: "card,credit,paylater,venmo",
      }}
    >
      <div className="checkout-pay-slot checkout-pay-slot--paypal relative isolate min-h-[48px]">
        <div
          className={
            blockPay ? "paypal-click-shielded pointer-events-none" : undefined
          }
        >
          <PayPalButtons
            style={{
              layout: "vertical",
              color: "gold",
              shape: "rect",
              label: "paypal",
              height: 48,
            }}
            onClick={(_data, actions) => {
              if (blockPayRef.current) {
                onBlockedPay?.();
                return actions.reject();
              }
              return actions.resolve();
            }}
            createOrder={handleCreateOrder}
            onApprove={handleApprove}
            onError={() => {}}
            onCancel={() => {
              onErrorRef.current?.("Pago PayPal cancelado.");
            }}
          />
        </div>

        {blockPay ? (
          <button
            type="button"
            className="absolute inset-0 z-[9999] cursor-pointer bg-transparent"
            aria-label="Completa los campos obligatorios para pagar"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBlockedPay?.();
            }}
          />
        ) : null}
      </div>
    </PayPalScriptProvider>
  );
}
