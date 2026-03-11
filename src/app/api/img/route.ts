import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Tidak di cache Vercel secara statik
export const revalidate = 86400; // Cache header CDN 1 hari

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("Missing Image URL", { status: 400 });
  }

  try {
    // Menggunakan Native fetch (Stream) alih-alih axios (Buffer).
    // fetch mengembalikan stream secara langsung jadi RAM Node.js kita sangat lega!
    const response = await fetch(imageUrl, {
      method: "GET",
      // Memalsukan header untuk melewati proteksi bot Komiku
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: process.env.TARGET_DOMAIN || "https://komiku.org",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      // Gunakan ini untuk abort fetch jika sumber sangat lambat (Opsional 8 detik)
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Langsung mengalirkan (piping) stream asli ke Response Next.js!
    // Tidak ada "arrayBuffer()" yang memfokuskan memori. Super cepat mirip konsep GO.
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache 7 hari + stale-while-revalidate 1 hari (Untuk CDN Cloudflare/Vercel Edge)
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400, immutable",
        "Access-Control-Allow-Origin": "*",
        "Vary": "Accept",
      },
    });
  } catch (error: any) {
    console.error("Image Proxy Error for:", imageUrl, error?.message || error);
    return new NextResponse("Failed to load image", { status: 502 });
  }
}
