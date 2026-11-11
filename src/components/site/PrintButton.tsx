"use client";

import { Icon } from "@/components/ui/Icon";

export function PrintButton({
  label = "Imprimer le récapitulatif",
  className = "btn-quiet",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      <Icon name="file" size={15} />
      {label}
    </button>
  );
}
