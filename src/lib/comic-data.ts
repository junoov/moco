import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface ComicListItem {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  type: string;
  status: string;
  rating: number;
  totalViews: number;
  totalChapters: number;
  updatedAt: string;
}

interface ComicWithCount {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  type: string;
  status: string;
  rating: number;
  totalViews: number;
  updatedAt: Date | string;
  _count: {
    chapters: number;
  };
}

interface HomepageCollections {
  trending: ComicListItem[];
  manhwa: ComicListItem[];
  manhua: ComicListItem[];
  manga: ComicListItem[];
  totalComics: number;
}

const HOMEPAGE_REVALIDATE_SECONDS = 120;
const COMICS_REVALIDATE_SECONDS = 180;

function mapComic(comic: ComicWithCount): ComicListItem {
  const updatedAt = comic.updatedAt instanceof Date
    ? comic.updatedAt.toISOString()
    : new Date(comic.updatedAt).toISOString();

  return {
    id: comic.id,
    title: comic.title,
    slug: comic.slug,
    coverUrl: comic.coverUrl,
    type: comic.type,
    status: comic.status,
    rating: comic.rating,
    totalViews: comic.totalViews,
    totalChapters: comic._count.chapters,
    updatedAt,
  };
}

const getHomepageCollectionsCached = unstable_cache(
  async (): Promise<HomepageCollections> => {
    const [trending, manhwa, manhua, manga, totalComics] = await Promise.all([
      prisma.comic.findMany({
        orderBy: { totalViews: "desc" },
        take: 10,
        include: { _count: { select: { chapters: true } } },
      }),
      prisma.comic.findMany({
        where: { type: { equals: "Manhwa", mode: "insensitive" } },
        orderBy: { updatedAt: "desc" },
        take: 50,
        include: { _count: { select: { chapters: true } } },
      }),
      prisma.comic.findMany({
        where: { type: { equals: "Manhua", mode: "insensitive" } },
        orderBy: { updatedAt: "desc" },
        take: 50,
        include: { _count: { select: { chapters: true } } },
      }),
      prisma.comic.findMany({
        where: { type: { equals: "Manga", mode: "insensitive" } },
        orderBy: { updatedAt: "desc" },
        take: 50,
        include: { _count: { select: { chapters: true } } },
      }),
      prisma.comic.count(),
    ]);

    return {
      trending: trending.map(mapComic),
      manhwa: manhwa.map(mapComic),
      manhua: manhua.map(mapComic),
      manga: manga.map(mapComic),
      totalComics,
    };
  },
  ["homepage-collections-v1"],
  { revalidate: HOMEPAGE_REVALIDATE_SECONDS, tags: ["homepage", "comics"] }
);

const getComicsTotalCached = unstable_cache(
  async (): Promise<number> => prisma.comic.count(),
  ["comics-total-v1"],
  { revalidate: COMICS_REVALIDATE_SECONDS, tags: ["comics"] }
);

const getComicsPageCached = unstable_cache(
  async (page: number, pageSize: number): Promise<ComicListItem[]> => {
    const skip = (page - 1) * pageSize;
    const comics = await prisma.comic.findMany({
      orderBy: { updatedAt: "desc" },
      take: pageSize,
      skip,
      include: { _count: { select: { chapters: true } } },
    });

    return comics.map(mapComic);
  },
  ["comics-page-v1"],
  { revalidate: COMICS_REVALIDATE_SECONDS, tags: ["comics"] }
);

export async function getHomepageData() {
  const data = await getHomepageCollectionsCached();

  const deduped = new Map<string, ComicListItem>();
  for (const comic of [...data.manhwa, ...data.manhua, ...data.manga]) {
    if (!deduped.has(comic.slug)) {
      deduped.set(comic.slug, comic);
    }
  }

  return {
    trending: data.trending,
    manhwa: data.manhwa,
    manhua: data.manhua,
    manga: data.manga,
    uniqueAll: Array.from(deduped.values()),
    latestUpdates: Array.from(deduped.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    totalComics: data.totalComics,
  };
}

export async function getPaginatedComics(requestedPage: number, pageSize = 24) {
  const safePage = Number.isFinite(requestedPage) && requestedPage > 0
    ? Math.floor(requestedPage)
    : 1;

  const safePageSize = Number.isFinite(pageSize) && pageSize > 0
    ? Math.floor(pageSize)
    : 24;

  const totalComics = await getComicsTotalCached();
  const totalPages = Math.max(1, Math.ceil(totalComics / safePageSize));
  const currentPage = Math.min(safePage, totalPages);
  const comics = await getComicsPageCached(currentPage, safePageSize);

  return {
    comics,
    totalComics,
    currentPage,
    pageSize: safePageSize,
    totalPages,
  };
}
