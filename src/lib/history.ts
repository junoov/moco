export interface ReadingHistoryItem {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  type: string;
  status: string;
  totalViews: number;
  totalChapters: number;
  viewedAt: string;
}

const STORAGE_KEY = "mangareader:history:v1";
const HISTORY_UPDATED_EVENT = "mangareader:history-updated";
const MAX_HISTORY_ITEMS = 80;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function normalizeHistoryItem(value: unknown): ReadingHistoryItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;
  const slug = typeof item.slug === "string" ? item.slug.trim() : "";
  const title = typeof item.title === "string" ? item.title.trim() : "";
  if (!slug || !title) {
    return null;
  }

  const viewedAtRaw = typeof item.viewedAt === "string" ? item.viewedAt : "";
  const viewedAtDate = viewedAtRaw ? new Date(viewedAtRaw) : new Date(0);

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
    viewedAt: Number.isNaN(viewedAtDate.getTime())
      ? new Date(0).toISOString()
      : viewedAtDate.toISOString(),
  };
}

function emitHistoryUpdated() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(HISTORY_UPDATED_EVENT));
}

export function getHistoryRaw(): string {
  if (!isBrowser()) {
    return "[]";
  }
  return window.localStorage.getItem(STORAGE_KEY) || "[]";
}

export function parseHistory(raw: string): ReadingHistoryItem[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeHistoryItem)
      .filter((item): item is ReadingHistoryItem => item !== null)
      .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
  } catch {
    return [];
  }
}

export function getHistory(): ReadingHistoryItem[] {
  return parseHistory(getHistoryRaw());
}

export function saveHistory(history: ReadingHistoryItem[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));
  emitHistoryUpdated();
}

export function addHistory(item: Omit<ReadingHistoryItem, "viewedAt">) {
  const current = getHistory().filter((entry) => entry.slug !== item.slug);
  saveHistory([
    {
      ...item,
      viewedAt: new Date().toISOString(),
    },
    ...current,
  ]);
}

export function removeHistory(slug: string) {
  if (!slug) return;
  const next = getHistory().filter((entry) => entry.slug !== slug);
  saveHistory(next);
}

export function clearHistory() {
  saveHistory([]);
}

export function subscribeHistory(callback: () => void): () => void {
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
  window.addEventListener(HISTORY_UPDATED_EVENT, handleUpdateEvent);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(HISTORY_UPDATED_EVENT, handleUpdateEvent);
  };
}
