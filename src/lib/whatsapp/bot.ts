import "server-only";

import { resolveWhatsAppReply } from "@/lib/whatsapp/messages";
import { sendWhatsAppText } from "@/lib/whatsapp/send";

type IncomingTextMessage = {
  from: string;
  text: string;
};

export function extractWhatsAppTextMessages(payload: unknown) {
  const messages: IncomingTextMessage[] = [];

  if (!payload || typeof payload !== "object") return messages;

  const entries = (payload as { entry?: unknown[] }).entry ?? [];
  for (const entry of entries) {
    const changes =
      entry && typeof entry === "object"
        ? ((entry as { changes?: unknown[] }).changes ?? [])
        : [];

    for (const change of changes) {
      const value =
        change && typeof change === "object"
          ? (change as { value?: { messages?: unknown[] } }).value
          : undefined;
      const rawMessages = value?.messages ?? [];

      for (const message of rawMessages) {
        if (!message || typeof message !== "object") continue;
        const typed = message as {
          from?: string;
          type?: string;
          text?: { body?: string };
        };

        if (typed.type !== "text" || !typed.from || !typed.text?.body?.trim()) {
          continue;
        }

        messages.push({
          from: typed.from,
          text: typed.text.body.trim(),
        });
      }
    }
  }

  return messages;
}

export async function handleWhatsAppIncomingMessages(payload: unknown) {
  const messages = extractWhatsAppTextMessages(payload);
  const results: { from: string; sent: boolean }[] = [];

  for (const message of messages) {
    const reply = resolveWhatsAppReply(message.text);
    const result = await sendWhatsAppText(message.from, reply);
    results.push({ from: message.from, sent: result.sent });
  }

  return results;
}
