"use client";

import { useEffect, useState } from "react";

/** Segundos restantes hasta poder reenviar (actualiza en vivo). */
export function useResendCooldown(cooldownUntil: number) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!cooldownUntil) {
      setSecondsLeft(0);
      return;
    }

    const tick = () => {
      const remainingMs = Math.max(0, cooldownUntil - Date.now());
      setSecondsLeft(Math.ceil(remainingMs / 1000));
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  const coolingDown = secondsLeft > 0;

  return {
    coolingDown,
    secondsLeft,
    resendLinkLabel: coolingDown
      ? `Reenviar en ${secondsLeft}s`
      : "¿No te llegó? Reenviar correo",
    resendButtonLabel: coolingDown
      ? `Reenviar en ${secondsLeft}s`
      : "Reenviar",
  };
}
