import { NextResponse } from "next/server";
import { getChapterImages } from "@/lib/scraper";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; chapter: string }> }
) {
  try {
    const { slug, chapter } = await params;

    // Cari chapter di database (termasuk komiknya)
    const dbChapter = await prisma.chapter.findFirst({
      where: {
        slug: chapter,
        comic: { slug: slug },
      },
      include: { comic: true },
    });

    if (dbChapter) {
      const comicId = dbChapter.comicId;

      // Ambil prev / next chapter untuk navigasi
      const [prevChapter, nextChapter] = await Promise.all([
        prisma.chapter.findFirst({
          where: { comicId, number: { lt: dbChapter.number } },
          orderBy: { number: "desc" },
        }),
        prisma.chapter.findFirst({
          where: { comicId, number: { gt: dbChapter.number } },
          orderBy: { number: "asc" },
        }),
      ]);

      // Gunakan URL gambar asli dari database
      // Frontend sudah mem-proxy gambar lewat /api/img untuk bypass hotlinking
      const chapterData = {
        comicTitle: dbChapter.comic.title,
        comicSlug: dbChapter.comic.slug,
        chapterNumber: dbChapter.number,
        chapterSlug: dbChapter.slug,
        images: dbChapter.images as string[],
        prevChapter: prevChapter?.slug,
        nextChapter: nextChapter?.slug,
      };

      return NextResponse.json({ status: true, data: chapterData });
    }

    // Fallback live-scrape kalau belum ada di DB
    const chapterData = await getChapterImages(slug, chapter);

    if (!chapterData) {
      return NextResponse.json(
        { status: false, message: "Chapter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: true, data: chapterData });
  } catch (error) {
    console.error("API /comics/[slug]/[chapter] error:", error);
    return NextResponse.json(
      { status: false, message: "Failed to fetch chapter" },
      { status: 500 }
    );
  }
}
