const TOOLS = [
  "After Effects",
  "Cinema 4D",
  "Blender",
  "Redshift",
  "Premiere",
  "Octane",
  "DaVinci",
  "Figma",
];

/** Plain mono credit-crawl — no chip borders, just a running technical line. */
export function ToolsTicker() {
  return (
    <div className="overflow-hidden border-y border-line py-5">
      <div className="marquee-run flex w-max gap-10 px-8 font-mono-tech text-xs uppercase tracking-[0.3em] text-mist">
        {[...TOOLS, ...TOOLS].map((t, i) => (
          <span key={`${t}-${i}`} className="flex items-center gap-10">
            {t}
            <span className="h-1 w-1 rounded-full bg-mist" />
          </span>
        ))}
      </div>
    </div>
  );
}
