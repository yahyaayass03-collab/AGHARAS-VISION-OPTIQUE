"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function ProductGallery({
  images,
  name,
  badge,
}: {
  images: Array<{ id: string; url: string; alt: string }>;
  name: string;
  badge?: string | null;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div>
      <div className="relative flex aspect-[4/3] max-h-[620px] items-center justify-center border border-outline-variant bg-surface-dim p-5 sm:aspect-[5/4] sm:p-8 lg:aspect-[1/0.85]">
        {badge && (
          <span className="absolute left-4 top-4 z-10 bg-primary px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.12em] text-white">
            {badge}
          </span>
        )}
        {current ? (
          <Image
            key={current.id}
            src={current.url}
            alt={current.alt || name}
            width={760}
            height={520}
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 border border-dashed border-outline-variant text-outline">
            <Icon name="glasses" size={56} />
            <p className="text-[0.7rem] uppercase tracking-[0.12em]">
              Visuel à venir
            </p>
          </div>
        )}
        <span className="absolute bottom-4 right-4 hidden items-center gap-1.5 border border-outline-variant bg-white/90 px-2 py-1 text-[0.6rem] uppercase tracking-[0.1em] text-primary sm:flex">
          <Icon name="sparkle" size={12} className="text-secondary" />
          Vue studio
        </span>
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Vues du produit">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Voir la vue ${index + 1}`}
              onClick={() => setActive(index)}
              className={`flex h-16 w-[20%] min-w-[4rem] shrink-0 items-center justify-center border bg-white p-1.5 transition-colors sm:h-20 ${
                index === active
                  ? "border-primary"
                  : "border-outline-variant hover:border-primary"
              }`}
            >
              <Image
                src={image.url}
                alt=""
                width={90}
                height={70}
                sizes="90px"
                className="max-h-full w-auto object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
