"use client";

import { useActionState } from "react";
import { saveStaffAction } from "@/app/actions/admin/system";
import type { AdminState } from "@/lib/admin";
import {
  AdminField,
  AdminSelect,
  FormFeedback,
  SubmitButton,
} from "@/components/admin/FormBits";

export function StaffForm({
  roles,
}: {
  roles: Array<{ id: string; name: string }>;
}) {
  const [state, formAction] = useActionState<AdminState, FormData>(
    saveStaffAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <FormFeedback state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminField
          label="Prénom"
          name="firstName"
          required
          error={state?.fieldErrors?.firstName}
        />
        <AdminField
          label="Nom"
          name="lastName"
          required
          error={state?.fieldErrors?.lastName}
        />
        <AdminField
          label="E-mail professionnel"
          name="email"
          type="email"
          required
          autoComplete="off"
          error={state?.fieldErrors?.email}
        />
        <AdminField
          label="Mot de passe initial"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          hint="8 caractères minimum. Le collaborateur doit le changer."
          error={state?.fieldErrors?.password}
        />
      </div>
      <AdminSelect
        label="Rôle"
        name="roleId"
        required
        options={roles.map((role) => ({ value: role.id, label: role.name }))}
        error={state?.fieldErrors?.roleId}
      />
      <SubmitButton label="Créer le compte" />
    </form>
  );
}
