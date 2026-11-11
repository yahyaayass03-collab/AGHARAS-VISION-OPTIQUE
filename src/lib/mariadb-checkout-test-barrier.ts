import "server-only";

type CheckoutBarrierPoint = "quoted" | "catalog-locked" | "review-entering" | "review-locked";
type CheckoutBarrier = (point: CheckoutBarrierPoint, productId: string) => Promise<void>;

let barrier: CheckoutBarrier | undefined;

/** Test-only synchronization hook; unavailable in every non-test runtime. */
export function setMariaDbCheckoutTestBarrier(next: CheckoutBarrier | undefined): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("MariaDB checkout barriers can only be configured in test mode.");
  }
  barrier = next;
}

export async function reachMariaDbCheckoutTestBarrier(
  point: CheckoutBarrierPoint,
  productId: string,
): Promise<void> {
  if (process.env.NODE_ENV === "test") await barrier?.(point, productId);
}
