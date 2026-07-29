"use client";

import { useState } from "react";

type Props = {
  name: string;
  defaultValue?: string;
  label?: string;
  labelClass: string;
  inputClass: string;
  previewClassName?: string;
};

export function ImageUploadField({
  name,
  defaultValue = "",
  label = "Imagen principal",
  labelClass,
  inputClass,
  previewClassName = "h-40 w-40 rounded-md border border-zinc-200 object-cover",
}: Props) {
  const [url, setUrl] = useState(defaultValue);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatus("Subiendo a Cloudflare R2…");

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !data.url) {
        setStatus(data.message ?? "Error al subir");
        return;
      }
      setUrl(data.url);
      setStatus("Imagen subida.");
    } catch {
      setStatus("Error de red al subir.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="sm:col-span-2 space-y-3">
      <div>
        <label htmlFor={`${name}-file`} className={labelClass}>
          {label}
        </label>
        <input
          id={`${name}-file`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={onFileChange}
          disabled={uploading}
          className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800"
        />
        <p className="mt-1 text-xs text-zinc-400">
          JPG, PNG, WEBP o GIF · máx. 5 MB · se sube a R2
        </p>
      </div>

      <div>
        <label htmlFor={name} className={labelClass}>
          URL imagen (auto al subir, o pégala)
        </label>
        <input
          id={name}
          name={name}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://pub-….r2.dev/products/…"
          className={inputClass}
        />
      </div>

      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Vista previa" className={previewClassName} />
      ) : null}

      {status ? (
        <p className="text-xs text-zinc-500" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
