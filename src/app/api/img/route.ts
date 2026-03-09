import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic"; // Tidak di cache Vercel secara statik
export const revalidate = 86400; // Cache header CDN 1 hari

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("Missing Image URL", { status: 400 });
  }

  try {
    // 1. Download gambar dari target dengan memalsukan User-Agent dan Referer
    // Supaya komiku.org berpikir yang akses adalah web asli/browser asli, bukan robot/laman eksternal
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer", // Kita butuh data mentah (binary/buffer) gambarnya
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: process.env.TARGET_DOMAIN || "https://komiku.org",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      timeout: 10000, 
    });

    // 2. Tentukan format gambarnya apa (jpeg, png, webp, dll)
    const contentType = response.headers["content-type"] || "image/jpeg";

    // 3. Kembalikan data mentah tersebut beserta header keamanan agar bisa ditampilkan di tag <img> kita
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache gambar di browser user selama 1 hari biar web makin ngebut
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200", 
        // Mengizinkan web kita membaca gambar ini 
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("Image Proxy Error for:", imageUrl, error?.message || error);
    return new NextResponse("Failed to load image", { status: 502 });
  }
}
