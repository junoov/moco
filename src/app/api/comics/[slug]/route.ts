import { NextResponse } from "next/server";
import { getComicDetail } from "@/lib/scraper";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Coba cari dari database dulu
    const dbComic = await prisma.comic.findUnique({
      where: { slug },
      include: {
        genres: true,
        chapters: {
          orderBy: { number: 'desc' }
        }
      }
    });

    if (dbComic) {
      // Mapping dari format Database ke format UI
      const comicDetail = {
        ...dbComic,
        coverImage: dbComic.coverUrl || "",
        views: dbComic.totalViews,
        synopsis: dbComic.description || "",
        author: dbComic.author || "Unknown",
        genres: dbComic.genres.map((g: any) => g.name),
        totalChapters: dbComic.chapters.length,
        chapters: dbComic.chapters.map((ch: any) => ({
          number: ch.number,
          slug: ch.slug,
          title: ch.title || `Chapter ${ch.number}`
        }))
      };
      
      return NextResponse.json({ status: true, data: comicDetail });
    }

    // Jika tidak ada di DB, fallback ke scraper
    const comic = await getComicDetail(slug);

    if (!comic) {
      return NextResponse.json(
        { status: false, message: "Comic not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: true, data: comic });
  } catch (error) {
    console.error("API /comics/[slug] error:", error);
    return NextResponse.json(
      { status: false, message: "Failed to fetch comic detail" },
      { status: 500 }
    );
  }
}
