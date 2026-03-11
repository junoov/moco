import Link from "next/link";

export function TypeNav() {
  const types = [
    { name: "Manga", emoji: "🇯🇵", href: "/comics?type=Manga" },
    { name: "Manhwa", emoji: "🇰🇷", href: "/comics?type=Manhwa" },
    { name: "Manhua", emoji: "🇨🇳", href: "/comics?type=Manhua" },
  ];

  return (
    <div className="type-nav bg-[#0f1523] border border-gray-800 rounded-xl overflow-hidden mb-6">
      <div className="flex divide-x divide-gray-800">
        {types.map((t) => (
          <Link
            key={t.name}
            href={t.href}
            className="flex-1 flex flex-col items-center justify-center py-3 hover:bg-white/5 transition-colors group"
          >
            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{t.emoji}</span>
            <span className="text-sm font-bold text-gray-200">{t.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
