"use client";

import { useState } from "react";

type Props = {
  defaultUrls?: string[];
  labelClass: string;
  inputClass: string;
};

export function ProductImagesField({
  defaultUrls = [],
  labelClass,
  inputClass,
}: Props) {
  const [urls, setUrls] = useState<string[]>(
    defaultUrls.filter((u) => u.trim().length > 0),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setStatus(`Subiendo ${files.length} imagen(es)…`);

    const uploaded: string[] = [];
    try {
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body,
        });
        const data = (await res.json()) as { url?: string; message?: string };
        if (!res.ok || !data.url) {
          setStatus(data.message ?? "Error al subir una imagen");
          continue;
        }
        uploaded.push(data.url);
      }
      if (uploaded.length > 0) {
        setUrls((prev) => [...prev, ...uploaded]);
        setStatus(
          uploaded.length === files.length
            ? "Imágenes subidas."
            : `Subidas ${uploaded.length} de ${files.length}.`,
        );
      }
    } catch {
      setStatus("Error de red al subir.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function move(index: number, dir: -1 | 1) {
    setUrls((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index]!;
      next[index] = next[target]!;
      next[target] = tmp;
      return next;
    });
  }

  function remove(index: number) {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function addUrlManual(raw: string) {
    const url = raw.trim();
    if (!url) return;
    setUrls((prev) => [...prev, url]);
  }

  return (
    <div className="sm:col-span-2 space-y-4">
      <input type="hidden" name="image_urls" value={JSON.stringify(urls)} />

      <div>
        <label htmlFor="product-images-file" className={labelClass}>
          Galería de fotos
        </label>
        <input
          id="product-images-file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={onFileChange}
          disabled={uploading}
          className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800"
        />
        <p className="mt-1 text-xs text-zinc-400">
          La primera es la principal (tienda y cards). Puedes subir varias a la
          vez. JPG, PNG, WEBP o GIF · máx. 5 MB c/u.
        </p>
      </div>

      <div>
        <label htmlFor="manual-image-url" className={labelClass}>
          O pega una URL
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id="manual-image-url"
            type="url"
            placeholder="https://…"
            className={inputClass}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrlManual((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
          <button
            type="button"
            className="shrink-0 rounded-md border border-zinc-200 px-3 text-sm text-zinc-700 hover:bg-zinc-50"
            onClick={() => {
              const input = document.getElementById(
                "manual-image-url",
              ) as HTMLInputElement | null;
              if (!input) return;
              addUrlManual(input.value);
              input.value = "";
            }}
          >
            Añadir
          </button>
        </div>
      </div>

      {urls.length > 0 ? (
        <ul className="space-y-3">
          {urls.map((url, i) => (
            <li
              key={`${url}-${i}`}
              className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50/50 p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-16 w-12 shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-700">
                  {i === 0 ? "Principal" : `Foto ${i + 1}`}
                </p>
                <p className="truncate text-xs text-zinc-400">{url}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  className="rounded border border-zinc-200 px-2 py-1 text-xs disabled:opacity-30"
                  aria-label="Subir"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={i === urls.length - 1}
                  onClick={() => move(i, 1)}
                  className="rounded border border-zinc-200 px-2 py-1 text-xs disabled:opacity-30"
                  aria-label="Bajar"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded border border-zinc-200 px-2 py-1 text-xs text-red-600"
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-zinc-400">Sin fotos aún.</p>
      )}

      {status ? (
        <p className="text-xs text-zinc-500" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
