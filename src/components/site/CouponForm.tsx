"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  applyCouponAction,
  type CartActionState,
} from "@/app/actions/cart";
import { Icon } from "@/components/ui/Icon";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-quiet shrink-0 px-4 py-2.5 text-[0.62rem] uppercase tracking-[0.12em]"
    >
      {pending ? "…" : "Appliquer"}
    </button>
  );
}

export function CouponForm({ initialCode }: { initialCode: string | null }) {
  const [state, formAction] = useActionState<CartActionState, FormData>(
    applyCouponAction,
    null,
  );

  return (
    <div>
      <form action={formAction} className="flex items-stretch gap-2">
        <label htmlFor="coupon-code" className="sr-only">
          Code privilège ou invitation
        </label>
        <input
          id="coupon-code"
          name="code"
          type="text"
          defaultValue={initialCode ?? ""}
          placeholder="Code privilège…"
          autoComplete="off"
          className="field bg-surface-dim py-2.5 text-body-sm uppercase tracking-[0.08em]"
        />
        <SubmitButton />
      </form>
      {state && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`mt-2 flex items-start gap-1.5 text-[0.72rem] ${
            state.ok ? "text-success" : "text-error"
          }`}
        >
          <Icon
            name={state.ok ? "check" : "alert"}
            size={13}
            className="mt-0.5"
          />
          {state.message}
        </p>
      )}
    </div>
  );
}
