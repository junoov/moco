export interface BookmarkComic {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  type: string;
  status: string;
  totalViews: number;
  totalChapters: number;
}

const STORAGE_KEY = "mangareader:bookmarks:v1";
const BOOKMARKS_UPDATED_EVENT = "mangareader:bookmarks-updated";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function normalizeBookmark(value: unknown): BookmarkComic | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;
  const slug = typeof item.slug === "string" ? item.slug.trim() : "";
  const title = typeof item.title === "string" ? item.title.trim() : "";
  if (!slug || !title) {
    return null;
  }

  return {
    id: typeof item.id === "string" && item.id ? item.id : slug,
    slug,
    title,
    coverUrl: typeof item.coverUrl === "string" ? item.coverUrl : null,
    type: typeof item.type === "string" && item.type ? item.type : "Manga",
    status: typeof item.status === "string" && item.status ? item.status : "Ongoing",
    totalViews: typeof item.totalViews === "number" && Number.isFinite(item.totalViews) ? item.totalViews : 0,
    totalChapters:
      typeof item.totalChapters === "number" && Number.isFinite(item.totalChapters)
        ? item.totalChapters
        : 0,
  };
}

function emitBookmarksUpdated() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(BOOKMARKS_UPDATED_EVENT));
}

export function getBookmarksRaw(): string {
  if (!isBrowser()) {
    return "[]";
  }

  return window.localStorage.getItem(STORAGE_KEY) || "[]";
}

export function parseBookmarks(raw: string): BookmarkComic[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeBookmark)
      .filter((item): item is BookmarkComic => item !== null);
  } catch {
    return [];
  }
}

export function getBookmarks(): BookmarkComic[] {
  return parseBookmarks(getBookmarksRaw());
}

export function saveBookmarks(bookmarks: BookmarkComic[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  emitBookmarksUpdated();
}

export function isComicBookmarked(slug: string): boolean {
  if (!slug) return false;
  return getBookmarks().some((bookmark) => bookmark.slug === slug);
}

export function toggleComicBookmark(comic: BookmarkComic): boolean {
  const current = getBookmarks();
  const exists = current.some((bookmark) => bookmark.slug === comic.slug);

  if (exists) {
    saveBookmarks(current.filter((bookmark) => bookmark.slug !== comic.slug));
    return false;
  }

  const deduped = current.filter((bookmark) => bookmark.slug !== comic.slug);
  saveBookmarks([comic, ...deduped]);
  return true;
}

export function removeBookmark(slug: string) {
  if (!slug) return;
  const next = getBookmarks().filter((bookmark) => bookmark.slug !== slug);
  saveBookmarks(next);
}

export function subscribeBookmarks(callback: () => void): () => void {
  if (!isBrowser()) {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  };

  const handleUpdateEvent = () => {
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(BOOKMARKS_UPDATED_EVENT, handleUpdateEvent);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(BOOKMARKS_UPDATED_EVENT, handleUpdateEvent);
  };
}
