import { Icon } from "@/components/ui/Icon";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

const TONES: Record<string, string> = {
  PENDING: "border-gold/60 bg-gold/15 text-secondary",
  CONFIRMED: "border-primary/20 bg-primary/10 text-primary",
  IN_PRODUCTION: "border-secondary/30 bg-secondary/10 text-secondary",
  SHIPPED: "border-primary/20 bg-primary/10 text-primary",
  DELIVERED: "border-success/30 bg-success/10 text-success",
  CANCELLED: "border-error/30 bg-error-container text-error",
};

export function OrderStatusBadge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.12em] ${
        TONES[status] ?? "border-outline-variant bg-surface-dim text-primary"
      } ${className}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export const ORDER_FLOW = [
  "PENDING",
  "CONFIRMED",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
] as const;

export type HistoryEntry = {
  id: string;
  toStatus: string;
  note: string | null;
  createdAt: Date;
};

export function OrderTimeline({
  status,
  history,
  compact = false,
}: {
  status: string;
  history: HistoryEntry[];
  compact?: boolean;
}) {
  if (status === "CANCELLED") {
    return (
      <div className="border border-error/30 bg-error-container p-4">
        <p className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.12em] text-error">
          <Icon name="close" size={14} />
          Commande annulée
        </p>
        <p className="mt-1.5 text-body-sm leading-relaxed text-on-surface-variant">
          Cette commande a été annulée. Aucun paiement n&apos;est dû. Notre
          conciergerie reste disponible pour toute question.
        </p>
        {history.length > 0 && (
          <p className="mt-2 text-[0.7rem] text-outline">
            Dernière mise à jour :{" "}
            {(history[history.length - 1]?.createdAt ?? new Date()).toLocaleDateString("fr-MA", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>
    );
  }

  const currentIndex = Math.max(0, ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]));
  const noteFor = (step: string) =>
    history.find((entry) => entry.toStatus === step)?.note ?? null;

  return (
    <ol className={compact ? "space-y-3" : "space-y-0"}>
      {ORDER_FLOW.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        const note = noteFor(step);
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.55rem] ${
                  done
                    ? "border-primary bg-primary text-white"
                    : active
                      ? "border-secondary bg-secondary text-white"
                      : "border-outline-variant bg-white text-outline"
                }`}
                aria-hidden="true"
              >
                {done ? <Icon name="check" size={12} /> : index + 1}
              </span>
              {index < ORDER_FLOW.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`my-1 w-px flex-1 ${done ? "bg-primary/40" : "bg-outline-variant"}`}
                />
              )}
            </div>
            <div className={index === ORDER_FLOW.length - 1 ? "pb-0" : "pb-4"}>
              <p
                className={`text-[0.72rem] uppercase tracking-[0.1em] ${
                  active ? "font-medium text-secondary" : done ? "text-primary" : "text-outline"
                }`}
              >
                {ORDER_STATUS_LABELS[step]}
              </p>
              {note && (
                <p className="mt-0.5 text-[0.72rem] leading-relaxed text-on-surface-variant">
                  {note}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
