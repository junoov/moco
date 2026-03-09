import axios from "axios";
import * as cheerio from "cheerio";

const TARGET_DOMAIN = process.env.TARGET_DOMAIN || "https://komiku.org";
const API_DOMAIN = "https://api.komiku.org";
const DEFAULT_STATUS = "Ongoing";
const DEFAULT_TYPE = "Manga";

// Array berisi ragam Browser (Desktop, Mobile, OS yang berbeda)
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0",
];

// Helper untuk mengambil header acak tiap ada pergerakan request
function getRandomHeaders() {
  const randomAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  return {
    "User-Agent": randomAgent,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    Referer: TARGET_DOMAIN,
    Origin: TARGET_DOMAIN,
  };
}

function cleanText(value: string | undefined | null): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

function toAbsoluteUrl(url: string | undefined | null): string {
  const raw = cleanText(url);
  if (!raw) return "";

  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }

  try {
    return new URL(raw, TARGET_DOMAIN).toString();
  } catch {
    return raw;
  }
}

function normalizeType(type: string | undefined | null): string {
  const lowered = cleanText(type).toLowerCase();
  if (lowered.includes("manhwa")) return "Manhwa";
  if (lowered.includes("manhua")) return "Manhua";
  if (lowered.includes("manga")) return "Manga";
  return DEFAULT_TYPE;
}

function normalizeStatus(status: string | undefined | null): string {
  const lowered = cleanText(status).toLowerCase();
  if (!lowered) return DEFAULT_STATUS;

  if (
    lowered.includes("ongoing") ||
    lowered.includes("berjalan") ||
    lowered.includes("lanjut")
  ) {
    return "Ongoing";
  }

  if (
    lowered.includes("completed") ||
    lowered.includes("complete") ||
    lowered.includes("end") ||
    lowered.includes("tamat")
  ) {
    return "Completed";
  }

  return cleanText(status);
}

function extractMangaSlug(href: string | undefined | null): string {
  const raw = cleanText(href);
  if (!raw) return "";

  try {
    const pathname = new URL(raw, TARGET_DOMAIN).pathname;
    const matched = pathname.match(/^\/manga\/([^/]+)\/?$/i);
    return matched?.[1] || "";
  } catch {
    return "";
  }
}

function extractChapterSlug(href: string | undefined | null): string {
  const raw = cleanText(href);
  if (!raw) return "";

  try {
    const pathname = new URL(raw, TARGET_DOMAIN).pathname;
    const trimmed = pathname.replace(/^\/+|\/+$/g, "");
    if (!trimmed || trimmed.startsWith("manga/")) {
      return "";
    }
    return trimmed;
  } catch {
    return "";
  }
}

