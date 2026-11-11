/**
 * Non-destructive, out-of-band owner provisioning.
 * OWNER_EMAIL and OWNER_PASSWORD must be supplied via environment variables.
 * Never run the demo seed against business data.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword, passwordIssues } from "../src/lib/auth/password";

const db = new PrismaClient();

async function main() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("OWNER_EMAIL doit contenir une adresse e-mail valide.");
  }
  if (!password || passwordIssues(password).length > 0) {
    throw new Error("OWNER_PASSWORD doit être fourni et respecter les règles de sécurité.");
  }

  const existing = await db.user.findUnique({ where: { email }, include: { role: true } });
  if (existing && !existing.role.isSuperAdmin) {
    throw new Error("Cette adresse existe déjà avec un rôle non propriétaire. Intervention manuelle requise.");
  }

  const ownerRole = await db.role.upsert({
    where: { name: "Super Administrateur" },
    update: { isSuperAdmin: true, isSystem: true },
    create: {
      name: "Super Administrateur",
      description: "Propriétaire de la boutique",
      isSuperAdmin: true,
      isSystem: true,
      permissions: ["*"],
    },
  });
  const passwordHash = await hashPassword(password);
  await db.$transaction(async (tx) => {
    if (existing) {
      await tx.user.update({ where: { id: existing.id }, data: { passwordHash, isActive: true } });
      await tx.session.deleteMany({ where: { userId: existing.id } });
      await tx.passwordResetToken.deleteMany({ where: { userId: existing.id } });
    } else {
      await tx.user.create({
        data: {
          email,
          firstName: process.env.OWNER_FIRST_NAME?.trim() || "Propriétaire",
          lastName: process.env.OWNER_LAST_NAME?.trim() || "Boutique",
          passwordHash,
          roleId: ownerRole.id,
        },
      });
    }
  });
  console.log(`Compte propriétaire ${existing ? "mis à jour" : "créé"} : ${email}. Sessions précédentes révoquées.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => db.$disconnect());
