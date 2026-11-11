/** The sole owner is the super administrator provisioned out of band. */
export function isOwner(user: { email: string; role: { isSuperAdmin: boolean } }): boolean {
  const configured = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (process.env.NODE_ENV === "production" && !configured) return false;
  return user.role.isSuperAdmin && (!configured || user.email.toLowerCase() === configured);
}