function parseChapterNumber(title?: string, slug?: string): number {
  const titleMatch = cleanText(title).match(/(\d+(?:[.,]\d+)?)/);
  if (titleMatch?.[1]) {
    const parsed = parseFloat(titleMatch[1].replace(",", "."));
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  const slugMatch = cleanText(slug).match(/chapter-(\d+(?:-\d+)?)/i);
  if (slugMatch?.[1]) {
    const parsed = parseFloat(slugMatch[1].replace("-", "."));
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function dedupeComics(comics: Comic[]): Comic[] {
  const map = new Map<string, Comic>();
  for (const comic of comics) {
    if (!comic.slug) continue;
    if (!map.has(comic.slug)) {
      map.set(comic.slug, comic);
    }
  }
  return Array.from(map.values());
}

async function fetchHtml(url: string): Promise<string> {
  const response = await axios.get(url, {
    headers: getRandomHeaders(),
    timeout: 15000,
    validateStatus: (status) => status >= 200 && status < 500,
  });

  if (response.status >= 400) {
    throw new Error(`Request failed (${response.status}) ${url}`);
  }

  return String(response.data || "");
}

function parseDaftarCards(html: string, forcedType?: string): Comic[] {
  const $ = cheerio.load(html);
  const cards: Comic[] = [];

  $("article.manga-card").each((_, element) => {
    const card = $(element);
    const titleLink = card.find("h4 a[href*='/manga/']").first();

    const title = cleanText(titleLink.text());
    const slug = extractMangaSlug(titleLink.attr("href"));
    if (!title || !slug) return;

    const img = card.find("img").first();
    const coverImage = toAbsoluteUrl(img.attr("data-src") || img.attr("src"));

    const metaText = cleanText(card.find("p.meta").text());
    const type = normalizeType(metaText || forcedType);

    const statusMatch = metaText.match(/status:\s*([^\n]+)/i);
    const status = normalizeStatus(statusMatch?.[1]);

    cards.push({
      id: slug,
      title,
      slug,
      coverImage,
      type,
      status,
      rating: 0,
      views: 0,
      totalChapters: 0,
    });
  });

  return cards;
}

function parseBgeCards(html: string, forcedType?: string): Comic[] {
  const $ = cheerio.load(html);
  const cards: Comic[] = [];

  $(".bge").each((_, element) => {
    const card = $(element);
    const titleLink = card.find(".kan > a[href*='/manga/']").first();
    const imageLink = card.find(".bgei a[href*='/manga/']").first();
    const fallbackLink = titleLink.length ? titleLink : imageLink;

    const title = cleanText(card.find(".kan h3").first().text()) || cleanText(fallbackLink.text());
    const slug = extractMangaSlug(fallbackLink.attr("href"));
    if (!title || !slug) return;

    const img = card.find(".bgei img").first();
    const coverImage = toAbsoluteUrl(img.attr("data-src") || img.attr("src"));

    const typeInfo = cleanText(card.find(".tpe1_inf").first().text());
    const type = normalizeType(typeInfo || forcedType);

    const chapterLabel = cleanText(
      card.find(".kan .new1").last().find("span").last().text() ||
        card.find(".kan .new1 a").last().text()
    );

    cards.push({
      id: slug,
      title,
      slug,
      coverImage,
      type,
      status: DEFAULT_STATUS,
      rating: 0,
      views: 0,
      totalChapters: parseChapterNumber(chapterLabel),
      lastChapter: chapterLabel || undefined,
      lastChapterSlug:
        extractChapterSlug(card.find(".kan .new1 a").last().attr("href")) ||
        undefined,
    });
  });

  return cards;
}

function parseHomepageRanking(html: string): Comic[] {
  const $ = cheerio.load(html);
  const cards: Comic[] = [];

  $(".ls2").each((_, element) => {
    const card = $(element);
    const titleLink = card.find(".ls2j h3 a[href*='/manga/']").first();

    const title = cleanText(titleLink.text());
    const slug = extractMangaSlug(titleLink.attr("href"));
    if (!title || !slug) return;

    const img = card.find(".ls2v img").first();
    const coverImage = toAbsoluteUrl(img.attr("data-src") || img.attr("src"));

    const typeHint =
      cleanText(img.attr("alt")) ||
      cleanText(card.find(".ls2j h3 a").attr("title"));

    const chapterLink = card.find(".ls2j a[href*='-chapter-']").first();
    const lastChapter = cleanText(chapterLink.text());

    cards.push({
      id: slug,
      title,
      slug,
      coverImage,
      type: normalizeType(typeHint),
      status: DEFAULT_STATUS,
      rating: 0,
      views: 0,
      totalChapters: parseChapterNumber(lastChapter, chapterLink.attr("href")),
      lastChapter: lastChapter || undefined,
      lastChapterSlug: extractChapterSlug(chapterLink.attr("href")) || undefined,
    });
  });

  return cards;
}

function normalizeTypeParam(type: string | undefined): string | undefined {
  const lowered = cleanText(type).toLowerCase();
  if (!lowered) return undefined;
  if (lowered === "manga") return "manga";
  if (lowered === "manhwa") return "manhwa";
  if (lowered === "manhua") return "manhua";
  return undefined;
}

function parseInfoTable($: cheerio.CheerioAPI): Map<string, string> {
  const map = new Map<string, string>();

  $("#Informasi table.inftable tr").each((_, row) => {
    const cells = $(row).find("td");
    const key = cleanText($(cells[0]).text()).replace(/:$/, "").toLowerCase();
    const value = cleanText($(cells[1]).text());
    if (key && value) {
      map.set(key, value);
    }
  });

  return map;
}

// ======================================================
// Types
// ======================================================
export interface Comic {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  type: string;
  status: string;
  rating: number;
  views: number;
  totalChapters: number;
  lastChapter?: string;
  lastChapterSlug?: string;
  synopsis?: string;
  genres?: string[];
  author?: string;
}

export interface ChapterInfo {
  number: number;
  slug: string;
  title?: string;
  date?: string;
}

export interface ComicDetail extends Comic {
  synopsis: string;
  genres: string[];
  author: string;
  chapters: ChapterInfo[];
  alternativeTitles?: string;
}

export interface ChapterData {
  comicTitle: string;
  comicSlug: string;
  chapterNumber: number;
  chapterSlug: string;
  images: string[];
  prevChapter?: string;
  nextChapter?: string;
}

// ======================================================
// Scraper Functions
// ======================================================

export async function getHomepage(): Promise<{
  trending: Comic[];
  manhwa: Comic[];
  manhua: Comic[];
  manga: Comic[];
}> {
  try {
    const homepageHtml = await fetchHtml(TARGET_DOMAIN);

    let trending = dedupeComics(parseHomepageRanking(homepageHtml)).slice(0, 10);

    if (trending.length === 0) {
      const hotHtml = await fetchHtml(`${API_DOMAIN}/other/hot/`);
      trending = dedupeComics(parseBgeCards(hotHtml)).slice(0, 10);
    }

    const [manhwa, manhua, manga] = await Promise.all([
      getComicsList({ type: "manhwa", order: "latest", page: 1 }),
      getComicsList({ type: "manhua", order: "latest", page: 1 }),
      getComicsList({ type: "manga", order: "latest", page: 1 }),
    ]);

    if (trending.length === 0) {
      trending = dedupeComics([...manhwa, ...manhua, ...manga]).slice(0, 10);
    }

    return {
      trending,
      manhwa: manhwa.slice(0, 20),
      manhua: manhua.slice(0, 20),
      manga: manga.slice(0, 20),
    };
  } catch (error) {
    console.error("Error fetching homepage:", error);
    return { trending: [], manhwa: [], manhua: [], manga: [] };
  }
}

export async function getComicDetail(
  slug: string
): Promise<ComicDetail | null> {
  try {
    const cleanSlug = cleanText(slug).replace(/^\/+|\/+$/g, "");
    if (!cleanSlug) return null;

    const url = `${TARGET_DOMAIN}/manga/${cleanSlug}/`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const rawTitle =
      cleanText($("#Judul h1").first().text()) ||
      cleanText($("h1").first().text()) ||
      cleanText($("meta[property='og:title']").attr("content"));

    const title = rawTitle.replace(/^komik\s+/i, "").trim();

    const synopsis =
      cleanText($("#Sinopsis p").first().text()) ||
      cleanText($("#Informasi p.desc").first().text()) ||
      cleanText($("meta[property='og:description']").attr("content"));

    const coverImage = toAbsoluteUrl(
      $("#Informasi .ims img").first().attr("data-src") ||
        $("#Informasi .ims img").first().attr("src") ||
        $("meta[property='og:image']").attr("content")
    );

    const info = parseInfoTable($);

    const genres = Array.from(
      new Set(
        $("#Informasi ul.genre li a, #Informasi .genre a")
          .toArray()
          .map((el) => cleanText($(el).text()))
          .filter(Boolean)
      )
    );

    const chaptersMap = new Map<string, ChapterInfo>();
    $("#Daftar_Chapter td.judulseries a[href*='-chapter-']").each((_, el) => {
      const link = $(el);
      const chapterSlug = extractChapterSlug(link.attr("href"));
      if (!chapterSlug) return;

      const chapterTitle = cleanText(
        link.find("span[itemprop='name']").text() || link.text()
      );

      const chapterNumber = parseChapterNumber(chapterTitle, chapterSlug);
      const row = link.closest("tr");
      const date = cleanText(row.find("td.tanggalseries").text()) || undefined;

      if (!chaptersMap.has(chapterSlug)) {
        chaptersMap.set(chapterSlug, {
          number: chapterNumber,
          slug: chapterSlug,
          title: chapterTitle || undefined,
          date,
        });
      }
    });

    const chapters = Array.from(chaptersMap.values()).sort(
      (a, b) => b.number - a.number
    );

    return {
      id: cleanSlug,
      title: title || cleanSlug,
      slug: cleanSlug,
      coverImage,
      type: normalizeType(info.get("jenis komik") || info.get("type") || ""),
      status: normalizeStatus(info.get("status")),
      rating: 0,
      views: 0,
      totalChapters: chapters.length,
      synopsis,
      genres,
      author: info.get("pengarang") || info.get("author") || "Unknown",
      chapters,
      alternativeTitles:
        info.get("judul indonesia") || info.get("judul alternatif") || undefined,
    };
  } catch (error) {
    console.error(`Error fetching comic detail for ${slug}:`, error);
    return null;
  }
}

export async function getChapterImages(
  comicSlug: string,
  chapterSlug: string
): Promise<ChapterData | null> {
  try {
    const cleanChapterSlug = cleanText(chapterSlug).replace(/^\/+|\/+$/g, "");
    const cleanComicSlug = cleanText(comicSlug).replace(/^\/+|\/+$/g, "");
    if (!cleanChapterSlug || !cleanComicSlug) {
      return null;
    }

    const candidateUrls = [
      `${TARGET_DOMAIN}/${cleanChapterSlug}/`,
      `${TARGET_DOMAIN}/${cleanChapterSlug}`,
    ];

    let html = "";
    for (const url of candidateUrls) {
      try {
        html = await fetchHtml(url);
        if (html) break;
      } catch {
        continue;
      }
    }

    if (!html) {
      throw new Error(`Chapter not found for slug: ${cleanChapterSlug}`);
    }

    const $ = cheerio.load(html);
    const imageSet = new Set<string>();

    $("#Baca_Komik img").each((_, img) => {
      const node = $(img);
      const src = toAbsoluteUrl(
        node.attr("data-src") ||
          node.attr("data-lazy-src") ||
          node.attr("src") ||
          ""
      );

      if (src && /^https?:\/\//i.test(src)) {
        imageSet.add(src);
      }
    });

    if (imageSet.size === 0) {
      const regex =
        /https?:\/\/[^"'\s]+?\.(?:jpg|jpeg|png|webp|gif|avif)(?:\?[^"'\s]*)?/gi;
      const matches = html.match(regex) || [];

      for (const match of matches) {
        const normalized = toAbsoluteUrl(match);
        if (
          normalized.includes("komiku") &&
          (normalized.includes("/upload") || normalized.includes("/uploads"))
        ) {
          imageSet.add(normalized);
        }
      }
    }

    const images = Array.from(imageSet);

    const chapterTitle =
      cleanText($("#Judul h1").first().text()) ||
      cleanText($("h1").first().text()) ||
      cleanChapterSlug.replace(/-/g, " ");

    const chapterNumber = parseChapterNumber(chapterTitle, cleanChapterSlug);

    const mangaLink = $("a[href*='/manga/']").first();
    const parsedComicSlug = extractMangaSlug(mangaLink.attr("href"));
    const parsedComicTitle = cleanText(mangaLink.text()).replace(/^komik\s+/i, "");

    const navChapters = new Map<string, number>();
    $("a[href*='-chapter-']").each((_, anchor) => {
      const slugValue = extractChapterSlug($(anchor).attr("href"));
      if (!slugValue || slugValue === cleanChapterSlug) return;
      navChapters.set(slugValue, parseChapterNumber($(anchor).attr("title"), slugValue));
    });

    let prevChapter: string | undefined;
    let nextChapter: string | undefined;

    const navEntries = Array.from(navChapters.entries());
    if (navEntries.length > 0) {
      const current = chapterNumber || parseChapterNumber(undefined, cleanChapterSlug);
      const lower = navEntries
        .filter(([, num]) => num > 0 && num < current)
        .sort((a, b) => b[1] - a[1]);
      const higher = navEntries
        .filter(([, num]) => num > 0 && num > current)
        .sort((a, b) => a[1] - b[1]);

      prevChapter = lower[0]?.[0];
      nextChapter = higher[0]?.[0];

      if (!prevChapter && !nextChapter && navEntries.length === 1) {
        const [singleSlug, singleNumber] = navEntries[0];
        if (singleNumber < current) prevChapter = singleSlug;
        if (singleNumber > current) nextChapter = singleSlug;
      }
    }

    return {
      comicTitle: parsedComicTitle || cleanComicSlug.replace(/-/g, " "),
      comicSlug: parsedComicSlug || cleanComicSlug,
      chapterNumber,
      chapterSlug: cleanChapterSlug,
      images,
      prevChapter,
      nextChapter,
    };
  } catch (error) {
    console.error(
      `Error fetching chapter ${chapterSlug} for ${comicSlug}:`,
      error
    );
    return null;
  }
}

export async function searchComics(query: string): Promise<Comic[]> {
  try {
    const term = cleanText(query);
    if (!term) return [];

    const url = `${API_DOMAIN}/?post_type=manga&s=${encodeURIComponent(term)}`;
    const html = await fetchHtml(url);
    return dedupeComics(parseBgeCards(html));
  } catch (error) {
    console.error(`Error searching for "${query}":`, error);
    return [];
  }
}

export async function getComicsList(params: {
  type?: string;
  order?: string;
  page?: number;
}): Promise<Comic[]> {
  try {
    const typeParam = normalizeTypeParam(params.type);
    const page = params.page && params.page > 0 ? params.page : 1;

    if (params.order?.toLowerCase() === "views") {
      const hotPath = page > 1 ? `/other/hot/page/${page}/` : "/other/hot/";
      const hotHtml = await fetchHtml(`${API_DOMAIN}${hotPath}`);
      const hotComics = dedupeComics(parseBgeCards(hotHtml, typeParam));
      if (hotComics.length > 0) {
        return hotComics;
      }
    }

    const query = new URLSearchParams();
    if (typeParam) query.set("tipe", typeParam);
    if (page > 1) query.set("halaman", String(page));

    const url = `${TARGET_DOMAIN}/daftar-komik/${
      query.toString() ? `?${query.toString()}` : ""
    }`;

    const html = await fetchHtml(url);
    const comics = dedupeComics(parseDaftarCards(html, typeParam));
    if (comics.length > 0) {
      return comics;
    }

    const fallbackPath = page > 1 ? `/other/hot/page/${page}/` : "/other/hot/";
    const fallbackHtml = await fetchHtml(`${API_DOMAIN}${fallbackPath}`);
    return dedupeComics(parseBgeCards(fallbackHtml, typeParam));
  } catch (error) {
    console.error("Error fetching comics list:", error);
    return [];
  }
}
