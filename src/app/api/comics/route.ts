import { NextResponse } from "next/server";
import { getHomepage, getComicsList } from "@/lib/scraper";
import { prisma } from "@/lib/prisma";

// API route ini selalu dinamis karena menggunakan request.url
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const order = searchParams.get("order");
    const page = parseInt(searchParams.get("page") || "1");

    // Helper mapper untuk menyesuaikan format database ke UI
    const mapComic = (c: any) => ({
      ...c,
      coverImage: c.coverUrl || "",
      views: c.totalViews,
    });

    // Jika filter spesifik diberikan, cari di DB
    if (type || order || page > 1) {
      const take = 20;
      const skip = (page - 1) * take;
      const dbComics = await prisma.comic.findMany({
        where: type ? { type: { equals: type, mode: "insensitive" } } : undefined,
        orderBy: order === "views" ? { totalViews: "desc" } : { updatedAt: "desc" },
        take,
        skip,
      });

      if (dbComics.length > 0) {
        return NextResponse.json({ status: true, data: dbComics.map(mapComic) });
      }

      // Fallback scraper
      const comics = await getComicsList({
        type: type || undefined,
        order: order || undefined,
        page,
      });
      return NextResponse.json({ status: true, data: comics });
    }

    // Ambil data untuk homepage dari database
    const [dbTrending, dbManhwa, dbManhua, dbManga] = await Promise.all([
      prisma.comic.findMany({ orderBy: { totalViews: "desc" }, take: 10 }),
      prisma.comic.findMany({ where: { type: { equals: "Manhwa", mode: "insensitive" } }, orderBy: { updatedAt: "desc" }, take: 20 }),
      prisma.comic.findMany({ where: { type: { equals: "Manhua", mode: "insensitive" } }, orderBy: { updatedAt: "desc" }, take: 20 }),
      prisma.comic.findMany({ where: { type: { equals: "Manga", mode: "insensitive" } }, orderBy: { updatedAt: "desc" }, take: 20 }),
    ]);

    if (dbTrending.length > 0) {
      return NextResponse.json({
        status: true,
        data: {
          trending: dbTrending.map(mapComic),
          manhwa: dbManhwa.map(mapComic),
          manhua: dbManhua.map(mapComic),
          manga: dbManga.map(mapComic),
        },
      });
    }

    // Fallback scraper jika kosong
    const data = await getHomepage();
    return NextResponse.json({ status: true, data });
  } catch (error) {
    console.error("API /comics error:", error);
    return NextResponse.json(
      { status: false, message: "Failed to fetch comics" },
      { status: 500 }
    );
  }
}
