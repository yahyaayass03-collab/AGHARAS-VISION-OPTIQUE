/**
 * Catalogue de permissions et évaluation d'accès.
 * Règles : refus par défaut, wildcard de module (`products.*`) et super-admin.
 * Module pur (aucune dépendance base de données) pour être testable.
 */

export const PERMISSIONS = {
  dashboard: ["dashboard.view"],
  products: [
    "products.view",
    "products.create",
    "products.update",
    "products.delete",
  ],
  inventory: ["inventory.view", "inventory.adjust"],
  orders: ["orders.view", "orders.update", "orders.cancel"],
  customers: ["customers.view", "customers.update"],
  prescriptions: ["prescriptions.view", "prescriptions.review"],
  promotions: ["promotions.manage"],
  content: ["content.manage"],
  settings: ["settings.manage"],
  users: ["users.manage"],
  roles: ["roles.manage"],
} as const;

export const ALL_PERMISSIONS: string[] = Object.values(PERMISSIONS).flat();

export const PERMISSION_GROUPS: Array<{
  module: string;
  label: string;
  permissions: Array<{ code: string; label: string }>;
}> = [
  {
    module: "dashboard",
    label: "Tableau de bord",
    permissions: [{ code: "dashboard.view", label: "Consulter les indicateurs" }],
  },
  {
    module: "products",
    label: "Produits & catalogue",
    permissions: [
      { code: "products.view", label: "Consulter" },
      { code: "products.create", label: "Créer" },
      { code: "products.update", label: "Modifier" },
      { code: "products.delete", label: "Archiver / supprimer" },
    ],
  },
  {
    module: "inventory",
    label: "Stock",
    permissions: [
      { code: "inventory.view", label: "Consulter" },
      { code: "inventory.adjust", label: "Ajuster" },
    ],
  },
  {
    module: "orders",
    label: "Commandes",
    permissions: [
      { code: "orders.view", label: "Consulter" },
      { code: "orders.update", label: "Mettre à jour" },
      { code: "orders.cancel", label: "Annuler" },
    ],
  },
  {
    module: "customers",
    label: "Clients",
    permissions: [
      { code: "customers.view", label: "Consulter" },
      { code: "customers.update", label: "Modifier" },
    ],
  },
  {
    module: "prescriptions",
    label: "Ordonnances",
    permissions: [
      { code: "prescriptions.view", label: "Consulter" },
      { code: "prescriptions.review", label: "Valider / refuser" },
    ],
  },
  {
    module: "promotions",
    label: "Promotions",
    permissions: [{ code: "promotions.manage", label: "Gérer les codes promo" }],
  },
  {
    module: "content",
    label: "Contenu",
    permissions: [{ code: "content.manage", label: "Gérer bannières, FAQ, pages" }],
  },
  {
    module: "settings",
    label: "Paramètres",
    permissions: [{ code: "settings.manage", label: "Gérer les réglages boutique" }],
  },
  {
    module: "users",
    label: "Utilisateurs",
    permissions: [{ code: "users.manage", label: "Gérer les comptes staff" }],
  },
  {
    module: "roles",
    label: "Rôles & permissions",
    permissions: [{ code: "roles.manage", label: "Gérer rôles et permissions" }],
  },
];

export type AccessSubject = {
  isSuperAdmin: boolean;
  permissions: string[];
} | null;

export function hasPermission(
  subject: AccessSubject,
  permission: string,
): boolean {
  if (!subject) return false;
  if (subject.isSuperAdmin) return true;
  if (subject.permissions.includes("*")) return true;
  if (subject.permissions.includes(permission)) return true;
  const module = permission.split(".")[0];
  return subject.permissions.includes(`${module}.*`);
}

export function hasAnyPermission(
  subject: AccessSubject,
  permissions: string[],
): boolean {
  return permissions.some((p) => hasPermission(subject, p));
}

/** Un acteur ne peut accorder que des permissions qu'il possède lui-même. */
export function canGrantPermissions(
  subject: AccessSubject,
  granted: string[],
): boolean {
  if (!subject) return false;
  if (subject.isSuperAdmin) return true;
  if (subject.permissions.includes("*")) return true;

  return granted.every((code) => {
    if (code.endsWith(".*")) {
      const module = code.split(".")[0];
      return (
        subject.permissions.includes(code) ||
        (module ? subject.permissions.includes(`${module}.*`) : false)
      );
    }
    return hasPermission(subject, code);
  });
}
