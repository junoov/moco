"use client";

import Link from "next/link";

export function FlagNav() {
  const flags = [
    { name: "Manga", emoji: "🇯🇵", href: "/comics?type=Manga" },
    { name: "Manhwa", emoji: "🇰🇷", href: "/comics?type=Manhwa" },
    { name: "Manhua", emoji: "🇨🇳", href: "/comics?type=Manhua" },
  ];

  return (
    <div className="bg-[#0f1523] border border-gray-800 rounded-xl overflow-hidden mb-6">
      <div className="flex divide-x divide-gray-800">
        {flags.map((flag) => (
          <Link
            key={flag.name}
            href={flag.href}
            className="flex-1 flex flex-col items-center justify-center py-4 hover:bg-white/5 transition-colors group"
          >
            <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">
              {flag.emoji}
            </span>
            <span className="text-base font-bold text-gray-200 tracking-wide">
              {flag.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
