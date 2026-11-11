import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { isOwner } from "@/lib/auth/owner";
import { readPrescriptionFile } from "@/lib/uploads";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFileName(name: string | null, id: string): string {
  const fallback = `ordonnance-${id}`;
  if (!name) return fallback;
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/^[._]+/, "")
    .slice(-120);
  return cleaned || fallback;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || !isOwner(user)) {
    return new Response("Authentification requise.", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { id } = await context.params;
  const prescription = await db.prescription.findUnique({ where: { id } });
  if (!prescription) {
    return new Response("Ordonnance introuvable.", { status: 404 });
  }

  if (!prescription.filePath) {
    return new Response("Aucun fichier joint à cette ordonnance.", { status: 404 });
  }

  const buffer = await readPrescriptionFile(prescription.filePath);
  if (!buffer) {
    return new Response("Fichier indisponible.", { status: 404 });
  }

  await writeAudit({
    userId: user.id,
    actorEmail: user.email,
    action: "prescription.download",
    entityType: "Prescription",
    entityId: prescription.id,
    metadata: { ownerId: prescription.userId },
  });

  const fileName = safeFileName(
    prescription.originalFileName,
    prescription.id,
  );

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": prescription.fileMime ?? "application/octet-stream",
      "Content-Length": String(buffer.length),
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
