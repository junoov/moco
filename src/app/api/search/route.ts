import { NextResponse } from "next/server";
import { searchComics } from "@/lib/scraper";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { status: false, message: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    // Cari dari database dulu
    const dbResults = await prisma.comic.findMany({
      where: {
        title: {
          contains: query,
          mode: "insensitive"
        }
      },
      take: 20
    });

    if (dbResults.length > 0) {
      const results = dbResults.map((c: any) => ({
        ...c,
        coverImage: c.coverUrl || "",
        views: c.totalViews,
      }));
      return NextResponse.json({ status: true, data: results });
    }

    // Fallback scraper jika kosong
    const results = await searchComics(query);
    return NextResponse.json({ status: true, data: results });
  } catch (error) {
    console.error("API /search error:", error);
    return NextResponse.json(
      { status: false, message: "Failed to search comics" },
      { status: 500 }
    );
  }
}
