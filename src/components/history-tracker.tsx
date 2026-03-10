"use client";

import { useEffect } from "react";
import { addHistory } from "@/lib/history";

interface TrackableComic {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  type: string;
  status: string;
  totalViews: number;
  totalChapters: number;
}

export function HistoryTracker({ comic }: { comic: TrackableComic }) {
  useEffect(() => {
    addHistory(comic);
  }, [comic]);

  return null;
}
