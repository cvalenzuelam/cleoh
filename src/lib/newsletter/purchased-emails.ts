import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

const PURCHASED_STATUSES = ["paid", "fulfilled"] as const;

export async function getPurchasedEmailSet() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select("email")
    .in("status", [...PURCHASED_STATUSES]);

  if (error) {
    console.error("[newsletter] purchased lookup:", error.message);
    return new Set<string>();
  }

  return new Set(
    (data ?? [])
      .map((row) => row.email?.trim().toLowerCase())
      .filter(Boolean) as string[],
  );
}
