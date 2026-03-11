"use client";

import Link from "next/link";

export function FlagNav() {
  const flags = [
    { name: "Manga", iconUrl: "https://flagcdn.com/w80/jp.png", href: "/comics?type=Manga" },
    { name: "Manhwa", iconUrl: "https://flagcdn.com/w80/kr.png", href: "/comics?type=Manhwa" },
    { name: "Manhua", iconUrl: "https://flagcdn.com/w80/cn.png", href: "/comics?type=Manhua" },
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
            <div className="mb-2 group-hover:scale-110 transition-transform">
              <img 
                src={flag.iconUrl} 
                alt={`${flag.name} flag`}
                className="w-8 h-auto object-cover rounded shadow-sm border border-gray-700/50"
              />
            </div>
            <span className="text-base font-bold text-gray-200 tracking-wide">
              {flag.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
