import { NextResponse } from "next/server";
import { getPurchasedEmailSet } from "@/lib/newsletter/purchased-emails";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/supabase/safe-user";

async function requireAdmin() {
  const supabase = await createClient();
  const user = await getSafeUser(supabase);
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") return null;
  return user;
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const [subscribersResult, purchasedEmails] = await Promise.all([
    supabase
      .from("newsletter_subscribers")
      .select("email, source, subscribed_at")
      .order("subscribed_at", { ascending: false }),
    getPurchasedEmailSet(),
  ]);

  const { data, error } = subscribersResult;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const header = "email,source,subscribed_at,purchased";
  const rows = (data ?? []).map((row) => {
    const purchased = purchasedEmails.has(row.email.toLowerCase())
      ? "yes"
      : "no";
    return [
      csvEscape(row.email),
      csvEscape(row.source ?? "popup"),
      csvEscape(row.subscribed_at),
      purchased,
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");
  const filename = `cleoh-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
