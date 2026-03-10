"use client";

import { Bookmark } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";
import {
  BookmarkComic,
  getBookmarksRaw,
  parseBookmarks,
  subscribeBookmarks,
  toggleComicBookmark,
} from "@/lib/bookmarks";

export function BookmarkToggleButton({
  comic,
  compact = false,
}: {
  comic: BookmarkComic;
  compact?: boolean;
}) {
  const bookmarksRaw = useSyncExternalStore(
    subscribeBookmarks,
    getBookmarksRaw,
    () => "[]"
  );
  const bookmarks = useMemo(() => parseBookmarks(bookmarksRaw), [bookmarksRaw]);
  const bookmarked = useMemo(
    () => bookmarks.some((bookmark) => bookmark.slug === comic.slug),
    [bookmarks, comic.slug]
  );

  const label = useMemo(() => {
    if (bookmarked) return compact ? "Saved" : "Bookmarked";
    return compact ? "Save" : "Bookmark";
  }, [bookmarked, compact]);

  return (
    <button
      type="button"
      className={`bookmark-toggle ${bookmarked ? "bookmark-toggle--active" : ""} ${compact ? "bookmark-toggle--compact" : ""}`.trim()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleComicBookmark(comic);
      }}
      aria-label={label}
      title={label}
    >
      <Bookmark size={15} />
      {!compact && <span>{label}</span>}
    </button>
  );
}
