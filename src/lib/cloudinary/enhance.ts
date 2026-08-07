import "server-only";

import crypto from "crypto";
import { cleanEnv } from "@/lib/env/clean";

/** Mejora automática al subir fotos de producto / hero en admin. */
export const CLOUDINARY_ENHANCE_TRANSFORM =
  "e_auto_enhance/c_limit,w_2000/f_auto/q_auto:best";

export function cloudinaryConfigured() {
  return Boolean(
    cleanEnv(process.env.CLOUDINARY_CLOUD_NAME) &&
      cleanEnv(process.env.CLOUDINARY_API_KEY) &&
      cleanEnv(process.env.CLOUDINARY_API_SECRET),
  );
}

export function cloudinaryEnhanceEnabled() {
  if (!cloudinaryConfigured()) return false;
  const flag = cleanEnv(process.env.CLOUDINARY_ENHANCE).toLowerCase();
  return flag !== "false" && flag !== "0";
}

function signParams(params: Record<string, string>, secret: string) {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(sorted + secret).digest("hex");
}

function extFromContentType(contentType: string) {
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

/**
 * Pasa la imagen por Cloudinary (auto enhance + límite 2000px) y devuelve bytes listos para R2.
 */
export async function enhanceImageBuffer(
  input: Buffer,
  contentType: string,
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const cloudName = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
  const apiKey = cleanEnv(process.env.CLOUDINARY_API_KEY);
  const apiSecret = cleanEnv(process.env.CLOUDINARY_API_SECRET);

  const timestamp = Math.round(Date.now() / 1000).toString();
  const transformation = CLOUDINARY_ENHANCE_TRANSFORM;
  const folder = "cleoh/uploads-temp";
  // Cloudinary firma TODOS los parámetros que se envían (menos file/api_key/
  // resource_type); si "folder" no entra aquí, la firma no coincide con la que
  // calcula el servidor y responde "Invalid Signature".
  const signature = signParams({ timestamp, transformation, folder }, apiSecret);

  const form = new FormData();
  form.append(
    "file",
    new Blob([Uint8Array.from(input)], { type: contentType }),
    "upload",
  );
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("transformation", transformation);
  form.append("folder", folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form },
  );

  const uploadData = (await uploadRes.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };

  if (!uploadRes.ok || !uploadData.secure_url) {
    throw new Error(
      uploadData.error?.message ||
        `Cloudinary upload failed (${uploadRes.status})`,
    );
  }

  const downloadRes = await fetch(uploadData.secure_url);
  if (!downloadRes.ok) {
    throw new Error(`No se pudo descargar imagen mejorada (${downloadRes.status})`);
  }

  const outType =
    downloadRes.headers.get("content-type")?.split(";")[0]?.trim() ||
    "image/jpeg";

  return {
    buffer: Buffer.from(await downloadRes.arrayBuffer()),
    contentType: outType,
    ext: extFromContentType(outType),
  };
}
