"use client";

import { useState, useTransition } from "react";
import { toggleWishlistAction } from "@/app/actions/wishlist";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  initialSaved,
  className,
  showLabel = false,
}: {
  productId: string;
  initialSaved: boolean;
  className?: string;
  showLabel?: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !saved;
    setSaved(next);
    setError(null);
    startTransition(async () => {
      const result = await toggleWishlistAction(productId);
      if (!result.ok) {
        setSaved(!next);
        setError(result.message ?? "Impossible de mettre à jour les favoris.");
        return;
      }
      setSaved(Boolean(result.saved));
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={cn(
        "inline-flex items-center gap-2 transition-colors disabled:opacity-60",
        saved ? "text-secondary" : "text-on-surface-variant hover:text-secondary",
        className,
      )}
      title={error ?? undefined}
    >
      <Icon name="heart" size={18} filled={saved} />
      {showLabel && (
        <span className="text-label uppercase tracking-[0.1em]">
          {saved ? "Dans mes favoris" : "Ajouter aux favoris"}
        </span>
      )}
    </button>
  );
}
