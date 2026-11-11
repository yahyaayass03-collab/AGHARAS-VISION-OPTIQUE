import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import { generateToken, sha256 } from "@/lib/auth/password";
import { jsonStringList } from "@/lib/json-string-list";

export const SESSION_COOKIE = "agharas_session";
const SESSION_DAYS = 30;

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: {
    id: string;
    name: string;
    isSuperAdmin: boolean;
    permissions: string[];
  };
};

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: sha256(raw) },
    include: { user: { include: { role: true } } },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  if (!session.user.isActive) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    phone: session.user.phone,
    role: {
      id: session.user.role.id,
      name: session.user.role.name,
      isSuperAdmin: session.user.role.isSuperAdmin,
      permissions: jsonStringList(session.user.role.permissions),
    },
  };
});

export async function createSession(userId: string): Promise<void> {
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: { tokenHash: sha256(token), userId, expiresAt },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (raw) {
    await db.session
      .deleteMany({ where: { tokenHash: sha256(raw) } })
      .catch(() => undefined);
  }
  store.delete(SESSION_COOKIE);
}

export function accessSubject(user: SessionUser | null) {
  if (!user) return null;
  return {
    isSuperAdmin: user.role.isSuperAdmin,
    permissions: jsonStringList(user.role.permissions),
  };
}
