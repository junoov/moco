import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function checkDb() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });
  
  try {
    await prisma.$connect();
    
    const comicCount = await prisma.comic.count();
    const chapterCount = await prisma.chapter.count();
    const genreCount = await prisma.genre.count();
    
    console.log("=== STATUS DATABASE ===");
    console.log(`Total Comics: ${comicCount}`);
    console.log(`Total Chapters: ${chapterCount}`);
    console.log(`Total Genres: ${genreCount}`);
    
    if (comicCount > 0) {
      console.log("\n=== CONTOH DATA KOMIK TERBARU ===");
      // Ambil 1 komik terbaru yang punya chapter
      const latestComic = await prisma.comic.findFirst({
        orderBy: { updatedAt: 'desc' },
        include: {
          chapters: {
            orderBy: { number: 'desc' },
            take: 3
          },
          genres: true
        }
      });
      
      if (latestComic) {
        console.log(`Judul: ${latestComic.title}`);
        console.log(`Slug: ${latestComic.slug}`);
        console.log(`Cover: ${latestComic.coverUrl}`);
        console.log(`Genres: ${latestComic.genres.map((g: any) => g.name).join(', ')}`);
        console.log(`\nDaftar 3 Chapter Terakhir:`);
        if (latestComic.chapters.length > 0) {
          latestComic.chapters.forEach((ch: any) => {
            const images = ch.images as string[];
            console.log(`- Chapter ${ch.number} (${ch.slug}) -> ${images ? images.length : 0} gambar`);
          });
        } else {
          console.log("- Belum ada chapter");
        }
      }
    }
  } catch (err: unknown) {
    const e = err as Error;
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
