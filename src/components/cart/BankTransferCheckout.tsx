"use client";

import { useCallback, useState } from "react";
import { InstagramLink } from "@/components/store/InstagramLink";
import { BANK_TRANSFER } from "@/lib/orders/bank-transfer";
import { formatCartMoney } from "@/lib/cart/types";

type Props = {
  blockPay: boolean;
  onBlockedPay: () => void;
  total: number;
  onSubmit: () => Promise<void>;
};

export function BankTransferCheckout({
  blockPay,
  onBlockedPay,
  total,
  onSubmit,
}: Props) {
  const [selected, setSelected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyAccount = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(BANK_TRANSFER.accountNumberRaw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (blockPay) {
      onBlockedPay();
      return;
    }
    if (!selected) {
      setError("Marca la casilla para confirmar que pagarás por transferencia.");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      await onSubmit();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo crear el pedido.",
      );
    } finally {
      setBusy(false);
    }
  }, [blockPay, onBlockedPay, onSubmit, selected]);

  return (
    <div className="animate-fade-up rounded-sm border border-line/80 bg-porcelain/40 px-4 py-5">
      <h3 className="font-display text-lg tracking-wide text-ink">
        Depósito y transferencia
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        Transfiere el total de tu pedido y envía tu comprobante por{" "}
        <InstagramLink />. Validamos el pago manualmente antes de preparar tu
        envío.
      </p>

      <dl className="mt-4 space-y-2.5 rounded-sm border border-line/60 bg-petal/50 px-4 py-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-ink-soft">
            Banco
          </dt>
          <dd className="font-medium text-ink">{BANK_TRANSFER.bank}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-ink-soft">
            Cuenta
          </dt>
          <dd className="flex items-center gap-2">
            <span className="font-mono text-[0.8rem] tracking-wide text-ink">
              {BANK_TRANSFER.accountNumber}
            </span>
            <button
              type="button"
              onClick={() => void copyAccount()}
              className={`pressable text-[0.6rem] uppercase tracking-[0.14em] transition-colors duration-200 ${
                copied ? "text-ink" : "text-rose underline-offset-2 hover:underline"
              }`}
            >
              {copied ? "Copiado ✓" : "Copiar"}
            </button>
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-ink-soft">
            Titular
          </dt>
          <dd className="text-right text-ink">{BANK_TRANSFER.holder}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-line/50 pt-2.5">
          <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-ink-soft">
            Monto
          </dt>
          <dd className="font-medium tabular-nums text-ink">
            {formatCartMoney(total)}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        Al terminar, manda tu comprobante por <InstagramLink /> (
        {BANK_TRANSFER.instagram}) con tu número de pedido.
      </p>

      <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-ink">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            setSelected(e.target.checked);
            if (e.target.checked) setError(null);
          }}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--cleoh-ink)]"
        />
        <span>
          Confirmo que elegí pagar por transferencia o depósito bancario (SPEI)
          y enviaré el comprobante por <InstagramLink />.
        </span>
      </label>

      {error ? (
        <p className="animate-fade-up mt-3 text-center text-xs text-rose" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy || !selected}
        onClick={() => void handleConfirm()}
        className="btn btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Creando pedido…" : "Confirmar pedido por transferencia"}
      </button>
    </div>
  );
}
