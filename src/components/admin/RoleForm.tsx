"use client";

import { useActionState } from "react";
import Link from "next/link";
import { deleteRoleAction, saveRoleAction } from "@/app/actions/admin/system";
import type { AdminState } from "@/lib/admin";
import { PERMISSION_GROUPS } from "@/lib/permissions";
import {
  AdminField,
  AdminTextArea,
  FormFeedback,
  SubmitButton,
} from "@/components/admin/FormBits";

export type RoleValues = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSuperAdmin: boolean;
};

function isGranted(permissions: string[], code: string): boolean {
  if (permissions.includes("*")) return true;
  if (permissions.includes(code)) return true;
  const module = code.split(".")[0];
  return module ? permissions.includes(`${module}.*`) : false;
}

export function RoleForm({
  role,
  grantable,
  onDone,
}: {
  role?: RoleValues;
  /** Codes de permission que l'acteur connecté peut accorder. */
  grantable: string[];
  onDone?: string;
}) {
  const [state, formAction] = useActionState<AdminState, FormData>(
    saveRoleAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {role?.id && <input type="hidden" name="id" value={role.id} />}
      <FormFeedback state={state} />

      <div className="grid gap-3 sm:grid-cols-2">
        <AdminField
          label="Nom du rôle"
          name="name"
          required
          defaultValue={role?.name}
          placeholder="Gérant de boutique"
          error={state?.fieldErrors?.name}
        />
        <AdminTextArea
          label="Description"
          name="description"
          rows={2}
          defaultValue={role?.description}
          placeholder="Périmètre du rôle…"
          error={state?.fieldErrors?.description}
        />
      </div>

      <div className="space-y-3">
        {PERMISSION_GROUPS.map((group) => (
          <fieldset
            key={group.module}
            className="border border-outline-variant bg-white px-3 py-2.5"
          >
            <legend className="px-1 text-[0.62rem] uppercase tracking-[0.12em] text-secondary">
              {group.label}
            </legend>
            <div className="mt-1 grid gap-1.5 sm:grid-cols-2">
              {group.permissions.map((permission) => {
                const checked = role ? isGranted(role.permissions, permission.code) : false;
                const canGrant = grantable.includes(permission.code);
                return (
                  <label
                    key={permission.code}
                    className={`flex items-start gap-2 text-[0.78rem] ${
                      canGrant ? "text-on-surface-variant" : "text-outline"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="permissions"
                      value={permission.code}
                      defaultChecked={checked}
                      disabled={!canGrant}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                    />
                    <span>
                      {permission.label}
                      <span className="block text-[0.62rem] text-outline">
                        {permission.code}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <p className="text-[0.68rem] leading-relaxed text-outline">
        Seules les permissions que vous possédez peuvent être accordées. Le rôle
        super-administrateur et les rôles système ne sont pas modifiables. Les
        jokers de module sont développés en permissions explicites à
        l&apos;enregistrement.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton label={role ? "Enregistrer le rôle" : "Créer le rôle"} />
        {onDone && (
          <Link href={onDone} className="btn-quiet btn-sm">
            Retour aux rôles
          </Link>
        )}
      </div>
    </form>
  );
}

export function DeleteRoleForm({
  roleId,
  label,
}: {
  roleId: string;
  label: string;
}) {
  return (
    <form
      action={deleteRoleAction}
      onSubmit={(event) => {
        if (!window.confirm(`Supprimer définitivement le rôle « ${label} » ?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={roleId} />
      <button
        type="submit"
        className="text-[0.7rem] text-error underline underline-offset-2 hover:no-underline"
      >
        Supprimer
      </button>
    </form>
  );
}
