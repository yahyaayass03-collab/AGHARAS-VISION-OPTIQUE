"use client";

import { useRef, useState } from "react";

type Item = { id: string; url: string; file?: File };

export function ProductImagesField({ initialUrls }: { initialUrls: string[] }) {
  const [items, setItems] = useState<Item[]>(() => initialUrls.map((url, index) => ({ id: `initial-${index}`, url })));
  const input = useRef<HTMLInputElement>(null);

  function synchronizeFiles(next: Item[]) {
    if (!input.current) return;
    const transfer = new DataTransfer();
    for (const item of next) if (item.file) transfer.items.add(item.file);
    input.current.files = transfer.files;
  }

  function remove(id: string) {
    const removed = items.find((item) => item.id === id);
    if (removed?.file) URL.revokeObjectURL(removed.url);
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    synchronizeFiles(next);
  }

  function move(index: number, direction: number) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target]!, next[index]!];
    setItems(next);
    synchronizeFiles(next);
  }

  const existing = items.filter((item) => !item.file);
  const uploaded = items.filter((item) => item.file);
  const order = items.map((item) => item.file
    ? existing.length + uploaded.findIndex((entry) => entry.id === item.id)
    : existing.findIndex((entry) => entry.id === item.id));

  return (
    <div className="space-y-3">
      <input type="hidden" name="imageUrls" value={existing.map((item) => item.url).join("\n")} />
      <input type="hidden" name="imageOrder" value={JSON.stringify(order)} />
      <label className="field-label" htmlFor="product-images">Ajouter des photos (JPEG, PNG ou WebP · 5 Mo chacune)</label>
      <input
        ref={input}
        id="product-images"
        type="file"
        name="images"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="admin-input"
        onChange={(event) => {
          const chosen = Array.from(event.currentTarget.files ?? []);
          for (const item of items) if (item.file) URL.revokeObjectURL(item.url);
          const next = [...items.filter((item) => !item.file), ...chosen.map((file) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(file), file }))];
          setItems(next);
          synchronizeFiles(next);
        }}
      />
      <p className="field-hint">Huit photos maximum. La première est la photo principale. Utilisez les flèches pour changer l'ordre.</p>
      {items.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => (
            <li key={item.id} className="border border-outline-variant bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={`Photo ${index + 1}`} className="h-28 w-full bg-surface-dim object-contain" />
              <p className="mt-1 truncate text-[0.7rem] text-primary">{index === 0 ? "Photo principale" : `Photo ${index + 1}`}</p>
              <div className="mt-2 flex gap-1">
                <button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="btn-quiet btn-sm" aria-label={`Monter la photo ${index + 1}`}>↑</button>
                <button type="button" disabled={index === items.length - 1} onClick={() => move(index, 1)} className="btn-quiet btn-sm" aria-label={`Descendre la photo ${index + 1}`}>↓</button>
                <button type="button" onClick={() => remove(item.id)} className="btn-quiet btn-sm text-error" aria-label={`Supprimer la photo ${index + 1}`}>Retirer</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
