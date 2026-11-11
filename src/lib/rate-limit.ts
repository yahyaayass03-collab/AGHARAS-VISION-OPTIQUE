import "server-only";

/**
 * Limitation de débit en mémoire (par instance).
 * Suffisant pour un déploiement mono-instance ; en production multi-instances,
 * remplacer par un store partagé (Redis) — documenté dans docs/SECURITY.md.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Nombre maximal de clés conservées avant purge des entrées expirées. */
const MAX_BUCKETS = 10_000;

/**
 * Purge paresseuse : appelée à chaque requête lorsque la table atteint son
 * plafond. Les entrées expirées sont supprimées ; si la table reste saturée
 * (attaque par clés jetables), les entrées dont l'échéance est la plus proche
 * sont évincées pour borner la mémoire.
 */
function purgeExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
  if (buckets.size <= MAX_BUCKETS) return;

  const sorted = [...buckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
  for (const [key] of sorted.slice(0, buckets.size - MAX_BUCKETS)) {
    buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  if (buckets.size >= MAX_BUCKETS) purgeExpired(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { ok: true, retryAfterSeconds: 0 };
}
