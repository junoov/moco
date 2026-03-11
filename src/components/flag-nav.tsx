"use client";

import Link from "next/link";

export function FlagNav() {
  const flags = [
    { name: "Manga", emoji: "🇯🇵", href: "/comics?type=Manga", accent: "var(--manga-badge)" },
    { name: "Manhwa", emoji: "🇰🇷", href: "/comics?type=Manhwa", accent: "var(--manhwa-badge)" },
    { name: "Manhua", emoji: "🇨🇳", href: "/comics?type=Manhua", accent: "var(--manhua-badge)" },
  ];

  return (
    <div className="panel p-0 mb-8 stagger overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00f0ff] via-[#ff00ea] to-[#ff3333] z-10"></div>
      <div className="flex divide-x divide-[var(--line)] relative z-0">
        {flags.map((flag) => (
          <Link
            key={flag.name}
            href={flag.href}
            className="flex-1 flex flex-col items-center justify-center py-6 transition-all duration-300 group hover:bg-[var(--bg-1)] relative"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" 
                 style={{ background: `radial-gradient(circle at center, ${flag.accent} 0%, transparent 70%)` }} />
            <span className="text-4xl mb-2 group-hover:scale-125 group-hover:-translate-y-1 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] filter grayscale-[0.2] group-hover:grayscale-0">
              {flag.emoji}
            </span>
            <span className="font-display text-xs lg:text-sm font-bold text-[var(--text-dim)] group-hover:text-white uppercase tracking-widest transition-colors">
              {flag.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
