import { readPublicImage } from "@/lib/public-media";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const image = await readPublicImage(name);
  if (!image) return new Response(null, { status: 404, headers: { "X-Content-Type-Options": "nosniff" } });
  const etag = image.etag.startsWith('"') ? image.etag : `"${image.etag}"`;
  const headers = {
    "Content-Type": image.mimeType,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: etag,
  };
  if (request.headers.get("if-none-match")?.split(",").map((value) => value.trim()).includes(etag)) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      ...headers,
    },
  });
}
