import "server-only";

function required(name: string) {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Falta ${name} en .env.local`);
  return v;
}

export function r2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.CLOUDFLARE_API_TOKEN?.trim() &&
      process.env.R2_BUCKET?.trim() &&
      process.env.R2_PUBLIC_BASE_URL?.trim(),
  );
}

export function publicUrlForKey(key: string) {
  const base = required("R2_PUBLIC_BASE_URL").replace(/\/$/, "");
  return `${base}/${key.replace(/^\//, "")}`;
}

/**
 * Sube por API de Cloudflare (no S3).
 * En esta máquina el endpoint *.r2.cloudflarestorage.com falla el handshake TLS.
 */
export async function uploadToR2(input: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  const accountId = required("R2_ACCOUNT_ID");
  const bucket = required("R2_BUCKET");
  const token = required("CLOUDFLARE_API_TOKEN");
  const key = input.key.replace(/^\//, "");

  // Las barras del key van literales (no %2F), según docs de Cloudflare
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${key}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": input.contentType || "application/octet-stream",
    },
    body: new Uint8Array(input.body),
  });

  const data = (await res.json().catch(() => null)) as {
    success?: boolean;
    errors?: { message?: string }[];
  } | null;

  if (!res.ok || !data?.success) {
    const msg =
      data?.errors?.[0]?.message ||
      `Cloudflare R2 upload failed (${res.status})`;
    throw new Error(msg);
  }

  return publicUrlForKey(key);
}
