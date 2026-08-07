import { NextResponse } from "next/server";
import {
  cloudinaryEnhanceEnabled,
  enhanceImageBuffer,
} from "@/lib/cloudinary/enhance";
import { r2Configured, uploadToR2 } from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/supabase/safe-user";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

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

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!r2Configured()) {
    return NextResponse.json(
      {
        message:
          "Faltan variables R2 en .env.local (ACCOUNT_ID, keys, BUCKET, PUBLIC_BASE_URL).",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "FormData inválido" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Falta el archivo" }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { message: "Solo JPG, PNG, WEBP o GIF." },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { message: "Máximo 5 MB por imagen." },
      { status: 400 },
    );
  }

  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);

  try {
    let buffer = Buffer.from(await file.arrayBuffer());
    let contentType = file.type;
    let ext =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : "gif";

    if (cloudinaryEnhanceEnabled()) {
      try {
        const enhanced = await enhanceImageBuffer(buffer, contentType);
        buffer = Buffer.from(enhanced.buffer);
        contentType = enhanced.contentType;
        ext = enhanced.ext;
      } catch (e) {
        console.error("[cloudinary enhance]", e);
        return NextResponse.json(
          {
            message:
              e instanceof Error
                ? e.message
                : "No se pudo mejorar la imagen con Cloudinary.",
          },
          { status: 502 },
        );
      }
    }

    const key = `products/${stamp}-${rand}.${ext}`;

    const url = await uploadToR2({
      key,
      body: buffer,
      contentType,
    });
    return NextResponse.json({
      ok: true,
      url,
      key,
      enhanced: cloudinaryEnhanceEnabled(),
    });
  } catch (e) {
    console.error("[r2 upload]", e);
    return NextResponse.json(
      {
        message:
          e instanceof Error ? e.message : "Error al subir a Cloudflare R2",
      },
      { status: 502 },
    );
  }
}
